"""
通用数据库操作器
提供完整的CRUD操作和高级查询功能
"""

import sqlite3
import math
from typing import Optional, Dict, Any, List, Tuple
from .database_connection import DatabaseConnection
from models.database import (
    QueryParams, PaginatedResult, InsertResult, 
    UpdateResult, DeleteResult, OrderDirection
)
import logging

logger = logging.getLogger("HMML")


class DatabaseOperator:
    """通用数据库操作器"""
    
    def __init__(self, connection: DatabaseConnection):
        """
        初始化数据库操作器
        
        Args:
            connection: 数据库连接
        """
        self.connection = connection
        
    def _validate_connection(self) -> None:
        """验证数据库连接"""
        if not self.connection.is_connected():
            raise RuntimeError("数据库未连接")
            
    def _build_where_clause(self, where_conditions: Dict[str, Any]) -> Tuple[str, List[Any]]:
        """
        构建WHERE子句
        
        Args:
            where_conditions: WHERE条件字典
            
        Returns:
            WHERE子句和参数列表的元组
        """
        if not where_conditions:
            return "", []
            
        clauses = []
        params = []
        
        for field, value in where_conditions.items():
            if value is None:
                clauses.append(f"{field} IS NULL")
            elif isinstance(value, (list, tuple)):
                # IN条件
                placeholders = ",".join(["?" for _ in value])
                clauses.append(f"{field} IN ({placeholders})")
                params.extend(value)
            elif isinstance(value, str) and value.startswith('%') and value.endswith('%'):
                # LIKE条件
                clauses.append(f"{field} LIKE ?")
                params.append(value)
            elif field.endswith(' >='):
                # 大于等于条件
                actual_field = field[:-3].strip()
                clauses.append(f"{actual_field} >= ?")
                params.append(value)
            elif field.endswith(' <='):
                # 小于等于条件
                actual_field = field[:-3].strip()
                clauses.append(f"{actual_field} <= ?")
                params.append(value)
            elif field.endswith(' >'):
                # 大于条件
                actual_field = field[:-2].strip()
                clauses.append(f"{actual_field} > ?")
                params.append(value)
            elif field.endswith(' <'):
                # 小于条件
                actual_field = field[:-2].strip()
                clauses.append(f"{actual_field} < ?")
                params.append(value)
            elif field.endswith(' !='):
                # 不等于条件
                actual_field = field[:-3].strip()
                clauses.append(f"{actual_field} != ?")
                params.append(value)
            else:
                clauses.append(f"{field} = ?")
                params.append(value)
                
        where_clause = " AND ".join(clauses)
        return f"WHERE {where_clause}", params
        
    def find_one(self, table_name: str, where_conditions: Optional[Dict[str, Any]] = None,
                 select_fields: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """
        查询单条记录
        
        Args:
            table_name: 表名
            where_conditions: WHERE条件
            select_fields: 查询字段列表
            
        Returns:
            查询结果或None
        """
        self._validate_connection()
        
        try:
            # 构建SELECT子句
            if select_fields:
                select_clause = ", ".join(select_fields)
            else:
                select_clause = "*"
                
            # 构建WHERE子句
            where_clause, params = self._build_where_clause(where_conditions or {})
            
            # 构建完整SQL
            sql = f"SELECT {select_clause} FROM {table_name}"
            if where_clause:
                sql += f" {where_clause}"
            sql += " LIMIT 1"
            
            logger.debug(f"执行查询单条记录: {sql}, 参数: {params}")
            
            cursor = self.connection.execute_query(sql, tuple(params))
            row = cursor.fetchone()
            
            if row:
                return dict(row)
            return None
            
        except Exception as error:
            logger.error(f"查询单条记录失败: {error}")
            raise
            
    def find_many(self, table_name: str, params: QueryParams) -> List[Dict[str, Any]]:
        """
        查询多条记录
        
        Args:
            table_name: 表名
            params: 查询参数
            
        Returns:
            查询结果列表
        """
        self._validate_connection()
        
        try:
            # 构建SELECT子句
            if params.select:
                select_clause = ", ".join(params.select)
            else:
                select_clause = "*"
                
            # 构建WHERE子句
            where_clause, where_params = self._build_where_clause(params.where or {})
            
            # 构建ORDER BY子句
            order_clause = ""
            if params.order_by:
                order_direction = params.order_dir.value if params.order_dir else "ASC"
                order_clause = f"ORDER BY {params.order_by} {order_direction}"
                
            # 构建LIMIT和OFFSET子句
            limit_clause = ""
            if params.limit is not None:
                limit_clause = f"LIMIT {params.limit}"
                if params.offset is not None:
                    limit_clause += f" OFFSET {params.offset}"
                    
            # 构建完整SQL
            sql = f"SELECT {select_clause} FROM {table_name}"
            if where_clause:
                sql += f" {where_clause}"
            if order_clause:
                sql += f" {order_clause}"
            if limit_clause:
                sql += f" {limit_clause}"
                
            logger.debug(f"执行查询多条记录: {sql}, 参数: {where_params}")
            
            cursor = self.connection.execute_query(sql, tuple(where_params))
            return [dict(row) for row in cursor.fetchall()]
            
        except Exception as error:
            logger.error(f"查询多条记录失败: {error}")
            raise
            
    def find_with_pagination(self, table_name: str, page: int = 1, page_size: int = 10,
                           where_conditions: Optional[Dict[str, Any]] = None,
                           order_by: Optional[str] = None,
                           order_dir: OrderDirection = OrderDirection.ASC,
                           select_fields: Optional[List[str]] = None) -> PaginatedResult:
        """
        分页查询
        
        Args:
            table_name: 表名
            page: 页码（从1开始）
            page_size: 每页大小
            where_conditions: WHERE条件
            order_by: 排序字段
            order_dir: 排序方向
            select_fields: 查询字段列表
            
        Returns:
            分页查询结果
        """
        self._validate_connection()
        
        try:
            # 查询总记录数
            where_clause, where_params = self._build_where_clause(where_conditions or {})
            count_sql = f"SELECT COUNT(*) as total FROM {table_name}"
            if where_clause:
                count_sql += f" {where_clause}"
                
            cursor = self.connection.execute_query(count_sql, tuple(where_params))
            total = cursor.fetchone()['total']
            
            # 计算分页信息
            total_pages = math.ceil(total / page_size) if total > 0 else 1
            offset = (page - 1) * page_size
            
            # 查询数据
            query_params = QueryParams(
                select=select_fields,
                where=where_conditions,
                order_by=order_by,
                order_dir=order_dir,
                limit=page_size,
                offset=offset
            )
            
            items = self.find_many(table_name, query_params)
            
            return PaginatedResult(
                items=items,
                total_pages=total_pages,
                current_page=page,
                page_size=page_size,
                total=total,
                has_next=page < total_pages,
                has_prev=page > 1
            )
            
        except Exception as error:
            logger.error(f"分页查询失败: {error}")
            raise
            
    def insert(self, table_name: str, data: Dict[str, Any]) -> InsertResult:
        """
        插入记录
        
        Args:
            table_name: 表名
            data: 插入数据
            
        Returns:
            插入结果
        """
        self._validate_connection()
        
        try:
            if not data:
                raise ValueError("插入数据不能为空")
                
            fields = list(data.keys())
            values = list(data.values())
            placeholders = ",".join(["?" for _ in values])
            
            sql = f"INSERT INTO {table_name} ({','.join(fields)}) VALUES ({placeholders})"
            
            logger.debug(f"执行插入操作: {sql}, 参数: {values}")
            
            affected_rows = self.connection.execute_update(sql, tuple(values))
            last_insert_id = self.connection.get_last_insert_id()
            
            return InsertResult(
                success=True,
                last_insert_id=last_insert_id,
                affected_rows=affected_rows
            )
            
        except Exception as error:
            logger.error(f"插入记录失败: {error}")
            raise
            
    def update(self, table_name: str, data: Dict[str, Any], 
               where_conditions: Dict[str, Any]) -> UpdateResult:
        """
        更新记录
        
        Args:
            table_name: 表名
            data: 更新数据
            where_conditions: WHERE条件
            
        Returns:
            更新结果
        """
        self._validate_connection()
        
        try:
            if not data:
                raise ValueError("更新数据不能为空")
            if not where_conditions:
                raise ValueError("更新操作必须指定WHERE条件")
                
            # 构建SET子句
            set_clauses = []
            set_params = []
            for field, value in data.items():
                set_clauses.append(f"{field} = ?")
                set_params.append(value)
                
            set_clause = ", ".join(set_clauses)
            
            # 构建WHERE子句
            where_clause, where_params = self._build_where_clause(where_conditions)
            
            # 构建完整SQL
            sql = f"UPDATE {table_name} SET {set_clause} {where_clause}"
            all_params = set_params + where_params
            
            logger.debug(f"执行更新操作: {sql}, 参数: {all_params}")
            
            affected_rows = self.connection.execute_update(sql, tuple(all_params))
            
            return UpdateResult(
                success=True,
                affected_rows=affected_rows
            )
            
        except Exception as error:
            logger.error(f"更新记录失败: {error}")
            raise
            
    def delete(self, table_name: str, where_conditions: Dict[str, Any]) -> DeleteResult:
        """
        删除记录
        
        Args:
            table_name: 表名
            where_conditions: WHERE条件
            
        Returns:
            删除结果
        """
        self._validate_connection()
        
        try:
            if not where_conditions:
                raise ValueError("删除操作必须指定WHERE条件")
                
            # 构建WHERE子句
            where_clause, where_params = self._build_where_clause(where_conditions)
            
            # 构建完整SQL
            sql = f"DELETE FROM {table_name} {where_clause}"
            
            logger.debug(f"执行删除操作: {sql}, 参数: {where_params}")
            
            affected_rows = self.connection.execute_update(sql, tuple(where_params))
            
            return DeleteResult(
                success=True,
                affected_rows=affected_rows
            )
            
        except Exception as error:
            logger.error(f"删除记录失败: {error}")
            raise
            
    def execute_raw_sql(self, sql: str, params: Tuple = ()) -> sqlite3.Cursor:
        """
        执行原始SQL
        
        Args:
            sql: SQL语句
            params: 参数
            
        Returns:
            查询游标
        """
        self._validate_connection()
        
        try:
            logger.debug(f"执行原始SQL: {sql}, 参数: {params}")
            return self.connection.execute_query(sql, params)
        except Exception as error:
            logger.error(f"执行原始SQL失败: {error}")
            raise
            
    def count(self, table_name: str, where_conditions: Optional[Dict[str, Any]] = None) -> int:
        """
        统计记录数
        
        Args:
            table_name: 表名
            where_conditions: WHERE条件
            
        Returns:
            记录数
        """
        self._validate_connection()
        
        try:
            where_clause, where_params = self._build_where_clause(where_conditions or {})
            
            sql = f"SELECT COUNT(*) as count FROM {table_name}"
            if where_clause:
                sql += f" {where_clause}"
                
            logger.debug(f"执行统计查询: {sql}, 参数: {where_params}")
            
            cursor = self.connection.execute_query(sql, tuple(where_params))
            return cursor.fetchone()['count']
            
        except Exception as error:
            logger.error(f"统计记录数失败: {error}")
            raise
