"""
配置数据模型
Configuration Models
定义配置文件相关的数据模型和类型
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class ConfigFileInfo(BaseModel):
    """配置文件信息"""
    path: str = Field(..., description="配置文件路径")
    exists: bool = Field(default=False, description="文件是否存在")
    readable: bool = Field(default=False, description="文件是否可读")
    writable: bool = Field(default=False, description="文件是否可写")
    size: int = Field(default=0, description="文件大小（字节）")
    last_modified: str = Field(..., description="最后修改时间（ISO格式）")


class MainConfigData(BaseModel):
    """麦麦主程序配置数据"""
    # 这里可以包含任意的配置项，因为配置是动态的
    class Config:
        extra = "allow"  # 允许额外的字段
        
    def model_dump(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return super().model_dump()


class ModelConfigData(BaseModel):
    """麦麦模型配置数据"""
    api_providers: Optional[List[Dict[str, Any]]] = Field(default=None, description="API服务提供商列表")
    models: Optional[List[Dict[str, Any]]] = Field(default=None, description="模型配置列表")
    
    class Config:
        extra = "allow"  # 允许额外的字段


class AdapterConfigData(BaseModel):
    """适配器配置数据"""
    # 允许任意配置结构，因为不同适配器的配置可能不同
    class Config:
        extra = "allow"


class ConfigUpdateData(BaseModel):
    """配置更新数据"""
    class Config:
        extra = "allow"  # 允许任意字段


class ApiProviderData(BaseModel):
    """API供应商数据"""
    name: str = Field(..., description="供应商名称")
    base_url: str = Field(..., description="API基础URL")
    api_key: str = Field(..., description="API密钥")
    client_type: Optional[str] = Field(default="openai", description="客户端类型")
    max_retry: Optional[int] = Field(default=2, description="最大重试次数")
    timeout: Optional[int] = Field(default=30, description="超时时间（秒）")
    retry_interval: Optional[int] = Field(default=10, description="重试间隔（秒）")


class ModelData(BaseModel):
    """模型配置数据"""
    model_identifier: str = Field(..., description="模型标识符")
    name: str = Field(..., description="模型名称")
    api_provider: str = Field(..., description="API供应商名称")
    price_in: Optional[float] = Field(default=0.0, description="输入价格")
    price_out: Optional[float] = Field(default=0.0, description="输出价格")
    force_stream_mode: Optional[bool] = Field(default=None, description="强制流式输出模式")


class ProviderDeleteData(BaseModel):
    """删除供应商数据"""
    name: str = Field(..., description="供应商名称")


class ModelDeleteData(BaseModel):
    """删除模型数据"""
    name: str = Field(..., description="模型名称")


class ConfigServiceOptions(BaseModel):
    """配置服务选项"""
    encoding: str = Field(default="utf-8", description="文件编码")
    backup: bool = Field(default=True, description="是否创建备份")
    validate: bool = Field(default=True, description="是否验证数据")
