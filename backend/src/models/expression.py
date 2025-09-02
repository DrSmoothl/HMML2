"""
Expression表数据模型
用于定义Expression表的数据结构和验证规则
"""

from typing import Optional, Dict, List
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

from .database import PaginationParams


class ExpressionType(str, Enum):
    """Expression类型枚举"""
    STYLE = "style"         # 表达方式
    GRAMMAR = "grammar"     # 语法表达方式


class ExpressionRecord(BaseModel):
    """Expression表完整记录结构"""
    id: int = Field(..., description="唯一标识符")
    situation: str = Field(..., description="情境描述")
    style: str = Field(..., description="对应的表达风格")
    count: float = Field(..., description="统计次数")
    last_active_time: float = Field(..., description="最后使用此表达方式的时间")
    chat_id: str = Field(..., description="聊天ID")
    type: str = Field(..., description="类型（style/grammar）")
    create_date: float = Field(..., description="创建时间")


class ExpressionInsertData(BaseModel):
    """插入Expression时的数据结构（不包含id）"""
    situation: str = Field(..., description="情境描述", min_length=1, max_length=1000)
    style: str = Field(..., description="对应的表达风格", min_length=1, max_length=1000)
    count: Optional[float] = Field(0.0, description="统计次数", ge=0)
    last_active_time: Optional[float] = Field(None, description="最后使用此表达方式的时间")
    chat_id: str = Field(..., description="聊天ID", min_length=1, max_length=100)
    type: str = Field(..., description="类型", min_length=1, max_length=50)
    create_date: Optional[float] = Field(None, description="创建时间")


class ExpressionUpdateData(BaseModel):
    """更新Expression时的数据结构"""
    id: int = Field(..., description="要更新的记录ID", gt=0)
    situation: Optional[str] = Field(None, description="情境描述", min_length=1, max_length=1000)
    style: Optional[str] = Field(None, description="对应的表达风格", min_length=1, max_length=1000)
    count: Optional[float] = Field(None, description="统计次数", ge=0)
    last_active_time: Optional[float] = Field(None, description="最后使用此表达方式的时间")
    chat_id: Optional[str] = Field(None, description="聊天ID", min_length=1, max_length=100)
    type: Optional[str] = Field(None, description="类型", min_length=1, max_length=50)
    create_date: Optional[float] = Field(None, description="创建时间")


class ExpressionDeleteData(BaseModel):
    """删除Expression时的数据结构"""
    id: int = Field(..., description="要删除的记录ID", gt=0)


class ExpressionFilterOptions(BaseModel):
    """Expression查询过滤选项"""
    situation: Optional[str] = Field(None, description="按情境描述过滤")
    style: Optional[str] = Field(None, description="按表达风格过滤")
    chat_id: Optional[str] = Field(None, description="按聊天ID过滤")
    type: Optional[str] = Field(None, description="按类型过滤")
    minCount: Optional[float] = Field(None, description="最小统计次数", ge=0)
    maxCount: Optional[float] = Field(None, description="最大统计次数", ge=0)
    startDate: Optional[float] = Field(None, description="开始创建时间")
    endDate: Optional[float] = Field(None, description="结束创建时间")


class ExpressionPaginationParams(PaginationParams):
    """Expression分页查询参数"""
    orderBy: Optional[str] = Field("id", description="排序字段")
    orderDir: Optional[str] = Field("ASC", description="排序方向")
    filter: Optional[ExpressionFilterOptions] = Field(None, description="过滤条件")


class ExpressionPaginationResult(BaseModel):
    """Expression分页查询结果"""
    model_config = ConfigDict(from_attributes=True)
    
    items: List[ExpressionRecord] = Field(default_factory=list, description="Expression记录列表")
    totalPages: int = Field(..., description="总页数")
    page: int = Field(..., description="当前页")
    size: int = Field(..., description="每页大小")
    total: int = Field(..., description="总记录数")


class ExpressionStats(BaseModel):
    """Expression统计信息"""
    total: int = Field(..., description="总记录数")
    byType: Dict[str, int] = Field(default_factory=dict, description="按类型统计")
    byChatId: Dict[str, int] = Field(default_factory=dict, description="按聊天ID统计")
    avgCount: float = Field(..., description="平均统计次数")
    totalCount: float = Field(..., description="总统计次数")
    recentActive: int = Field(..., description="最近活跃的expression数量（24小时内）")


class ExpressionSearchParams(BaseModel):
    """Expression搜索参数"""
    keyword: str = Field(..., description="搜索关键字", min_length=1, max_length=100)
    limit: Optional[int] = Field(20, description="限制结果数量", ge=1, le=100)


class ExpressionChatParams(BaseModel):
    """按聊天ID查询Expression参数"""
    chatId: str = Field(..., description="聊天ID", min_length=1, max_length=100)
    limit: Optional[int] = Field(10, description="限制结果数量", ge=1, le=100)


class ExpressionTypeParams(BaseModel):
    """按类型查询Expression参数"""
    type: str = Field(..., description="类型", min_length=1, max_length=50)
    limit: Optional[int] = Field(10, description="限制结果数量", ge=1, le=100)


class ExpressionValidationError(BaseModel):
    """Expression验证错误信息"""
    field: str = Field(..., description="错误字段")
    message: str = Field(..., description="错误信息")
