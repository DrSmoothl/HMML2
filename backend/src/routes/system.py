"""
System 路由
系统相关API端点
"""

from fastapi import APIRouter, HTTPException
import time
import logging
import re
from pathlib import Path
from core.path_cache_manager import path_cache_manager

logger = logging.getLogger("HMML")

router = APIRouter(prefix="/system", tags=["系统信息"])


def create_success_response(data: dict = None, message: str = "操作成功") -> dict:
    """创建成功响应"""
    return {
        "status": 200,
        "message": message,
        "data": data,
        "time": int(time.time() * 1000)
    }


def create_error_response(status: int, message: str) -> dict:
    """创建错误响应"""
    return {
        "status": status,
        "message": message,
        "time": int(time.time() * 1000)
    }


def is_onekey_environment() -> bool:
    """检测是否为一键包环境"""
    try:
        # 获取当前后端目录的绝对路径
        current_dir = Path(__file__).resolve().parent.parent.parent.parent  # 回到HMMLBackend目录
        
        # 检查当前后端是否在一键包的标准路径中运行
        # 标准路径应该是: MaiBotOneKey/modules/HMMLBackend
        parent_dir = current_dir.parent  # 应该是modules目录
        grandparent_dir = parent_dir.parent  # 应该是MaiBotOneKey目录
        
        # 检查目录名称和结构是否符合一键包标准
        is_onekey = (
            current_dir.name == "HMMLBackend" and
            parent_dir.name == "modules" and
            grandparent_dir.name == "MaiBotOneKey" and
            (grandparent_dir / "modules").exists() and
            (grandparent_dir / "modules" / "MaiBot").exists()
        )
        
        return is_onekey
        
    except Exception as error:
        logger.debug(f'一键包环境检测失败: {error}')
        return False


@router.get("/isOneKeyEnv", summary="检测是否为一键包环境")
async def check_onekey_environment():
    """
    检测当前后端是否运行在一键包环境中
    
    返回:
        isOneKeyEnv: boolean - 是否为一键包环境
        currentPath: string - 当前后端路径
        expectedPath: string - 一键包环境的预期路径格式
    """
    try:
        logger.info("检测一键包环境")
        
        # 获取当前后端目录信息
        current_dir = Path(__file__).resolve().parent.parent.parent.parent
        is_onekey = is_onekey_environment()
        
        response_data = {
            "isOneKeyEnv": is_onekey,
            "currentPath": str(current_dir),
            "expectedPath": "MaiBotOneKey/modules/HMMLBackend",
            "detection": {
                "currentDirName": current_dir.name,
                "parentDirName": current_dir.parent.name if current_dir.parent else None,
                "grandparentDirName": current_dir.parent.parent.name if current_dir.parent and current_dir.parent.parent else None
            }
        }
        
        if is_onekey:
            logger.info(f"检测到一键包环境，当前路径: {current_dir}")
            message = "检测到一键包环境"
        else:
            logger.info(f"当前运行在开发环境，当前路径: {current_dir}")
            message = "当前运行在开发环境"
        
        return create_success_response(response_data, message)
        
    except Exception as error:
        logger.error(f"检测一键包环境失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "检测失败")
        )


@router.get("/info", summary="获取系统基本信息")
async def get_system_info():
    """
    获取系统基本信息
    """
    try:
        import platform
        import psutil
        
        # 获取系统信息
        system_info = {
            "platform": platform.system(),
            "platformRelease": platform.release(),
            "platformVersion": platform.version(),
            "architecture": platform.machine(),
            "hostname": platform.node(),
            "pythonVersion": platform.python_version(),
            "currentWorkingDirectory": str(Path.cwd()),
            "backendPath": str(Path(__file__).resolve().parent.parent.parent.parent),
            "cpu": {
                "count": psutil.cpu_count(),
                "usage": psutil.cpu_percent(interval=0.1)
            },
            "memory": {
                "total": round(psutil.virtual_memory().total / 1024 / 1024 / 1024, 2),  # GB
                "used": round(psutil.virtual_memory().used / 1024 / 1024 / 1024, 2),   # GB
                "usage": psutil.virtual_memory().percent
            }
        }
        
        return create_success_response(system_info, "获取系统信息成功")
        
    except Exception as error:
        logger.error(f"获取系统信息失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "获取系统信息失败")
        )


@router.get("/getMaiVersion", summary="获取麦麦版本号")
async def get_mai_version():
    """
    获取麦麦版本号
    从麦麦根目录下的 src/config/config.py 文件中读取版本信息
    """
    try:
        logger.info("获取麦麦版本号")
        
        # 从根目录缓存获取麦麦根目录
        main_root = path_cache_manager.get_main_root()
        if not main_root:
            logger.error("未找到麦麦根目录，请先设置路径缓存")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "未找到麦麦根目录，请先设置路径缓存")
            )
        
        # 构造配置文件路径
        config_file_path = Path(main_root) / "src" / "config" / "config.py"
        
        if not config_file_path.exists():
            logger.error(f"配置文件不存在: {config_file_path}")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "麦麦配置文件不存在")
            )
        
        # 读取配置文件内容
        with open(config_file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # 使用正则表达式查找版本号
        version_match = re.search(r'MMC_VERSION\s*=\s*["\']([^"\']+)["\']', content)
        
        if not version_match:
            logger.error("在配置文件中未找到版本号")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "在配置文件中未找到版本号")
            )
        
        raw_version = version_match.group(1)
        logger.info(f"找到原始版本号: {raw_version}")
        
        # 处理预览版本，移除 snapshot 后缀
        # 例如: 0.10.1.snapshot.1 -> 0.10.1
        # 例如: 0.10.2.snapshot.3 -> 0.10.2
        if '.snapshot.' in raw_version:
            version = raw_version.split('.snapshot.')[0]
            logger.info(f"检测到预览版本，处理后版本号: {version}")
        else:
            version = raw_version
            logger.info(f"正式版本号: {version}")
        
        response_data = {
            "version": version
        }
        
        return create_success_response(response_data, "获取成功")
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as error:
        logger.error(f"获取麦麦版本号失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, f"获取麦麦版本号失败: {str(error)}")
        )
