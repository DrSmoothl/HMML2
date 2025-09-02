"""
Expression表API路由
提供Expression表的HTTP API接口
"""

import time
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models.expression import (
    ExpressionInsertData, ExpressionUpdateData, ExpressionDeleteData,
    ExpressionPaginationParams
)
from services.expression_service import ExpressionService
from core.logger import logger

# 创建路由器
router = APIRouter(prefix="/database/expression", tags=["Expression表操作"])


def create_success_response(data: Optional[dict] = None, message: str = "操作成功") -> dict:
    """创建成功响应"""
    return {
        "status": 200,
        "message": message,
        "time": int(time.time() * 1000),
        "data": data
    }


def create_error_response(status: int, message: str) -> dict:
    """创建错误响应"""
    return {
        "status": status,
        "message": message,
        "time": int(time.time() * 1000)
    }


@router.get("/get", response_model=dict, summary="查询expression列表（分页）")
async def get_expressions(
    page: int = Query(1, description="页码，从1开始", ge=1),
    pageSize: int = Query(10, description="每页记录数", ge=1, le=100),
    orderBy: Optional[str] = Query("id", description="排序字段"),
    orderDir: Optional[str] = Query("ASC", description="排序方向"),
    situation: Optional[str] = Query(None, description="按情境描述过滤"),
    style: Optional[str] = Query(None, description="按表达风格过滤"),
    chat_id: Optional[str] = Query(None, description="按聊天ID过滤"),
    type: Optional[str] = Query(None, description="按类型过滤"),
    minCount: Optional[float] = Query(None, description="最小统计次数"),
    maxCount: Optional[float] = Query(None, description="最大统计次数"),
    startDate: Optional[float] = Query(None, description="开始创建时间"),
    endDate: Optional[float] = Query(None, description="结束创建时间")
):
    """
    查询expression列表（分页）
    
    Args:
        page: 页码，从1开始
        pageSize: 每页记录数
        orderBy: 排序字段
        orderDir: 排序方向
        situation: 按情境描述过滤
        style: 按表达风格过滤
        chat_id: 按聊天ID过滤
        type: 按类型过滤
        minCount: 最小统计次数
        maxCount: 最大统计次数
        startDate: 开始创建时间
        endDate: 结束创建时间
        
    Returns:
        分页查询结果
    """
    try:
        logger.debug(f'处理查询expression列表请求: page={page}, pageSize={pageSize}')
        
        # 构建查询参数
        from models.expression import ExpressionFilterOptions
        filter_options = ExpressionFilterOptions(
            situation=situation,
            style=style,
            chat_id=chat_id,
            type=type,
            minCount=minCount,
            maxCount=maxCount,
            startDate=startDate,
            endDate=endDate
        )
        
        params = ExpressionPaginationParams(
            page=page,
            size=pageSize,
            orderBy=orderBy,
            orderDir=orderDir,
            filter=filter_options
        )
        
        # 查询数据
        result = await ExpressionService.get_expressions(params)
        
        # 转换响应格式
        response_data = {
            "items": [item.model_dump() for item in result.items],
            "totalPages": result.totalPages,
            "currentPage": result.page,
            "pageSize": result.size
        }
        
        return create_success_response(response_data, '查询成功')
        
    except ValueError as error:
        logger.warn(f'查询expression列表参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except Exception as error:
        logger.error(f'查询expression列表失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '查询expression列表失败')
        )


@router.get("/get/{expression_id}", response_model=dict, summary="根据ID查询单个expression")
async def get_expression_by_id(expression_id: int):
    """
    根据ID查询单个expression
    
    Args:
        expression_id: expression ID
        
    Returns:
        expression记录
    """
    try:
        logger.debug(f'处理根据ID查询expression请求: {expression_id}')
        
        if expression_id <= 0:
            raise ValueError("ID必须是大于0的数字")
        
        result = await ExpressionService.get_expression_by_id(expression_id)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, f'未找到ID为 {expression_id} 的expression记录')
            )
        
        return create_success_response(result.model_dump(), '查询成功')
        
    except ValueError as error:
        logger.warn(f'根据ID查询expression参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'根据ID查询expression失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '根据ID查询expression失败')
        )


@router.post("/insert", response_model=dict, summary="插入expression")
async def insert_expression(request: ExpressionInsertData):
    """
    插入expression
    
    Args:
        request: 插入数据
        
    Returns:
        插入结果（包含新记录ID）
    """
    try:
        logger.debug(f'处理插入expression请求: {request.situation[:50]}...')
        
        insert_id = await ExpressionService.insert_expression(request)
        
        logger.info(f'expression插入成功，ID: {insert_id}')
        return create_success_response({"id": insert_id}, '插入成功')
        
    except ValueError as error:
        logger.warn(f'插入expression参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except Exception as error:
        logger.error(f'插入expression失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '插入expression失败')
        )


@router.post("/update", response_model=dict, summary="更新expression")
async def update_expression(request: ExpressionUpdateData):
    """
    更新expression
    
    Args:
        request: 更新数据
        
    Returns:
        更新结果
    """
    try:
        logger.debug(f'处理更新expression请求: ID={request.id}')
        
        success = await ExpressionService.update_expression(request)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, f'未找到ID为 {request.id} 的expression记录')
            )
        
        logger.info(f'expression更新成功，ID: {request.id}')
        return create_success_response(message='更新成功')
        
    except ValueError as error:
        logger.warn(f'更新expression参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'更新expression失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '更新expression失败')
        )


@router.delete("/delete", response_model=dict, summary="删除expression")
async def delete_expression(request: ExpressionDeleteData):
    """
    删除expression
    
    Args:
        request: 删除数据（包含ID）
        
    Returns:
        删除结果
    """
    try:
        logger.debug(f'处理删除expression请求: ID={request.id}')
        
        success = await ExpressionService.delete_expression(request.id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, f'未找到ID为 {request.id} 的expression记录')
            )
        
        logger.info(f'expression删除成功，ID: {request.id}')
        return create_success_response(message='删除成功')
        
    except ValueError as error:
        logger.warn(f'删除expression参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'删除expression失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '删除expression失败')
        )


@router.get("/chat/{chat_id}", response_model=dict, summary="根据聊天ID查询expression")
async def get_expressions_by_chat_id(
    chat_id: str,
    limit: int = Query(10, description="限制结果数量", ge=1, le=100)
):
    """
    根据聊天ID查询expression
    
    Args:
        chat_id: 聊天ID
        limit: 限制结果数量
        
    Returns:
        expression记录列表
    """
    try:
        logger.debug(f'处理根据聊天ID查询expression请求: {chat_id}')
        
        if not chat_id or not chat_id.strip():
            raise ValueError("聊天ID不能为空")
        
        result = await ExpressionService.get_expressions_by_chat_id(chat_id, limit)
        
        response_data = {
            "items": [item.model_dump() for item in result],
            "count": len(result)
        }
        
        return create_success_response(response_data, '查询成功')
        
    except ValueError as error:
        logger.warn(f'根据聊天ID查询expression参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except Exception as error:
        logger.error(f'根据聊天ID查询expression失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '根据聊天ID查询expression失败')
        )


@router.get("/type/{type_name}", response_model=dict, summary="根据类型查询expression")
async def get_expressions_by_type(
    type_name: str,
    limit: int = Query(10, description="限制结果数量", ge=1, le=100)
):
    """
    根据类型查询expression
    
    Args:
        type_name: 类型名称
        limit: 限制结果数量
        
    Returns:
        expression记录列表
    """
    try:
        logger.debug(f'处理根据类型查询expression请求: {type_name}')
        
        if not type_name or not type_name.strip():
            raise ValueError("类型不能为空")
        
        result = await ExpressionService.get_expressions_by_type(type_name, limit)
        
        response_data = {
            "items": [item.model_dump() for item in result],
            "count": len(result)
        }
        
        return create_success_response(response_data, '查询成功')
        
    except ValueError as error:
        logger.warn(f'根据类型查询expression参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except Exception as error:
        logger.error(f'根据类型查询expression失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '根据类型查询expression失败')
        )


@router.get("/search", response_model=dict, summary="搜索expression")
async def search_expressions(
    keyword: str = Query(..., description="搜索关键字", min_length=1, max_length=100),
    limit: int = Query(20, description="限制结果数量", ge=1, le=100)
):
    """
    搜索expression
    
    Args:
        keyword: 搜索关键字
        limit: 限制结果数量
        
    Returns:
        搜索结果
    """
    try:
        logger.debug(f'处理搜索expression请求: {keyword}')
        
        result = await ExpressionService.search_expressions(keyword, limit)
        
        response_data = {
            "items": [item.model_dump() for item in result],
            "count": len(result),
            "keyword": keyword
        }
        
        return create_success_response(response_data, '搜索成功')
        
    except ValueError as error:
        logger.warn(f'搜索expression参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except Exception as error:
        logger.error(f'搜索expression失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '搜索expression失败')
        )


@router.get("/stats", response_model=dict, summary="获取expression统计信息")
async def get_expression_stats():
    """
    获取expression统计信息
    
    Returns:
        统计信息
    """
    try:
        logger.debug('处理获取expression统计信息请求')
        
        result = await ExpressionService.get_expression_stats()
        
        return create_success_response(result.model_dump(), '获取统计信息成功')
        
    except Exception as error:
        logger.error(f'获取expression统计信息失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '获取expression统计信息失败')
        )


@router.post("/increment/{expression_id}", response_model=dict, summary="增加expression统计次数")
async def increment_expression_count(expression_id: int):
    """
    增加expression统计次数
    
    Args:
        expression_id: expression ID
        
    Returns:
        更新结果
    """
    try:
        logger.debug(f'处理增加expression统计次数请求: ID={expression_id}')
        
        if expression_id <= 0:
            raise ValueError("ID必须是大于0的数字")
        
        # 检查expression是否存在
        expression = await ExpressionService.get_expression_by_id(expression_id)
        if not expression:
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, f'未找到ID为 {expression_id} 的expression记录')
            )
        
        success = await ExpressionService.increment_count(expression_id)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail=create_error_response(500, '更新统计次数失败')
            )
        
        logger.info(f'expression统计次数更新成功，ID: {expression_id}')
        return create_success_response(message='统计次数已更新')
        
    except ValueError as error:
        logger.warn(f'增加expression统计次数参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'增加expression统计次数失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '增加expression统计次数失败')
        )
