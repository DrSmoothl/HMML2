"""
Emoji表专用路由
提供emoji表的CRUD操作API
"""

import time
from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional
from models.emoji import (
    EmojiInsertData, EmojiUpdateData, EmojiDeleteData,
    EmojiPaginationParams, EmojiInsertResponse, EmojiUpdateResponse,
    EmojiDeleteResponse, EmojiGetResponse, EmojiImageResponse,
    EmojiStatsResponse, CalculateHashRequest, CalculateHashResponse
)
from services.emoji_service import EmojiService
import logging

logger = logging.getLogger("HMML")

router = APIRouter(prefix="/database/emoji", tags=["emoji"])


@router.get("/get", response_model=EmojiGetResponse)
async def get_emojis(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    pageSize: int = Query(10, ge=1, le=1000, description="每页大小"),
    orderBy: Optional[str] = Query(None, description="排序字段"),
    orderDir: Optional[str] = Query("ASC", description="排序方向"),
    format: Optional[str] = Query(None, description="按格式过滤"),
    emotion: Optional[str] = Query(None, description="按情感过滤"),
    is_registered: Optional[int] = Query(None, description="按注册状态过滤"),
    is_banned: Optional[int] = Query(None, description="按禁止状态过滤"),
    description: Optional[str] = Query(None, description="按描述模糊搜索"),
    emoji_hash: Optional[str] = Query(None, description="按哈希值查找")
):
    """
    查询emoji（分页）
    GET /database/emoji/get?page=1&pageSize=10&orderBy=id&orderDir=DESC&format=png&emotion=happy
    """
    try:
        # 验证排序字段
        if orderBy:
            valid_order_fields = ['id', 'query_count', 'usage_count', 'last_used_time', 'record_time']
            if orderBy not in valid_order_fields:
                raise HTTPException(
                    status_code=400,
                    detail=f"排序字段必须是以下之一: {', '.join(valid_order_fields)}"
                )
        
        # 验证布尔字段
        if is_registered is not None and is_registered not in [0, 1]:
            raise HTTPException(status_code=400, detail="is_registered必须是0或1")
        if is_banned is not None and is_banned not in [0, 1]:
            raise HTTPException(status_code=400, detail="is_banned必须是0或1")
        
        # 构建查询参数
        params = EmojiPaginationParams(
            page=page,
            page_size=pageSize,
            order_by=orderBy,
            order_dir=orderDir,
            format=format,
            emotion=emotion,
            is_registered=is_registered,
            is_banned=is_banned,
            description=description,
            emoji_hash=emoji_hash
        )
        
        # 执行查询
        result = await EmojiService.get_emojis(params)
        
        return EmojiGetResponse(
            status=200,
            message="查询成功",
            data=result,
            time=int(time.time() * 1000)
        )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"查询emoji失败: {error}")
        raise HTTPException(status_code=500, detail=f"查询emoji失败: {str(error)}")


@router.get("/get/{emoji_id}")
async def get_emoji_by_id(
    emoji_id: int = Path(..., ge=1, description="emoji ID")
):
    """
    根据ID查询单个emoji
    GET /database/emoji/get/:id
    """
    try:
        result = await EmojiService.get_emoji_by_id(emoji_id)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"未找到ID为 {emoji_id} 的emoji记录"
            )
        
        # 增加查询次数
        await EmojiService.increment_query_count(emoji_id)
        
        return {
            "status": 200,
            "message": "查询成功",
            "data": result,
            "time": int(time.time() * 1000)
        }
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"根据ID查询emoji失败: {error}")
        raise HTTPException(status_code=500, detail=f"查询emoji失败: {str(error)}")


@router.post("/insert", response_model=EmojiInsertResponse)
async def insert_emoji(data: EmojiInsertData):
    """
    插入emoji
    POST /database/emoji/insert
    """
    try:
        insert_id = await EmojiService.insert_emoji(data)
        
        return EmojiInsertResponse(
            status=200,
            message="插入成功",
            data={"id": insert_id},
            time=int(time.time() * 1000)
        )
        
    except Exception as error:
        logger.error(f"插入emoji失败: {error}")
        raise HTTPException(status_code=500, detail=f"插入emoji失败: {str(error)}")


@router.post("/update", response_model=EmojiUpdateResponse)
async def update_emoji(data: EmojiUpdateData):
    """
    更新emoji
    POST /database/emoji/update
    """
    try:
        success = await EmojiService.update_emoji(data)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"未找到要更新的emoji记录，ID: {data.id}"
            )
        
        return EmojiUpdateResponse(
            status=200,
            message="更新成功",
            time=int(time.time() * 1000)
        )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"更新emoji失败: {error}")
        raise HTTPException(status_code=500, detail=f"更新emoji失败: {str(error)}")


@router.delete("/delete/{emoji_id}")
async def delete_emoji_by_path(
    emoji_id: int = Path(..., ge=1, description="emoji ID")
):
    """
    删除emoji (路径参数方式)
    DELETE /database/emoji/delete/:id
    """
    try:
        success = await EmojiService.delete_emoji(emoji_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"未找到要删除的emoji记录，ID: {emoji_id}"
            )
        
        return {
            "status": 200,
            "message": "删除成功",
            "time": int(time.time() * 1000)
        }
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"删除emoji失败: {error}")
        raise HTTPException(status_code=500, detail=f"删除emoji失败: {str(error)}")


@router.delete("/delete", response_model=EmojiDeleteResponse)
async def delete_emoji_by_body(data: EmojiDeleteData):
    """
    删除emoji (请求体方式，兼容旧版本)
    DELETE /database/emoji/delete
    """
    try:
        success = await EmojiService.delete_emoji(data.id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"未找到要删除的emoji记录，ID: {data.id}"
            )
        
        return EmojiDeleteResponse(
            status=200,
            message="删除成功",
            time=int(time.time() * 1000)
        )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"删除emoji失败: {error}")
        raise HTTPException(status_code=500, detail=f"删除emoji失败: {str(error)}")


@router.get("/hash/{emoji_hash}")
async def get_emoji_by_hash(
    emoji_hash: str = Path(..., description="emoji哈希值")
):
    """
    根据哈希值查询emoji
    GET /database/emoji/hash/:hash
    """
    try:
        result = await EmojiService.get_emoji_by_hash(emoji_hash)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"未找到哈希值为 {emoji_hash} 的emoji记录"
            )
        
        return {
            "status": 200,
            "message": "查询成功",
            "data": result,
            "time": int(time.time() * 1000)
        }
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"根据哈希值查询emoji失败: {error}")
        raise HTTPException(status_code=500, detail=f"查询emoji失败: {str(error)}")


@router.get("/getSingleEmojiImage", response_model=EmojiImageResponse)
async def get_single_emoji_image(
    id: int = Query(..., ge=1, description="emoji ID")
):
    """
    获取单个emoji图片的Base64编码
    GET /database/emoji/getSingleEmojiImage?id=1
    """
    try:
        image_base64 = await EmojiService.get_emoji_image(id)
        
        return EmojiImageResponse(
            status=200,
            message="查询成功",
            data={"imageb64": image_base64},
            time=int(time.time() * 1000)
        )
        
    except Exception as error:
        logger.error(f"获取emoji图片失败: {error}")
        raise HTTPException(status_code=500, detail=f"获取emoji图片失败: {str(error)}")


@router.get("/stats", response_model=EmojiStatsResponse)
async def get_emoji_stats():
    """
    获取emoji统计信息
    GET /database/emoji/stats
    """
    try:
        result = await EmojiService.get_emoji_stats()
        
        return EmojiStatsResponse(
            status=200,
            message="获取统计信息成功",
            data=result,
            time=int(time.time() * 1000)
        )
        
    except Exception as error:
        logger.error(f"获取emoji统计信息失败: {error}")
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(error)}")


@router.post("/calculateHash", response_model=CalculateHashResponse)
async def calculate_hash(data: CalculateHashRequest):
    """
    计算图片哈希值
    POST /database/emoji/calculateHash
    """
    try:
        image_hash = await EmojiService.calculate_image_hash(data.image_path)
        
        return CalculateHashResponse(
            status=200,
            message="计算哈希值成功",
            data={
                "imagePath": data.image_path,
                "imageHash": image_hash
            },
            time=int(time.time() * 1000)
        )
        
    except Exception as error:
        logger.error(f"计算图片哈希值失败: {error}")
        raise HTTPException(status_code=500, detail=f"计算哈希值失败: {str(error)}")
