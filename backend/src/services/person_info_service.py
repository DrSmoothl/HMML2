"""
Person Info 服务层
人物信息相关业务逻辑处理
"""

import math
from typing import Optional
from models.person_info import (
    PersonInfo, PersonInfoCreate, PersonInfoUpdate, 
    PersonInfoQuery, PersonInfoListData
)
from models.database import OrderDirection
from core.database_manager import database_manager
import logging

logger = logging.getLogger("HMML")


class PersonInfoService:
    """Person Info 服务类"""
    
    def __init__(self):
        self.table_name = "person_info"
    
    async def get_person_info_list(self, query: PersonInfoQuery) -> PersonInfoListData:
        """
        获取人物信息列表（分页）
        
        Args:
            query: 查询参数
            
        Returns:
            人物信息列表数据
        """
        try:
            logger.debug(f"查询人物信息列表，参数: {query}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # 构建WHERE条件
            where_conditions = {}
            
            if query.person_id:
                where_conditions["person_id"] = f"%{query.person_id}%"
            
            if query.platform:
                where_conditions["platform"] = query.platform
            
            if query.user_id:
                where_conditions["user_id"] = f"%{query.user_id}%"
            
            if query.person_name:
                where_conditions["person_name"] = f"%{query.person_name}%"
            
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
                for field in ['impression', 'short_impression', 'points', 'forgotten_points', 
                             'info_list', 'name_reason']:
                    if row.get(field) is None:
                        row[field] = "" if field not in ['forgotten_points', 'info_list'] else "[]"
                
                items.append(PersonInfo(**row))
            
            logger.info(f"查询人物信息列表成功，共 {len(items)} 条记录")
            
            return PersonInfoListData(
                items=items,
                totalPages=result.total_pages,
                currentPage=result.current_page,
                pageSize=result.page_size
            )
            
        except Exception as error:
            logger.error(f"查询人物信息列表失败: {error}")
            raise
    
    async def create_person_info(self, person_info: PersonInfoCreate) -> int:
        """
        创建人物信息
        
        Args:
            person_info: 人物信息数据
            
        Returns:
            新创建记录的ID
        """
        try:
            logger.debug(f"创建人物信息: {person_info.person_name}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # 准备插入数据
            insert_data = {
                'person_id': person_info.person_id,
                'person_name': person_info.person_name,
                'name_reason': person_info.name_reason,
                'platform': person_info.platform,
                'user_id': person_info.user_id,
                'nickname': person_info.nickname,
                'impression': person_info.impression,
                'short_impression': person_info.short_impression,
                'points': person_info.points,
                'forgotten_points': person_info.forgotten_points or "[]",
                'info_list': person_info.info_list or "[]",
                'know_times': person_info.know_times,
                'know_since': person_info.know_since,
                'last_know': person_info.last_know,
                'attitude_to_me': person_info.attitude_to_me,
                'attitude_to_me_confidence': person_info.attitude_to_me_confidence,
                'friendly_value': person_info.friendly_value,
                'friendly_value_confidence': person_info.friendly_value_confidence,
                'rudeness': person_info.rudeness,
                'rudeness_confidence': person_info.rudeness_confidence,
                'neuroticism': person_info.neuroticism,
                'neuroticism_confidence': person_info.neuroticism_confidence,
                'conscientiousness': person_info.conscientiousness,
                'conscientiousness_confidence': person_info.conscientiousness_confidence,
                'likeness': person_info.likeness,
                'likeness_confidence': person_info.likeness_confidence
            }
            
            # 执行插入
            result = operator.insert(self.table_name, insert_data)
            
            if result.success and result.last_insert_id:
                logger.info(f"创建人物信息成功，ID: {result.last_insert_id}")
                return result.last_insert_id
            else:
                raise RuntimeError("插入操作失败")
            
        except Exception as error:
            logger.error(f"创建人物信息失败: {error}")
            raise
    
    async def update_person_info(self, person_info: PersonInfoUpdate) -> bool:
        """
        更新人物信息
        
        Args:
            person_info: 人物信息数据
            
        Returns:
            是否更新成功
        """
        try:
            logger.debug(f"更新人物信息，ID: {person_info.id}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # 准备更新数据
            update_data = {
                'person_id': person_info.person_id,
                'person_name': person_info.person_name,
                'name_reason': person_info.name_reason,
                'platform': person_info.platform,
                'user_id': person_info.user_id,
                'nickname': person_info.nickname,
                'impression': person_info.impression,
                'short_impression': person_info.short_impression,
                'points': person_info.points,
                'forgotten_points': person_info.forgotten_points or "[]",
                'info_list': person_info.info_list or "[]",
                'know_times': person_info.know_times,
                'know_since': person_info.know_since,
                'last_know': person_info.last_know,
                'attitude_to_me': person_info.attitude_to_me,
                'attitude_to_me_confidence': person_info.attitude_to_me_confidence,
                'friendly_value': person_info.friendly_value,
                'friendly_value_confidence': person_info.friendly_value_confidence,
                'rudeness': person_info.rudeness,
                'rudeness_confidence': person_info.rudeness_confidence,
                'neuroticism': person_info.neuroticism,
                'neuroticism_confidence': person_info.neuroticism_confidence,
                'conscientiousness': person_info.conscientiousness,
                'conscientiousness_confidence': person_info.conscientiousness_confidence,
                'likeness': person_info.likeness,
                'likeness_confidence': person_info.likeness_confidence
            }
            
            # WHERE条件
            where_conditions = {'id': person_info.id}
            
            # 执行更新
            result = operator.update(self.table_name, update_data, where_conditions)
            
            if result.success:
                logger.info(f"更新人物信息成功，ID: {person_info.id}")
                return True
            else:
                return False
            
        except Exception as error:
            logger.error(f"更新人物信息失败: {error}")
            raise
    
    async def delete_person_info(self, person_info_id: int) -> bool:
        """
        删除人物信息
        
        Args:
            person_info_id: 人物信息ID
            
        Returns:
            是否删除成功
        """
        try:
            logger.debug(f"删除人物信息，ID: {person_info_id}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # WHERE条件
            where_conditions = {'id': person_info_id}
            
            # 执行删除
            result = operator.delete(self.table_name, where_conditions)
            
            if result.success and result.affected_rows > 0:
                logger.info(f"删除人物信息成功，ID: {person_info_id}")
                return True
            else:
                return False
            
        except Exception as error:
            logger.error(f"删除人物信息失败: {error}")
            raise
    
    async def get_person_info_by_id(self, person_info_id: int) -> Optional[PersonInfo]:
        """
        根据ID获取人物信息
        
        Args:
            person_info_id: 人物信息ID
            
        Returns:
            人物信息对象或None
        """
        try:
            logger.debug(f"根据ID查询人物信息: {person_info_id}")
            
            # 获取数据库操作器
            operator = database_manager.get_maibot_operator()
            if not operator:
                raise RuntimeError("数据库连接不可用")
            
            # WHERE条件
            where_conditions = {'id': person_info_id}
            
            # 执行查询
            result = operator.find_one(self.table_name, where_conditions)
            
            if result:
                # 处理可能为 None 的字段
                for field in ['impression', 'short_impression', 'points', 'forgotten_points', 
                             'info_list', 'name_reason']:
                    if result.get(field) is None:
                        result[field] = "" if field not in ['forgotten_points', 'info_list'] else "[]"
                
                logger.info(f"查询人物信息成功，ID: {person_info_id}")
                return PersonInfo(**result)
            else:
                logger.info(f"未找到人物信息，ID: {person_info_id}")
                return None
            
        except Exception as error:
            logger.error(f"查询人物信息失败: {error}")
            raise


# 全局服务实例
person_info_service = PersonInfoService()
