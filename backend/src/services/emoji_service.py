"""
Emoji表专用操作服务
提供对emoji表的高级操作功能
"""

import os
import hashlib
import base64
from typing import Optional, Dict, Any
from models.emoji import (
    EmojiRecord, EmojiInsertData, EmojiUpdateData, 
    EmojiQueryResponse, EmojiPaginationParams
)
from core.database_manager import database_manager
from core.path_cache_manager import path_cache_manager
from models.database import OrderDirection
import logging

logger = logging.getLogger("HMML")


class EmojiService:
    """Emoji表操作服务"""
    
    TABLE_NAME = "emoji"
    CONNECTION_NAME = "maibot"
    
    @classmethod
    async def _get_operator(cls):
        """获取数据库操作器"""
        operator = database_manager.get_operator(cls.CONNECTION_NAME)
        if not operator:
            # 尝试重新初始化麦麦数据库连接
            await database_manager._initialize_maimai_database()
            operator = database_manager.get_operator(cls.CONNECTION_NAME)
            
        if not operator:
            raise RuntimeError("麦麦数据库连接不可用，请检查数据库配置和路径缓存设置")
        return operator
        
    @classmethod
    async def get_emojis(cls, params: EmojiPaginationParams) -> EmojiQueryResponse:
        """
        分页查询emoji列表
        
        Args:
            params: 分页查询参数
            
        Returns:
            查询响应
        """
        try:
            operator = await cls._get_operator()
            
            # 构建WHERE条件
            where_conditions = {}
            if params.format:
                where_conditions["format"] = params.format
            if params.emotion:
                where_conditions["emotion"] = f"%{params.emotion}%"
            if params.description:
                where_conditions["description"] = f"%{params.description}%"
            if params.emoji_hash:
                where_conditions["emoji_hash"] = params.emoji_hash
            if params.is_registered is not None:
                where_conditions["is_registered"] = params.is_registered
            if params.is_banned is not None:
                where_conditions["is_banned"] = params.is_banned
                
            # 验证排序字段
            valid_order_fields = ['id', 'query_count', 'usage_count', 'last_used_time', 'record_time']
            order_by = None
            order_dir = OrderDirection.ASC
            
            if params.order_by and params.order_by in valid_order_fields:
                order_by = params.order_by
                if params.order_dir and params.order_dir.upper() == "DESC":
                    order_dir = OrderDirection.DESC
                    
            # 执行分页查询
            result = operator.find_with_pagination(
                table_name=cls.TABLE_NAME,
                page=params.page,
                page_size=params.page_size,
                where_conditions=where_conditions if where_conditions else None,
                order_by=order_by,
                order_dir=order_dir
            )
            
            # 转换为emoji记录
            emoji_items = []
            for item in result.items:
                emoji_items.append(EmojiRecord(**item))
                
            return EmojiQueryResponse(
                items=emoji_items,
                total_pages=result.total_pages,
                current_page=result.current_page,
                page_size=result.page_size,
                total=result.total,
                has_next=result.has_next,
                has_prev=result.has_prev
            )
            
        except Exception as error:
            logger.error(f"查询emoji列表失败: {error}")
            raise
            
    @classmethod
    async def get_emoji_by_id(cls, emoji_id: int) -> Optional[EmojiRecord]:
        """
        根据ID查询单个emoji
        
        Args:
            emoji_id: emoji ID
            
        Returns:
            emoji记录或None
        """
        try:
            if emoji_id <= 0:
                raise ValueError("emoji ID必须大于0")
                
            operator = await cls._get_operator()
            
            result = operator.find_one(
                table_name=cls.TABLE_NAME,
                where_conditions={"id": emoji_id}
            )
            
            if result:
                return EmojiRecord(**result)
            return None
            
        except Exception as error:
            logger.error(f"根据ID查询emoji失败: {error}")
            raise
            
    @classmethod
    async def insert_emoji(cls, data: EmojiInsertData) -> int:
        """
        插入emoji记录
        
        Args:
            data: 插入数据
            
        Returns:
            插入的记录ID
        """
        try:
            operator = await cls._get_operator()
            
            # 转换为字典格式
            insert_data = data.model_dump()
            
            # 执行插入
            result = operator.insert(cls.TABLE_NAME, insert_data)
            
            if not result.success or result.last_insert_id is None:
                raise RuntimeError("插入emoji失败")
                
            logger.info(f"emoji插入成功，ID: {result.last_insert_id}")
            return result.last_insert_id
            
        except Exception as error:
            logger.error(f"插入emoji失败: {error}")
            raise
            
    @classmethod
    async def update_emoji(cls, data: EmojiUpdateData) -> bool:
        """
        更新emoji记录
        
        Args:
            data: 更新数据
            
        Returns:
            是否更新成功
        """
        try:
            if data.id <= 0:
                raise ValueError("emoji ID必须大于0")
                
            operator = await cls._get_operator()
            
            # 构建更新数据（排除None值）
            update_data = {}
            for field, value in data.model_dump(exclude={'id'}).items():
                if value is not None:
                    update_data[field] = value
                    
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
                logger.info(f"emoji更新成功，ID: {data.id}")
                return True
            else:
                logger.warning(f"未找到要更新的emoji，ID: {data.id}")
                return False
                
        except Exception as error:
            logger.error(f"更新emoji失败: {error}")
            raise
            
    @classmethod
    async def delete_emoji(cls, emoji_id: int) -> bool:
        """
        删除emoji记录
        
        Args:
            emoji_id: emoji ID
            
        Returns:
            是否删除成功
        """
        try:
            if emoji_id <= 0:
                raise ValueError("emoji ID必须大于0")
                
            operator = await cls._get_operator()
            
            # 执行删除
            result = operator.delete(
                table_name=cls.TABLE_NAME,
                where_conditions={"id": emoji_id}
            )
            
            if result.affected_rows > 0:
                logger.info(f"emoji删除成功，ID: {emoji_id}")
                return True
            else:
                logger.warning(f"未找到要删除的emoji，ID: {emoji_id}")
                return False
                
        except Exception as error:
            logger.error(f"删除emoji失败: {error}")
            raise
            
    @classmethod
    async def get_emoji_by_hash(cls, emoji_hash: str) -> Optional[EmojiRecord]:
        """
        根据哈希值查询emoji
        
        Args:
            emoji_hash: emoji哈希值
            
        Returns:
            emoji记录或None
        """
        try:
            if not emoji_hash:
                raise ValueError("emoji哈希值不能为空")
                
            operator = await cls._get_operator()
            
            result = operator.find_one(
                table_name=cls.TABLE_NAME,
                where_conditions={"emoji_hash": emoji_hash}
            )
            
            if result:
                return EmojiRecord(**result)
            return None
            
        except Exception as error:
            logger.error(f"根据哈希值查询emoji失败: {error}")
            raise
            
    @classmethod
    async def increment_query_count(cls, emoji_id: int) -> bool:
        """
        增加emoji查询次数
        
        Args:
            emoji_id: emoji ID
            
        Returns:
            是否更新成功
        """
        try:
            operator = await cls._get_operator()
            
            # 使用原始SQL更新查询次数
            sql = f"UPDATE {cls.TABLE_NAME} SET query_count = query_count + 1 WHERE id = ?"
            cursor = operator.execute_raw_sql(sql, (emoji_id,))
            
            # 提交事务
            operator.connection.get_connection().commit()
            
            return cursor.rowcount > 0
            
        except Exception as error:
            logger.error(f"增加emoji查询次数失败: {error}")
            raise
            
    @classmethod
    async def get_emoji_stats(cls) -> Dict[str, Any]:
        """
        获取emoji统计信息
        
        Returns:
            统计信息字典
        """
        try:
            operator = await cls._get_operator()
            
            # 总数统计
            total_count = operator.count(cls.TABLE_NAME)
            
            # 按格式统计
            cursor = operator.execute_raw_sql(
                f"SELECT format, COUNT(*) as count FROM {cls.TABLE_NAME} GROUP BY format"
            )
            format_stats = {row['format']: row['count'] for row in cursor.fetchall()}
            
            # 按注册状态统计
            registered_count = operator.count(cls.TABLE_NAME, {"is_registered": 1})
            unregistered_count = total_count - registered_count
            
            # 按禁用状态统计
            banned_count = operator.count(cls.TABLE_NAME, {"is_banned": 1})
            active_count = total_count - banned_count
            
            return {
                "total_count": total_count,
                "format_stats": format_stats,
                "registered_count": registered_count,
                "unregistered_count": unregistered_count,
                "banned_count": banned_count,
                "active_count": active_count
            }
            
        except Exception as error:
            logger.error(f"获取emoji统计信息失败: {error}")
            raise
            
    @classmethod
    async def get_emoji_image(cls, emoji_id: int) -> str:
        """
        获取emoji图片的Base64编码
        
        Args:
            emoji_id: emoji ID
            
        Returns:
            Base64编码的图片数据
        """
        try:
            if emoji_id <= 0:
                raise ValueError("emoji ID必须大于0")
                
            # 获取emoji记录
            emoji = await cls.get_emoji_by_id(emoji_id)
            if not emoji:
                raise RuntimeError(f"未找到ID为 {emoji_id} 的emoji记录")
                
            # 获取麦麦根目录
            main_root = path_cache_manager.get_main_root()
            if not main_root:
                raise RuntimeError("麦麦主程序根目录未设置")
                
            # 构建完整文件路径
            full_path = os.path.join(main_root, emoji.full_path.lstrip('/\\'))
            
            # 检查文件是否存在
            if not os.path.exists(full_path):
                raise RuntimeError(f"emoji图片文件不存在: {full_path}")
                
            # 读取文件并转换为Base64
            with open(full_path, 'rb') as f:
                file_data = f.read()
                base64_data = base64.b64encode(file_data).decode('utf-8')
                
            return base64_data
            
        except Exception as error:
            logger.error(f"获取emoji图片失败: {error}")
            raise
            
    @classmethod
    async def calculate_image_hash(cls, image_path: str) -> str:
        """
        计算图片文件的哈希值
        
        Args:
            image_path: 图片相对路径
            
        Returns:
            图片哈希值
        """
        try:
            if not image_path:
                raise ValueError("图片路径不能为空")
                
            # 获取麦麦根目录
            main_root = path_cache_manager.get_main_root()
            if not main_root:
                raise RuntimeError("麦麦主程序根目录未设置")
                
            # 构建完整文件路径
            full_path = os.path.join(main_root, image_path.lstrip('/\\'))
            
            # 检查文件是否存在
            if not os.path.exists(full_path):
                raise RuntimeError(f"图片文件不存在: {full_path}")
                
            # 计算文件MD5哈希值
            with open(full_path, 'rb') as f:
                file_data = f.read()
                hash_md5 = hashlib.md5(file_data)
                return hash_md5.hexdigest()
                
        except Exception as error:
            logger.error(f"计算图片哈希值失败: {error}")
            raise
