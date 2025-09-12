"""
HMML (Hello MaiMai Launcher) 后端服务
基于FastAPI框架设计的Python HTTP服务器
重写自原Node.js版本
"""

import asyncio
import signal
import sys

from core.logger import logger
from core.config import config_manager
from core.http_server import HttpServer
from core.version import (
    initialize_version_system, 
    ConfigUpdater, 
    HMML_VERSION, 
    get_current_environment
)


class Application:
    """HMML应用程序主类"""
    
    def __init__(self):
        self.http_server: HttpServer = None
        self.is_shutting_down = False
    
    async def initialize(self):
        """初始化应用"""
        try:
            logger.info('正在初始化 HMML 后端服务...')
            
            # 显示版本信息
            environment = get_current_environment()
            logger.info(f'🔖 HMML 版本: {HMML_VERSION} ({environment})')
            
            # 初始化版本系统
            await initialize_version_system()
            
            # 自动修复配置文件版本
            try:
                await ConfigUpdater.auto_fix_config_versions('./config')
            except Exception as error:
                logger.warn(f'配置版本自动修复失败: {error}')
            
            # 加载配置
            config = await config_manager.load()
            logger.info('配置加载完成')
            
            # 配置日志系统
            logger.configure(
                level="DEBUG",  # 临时设置为DEBUG级别来查看详细信息
                enable_console=config.logger.enable_console,
                enable_file=config.logger.enable_file,
                max_file_size=config.logger.max_file_size,
                max_files=config.logger.max_files
            )
            
            # 初始化路径缓存管理器
            try:
                from core.path_cache_manager import path_cache_manager
                await path_cache_manager.initialize()
                logger.info('路径缓存管理器初始化完成')
            except Exception as error:
                logger.warn(f'路径缓存管理器初始化失败: {error}')
            
            # 初始化数据库管理器
            try:
                from core.database_manager import database_manager
                from core.path_cache_manager import path_cache_manager
                await database_manager.initialize(path_cache_manager)
                logger.info('数据库管理器初始化完成')
            except Exception as error:
                logger.warn(f'数据库管理器初始化失败: {error}')
            
            # 初始化Git克隆服务
            try:
                from services.git_clone_service import initialize_git_clone_service
                initialize_git_clone_service()
                logger.info('Git克隆服务初始化完成')
            except Exception as error:
                logger.warn(f'Git克隆服务初始化失败: {error}')
            
            # 初始化HTTP服务器
            self.http_server = HttpServer(config)
            await self.http_server.init()
            
            logger.info('应用初始化完成')
            # 初始化访问 Token （放在最后，确保 config 目录存在）
            try:
                from core.token_manager import get_token_manager
                get_token_manager().initialize()
                logger.info('访问Token初始化完成')
            except Exception as error:
                logger.warn(f'Token初始化失败: {error}')
            
        except Exception as error:
            logger.fatal(f'应用初始化失败: {error}')
            sys.exit(1)
    
    async def start(self):
        """启动应用"""
        try:
            if not self.http_server:
                raise RuntimeError("HTTP服务器未初始化")
            
            # 启动HTTP服务器
            await self.http_server.start()
            
            logger.info('HMML 后端服务启动成功')
            
        except Exception as error:
            logger.fatal(f'应用启动失败: {error}')
            sys.exit(1)
    
    async def shutdown(self):
        """优雅关闭应用"""
        if self.is_shutting_down:
            logger.warn('应用正在关闭中...')
            return
        
        self.is_shutting_down = True
        logger.info('开始优雅关闭应用...')
        
        try:
            # 停止HTTP服务器
            if self.http_server:
                await self.http_server.stop()
            
            # 关闭数据库连接
            try:
                from core.database_manager import database_manager
                await database_manager.close_all_connections()
                logger.info('数据库连接已关闭')
            except Exception as error:
                logger.warn(f'关闭数据库连接时出错: {error}')
            
            # 关闭日志系统
            await logger.close()
            
            logger.info('应用已优雅关闭')
            sys.exit(0)
            
        except Exception as error:
            logger.error(f'应用关闭过程中发生错误: {error}')
            sys.exit(1)


async def main():
    """主函数"""
    app = Application()
    
    def signal_handler(signum, frame):
        """信号处理器"""
        logger.warn(f'收到信号 {signum}，开始优雅关闭...')
        asyncio.create_task(app.shutdown())
    
    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # 初始化应用
        await app.initialize()
        
        # 启动应用
        await app.start()
        
    except KeyboardInterrupt:
        logger.info('用户中断服务')
        await app.shutdown()
    except Exception as error:
        logger.fatal(f'应用运行失败: {error}')
        sys.exit(1)


def show_status():
    """显示服务状态"""
    import psutil
    process = psutil.Process()
    
    memory_info = process.memory_info()
    
    print('')
    print('📊 服务状态:')
    print(f'  进程PID: {process.pid}')
    print(f'  内存使用: {memory_info.rss / 1024 / 1024:.1f}MB')
    print(f'  Python版本: {sys.version}')
    print('')


def show_config():
    """显示配置信息"""
    try:
        config = config_manager.get()
        
        print('')
        print('⚙️  配置信息:')
        print(f'  服务端口: {config.server.port}')
        print(f'  服务主机: {config.server.host}')
        print(f'  URL前缀: {config.server.prefix or "无"}')
        print(f'  反向代理模式: {"启用" if config.server.reverse_proxy_mode else "禁用"}')
        print(f'  日志级别: {config.logger.level}')
        print(f'  CORS启用: {"是" if config.security.cors_enabled else "否"}')
        print('')
        print('📋 版本信息:')
        print(f'  版本: {HMML_VERSION}')
        print(f'  环境: {get_current_environment()}')
        print('  后端: Python/FastAPI')
        print('')
    except Exception as e:
        print(f'获取配置信息失败: {e}')


if __name__ == "__main__":
    # 运行应用
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("服务已停止")
    except Exception as e:
        print(f"服务启动失败: {e}")
        sys.exit(1)
