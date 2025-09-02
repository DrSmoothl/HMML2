"""
Chat Stream 数据模型
聊天流表相关的数据模型定义
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from .database import ApiResponse


class ChatStreamBase(BaseModel):
    """Chat Stream 基础模型"""
    model_config = ConfigDict(from_attributes=True)
    
    stream_id: str = Field(..., description="聊天流id", max_length=255)
    create_time: float = Field(..., description="创建时间")
    group_platform: Optional[str] = Field(default=None, description="群组平台", max_length=100)
    group_id: Optional[str] = Field(default=None, description="群组id", max_length=255)
    group_name: Optional[str] = Field(default=None, description="群组名称", max_length=255)
    last_active_time: float = Field(..., description="最后活跃时间")
    platform: str = Field(..., description="平台", max_length=100)
    user_platform: Optional[str] = Field(default=None, description="用户平台", max_length=100)
    user_id: str = Field(..., description="用户id", max_length=255)
    user_nickname: Optional[str] = Field(default=None, description="用户昵称", max_length=255)
    user_cardname: Optional[str] = Field(default=None, description="用户群昵称", max_length=255)


class ChatStream(ChatStreamBase):
    """Chat Stream 完整模型（包含ID）"""
    id: int = Field(..., description="唯一标识符")


class ChatStreamCreate(ChatStreamBase):
    """Chat Stream 创建模型（不包含ID）"""
    pass


class ChatStreamUpdate(ChatStreamBase):
    """Chat Stream 更新模型（包含ID）"""
    id: int = Field(..., description="唯一标识符")


class ChatStreamDelete(BaseModel):
    """Chat Stream 删除模型"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="要删除的记录ID")


class ChatStreamQuery(BaseModel):
    """Chat Stream 查询参数模型"""
    model_config = ConfigDict(from_attributes=True)
    
    page: int = Field(default=1, ge=1, description="页码，从1开始")
    pageSize: int = Field(default=10, ge=1, le=100, description="每页数量")
    stream_id: Optional[str] = Field(default=None, description="聊天流ID过滤")
    group_platform: Optional[str] = Field(default=None, description="群组平台过滤")
    group_id: Optional[str] = Field(default=None, description="群组ID过滤")
    group_name: Optional[str] = Field(default=None, description="群组名称过滤")
    platform: Optional[str] = Field(default=None, description="平台过滤")
    user_platform: Optional[str] = Field(default=None, description="用户平台过滤")
    user_id: Optional[str] = Field(default=None, description="用户ID过滤")
    user_nickname: Optional[str] = Field(default=None, description="用户昵称过滤")
    user_cardname: Optional[str] = Field(default=None, description="用户群昵称过滤")


class ChatStreamListData(BaseModel):
    """Chat Stream 列表数据模型"""
    model_config = ConfigDict(from_attributes=True)
    
    items: List[ChatStream] = Field(..., description="聊天流列表")
    totalPages: int = Field(..., description="总页数")
    currentPage: int = Field(..., description="当前页")
    pageSize: int = Field(..., description="每页大小")


class ChatStreamListResponse(ApiResponse):
    """Chat Stream 列表响应模型"""
    data: ChatStreamListData = Field(..., description="聊天流列表数据")


class ChatStreamCreateResponse(ApiResponse):
    """Chat Stream 创建响应模型"""
    data: dict = Field(..., description="创建结果，包含新记录的ID")


class ChatStreamUpdateResponse(ApiResponse):
    """Chat Stream 更新响应模型"""
    pass


class ChatStreamDeleteResponse(ApiResponse):
    """Chat Stream 删除响应模型"""
    pass


class ChatStreamFilter(BaseModel):
    """Chat Stream 过滤器模型"""
    model_config = ConfigDict(from_attributes=True)
    
    stream_id: Optional[str] = Field(default=None, description="聊天流ID")
    group_platform: Optional[str] = Field(default=None, description="群组平台")
    group_id: Optional[str] = Field(default=None, description="群组ID")
    group_name: Optional[str] = Field(default=None, description="群组名称")
    platform: Optional[str] = Field(default=None, description="平台")
    user_platform: Optional[str] = Field(default=None, description="用户平台")
    user_id: Optional[str] = Field(default=None, description="用户ID")
    user_nickname: Optional[str] = Field(default=None, description="用户昵称")
    user_cardname: Optional[str] = Field(default=None, description="用户群昵称")
