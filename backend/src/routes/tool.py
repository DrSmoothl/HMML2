"""
工具相关路由
用于处理工具API的HTTP请求
"""

from fastapi import APIRouter, HTTPException
from models.tool import GetModelsRequest, GetModelsResponse
from services.tool_service import ToolService

router = APIRouter()

# 初始化工具服务
tool_service = ToolService()


@router.post("/getModels", response_model=GetModelsResponse)
async def get_models(request: GetModelsRequest):
    """
    获取API服务商的模型列表
    
    Args:
        request: 包含API URL和密钥的请求对象
        
    Returns:
        GetModelsResponse: 包含模型列表的响应
        
    Raises:
        HTTPException: 当请求失败时返回HTTP错误
    """
    try:
        # 基本参数验证
        if not request.api_url or not request.api_url.strip():
            raise HTTPException(status_code=400, detail="API URL不能为空")
        
        if not request.api_key or not request.api_key.strip():
            raise HTTPException(status_code=400, detail="API密钥不能为空")
        
        # 验证API URL格式
        api_url = request.api_url.strip()
        if not api_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="API URL格式无效，必须以http://或https://开头")
        
        # 验证API密钥格式
        api_key = request.api_key.strip()
        if len(api_key) < 10:
            raise HTTPException(status_code=400, detail="API密钥格式无效，长度不能少于10个字符")
        
        # 调用服务获取模型列表
        result = tool_service.get_models(request)
        return result
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        # 捕获其他异常并转换为HTTP异常
        error_message = str(e)
        
        # 根据错误内容返回适当的状态码
        if "无效" in error_message or "已过期" in error_message:
            raise HTTPException(status_code=401, detail=error_message)
        elif "权限不足" in error_message:
            raise HTTPException(status_code=403, detail=error_message)
        elif "不存在" in error_message:
            raise HTTPException(status_code=404, detail=error_message)
        elif "网络" in error_message or "请求失败" in error_message:
            raise HTTPException(status_code=502, detail=error_message)
        else:
            raise HTTPException(status_code=500, detail=error_message)
