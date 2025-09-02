"""
SQLite数据库操作的通用数据模型
提供数据库操作的类型定义和验证
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List, Generic, TypeVar
from enum import Enum

# 定义泛型类型变量
T = TypeVar('T')


class OrderDirection(str, Enum):
    """排序方向枚举"""
    ASC = "ASC"
    DESC = "DESC"


class DatabaseConfig(BaseModel):
    """数据库配置模型"""
    model_config = ConfigDict(from_attributes=True)
    
    path: str = Field(..., description="数据库文件路径")
    readonly: bool = Field(default=False, description="是否只读模式")
    timeout: int = Field(default=30, description="连接超时时间(秒)")
    check_same_thread: bool = Field(default=False, description="是否检查同线程")


class PaginationParams(BaseModel):
    """分页参数模型"""
    model_config = ConfigDict(from_attributes=True)
    
    page: int = Field(default=1, ge=1, description="页码，从1开始")
    page_size: int = Field(default=10, ge=1, le=1000, description="每页大小，1-1000")


class SortParams(BaseModel):
    """排序参数模型"""
    model_config = ConfigDict(from_attributes=True)
    
    order_by: Optional[str] = Field(default=None, description="排序字段")
    order_dir: OrderDirection = Field(default=OrderDirection.ASC, description="排序方向")


class QueryFilter(BaseModel):
    """查询过滤器基础模型"""
    model_config = ConfigDict(from_attributes=True)
    
    # 允许额外字段，方便扩展
    pass


class PaginatedResult(BaseModel, Generic[T]):
    """分页查询结果模型"""
    model_config = ConfigDict(from_attributes=True)
    
    items: List[T] = Field(default_factory=list, description="查询结果列表")
    total_pages: int = Field(..., description="总页数")
    current_page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页大小")
    total: int = Field(..., description="总记录数")
    has_next: bool = Field(..., description="是否有下一页")
    has_prev: bool = Field(..., description="是否有上一页")


class QueryParams(BaseModel):
    """查询参数模型"""
    model_config = ConfigDict(from_attributes=True)
    
    select: Optional[List[str]] = Field(default=None, description="选择的字段列表")
    where: Optional[Dict[str, Any]] = Field(default=None, description="WHERE条件")
    order_by: Optional[str] = Field(default=None, description="排序字段")
    order_dir: OrderDirection = Field(default=OrderDirection.ASC, description="排序方向")
    limit: Optional[int] = Field(default=None, description="查询限制")
    offset: Optional[int] = Field(default=None, description="查询偏移")


class InsertResult(BaseModel):
    """插入操作结果模型"""
    model_config = ConfigDict(from_attributes=True)
    
    success: bool = Field(..., description="是否成功")
    last_insert_id: Optional[int] = Field(default=None, description="最后插入的ID")
    affected_rows: int = Field(default=0, description="影响的行数")


class UpdateResult(BaseModel):
    """更新操作结果模型"""
    model_config = ConfigDict(from_attributes=True)
    
    success: bool = Field(..., description="是否成功")
    affected_rows: int = Field(default=0, description="影响的行数")


class DeleteResult(BaseModel):
    """删除操作结果模型"""
    model_config = ConfigDict(from_attributes=True)
    
    success: bool = Field(..., description="是否成功")
    affected_rows: int = Field(default=0, description="影响的行数")


class TableInfo(BaseModel):
    """表信息模型"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str = Field(..., description="表名")
    column_count: int = Field(..., description="列数")
    row_count: int = Field(..., description="行数")
    columns: List[Dict[str, Any]] = Field(default_factory=list, description="列信息")


class DatabaseInfo(BaseModel):
    """数据库信息模型"""
    model_config = ConfigDict(from_attributes=True)
    
    path: str = Field(..., description="数据库路径")
    size: int = Field(..., description="文件大小(字节)")
    table_count: int = Field(..., description="表数量")
    tables: List[str] = Field(default_factory=list, description="表名列表")


class ApiResponse(BaseModel):
    """API响应基础模型"""
    model_config = ConfigDict(from_attributes=True)
    
    status: int = Field(..., description="状态码")
    message: str = Field(..., description="响应消息")
    data: Optional[Any] = Field(default=None, description="响应数据")
    time: int = Field(..., description="响应时间戳")


class ErrorResponse(BaseModel):
    """错误响应模型"""
    model_config = ConfigDict(from_attributes=True)
    
    status: int = Field(..., description="错误状态码")
    message: str = Field(..., description="错误消息")
    error: Optional[str] = Field(default=None, description="错误详情")
    time: int = Field(..., description="响应时间戳")
