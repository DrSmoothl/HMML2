"""
Expression表业务逻辑服务
提供Expression表的所有业务操作功能
"""

import time
from typing import Optional, List

from core.database_manager import database_manager
from core.database_operator import DatabaseOperator
from core.logger import logger
from models.database import OrderDirection, QueryParams
from models.expression import (
    ExpressionRecord, ExpressionInsertData, ExpressionUpdateData,
    ExpressionPaginationParams, ExpressionPaginationResult,
    ExpressionStats
)
from utils.database_validator import DatabaseValidator


class ExpressionService:
    """Expression表服务类"""
    
    TABLE_NAME = "expression"
    DATABASE_NAME = "maibot"  # 修正为正确的数据库连接名
    
    @classmethod
    async def get_expressions(cls, params: ExpressionPaginationParams) -> ExpressionPaginationResult:
        """
        分页查询expression列表
        
        Args:
            params: 分页查询参数
            
        Returns:
            分页查询结果
        """
        try:
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 构建WHERE条件
            where_conditions = {}
            if params.filter:
                if params.filter.situation:
                    where_conditions["situation LIKE"] = f"%{params.filter.situation}%"
                if params.filter.style:
                    where_conditions["style LIKE"] = f"%{params.filter.style}%"
                if params.filter.chat_id:
                    where_conditions["chat_id"] = params.filter.chat_id
                if params.filter.type:
                    where_conditions["type"] = params.filter.type
                if params.filter.minCount is not None:
                    where_conditions["count >="] = params.filter.minCount
                if params.filter.maxCount is not None:
                    where_conditions["count <="] = params.filter.maxCount
                if params.filter.startDate is not None:
                    where_conditions["create_date >="] = params.filter.startDate
                if params.filter.endDate is not None:
                    where_conditions["create_date <="] = params.filter.endDate
            
            # 查询数据
            result = operator.find_with_pagination(
                table_name=cls.TABLE_NAME,
                where_conditions=where_conditions,
                page=params.page,
                page_size=params.page_size,
                order_by=params.orderBy or "id",
                order_dir=params.orderDir or "ASC"
            )
            
            # 转换为Expression记录
            items = []
            for row in result.items:
                items.append(ExpressionRecord(**row))
            
            return ExpressionPaginationResult(
                items=items,
                total=result.total,
                page=result.current_page,
                size=result.page_size,
                totalPages=result.total_pages
            )
            
        except Exception as error:
            logger.error(f"查询expression列表失败: {error}")
            raise
    
    @classmethod
    async def get_expression_by_id(cls, expression_id: int) -> Optional[ExpressionRecord]:
        """
        根据ID获取单个expression
        
        Args:
            expression_id: expression ID
            
        Returns:
            expression记录，未找到时返回None
        """
        try:
            if expression_id <= 0:
                raise ValueError("expression ID必须大于0")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 查询单条记录
            result = operator.find_one(
                table_name=cls.TABLE_NAME,
                where_conditions={"id": expression_id}
            )
            
            if result:
                return ExpressionRecord(**result)
            
            return None
            
        except Exception as error:
            logger.error(f"根据ID查询expression失败: {error}")
            raise
    
    @classmethod
    async def insert_expression(cls, data: ExpressionInsertData) -> int:
        """
        插入新的expression记录
        
        Args:
            data: 插入数据
            
        Returns:
            新插入记录的ID
        """
        try:
            # 验证数据
            DatabaseValidator.validate_not_empty(data.situation, "situation")
            DatabaseValidator.validate_not_empty(data.style, "style")
            DatabaseValidator.validate_not_empty(data.chat_id, "chat_id")
            DatabaseValidator.validate_not_empty(data.type, "type")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 准备插入数据
            current_time = time.time()
            insert_data = {
                "situation": data.situation,
                "style": data.style,
                "count": data.count or 0.0,
                "last_active_time": data.last_active_time or current_time,
                "chat_id": data.chat_id,
                "type": data.type,
                "create_date": data.create_date or current_time
            }
            
            # 执行插入
            result = operator.insert(
                table_name=cls.TABLE_NAME,
                data=insert_data
            )
            
            if result.affected_rows > 0:
                logger.info(f"expression插入成功，ID: {result.last_insert_id}")
                return result.last_insert_id
            else:
                raise RuntimeError("插入expression失败")
                
        except Exception as error:
            logger.error(f"插入expression失败: {error}")
            raise
    
    @classmethod
    async def update_expression(cls, data: ExpressionUpdateData) -> bool:
        """
        更新expression记录
        
        Args:
            data: 更新数据
            
        Returns:
            是否更新成功
        """
        try:
            if data.id <= 0:
                raise ValueError("expression ID必须大于0")
            
            # 检查记录是否存在
            existing = await cls.get_expression_by_id(data.id)
            if not existing:
                raise RuntimeError(f"未找到ID为 {data.id} 的expression记录")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 准备更新数据（只包含有值的字段）
            update_data = {}
            if data.situation is not None:
                DatabaseValidator.validate_not_empty(data.situation, "situation")
                update_data["situation"] = data.situation
            if data.style is not None:
                DatabaseValidator.validate_not_empty(data.style, "style")
                update_data["style"] = data.style
            if data.count is not None:
                update_data["count"] = data.count
            if data.last_active_time is not None:
                update_data["last_active_time"] = data.last_active_time
            if data.chat_id is not None:
                DatabaseValidator.validate_not_empty(data.chat_id, "chat_id")
                update_data["chat_id"] = data.chat_id
            if data.type is not None:
                DatabaseValidator.validate_not_empty(data.type, "type")
                update_data["type"] = data.type
            if data.create_date is not None:
                update_data["create_date"] = data.create_date
                
            if not update_data:
                logger.warning("没有需要更新的数据")
                return False
                
            # 执行更新
            result = operator.update(
                table_name=cls.TABLE_NAME,
                data=update_data,
                where_conditions={"id": data.id}
            )
            
            if result.affected_rows > 0:
                logger.info(f"expression更新成功，ID: {data.id}")
                return True
            else:
                logger.warning(f"未找到要更新的expression，ID: {data.id}")
                return False
                
        except Exception as error:
            logger.error(f"更新expression失败: {error}")
            raise
    
    @classmethod
    async def delete_expression(cls, expression_id: int) -> bool:
        """
        删除expression记录
        
        Args:
            expression_id: expression ID
            
        Returns:
            是否删除成功
        """
        try:
            if expression_id <= 0:
                raise ValueError("expression ID必须大于0")
            
            # 检查记录是否存在
            existing = await cls.get_expression_by_id(expression_id)
            if not existing:
                raise RuntimeError(f"未找到ID为 {expression_id} 的expression记录")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 执行删除
            result = operator.delete(
                table_name=cls.TABLE_NAME,
                where_conditions={"id": expression_id}
            )
            
            if result.affected_rows > 0:
                logger.info(f"expression删除成功，ID: {expression_id}")
                return True
            else:
                logger.warning(f"未找到要删除的expression，ID: {expression_id}")
                return False
                
        except Exception as error:
            logger.error(f"删除expression失败: {error}")
            raise
    
    @classmethod
    async def get_expressions_by_chat_id(cls, chat_id: str, limit: int = 10) -> List[ExpressionRecord]:
        """
        根据聊天ID查询expression
        
        Args:
            chat_id: 聊天ID
            limit: 限制结果数量
            
        Returns:
            expression记录列表
        """
        try:
            if not chat_id or not chat_id.strip():
                raise ValueError("聊天ID不能为空")
            
            if limit <= 0 or limit > 100:
                raise ValueError("限制数量必须在1-100之间")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 查询数据
            results = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    where={"chat_id": chat_id.strip()},
                    order_by="last_active_time",
                    order_dir=OrderDirection.DESC,
                    limit=limit
                )
            )
            
            # 转换为Expression记录
            items = []
            for row in results:
                items.append(ExpressionRecord(**row))
            
            return items
            
        except Exception as error:
            logger.error(f"根据聊天ID查询expression失败: {error}")
            raise
    
    @classmethod
    async def get_expressions_by_type(cls, expr_type: str, limit: int = 10) -> List[ExpressionRecord]:
        """
        根据类型查询expression
        
        Args:
            expr_type: 类型
            limit: 限制结果数量
            
        Returns:
            expression记录列表
        """
        try:
            if not expr_type or not expr_type.strip():
                raise ValueError("类型不能为空")
            
            if limit <= 0 or limit > 100:
                raise ValueError("限制数量必须在1-100之间")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 查询数据
            results = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    where={"type": expr_type.strip()},
                    order_by="count",
                    order_dir=OrderDirection.DESC,
                    limit=limit
                )
            )
            
            # 转换为Expression记录
            items = []
            for row in results:
                items.append(ExpressionRecord(**row))
            
            return items
            
        except Exception as error:
            logger.error(f"根据类型查询expression失败: {error}")
            raise
    
    @classmethod
    async def search_expressions(cls, keyword: str, limit: int = 20) -> List[ExpressionRecord]:
        """
        搜索expression
        
        Args:
            keyword: 搜索关键字
            limit: 限制结果数量
            
        Returns:
            expression记录列表
        """
        try:
            if not keyword or not keyword.strip():
                raise ValueError("搜索关键字不能为空")
            
            if limit <= 0 or limit > 100:
                raise ValueError("限制数量必须在1-100之间")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 构建搜索条件
            keyword = keyword.strip()
            where_conditions = {
                "OR": [
                    {"situation LIKE": f"%{keyword}%"},
                    {"style LIKE": f"%{keyword}%"}
                ]
            }
            
            # 查询数据
            results = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    where=where_conditions,
                    order_by="count",
                    order_dir=OrderDirection.DESC,
                    limit=limit
                )
            )
            
            # 转换为Expression记录
            items = []
            for row in results:
                items.append(ExpressionRecord(**row))
            
            return items
            
        except Exception as error:
            logger.error(f"搜索expression失败: {error}")
            raise
    
    @classmethod
    async def get_expression_stats(cls) -> ExpressionStats:
        """
        获取expression统计信息
        
        Returns:
            统计信息
        """
        try:
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 获取总记录数
            total_result = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    select=["COUNT(*) as total"],
                    where={}
                )
            )
            total = total_result[0]["total"] if total_result else 0
            
            # 按类型统计
            type_result = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    select=["type", "COUNT(*) as count"],
                    where={}
                )
            )
            by_type = {row["type"]: row["count"] for row in type_result}
            
            # 按聊天ID统计（取前10个）
            chat_result = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    select=["chat_id", "COUNT(*) as count"],
                    where={},
                    limit=10,
                    order_by="count",
                    order_dir=OrderDirection.DESC
                )
            )
            by_chat_id = {row["chat_id"]: row["count"] for row in chat_result}
            
            # 统计次数相关
            count_result = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    select=["AVG(count) as avg_count", "SUM(count) as total_count"],
                    where={}
                )
            )
            avg_count = float(count_result[0]["avg_count"] or 0) if count_result else 0.0
            total_count = float(count_result[0]["total_count"] or 0) if count_result else 0.0
            
            # 最近活跃的expression数量（24小时内）
            recent_time = time.time() - 24 * 60 * 60  # 24小时前
            recent_result = operator.find_many(
                table_name=cls.TABLE_NAME,
                params=QueryParams(
                    select=["COUNT(*) as recent_count"],
                    where={"last_active_time >=": recent_time}
                )
            )
            recent_active = recent_result[0]["recent_count"] if recent_result else 0
            
            return ExpressionStats(
                total=total,
                byType=by_type,
                byChatId=by_chat_id,
                avgCount=avg_count,
                totalCount=total_count,
                recentActive=recent_active
            )
            
        except Exception as error:
            logger.error(f"获取expression统计信息失败: {error}")
            raise
    
    @classmethod
    async def increment_count(cls, expression_id: int) -> bool:
        """
        增加expression统计次数
        
        Args:
            expression_id: expression ID
            
        Returns:
            是否更新成功
        """
        try:
            if expression_id <= 0:
                raise ValueError("expression ID必须大于0")
            
            # 获取数据库连接
            db_connection = database_manager.get_connection(cls.DATABASE_NAME)
            if not db_connection:
                raise RuntimeError("数据库连接未初始化")
            
            operator = DatabaseOperator(db_connection)
            
            # 更新统计次数和最后活跃时间
            current_time = time.time()
            update_data = {
                "count": "count + 1",  # 使用SQL表达式
                "last_active_time": current_time
            }
            
            result = operator.update(
                table_name=cls.TABLE_NAME,
                data=update_data,
                where_conditions={"id": expression_id}
            )
            
            if result.affected_rows > 0:
                logger.info(f"expression统计次数更新成功，ID: {expression_id}")
                return True
            else:
                logger.warning(f"未找到要更新的expression，ID: {expression_id}")
                return False
                
        except Exception as error:
            logger.error(f"更新expression统计次数失败: {error}")
            raise
