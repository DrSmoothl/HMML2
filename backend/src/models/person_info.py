"""
Person Info 数据模型
人物信息表相关的数据模型定义
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from .database import ApiResponse


class PersonInfoBase(BaseModel):
    """Person Info 基础模型"""
    model_config = ConfigDict(from_attributes=True)
    
    person_id: str = Field(..., description="人物ID", max_length=255)
    person_name: str = Field(..., description="人物名称", max_length=255)
    name_reason: Optional[str] = Field(default=None, description="命名原因")
    platform: str = Field(..., description="平台", max_length=100)
    user_id: str = Field(..., description="用户ID", max_length=255)
    nickname: str = Field(..., description="昵称", max_length=255)
    impression: Optional[str] = Field(default=None, description="印象")
    short_impression: Optional[str] = Field(default=None, description="简短印象")
    points: Optional[str] = Field(default=None, description="对用户的认知点")
    forgotten_points: Optional[str] = Field(default="[]", description="被遗忘的点")
    info_list: Optional[str] = Field(default="[]", description="信息列表")
    know_times: Optional[float] = Field(default=0.0, description="认知次数")
    know_since: Optional[float] = Field(default=None, description="认知开始时间")
    last_know: Optional[float] = Field(default=None, description="最后认知时间")
    attitude_to_me: Optional[str] = Field(default=None, description="对自己的态度")
    attitude_to_me_confidence: Optional[float] = Field(default=None, description="对自己的态度的累计权重")
    friendly_value: Optional[float] = Field(default=None, description="友好度")
    friendly_value_confidence: Optional[float] = Field(default=None, description="友好度的累计权重")
    rudeness: Optional[str] = Field(default=None, description="粗鲁度")
    rudeness_confidence: Optional[float] = Field(default=None, description="粗鲁度的累计权重")
    neuroticism: Optional[str] = Field(default=None, description="神经质程度")
    neuroticism_confidence: Optional[float] = Field(default=None, description="神经质程度的累计权重")
    conscientiousness: Optional[str] = Field(default=None, description="尽责程度")
    conscientiousness_confidence: Optional[float] = Field(default=None, description="尽责程度的累计权重")
    likeness: Optional[str] = Field(default=None, description="喜爱程度")
    likeness_confidence: Optional[float] = Field(default=None, description="喜爱程度的累计权重")


class PersonInfo(PersonInfoBase):
    """Person Info 完整模型（包含ID）"""
    id: int = Field(..., description="唯一标识符")
    is_known: Optional[int] = Field(default=0, description="是否已经认识")


class PersonInfoCreate(PersonInfoBase):
    """Person Info 创建模型（不包含ID和is_known）"""
    pass


class PersonInfoUpdate(PersonInfoBase):
    """Person Info 更新模型（包含ID）"""
    id: int = Field(..., description="唯一标识符")


class PersonInfoDelete(BaseModel):
    """Person Info 删除模型"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="要删除的记录ID")


class PersonInfoQuery(BaseModel):
    """Person Info 查询参数模型"""
    model_config = ConfigDict(from_attributes=True)
    
    page: int = Field(default=1, ge=1, description="页码，从1开始")
    pageSize: int = Field(default=10, ge=1, le=100, description="每页数量")
    person_id: Optional[str] = Field(default=None, description="人物ID过滤")
    platform: Optional[str] = Field(default=None, description="平台过滤")
    user_id: Optional[str] = Field(default=None, description="用户ID过滤")
    person_name: Optional[str] = Field(default=None, description="人物名称过滤")


class PersonInfoListData(BaseModel):
    """Person Info 列表数据模型"""
    model_config = ConfigDict(from_attributes=True)
    
    items: List[PersonInfo] = Field(..., description="人物信息列表")
    totalPages: int = Field(..., description="总页数")
    currentPage: int = Field(..., description="当前页")
    pageSize: int = Field(..., description="每页大小")


class PersonInfoListResponse(ApiResponse):
    """Person Info 列表响应模型"""
    data: PersonInfoListData = Field(..., description="人物信息列表数据")


class PersonInfoCreateResponse(ApiResponse):
    """Person Info 创建响应模型"""
    data: dict = Field(..., description="创建结果，包含新记录的ID")


class PersonInfoUpdateResponse(ApiResponse):
    """Person Info 更新响应模型"""
    pass


class PersonInfoDeleteResponse(ApiResponse):
    """Person Info 删除响应模型"""
    pass


class PersonInfoFilter(BaseModel):
    """Person Info 过滤器模型"""
    model_config = ConfigDict(from_attributes=True)
    
    person_id: Optional[str] = Field(default=None, description="人物ID")
    platform: Optional[str] = Field(default=None, description="平台")
    user_id: Optional[str] = Field(default=None, description="用户ID")
    person_name: Optional[str] = Field(default=None, description="人物名称")
    is_known: Optional[int] = Field(default=None, description="是否已知")
