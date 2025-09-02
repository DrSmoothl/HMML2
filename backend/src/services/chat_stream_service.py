"""
Chat Stream 服务层
聊天流相关业务逻辑处理
"""

from typing import Optional
from models.chat_stream import (
    ChatStream, ChatStreamCreate, ChatStreamUpdate, 
    ChatStreamQuery, ChatStreamListData
)
from models.database import OrderDirection
from core.database_manager import database_manager
import logging

logger = logging.getLogger("HMML")


class ChatStreamService:
    """Chat Stream 服务类"""
    
    def __init__(self):
        self.table_name = "chat_streams"
    
    async def get_chat_stream_list(self, query: ChatStreamQuery) -> ChatStreamListData:
        """
        获取聊天流列表（分页）
        
        Args:
            query: 查询参数
            
        Returns:
            聊天流列表数据
        """
        try:
            logger.debug(f"查询聊天流列表，参数: {query}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # 构建WHERE条件
            where_conditions = {}
            
            if query.stream_id:
                where_conditions["stream_id"] = f"%{query.stream_id}%"
            
            if query.group_platform:
                where_conditions["group_platform"] = query.group_platform
            
            if query.group_id:
                where_conditions["group_id"] = f"%{query.group_id}%"
            
            if query.group_name:
                where_conditions["group_name"] = f"%{query.group_name}%"
            
            if query.platform:
                where_conditions["platform"] = query.platform
            
            if query.user_platform:
                where_conditions["user_platform"] = query.user_platform
            
            if query.user_id:
                where_conditions["user_id"] = f"%{query.user_id}%"
            
            if query.user_nickname:
                where_conditions["user_nickname"] = f"%{query.user_nickname}%"
            
            if query.user_cardname:
                where_conditions["user_cardname"] = f"%{query.user_cardname}%"
            
            # 使用分页查询
            result = operator.find_with_pagination(
                table_name=self.table_name,
                page=query.page,
                page_size=query.pageSize,
                where_conditions=where_conditions,
                order_by="id",
                order_dir=OrderDirection.DESC
            )
            
            # 转换为模型对象
            items = []
            for row in result.items:
                # 处理可能为 None 的字段
                for field in ['group_platform', 'group_id', 'group_name', 'user_platform', 
                             'user_nickname', 'user_cardname']:
                    if row.get(field) is None:
                        row[field] = ""
                
                items.append(ChatStream(**row))
            
            logger.info(f"查询聊天流列表成功，共 {len(items)} 条记录")
            
            return ChatStreamListData(
                items=items,
                totalPages=result.total_pages,
                currentPage=result.current_page,
                pageSize=result.page_size
            )
            
        except Exception as error:
            logger.error(f"查询聊天流列表失败: {error}")
            raise
    
    async def create_chat_stream(self, chat_stream: ChatStreamCreate) -> int:
        """
        创建聊天流
        
        Args:
            chat_stream: 聊天流数据
            
        Returns:
            新创建记录的ID
        """
        try:
            logger.debug(f"创建聊天流: {chat_stream.stream_id}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # 准备插入数据
            insert_data = {
                'stream_id': chat_stream.stream_id,
                'create_time': chat_stream.create_time,
                'group_platform': chat_stream.group_platform,
                'group_id': chat_stream.group_id,
                'group_name': chat_stream.group_name,
                'last_active_time': chat_stream.last_active_time,
                'platform': chat_stream.platform,
                'user_platform': chat_stream.user_platform,
                'user_id': chat_stream.user_id,
                'user_nickname': chat_stream.user_nickname,
                'user_cardname': chat_stream.user_cardname
            }
            
            # 执行插入
            result = operator.insert(self.table_name, insert_data)
            
            if result.success and result.last_insert_id:
                logger.info(f"创建聊天流成功，ID: {result.last_insert_id}")
                return result.last_insert_id
            else:
                raise RuntimeError("插入操作失败")
            
        except Exception as error:
            logger.error(f"创建聊天流失败: {error}")
            raise
    
    async def update_chat_stream(self, chat_stream: ChatStreamUpdate) -> bool:
        """
        更新聊天流
        
        Args:
            chat_stream: 聊天流数据
            
        Returns:
            是否更新成功
        """
        try:
            logger.debug(f"更新聊天流，ID: {chat_stream.id}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # 准备更新数据
            update_data = {
                'stream_id': chat_stream.stream_id,
                'create_time': chat_stream.create_time,
                'group_platform': chat_stream.group_platform,
                'group_id': chat_stream.group_id,
                'group_name': chat_stream.group_name,
                'last_active_time': chat_stream.last_active_time,
                'platform': chat_stream.platform,
                'user_platform': chat_stream.user_platform,
                'user_id': chat_stream.user_id,
                'user_nickname': chat_stream.user_nickname,
                'user_cardname': chat_stream.user_cardname
            }
            
            # WHERE条件
            where_conditions = {'id': chat_stream.id}
            
            # 执行更新
            result = operator.update(self.table_name, update_data, where_conditions)
            
            if result.success:
                logger.info(f"更新聊天流成功，ID: {chat_stream.id}")
                return True
            else:
                return False
            
        except Exception as error:
            logger.error(f"更新聊天流失败: {error}")
            raise
    
    async def delete_chat_stream(self, chat_stream_id: int) -> bool:
        """
        删除聊天流
        
        Args:
            chat_stream_id: 聊天流ID
            
        Returns:
            是否删除成功
        """
        try:
            logger.debug(f"删除聊天流，ID: {chat_stream_id}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # WHERE条件
            where_conditions = {'id': chat_stream_id}
            
            # 执行删除
            result = operator.delete(self.table_name, where_conditions)
            
            if result.success and result.affected_rows > 0:
                logger.info(f"删除聊天流成功，ID: {chat_stream_id}")
                return True
            else:
                return False
            
        except Exception as error:
            logger.error(f"删除聊天流失败: {error}")
            raise
    
    async def get_chat_stream_by_id(self, chat_stream_id: int) -> Optional[ChatStream]:
        """
        根据ID获取聊天流
        
        Args:
            chat_stream_id: 聊天流ID
            
        Returns:
            聊天流对象或None
        """
        try:
            logger.debug(f"根据ID查询聊天流: {chat_stream_id}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # WHERE条件
            where_conditions = {'id': chat_stream_id}
            
            # 执行查询
            result = operator.find_one(self.table_name, where_conditions)
            
            if result:
                # 处理可能为 None 的字段
                for field in ['group_platform', 'group_id', 'group_name', 'user_platform', 
                             'user_nickname', 'user_cardname']:
                    if result.get(field) is None:
                        result[field] = ""
                
                logger.info(f"查询聊天流成功，ID: {chat_stream_id}")
                return ChatStream(**result)
            else:
                logger.info(f"未找到聊天流，ID: {chat_stream_id}")
                return None
            
        except Exception as error:
            logger.error(f"查询聊天流失败: {error}")
            raise


# 全局服务实例
chat_stream_service = ChatStreamService()
