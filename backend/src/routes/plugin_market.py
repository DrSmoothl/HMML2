"""
插件广场API路由
"""
from fastapi import APIRouter
from services.plugin_market_service import PluginMarketService
from models.plugin import PluginInstallRequest

router = APIRouter(prefix="/pluginMarket", tags=["插件广场"])


@router.get("/get")
async def get_all_plugins():
    """
    获取所有插件列表
    
    Returns:
        ApiResponse: 包含所有插件信息的响应
    """
    return await PluginMarketService.get_all_plugins()


@router.get("/get/{plugin_id}")
async def get_plugin_by_id(plugin_id: str):
    """
    根据插件ID获取单个插件详情
    
    Args:
        plugin_id: 插件ID
        
    Returns:
        ApiResponse: 包含插件详情的响应
    """
    return await PluginMarketService.get_plugin_by_id(plugin_id)


@router.post("/install")
async def install_plugin(request: PluginInstallRequest):
    """
    安装插件
    
    Args:
        request: 插件安装请求
        
    Returns:
        ApiResponse: 安装结果响应
    """
    return await PluginMarketService.install_plugin(request.plugin_id)
