"""
Emoji表操作的专用数据模型
提供emoji表数据的类型定义和验证
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from .database import ApiResponse


class EmojiRecord(BaseModel):
    """Emoji记录模型"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="唯一标识符")
    full_path: str = Field(..., description="完整路径")
    format: str = Field(..., description="格式")
    emoji_hash: str = Field(..., description="哈希值")
    description: str = Field(..., description="描述")
    query_count: int = Field(default=0, description="查询次数")
    is_registered: int = Field(default=0, description="是否注册 (0/1)")
    is_banned: int = Field(default=0, description="是否被禁止 (0/1)")
    emotion: str = Field(default="", description="情感")
    record_time: float = Field(..., description="记录时间")
    register_time: float = Field(..., description="注册时间")
    usage_count: int = Field(default=0, description="使用次数")
    last_used_time: float = Field(..., description="最后使用时间")


class EmojiInsertData(BaseModel):
    """插入Emoji时的数据模型（不包含id）"""
    model_config = ConfigDict(from_attributes=True)
    
    full_path: str = Field(..., description="完整路径")
    format: str = Field(..., description="格式")
    emoji_hash: str = Field(..., description="哈希值")
    description: str = Field(..., description="描述")
    query_count: int = Field(default=0, description="查询次数")
    is_registered: int = Field(default=0, description="是否注册 (0/1)")
    is_banned: int = Field(default=0, description="是否被禁止 (0/1)")
    emotion: str = Field(default="", description="情感")
    record_time: float = Field(..., description="记录时间")
    register_time: float = Field(..., description="注册时间")
    usage_count: int = Field(default=0, description="使用次数")
    last_used_time: float = Field(..., description="最后使用时间")


class EmojiUpdateData(BaseModel):
    """更新Emoji时的数据模型"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="要更新的记录ID")
    full_path: Optional[str] = Field(default=None, description="完整路径")
    format: Optional[str] = Field(default=None, description="格式")
    emoji_hash: Optional[str] = Field(default=None, description="哈希值")
    description: Optional[str] = Field(default=None, description="描述")
    query_count: Optional[int] = Field(default=None, description="查询次数")
    is_registered: Optional[int] = Field(default=None, description="是否注册 (0/1)")
    is_banned: Optional[int] = Field(default=None, description="是否被禁止 (0/1)")
    emotion: Optional[str] = Field(default=None, description="情感")
    record_time: Optional[float] = Field(default=None, description="记录时间")
    register_time: Optional[float] = Field(default=None, description="注册时间")
    usage_count: Optional[int] = Field(default=None, description="使用次数")
    last_used_time: Optional[float] = Field(default=None, description="最后使用时间")


class EmojiDeleteData(BaseModel):
    """删除Emoji时的数据模型"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="要删除的记录ID")


class EmojiQueryFilter(BaseModel):
    """Emoji查询过滤器"""
    model_config = ConfigDict(from_attributes=True)
    
    format: Optional[str] = Field(default=None, description="按格式过滤")
    emotion: Optional[str] = Field(default=None, description="按情感过滤")
    is_registered: Optional[int] = Field(default=None, description="按注册状态过滤")
    is_banned: Optional[int] = Field(default=None, description="按禁止状态过滤")
    description: Optional[str] = Field(default=None, description="按描述模糊搜索")
    emoji_hash: Optional[str] = Field(default=None, description="按哈希值查找")


class EmojiPaginationParams(BaseModel):
    """Emoji分页查询参数"""
    model_config = ConfigDict(from_attributes=True)
    
    page: int = Field(default=1, ge=1, description="页码，从1开始")
    page_size: int = Field(default=10, ge=1, le=1000, description="每页数量")
    order_by: Optional[str] = Field(default=None, description="排序字段")
    order_dir: Optional[str] = Field(default="ASC", description="排序方向")
    format: Optional[str] = Field(default=None, description="按格式过滤")
    emotion: Optional[str] = Field(default=None, description="按情感过滤")
    is_registered: Optional[int] = Field(default=None, description="按注册状态过滤")
    is_banned: Optional[int] = Field(default=None, description="按禁止状态过滤")
    description: Optional[str] = Field(default=None, description="按描述模糊搜索")
    emoji_hash: Optional[str] = Field(default=None, description="按哈希值查找")


class EmojiQueryResponse(BaseModel):
    """Emoji查询响应"""
    model_config = ConfigDict(from_attributes=True)
    
    items: List[EmojiRecord] = Field(default_factory=list, description="emoji内容")
    total_pages: int = Field(..., description="总页数")
    current_page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页大小")
    total: int = Field(..., description="总记录数")
    has_next: bool = Field(..., description="是否有下一页")
    has_prev: bool = Field(..., description="是否有上一页")


class EmojiInsertResponse(ApiResponse):
    """Emoji插入响应"""
    model_config = ConfigDict(from_attributes=True)
    
    data: Optional[dict] = Field(default=None, description="插入结果数据，包含id")


class EmojiUpdateResponse(ApiResponse):
    """Emoji更新响应"""
    model_config = ConfigDict(from_attributes=True)


class EmojiDeleteResponse(ApiResponse):
    """Emoji删除响应"""
    model_config = ConfigDict(from_attributes=True)


class EmojiGetResponse(ApiResponse):
    """Emoji查询响应"""
    model_config = ConfigDict(from_attributes=True)
    
    data: Optional[EmojiQueryResponse] = Field(default=None, description="查询结果数据")


class EmojiImageResponse(ApiResponse):
    """获取单个emoji图片响应"""
    model_config = ConfigDict(from_attributes=True)
    
    data: Optional[dict] = Field(default=None, description="图片数据，包含imageb64字段")


class EmojiStatsResponse(ApiResponse):
    """Emoji统计信息响应"""
    model_config = ConfigDict(from_attributes=True)
    
    data: Optional[dict] = Field(default=None, description="统计数据")


class CalculateHashRequest(BaseModel):
    """计算哈希值请求"""
    model_config = ConfigDict(from_attributes=True)
    
    image_path: str = Field(..., description="图片路径")


class CalculateHashResponse(ApiResponse):
    """计算哈希值响应"""
    model_config = ConfigDict(from_attributes=True)
    
    data: Optional[dict] = Field(default=None, description="哈希值数据，包含imageHash字段")
