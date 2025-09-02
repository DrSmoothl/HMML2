"""
HMML HTTP Server
HTTP服务器 - 基于FastAPI的Web服务器
"""

import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from pathlib import Path
import uvicorn
from typing import Optional

from .config import Config
from .logger import logger
from .version import get_version, get_current_environment


class HttpServer:
    """HTTP服务器类"""
    
    def __init__(self, config: Config):
        self.config = config
        self.app: Optional[FastAPI] = None
        self.server: Optional[uvicorn.Server] = None
    
    async def init(self):
        """初始化HTTP服务器"""
        try:
            # 创建FastAPI应用
            @asynccontextmanager
            async def lifespan(app: FastAPI):
                # 启动时执行
                logger.info("FastAPI应用启动")
                yield
                # 关闭时执行
                logger.info("FastAPI应用关闭")
            
            self.app = FastAPI(
                title=self.config.app.name,
                description=self.config.app.description,
                version=self.config.app.version,
                lifespan=lifespan
            )
            
            self.setup_middleware()
            self.setup_error_handlers()
            self.setup_routes()
            self.setup_static_files()
            
            logger.info("HTTP服务器初始化完成")
        except Exception as error:
            logger.error(f"HTTP服务器初始化失败: {error}")
            raise error
    
    def setup_middleware(self):
        """设置中间件"""
        if not self.app:
            return
        
        # CORS中间件
        if self.config.security.cors_enabled:
            self.app.add_middleware(
                CORSMiddleware,
                allow_origins=self.config.security.cors_origins,
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
        
        # 反向代理中间件
        if self.config.server.reverse_proxy_mode:
            self.app.add_middleware(
                TrustedHostMiddleware,
                allowed_hosts=["*"]  # 在生产环境中应该限制具体的主机
            )
        
        # 请求日志中间件
        @self.app.middleware("http")
        async def log_requests(request: Request, call_next):
            start_time = asyncio.get_event_loop().time()
            response = await call_next(request)
            process_time = asyncio.get_event_loop().time() - start_time
            
            logger.info(
                f"{request.method} {request.url.path} - "
                f"{response.status_code} - {process_time:.4f}s"
            )
            return response
    
    def setup_error_handlers(self):
        """设置错误处理器"""
        if not self.app:
            return
        
        @self.app.exception_handler(404)
        async def not_found_handler(request: Request, exc):
            return JSONResponse(
                status_code=404,
                content={
                    "error": "Not Found",
                    "message": "请求的资源不存在",
                    "path": str(request.url.path)
                }
            )
        
        @self.app.exception_handler(RequestValidationError)
        async def validation_exception_handler(request: Request, exc: RequestValidationError):
            return JSONResponse(
                status_code=422,
                content={
                    "error": "Validation Error",
                    "message": "请求参数验证失败",
                    "details": exc.errors()
                }
            )
        
        @self.app.exception_handler(500)
        async def internal_error_handler(request: Request, exc):
            logger.error(f"内部服务器错误: {exc}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "服务器内部错误"
                }
            )
    
    def setup_routes(self):
        """设置路由"""
        if not self.app:
            return
        
        # 导入路由模块
        from routes.path_cache import router as path_cache_router
        from routes.emoji import router as emoji_router
        from routes.expression import router as expression_router
        from routes.config import router as config_router
        from routes.person_info import router as person_info_router
        from routes.chat_stream import router as chat_stream_router
        from routes.system import router as system_router
        from routes.plugin_market import router as plugin_market_router
        from routes.tool import router as tool_router
        
        # 注册路由
        self.app.include_router(path_cache_router, prefix="/api")
        self.app.include_router(emoji_router, prefix="/api")
        self.app.include_router(expression_router, prefix="/api")
        self.app.include_router(config_router, prefix="/api")
        self.app.include_router(person_info_router, prefix="/api")
        self.app.include_router(chat_stream_router, prefix="/api")
        self.app.include_router(system_router, prefix="/api")
        self.app.include_router(plugin_market_router, prefix="/api")
        self.app.include_router(tool_router, prefix="/api/tools")
        
        # 健康检查路由
        @self.app.get("/api/health")
        async def health_check():
            import psutil
            import time
            
            process = psutil.Process()
            memory_info = process.memory_info()
            
            health_info = {
                "status": "healthy",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "uptime": int(time.time() - process.create_time()),
                "memory": {
                    "used": round(memory_info.rss / 1024 / 1024),  # MB
                    "total": round(memory_info.vms / 1024 / 1024), # MB
                },
                "version": get_version(),
                "service": self.config.app.name
            }
            
            return {
                "status": 200,
                "message": "健康检查成功", 
                "time": int(time.time() * 1000),
                "data": health_info
            }
        
        # 服务信息路由
        @self.app.get("/api/info")
        async def service_info():
            import psutil
            import platform
            import time
            
            # 获取系统信息
            memory = psutil.virtual_memory()
            cpu_count = psutil.cpu_count()
            
            # 获取网络接口
            network_interfaces = psutil.net_if_stats()
            active_interfaces = [name for name, stats in network_interfaces.items() if stats.isup]
            
            service_info = {
                "name": self.config.app.name,
                "version": self.config.app.version,
                "description": self.config.app.description,
                "environment": get_current_environment(),
                "pythonVersion": platform.python_version(),
                "platform": platform.system(),
                "arch": platform.machine(),
                "startTime": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "uptime": int(time.time() - psutil.Process().create_time()),
                "system": {
                    "hostname": platform.node(),
                    "type": platform.system(),
                    "release": platform.release(),
                    "cpu": {
                        "cores": cpu_count,
                        "usage": psutil.cpu_percent(interval=0.1)
                    },
                    "memory": {
                        "total": round(memory.total / 1024 / 1024 / 1024, 2),  # GB
                        "used": round(memory.used / 1024 / 1024 / 1024, 2),   # GB
                        "free": round(memory.free / 1024 / 1024 / 1024, 2),   # GB
                        "usage": memory.percent
                    },
                    "network": {
                        "interfaces": len(active_interfaces),
                        "activeInterfaces": active_interfaces
                    }
                }
            }
            
            return {
                "status": 200,
                "message": "获取系统信息成功",
                "time": int(time.time() * 1000),
                "data": service_info
            }
        
        # 根路径
        @self.app.get("/")
        async def root():
            return {
                "message": f"欢迎使用 {self.config.app.name}",
                "version": self.config.app.version,
                "api_docs": "/docs",
                "health": "/api/health"
            }
    
    def setup_static_files(self):
        """设置静态文件服务"""
        if not self.app:
            return
        
        # 检查public目录是否存在
        public_dir = Path("public")
        if public_dir.exists():
            self.app.mount("/static", StaticFiles(directory=public_dir), name="static")
            logger.info("静态文件服务已启用")
    
    async def start(self):
        """启动HTTP服务器"""
        try:
            if not self.app:
                raise RuntimeError("HTTP服务器未初始化")
            
            # 创建uvicorn配置
            config = uvicorn.Config(
                app=self.app,
                host=self.config.server.host,
                port=self.config.server.port,
                log_level="info",
                access_log=False  # 我们使用自己的请求日志
            )
            
            self.server = uvicorn.Server(config)
            
            # 打印启动信息
            self.print_startup_info()
            
            # 启动服务器
            await self.server.serve()
            
        except Exception as error:
            logger.error(f"HTTP服务器启动失败: {error}")
            raise error
    
    async def stop(self):
        """停止HTTP服务器"""
        if self.server:
            self.server.should_exit = True
            logger.info("HTTP服务器已停止")
    
    def get_app(self) -> FastAPI:
        """获取FastAPI应用实例"""
        if not self.app:
            raise RuntimeError("HTTP服务器未初始化")
        return self.app
    
    def print_startup_info(self):
        """打印启动信息"""
        config = self.config
        host = "localhost" if config.server.host == "0.0.0.0" else config.server.host
        base_url = f"http://{host}:{config.server.port}"
        prefixed_url = f"{base_url}{config.server.prefix}" if config.server.prefix else base_url

        print('')
        print('██╗  ██╗███╗   ███╗███╗   ███╗██╗     ')
        print('██║  ██║████╗ ████║████╗ ████║██║     ')
        print('███████║██╔████╔██║██╔████╔██║██║     ')
        print('██╔══██║██║╚██╔╝██║██║╚██╔╝██║██║     ')
        print('██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗')
        print('╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝')
        print('')
        print(f'📦 服务名称: {config.app.name}')
        print(f'📝 服务描述: {config.app.description}')
        print(f'🔖 版本: {get_version()}')
        print(f'🌍 环境: {get_current_environment()}')
        print(f'🚀 服务地址: {prefixed_url}')
        print(f'📊 健康检查: {prefixed_url}/api/health')
        print(f'ℹ️  服务信息: {prefixed_url}/api/info')
        print(f'📚 API文档: {prefixed_url}/docs')
        print('')
        print('🎉 服务已成功启动！')
        print('')
        print('💡 提示: 按 Ctrl+C 退出服务')
        print('==========================================')
    
    def parse_size(self, size_str: str) -> int:
        """解析文件大小字符串"""
        import re
        
        match = re.match(r'^(\d+)([kmg]?b?)$', size_str.lower())
        if not match:
            return 1024 * 1024  # 默认1MB
        
        size = int(match.group(1))
        unit = match.group(2) or ''
        
        if unit in ['gb', 'g']:
            return size * 1024 * 1024 * 1024
        elif unit in ['mb', 'm']:
            return size * 1024 * 1024
        elif unit in ['kb', 'k']:
            return size * 1024
        else:
            return size
