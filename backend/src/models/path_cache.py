"""
路径缓存相关类型定义
Path Cache Type Definitions
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class AdapterRootInfo(BaseModel):
    """适配器根目录信息"""
    adapter_name: str = Field(..., description="适配器名称")
    root_path: str = Field(..., description="适配器根目录路径")


class PathCacheData(BaseModel):
    """路径缓存数据结构"""
    main_root: Optional[str] = Field(None, description="麦麦主程序根目录")
    adapter_roots: List[AdapterRootInfo] = Field(default_factory=list, description="适配器根目录列表")
    last_updated: str = Field(..., description="最后更新时间")
    version: str = Field(default="1.0.0", description="数据版本")


class GetAllPathsResponse(BaseModel):
    """API响应 - 获取所有路径"""
    main_root: Optional[str] = Field(None, description="麦麦主程序根目录")
    adapter_roots: List[AdapterRootInfo] = Field(default_factory=list, description="适配器根目录列表")


class SetRootPathRequest(BaseModel):
    """API请求 - 设置主程序根目录"""
    mainRoot: str = Field(..., description="新的麦麦主程序根目录", min_length=1, max_length=500)


class SetRootPathResponse(BaseModel):
    """API响应 - 设置主程序根目录"""
    success: bool = Field(..., description="是否设置成功")
    main_root: str = Field(..., description="设置的主程序根目录")
    message: str = Field(..., description="响应消息")


class AddAdapterRootRequest(BaseModel):
    """API请求 - 添加适配器根目录"""
    adapterName: str = Field(..., description="适配器名称", min_length=1, max_length=100)
    rootPath: str = Field(..., description="适配器根目录路径", min_length=1, max_length=500)


class AddAdapterRootResponse(BaseModel):
    """API响应 - 添加适配器根目录"""
    success: bool = Field(..., description="是否添加成功")
    adapter_name: str = Field(..., description="适配器名称")
    root_path: str = Field(..., description="适配器根目录路径")
    message: str = Field(..., description="响应消息")


class RemoveAdapterRootRequest(BaseModel):
    """API请求 - 移除适配器根目录"""
    adapterName: str = Field(..., description="适配器名称", min_length=1, max_length=100)


class UpdateAdapterRootRequest(BaseModel):
    """API请求 - 更新适配器根目录"""
    adapterName: str = Field(..., description="适配器名称", min_length=1, max_length=100)
    rootPath: str = Field(..., description="新的根目录路径", min_length=1, max_length=500)


class UpdateAdapterRootResponse(BaseModel):
    """API响应 - 更新适配器根目录"""
    success: bool = Field(..., description="是否更新成功")
    adapter_name: str = Field(..., description="适配器名称")
    root_path: str = Field(..., description="新的根目录路径")
    message: str = Field(..., description="响应消息")


class PathValidationResult(BaseModel):
    """路径验证结果"""
    is_valid: bool = Field(..., description="是否有效")
    error: Optional[str] = Field(None, description="错误消息（如果无效）")
    exists: bool = Field(..., description="路径是否存在")
    is_directory: bool = Field(..., description="是否为目录")
    absolute_path: Optional[str] = Field(None, description="绝对路径")


class PathCacheConfig(BaseModel):
    """路径缓存配置"""
    cache_file_path: str = Field(..., description="缓存文件路径")
    enable_validation: bool = Field(default=True, description="是否启用路径验证")
    auto_create_directory: bool = Field(default=False, description="是否自动创建目录")
    max_adapters: int = Field(default=50, description="最大适配器数量")


class StandardResponse(BaseModel):
    """标准API响应格式"""
    status: int = Field(..., description="状态码")
    message: str = Field(..., description="响应消息")
    time: int = Field(..., description="时间戳（毫秒）")
    data: Optional[dict] = Field(None, description="响应数据")


class CacheStats(BaseModel):
    """缓存统计信息"""
    has_main_root: bool = Field(..., description="是否有主程序根目录")
    adapter_count: int = Field(..., description="适配器数量")
    last_updated: str = Field(..., description="最后更新时间")
