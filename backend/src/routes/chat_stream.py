"""
Chat Stream 路由
聊天流相关API端点
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import time
import logging

from models.chat_stream import (
    ChatStreamCreate, ChatStreamUpdate, ChatStreamDelete,
    ChatStreamQuery, ChatStreamListResponse, ChatStreamCreateResponse,
    ChatStreamUpdateResponse, ChatStreamDeleteResponse
)
from services.chat_stream_service import chat_stream_service

logger = logging.getLogger("HMML")

# 响应辅助函数
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

router = APIRouter(prefix="/database/chatStreams", tags=["聊天流管理"])


@router.get("/get", response_model=ChatStreamListResponse, summary="查询聊天流列表")
async def get_chat_stream_list(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
    stream_id: Optional[str] = Query(None, description="聊天流ID过滤"),
    group_platform: Optional[str] = Query(None, description="群组平台过滤"),
    group_id: Optional[str] = Query(None, description="群组ID过滤"),
    group_name: Optional[str] = Query(None, description="群组名称过滤"),
    platform: Optional[str] = Query(None, description="平台过滤"),
    user_platform: Optional[str] = Query(None, description="用户平台过滤"),
    user_id: Optional[str] = Query(None, description="用户ID过滤"),
    user_nickname: Optional[str] = Query(None, description="用户昵称过滤"),
    user_cardname: Optional[str] = Query(None, description="用户群昵称过滤")
):
    """
    查询聊天流列表（分页）
    """
    try:
        logger.info(f"查询聊天流列表，页码: {page}, 每页: {pageSize}")
        
        # 构建查询参数
        query = ChatStreamQuery(
            page=page,
            pageSize=pageSize,
            stream_id=stream_id,
            group_platform=group_platform,
            group_id=group_id,
            group_name=group_name,
            platform=platform,
            user_platform=user_platform,
            user_id=user_id,
            user_nickname=user_nickname,
            user_cardname=user_cardname
        )
        
        # 查询数据
        result = await chat_stream_service.get_chat_stream_list(query)
        
        logger.info("查询聊天流列表成功")
        return create_success_response(result, "查询成功")
        
    except Exception as error:
        logger.error(f"查询聊天流列表失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "查询失败")
        )


@router.post("/insert", response_model=ChatStreamCreateResponse, summary="插入聊天流")
async def insert_chat_stream(request: ChatStreamCreate):
    """
    插入新的聊天流记录
    """
    try:
        logger.info(f"插入聊天流: {request.stream_id}")
        
        # 创建聊天流
        chat_stream_id = await chat_stream_service.create_chat_stream(request)
        
        logger.info("插入聊天流成功")
        return create_success_response({"id": chat_stream_id}, "插入成功")
        
    except Exception as error:
        logger.error(f"插入聊天流失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "插入失败")
        )


@router.post("/update", response_model=ChatStreamUpdateResponse, summary="更新聊天流")
async def update_chat_stream(request: ChatStreamUpdate):
    """
    更新聊天流记录
    """
    try:
        logger.info(f"更新聊天流，ID: {request.id}")
        
        # 更新聊天流
        success = await chat_stream_service.update_chat_stream(request)
        
        if success:
            logger.info("更新聊天流成功")
            return create_success_response({}, "更新成功")
        else:
            logger.warning("更新聊天流失败，记录可能不存在")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "更新失败，记录不存在")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"更新聊天流失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "更新失败")
        )


@router.delete("/delete", response_model=ChatStreamDeleteResponse, summary="删除聊天流")
async def delete_chat_stream(request: ChatStreamDelete):
    """
    删除聊天流记录
    """
    try:
        logger.info(f"删除聊天流，ID: {request.id}")
        
        # 删除聊天流
        success = await chat_stream_service.delete_chat_stream(request.id)
        
        if success:
            logger.info("删除聊天流成功")
            return create_success_response({}, "删除成功")
        else:
            logger.warning("删除聊天流失败，记录可能不存在")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "删除失败，记录不存在")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"删除聊天流失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "删除失败")
        )


# RESTful 风格的额外端点（可选）

@router.get("/get/{chat_stream_id}", summary="根据ID获取单个聊天流")
async def get_chat_stream_by_id(chat_stream_id: int):
    """
    根据ID获取单个聊天流记录
    """
    try:
        logger.info(f"根据ID查询聊天流: {chat_stream_id}")
        
        # 查询聊天流
        result = await chat_stream_service.get_chat_stream_by_id(chat_stream_id)
        
        if result:
            logger.info("查询聊天流成功")
            return create_success_response(result, "查询成功")
        else:
            logger.warning("聊天流不存在")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "聊天流不存在")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"查询聊天流失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "查询失败")
        )


@router.put("/update/{chat_stream_id}", summary="更新聊天流（RESTful风格）")
async def update_chat_stream_restful(chat_stream_id: int, request: ChatStreamCreate):
    """
    更新聊天流记录（RESTful风格）
    """
    try:
        logger.info(f"更新聊天流（RESTful），ID: {chat_stream_id}")
        
        # 构建更新数据
        update_data = ChatStreamUpdate(
            id=chat_stream_id,
            **request.model_dump()
        )
        
        # 更新聊天流
        success = await chat_stream_service.update_chat_stream(update_data)
        
        if success:
            logger.info("更新聊天流成功")
            return create_success_response({}, "更新成功")
        else:
            logger.warning("更新聊天流失败，记录可能不存在")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "更新失败，记录不存在")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"更新聊天流失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "更新失败")
        )


@router.delete("/delete/{chat_stream_id}", summary="删除聊天流（RESTful风格）")
async def delete_chat_stream_restful(chat_stream_id: int):
    """
    删除聊天流记录（RESTful风格）
    """
    try:
        logger.info(f"删除聊天流（RESTful），ID: {chat_stream_id}")
        
        # 删除聊天流
        success = await chat_stream_service.delete_chat_stream(chat_stream_id)
        
        if success:
            logger.info("删除聊天流成功")
            return create_success_response({}, "删除成功")
        else:
            logger.warning("删除聊天流失败，记录可能不存在")
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, "删除失败，记录不存在")
            )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"删除聊天流失败: {error}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, "删除失败")
        )
