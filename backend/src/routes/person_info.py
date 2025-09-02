"""
Person Info API 路由
人物信息相关的API端点
"""

import time
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models.person_info import (
    PersonInfoCreate, PersonInfoUpdate, PersonInfoDelete,
    PersonInfoQuery, PersonInfoListResponse, PersonInfoCreateResponse,
    PersonInfoUpdateResponse, PersonInfoDeleteResponse
)
from services.person_info_service import person_info_service
from core.database_manager import database_manager
import logging

logger = logging.getLogger("HMML")

# 创建路由器
router = APIRouter(prefix="/database/person-info", tags=["人物信息"])


def create_success_response(data: Optional[dict] = None, message: str = "操作成功") -> dict:
    """创建成功响应"""
    return {
        "status": 200,
        "message": message,
        "data": data,
        "time": int(time.time() * 1000)
    }


def create_error_response(status: int, message: str) -> dict:
    """创建错误响应"""
    return {
        "status": status,
        "message": message,
        "time": int(time.time() * 1000)
    }


@router.get("/get", response_model=PersonInfoListResponse, summary="查询人物信息列表")
async def get_person_info_list(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
    person_id: Optional[str] = Query(None, description="人物ID过滤"),
    platform: Optional[str] = Query(None, description="平台过滤"),
    user_id: Optional[str] = Query(None, description="用户ID过滤"),
    person_name: Optional[str] = Query(None, description="人物名称过滤")
):
    """
    查询人物信息列表
    
    Args:
        page: 页码，从1开始
        pageSize: 每页数量
        person_id: 人物ID过滤（可选）
        platform: 平台过滤（可选）
        user_id: 用户ID过滤（可选）
        person_name: 人物名称过滤（可选）
        
    Returns:
        人物信息列表响应
    """
    try:
        logger.debug(f"处理查询人物信息列表请求，页码: {page}, 每页: {pageSize}")
        
        # 构建查询参数
        query = PersonInfoQuery(
            page=page,
            pageSize=pageSize,
            person_id=person_id,
            platform=platform,
            user_id=user_id,
            person_name=person_name
        )
        
        # 调用服务层
        result = await person_info_service.get_person_info_list(query)
        
        # 转换为API响应格式
        response_data = {
            "items": [item.model_dump() for item in result.items],
            "totalPages": result.totalPages,
            "currentPage": result.currentPage,
            "pageSize": result.pageSize
        }
        
        logger.info(f"查询人物信息列表成功，共 {len(result.items)} 条记录")
        return create_success_response(response_data, "查询成功")
        
    except Exception as error:
        logger.error(f"查询人物信息列表失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "查询失败")
        )


@router.post("/insert", response_model=PersonInfoCreateResponse, summary="插入人物信息")
async def insert_person_info(request: PersonInfoCreate):
    """
    插入人物信息
    
    Args:
        request: 人物信息数据
        
    Returns:
        插入结果响应
    """
    try:
        logger.debug(f"处理插入人物信息请求: {request.person_name}")
        
        # 调用服务层
        new_id = await person_info_service.create_person_info(request)
        
        response_data = {"id": new_id}
        
        logger.info(f"插入人物信息成功，ID: {new_id}")
        return create_success_response(response_data, "插入成功")
        
    except Exception as error:
        logger.error(f"插入人物信息失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "插入失败")
        )


@router.post("/update", response_model=PersonInfoUpdateResponse, summary="更新人物信息")
async def update_person_info(request: PersonInfoUpdate):
    """
    更新人物信息
    
    Args:
        request: 人物信息数据（包含ID）
        
    Returns:
        更新结果响应
    """
    try:
        logger.debug(f"处理更新人物信息请求，ID: {request.id}")
        
        # 检查记录是否存在
        existing = await person_info_service.get_person_info_by_id(request.id)
        if not existing:
            logger.warning(f"更新失败，记录不存在，ID: {request.id}")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "记录不存在")
            )
        
        # 调用服务层
        success = await person_info_service.update_person_info(request)
        
        if success:
            logger.info(f"更新人物信息成功，ID: {request.id}")
            return create_success_response(message="更新成功")
        else:
            raise HTTPException(
                status_code=500,
                detail=create_error_response(500, "更新失败")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"更新人物信息失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "更新失败")
        )


@router.delete("/delete", response_model=PersonInfoDeleteResponse, summary="删除人物信息")
async def delete_person_info(request: PersonInfoDelete):
    """
    删除人物信息
    
    Args:
        request: 删除请求（包含ID）
        
    Returns:
        删除结果响应
    """
    try:
        logger.debug(f"处理删除人物信息请求，ID: {request.id}")
        
        # 检查记录是否存在
        existing = await person_info_service.get_person_info_by_id(request.id)
        if not existing:
            logger.warning(f"删除失败，记录不存在，ID: {request.id}")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "记录不存在")
            )
        
        # 调用服务层
        success = await person_info_service.delete_person_info(request.id)
        
        if success:
            logger.info(f"删除人物信息成功，ID: {request.id}")
            return create_success_response(message="删除成功")
        else:
            raise HTTPException(
                status_code=500,
                detail=create_error_response(500, "删除失败")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"删除人物信息失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "删除失败")
        )


@router.get("/get/{person_id}", summary="根据ID获取单个人物信息")
async def get_person_info_by_id(person_id: int):
    """
    根据ID获取单个人物信息
    
    Args:
        person_id: 人物信息ID
        
    Returns:
        单个人物信息响应
    """
    try:
        logger.debug(f"处理根据ID查询人物信息请求，ID: {person_id}")
        
        # 调用服务层
        person_info = await person_info_service.get_person_info_by_id(person_id)
        
        if not person_info:
            logger.warning(f"未找到人物信息，ID: {person_id}")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "记录不存在")
            )
        
        logger.info(f"查询人物信息成功，ID: {person_id}")
        return create_success_response(person_info.model_dump(), "查询成功")
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"查询人物信息失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "查询失败")
        )


@router.put("/update/{person_id}", summary="更新人物信息（RESTful风格）")
async def update_person_info_restful(person_id: int, request: PersonInfoCreate):
    """
    更新人物信息（RESTful风格）
    
    Args:
        person_id: 人物信息ID
        request: 人物信息数据
        
    Returns:
        更新结果响应
    """
    try:
        logger.debug(f"处理RESTful更新人物信息请求，ID: {person_id}")
        
        # 检查记录是否存在
        existing = await person_info_service.get_person_info_by_id(person_id)
        if not existing:
            logger.warning(f"更新失败，记录不存在，ID: {person_id}")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "记录不存在")
            )
        
        # 构建更新对象
        update_request = PersonInfoUpdate(id=person_id, **request.model_dump())
        
        # 调用服务层
        success = await person_info_service.update_person_info(update_request)
        
        if success:
            logger.info(f"更新人物信息成功，ID: {person_id}")
            return create_success_response(message="更新成功")
        else:
            raise HTTPException(
                status_code=500,
                detail=create_error_response(500, "更新失败")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"更新人物信息失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "更新失败")
        )


@router.delete("/delete/{person_id}", summary="删除人物信息（RESTful风格）")
async def delete_person_info_restful(person_id: int):
    """
    删除人物信息（RESTful风格）
    
    Args:
        person_id: 人物信息ID
        
    Returns:
        删除结果响应
    """
    try:
        logger.debug(f"处理RESTful删除人物信息请求，ID: {person_id}")
        
        # 检查记录是否存在
        existing = await person_info_service.get_person_info_by_id(person_id)
        if not existing:
            logger.warning(f"删除失败，记录不存在，ID: {person_id}")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "记录不存在")
            )
        
        # 调用服务层
        success = await person_info_service.delete_person_info(person_id)
        
        if success:
            logger.info(f"删除人物信息成功，ID: {person_id}")
            return create_success_response(message="删除成功")
        else:
            raise HTTPException(
                status_code=500,
                detail=create_error_response(500, "删除失败")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"删除人物信息失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "删除失败")
        )


@router.get("/stats", summary="获取人物信息统计")
async def get_person_info_stats():
    """
    获取人物信息统计信息
    
    Returns:
        统计信息响应
    """
    try:
        logger.debug("处理获取人物信息统计请求")
        
        # 获取数据库操作器
        operator = database_manager.get_maibot_operator()
        if not operator:
            raise RuntimeError("数据库连接不可用")
        
        # 基础统计
        total_result = operator.execute_raw_sql("SELECT COUNT(*) as total FROM person_info")
        total = total_result.fetchone()['total'] if total_result else 0
        
        # 按平台统计
        platform_result = operator.execute_raw_sql("SELECT platform, COUNT(*) as count FROM person_info GROUP BY platform")
        by_platform = {row['platform']: row['count'] for row in platform_result.fetchall()}
        
        # 计算平均认知次数
        avg_know_times_result = operator.execute_raw_sql("SELECT AVG(CAST(know_times AS FLOAT)) as avg_know_times FROM person_info WHERE know_times IS NOT NULL")
        avg_know_times = float(avg_know_times_result.fetchone()['avg_know_times'] or 0)
        
        # 计算平均友好度
        avg_friendly_result = operator.execute_raw_sql("SELECT AVG(CAST(friendly_value AS FLOAT)) as avg_friendly FROM person_info WHERE friendly_value IS NOT NULL")
        avg_friendly_value = float(avg_friendly_result.fetchone()['avg_friendly'] or 0)
        
        # 总认知次数
        total_know_times_result = operator.execute_raw_sql("SELECT SUM(CAST(know_times AS FLOAT)) as total_know_times FROM person_info WHERE know_times IS NOT NULL")
        total_know_times = float(total_know_times_result.fetchone()['total_know_times'] or 0)
        
        # 按友好度分组统计
        friendly_stats_result = operator.execute_raw_sql("""
            SELECT 
                CASE 
                    WHEN friendly_value IS NULL THEN 'unknown'
                    WHEN CAST(friendly_value AS INTEGER) <= 2 THEN 'low'
                    WHEN CAST(friendly_value AS INTEGER) <= 5 THEN 'medium'
                    WHEN CAST(friendly_value AS INTEGER) <= 8 THEN 'high'
                    ELSE 'very_high'
                END as level,
                COUNT(*) as count
            FROM person_info 
            GROUP BY level
        """)
        by_friendly_value = {row['level']: row['count'] for row in friendly_stats_result.fetchall()}
        
        # 按态度分组统计  
        attitude_stats_result = operator.execute_raw_sql("""
            SELECT 
                CASE 
                    WHEN attitude_to_me IS NULL THEN 'unknown'
                    WHEN CAST(attitude_to_me AS INTEGER) <= 2 THEN 'negative'
                    WHEN CAST(attitude_to_me AS INTEGER) <= 5 THEN 'neutral'
                    WHEN CAST(attitude_to_me AS INTEGER) <= 8 THEN 'positive'
                    ELSE 'very_positive'
                END as level,
                COUNT(*) as count
            FROM person_info 
            GROUP BY level
        """)
        by_attitude_to_me = {row['level']: row['count'] for row in attitude_stats_result.fetchall()}
        
        # 按粗鲁度分组统计
        rudeness_stats_result = operator.execute_raw_sql("""
            SELECT 
                CASE 
                    WHEN rudeness IS NULL THEN 'unknown'
                    WHEN CAST(rudeness AS INTEGER) <= 2 THEN 'low'
                    WHEN CAST(rudeness AS INTEGER) <= 5 THEN 'medium'
                    WHEN CAST(rudeness AS INTEGER) <= 8 THEN 'high'
                    ELSE 'very_high'
                END as level,
                COUNT(*) as count
            FROM person_info 
            GROUP BY level
        """)
        by_rudeness = {row['level']: row['count'] for row in rudeness_stats_result.fetchall()}
        
        # 按神经质程度分组统计
        neuroticism_stats_result = operator.execute_raw_sql("""
            SELECT 
                CASE 
                    WHEN neuroticism IS NULL THEN 'unknown'
                    WHEN CAST(neuroticism AS INTEGER) <= 2 THEN 'low'
                    WHEN CAST(neuroticism AS INTEGER) <= 5 THEN 'medium'
                    WHEN CAST(neuroticism AS INTEGER) <= 8 THEN 'high'
                    ELSE 'very_high'
                END as level,
                COUNT(*) as count
            FROM person_info 
            GROUP BY level
        """)
        by_neuroticism = {row['level']: row['count'] for row in neuroticism_stats_result.fetchall()}
        
        # 按尽责程度分组统计
        conscientiousness_stats_result = operator.execute_raw_sql("""
            SELECT 
                CASE 
                    WHEN conscientiousness IS NULL THEN 'unknown'
                    WHEN CAST(conscientiousness AS INTEGER) <= 2 THEN 'low'
                    WHEN CAST(conscientiousness AS INTEGER) <= 5 THEN 'medium'
                    WHEN CAST(conscientiousness AS INTEGER) <= 8 THEN 'high'
                    ELSE 'very_high'
                END as level,
                COUNT(*) as count
            FROM person_info 
            GROUP BY level
        """)
        by_conscientiousness = {row['level']: row['count'] for row in conscientiousness_stats_result.fetchall()}
        
        # 按喜爱程度分组统计
        likeness_stats_result = operator.execute_raw_sql("""
            SELECT 
                CASE 
                    WHEN likeness IS NULL THEN 'unknown'
                    WHEN CAST(likeness AS INTEGER) <= 2 THEN 'low'
                    WHEN CAST(likeness AS INTEGER) <= 5 THEN 'medium'
                    WHEN CAST(likeness AS INTEGER) <= 8 THEN 'high'
                    ELSE 'very_high'
                END as level,
                COUNT(*) as count
            FROM person_info 
            GROUP BY level
        """)
        by_likeness = {row['level']: row['count'] for row in likeness_stats_result.fetchall()}
        
        # 最近活跃用户（7天内有互动的）
        recent_active_result = operator.execute_raw_sql("""
            SELECT COUNT(*) as recent_count 
            FROM person_info 
            WHERE last_know IS NOT NULL 
            AND last_know > ?
        """, (time.time() - 7 * 24 * 3600,))  # 7天前的时间戳
        recent_active = recent_active_result.fetchone()['recent_count'] if recent_active_result else 0
        
        # 认知次数最多的前5个人
        top_persons_result = operator.execute_raw_sql("""
            SELECT id, person_name, know_times 
            FROM person_info 
            WHERE know_times IS NOT NULL 
            ORDER BY CAST(know_times AS FLOAT) DESC 
            LIMIT 5
        """)
        top_persons = []
        for row in top_persons_result.fetchall():
            top_persons.append({
                "id": row['id'],
                "person_name": row['person_name'],
                "know_times": float(row['know_times']) if row['know_times'] else 0
            })
        
        # 构建完整统计数据
        stats_data = {
            "total": total,
            "byPlatform": by_platform,
            "byFriendlyValue": by_friendly_value,
            "byAttitudeToMe": by_attitude_to_me,
            "byRudeness": by_rudeness,
            "byNeuroticism": by_neuroticism,
            "byConscientiousness": by_conscientiousness,
            "byLikeness": by_likeness,
            "avgKnowTimes": avg_know_times,
            "avgFriendlyValue": avg_friendly_value,
            "totalKnowTimes": total_know_times,
            "recentActive": recent_active,
            "topPersons": top_persons
        }
        
        logger.info("获取人物信息统计成功")
        return create_success_response(stats_data, "获取统计信息成功")
        
    except Exception as error:
        logger.error(f"获取人物信息统计失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "获取统计信息失败")
        )


@router.get("/platforms", summary="获取可用平台列表")
async def get_available_platforms():
    """
    获取可用平台列表
    
    Returns:
        平台列表响应
    """
    try:
        logger.debug("处理获取可用平台列表请求")
        
        # 获取数据库操作器
        operator = database_manager.get_maibot_operator()
        if not operator:
            raise RuntimeError("数据库连接不可用")
        
        # 查询平台列表
        result = operator.execute_raw_sql("SELECT DISTINCT platform FROM person_info ORDER BY platform")
        
        platforms = [{"name": row['platform'], "count": 0} for row in result.fetchall()]
        
        # 获取每个平台的数量
        for platform in platforms:
            count_result = operator.execute_raw_sql("SELECT COUNT(*) as count FROM person_info WHERE platform = ?", (platform['name'],))
            platform['count'] = count_result.fetchone()['count'] if count_result else 0
        
        logger.info("获取可用平台列表成功")
        return create_success_response(platforms, "获取平台列表成功")
        
    except Exception as error:
        logger.error(f"获取可用平台列表失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "获取平台列表失败")
        )