"""
工具服务类
用于处理工具相关的业务逻辑
"""

import time
import requests
from models.tool import GetModelsRequest, ExternalModelsResponse, GetModelsResponseData, GetModelsResponse


class ToolService:
    """工具服务类"""
    
    def __init__(self):
        """初始化工具服务"""
        pass
    
    def get_models(self, request: GetModelsRequest) -> GetModelsResponse:
        """
        获取API服务商的模型列表
        
        Args:
            request: 获取模型请求
            
        Returns:
            GetModelsResponse: 模型列表响应
            
        Raises:
            Exception: 当请求失败时抛出异常
        """
        try:
            # 构建请求URL
            models_url = f"{request.api_url.rstrip('/')}/models"
            
            # 设置请求头
            headers = {
                "Authorization": f"Bearer {request.api_key}",
                "Content-Type": "application/json"
            }
            
            # 发送GET请求获取模型列表
            response = requests.get(models_url, headers=headers, timeout=30.0)
            response.raise_for_status()
            
            # 解析响应JSON
            response_data = response.json()
            
            # 验证响应格式
            external_response = ExternalModelsResponse(**response_data)
            
            # 提取模型ID列表
            model_ids = [model.id for model in external_response.data]
            
            # 构建响应
            return GetModelsResponse(
                status=200,
                message="获取模型成功",
                data=GetModelsResponseData(models=model_ids),
                time=int(time.time() * 1000)
            )
                
        except requests.exceptions.HTTPError as e:
            # HTTP状态错误
            status_code = e.response.status_code if e.response else 0
            error_msg = f"API请求失败: HTTP {status_code}"
            if status_code == 401:
                error_msg = "API密钥无效或已过期"
            elif status_code == 403:
                error_msg = "API密钥权限不足"
            elif status_code == 404:
                error_msg = "API地址不存在"
            elif status_code == 0:
                error_msg = "网络连接失败，请检查API地址是否正确"
            
            raise Exception(error_msg)
            
        except requests.exceptions.ConnectionError as e:
            # 连接错误
            raise Exception(f"网络连接失败: {str(e)}")
            
        except requests.exceptions.Timeout as e:
            # 超时错误
            raise Exception(f"请求超时: {str(e)}")
            
        except requests.exceptions.RequestException as e:
            # 其他网络请求错误
            raise Exception(f"网络请求失败: {str(e)}")
            
        except Exception as e:
            # 其他错误
            raise Exception(f"获取模型列表失败: {str(e)}")
    
    def _validate_api_url(self, api_url: str) -> bool:
        """
        验证API URL格式
        
        Args:
            api_url: API地址
            
        Returns:
            bool: 是否有效
        """
        if not api_url:
            return False
        
        if not api_url.startswith(('http://', 'https://')):
            return False
        
        return True
    
    def _validate_api_key(self, api_key: str) -> bool:
        """
        验证API密钥格式
        
        Args:
            api_key: API密钥
            
        Returns:
            bool: 是否有效
        """
        if not api_key:
            return False
        
        if len(api_key.strip()) < 10:
            return False
        
        return True
