"""
工具相关数据模型
用于定义工具API的请求和响应数据结构
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class GetModelsRequest(BaseModel):
    """获取模型列表请求模型"""
    api_url: str = Field(..., description="API服务地址", example="https://api.siliconflow.cn/v1")
    api_key: str = Field(..., description="API密钥", example="sk-xxxx")


class ModelInfo(BaseModel):
    """模型信息"""
    id: str = Field(..., description="模型ID")
    object: Optional[str] = Field(None, description="对象类型")
    created: Optional[int] = Field(None, description="创建时间")
    owned_by: Optional[str] = Field(None, description="拥有者")


class ExternalModelsResponse(BaseModel):
    """外部API模型列表响应"""
    object: str = Field(..., description="对象类型")
    data: List[ModelInfo] = Field(..., description="模型列表")


class GetModelsResponseData(BaseModel):
    """获取模型列表响应数据"""
    models: List[str] = Field(..., description="模型ID列表")


class GetModelsResponse(BaseModel):
    """获取模型列表响应模型"""
    status: int = Field(200, description="状态码")
    message: str = Field("获取模型成功", description="响应消息")
    data: GetModelsResponseData = Field(..., description="响应数据")
    time: int = Field(..., description="响应时间戳")
