"""
路径缓存API路由
Path Cache API Routes
"""

import time
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models.path_cache import (
    PathCacheData, AdapterRootInfo,
    GetAllPathsResponse, SetRootPathRequest, SetRootPathResponse,
    AddAdapterRootRequest, AddAdapterRootResponse,
    UpdateAdapterRootRequest, StandardResponse
)
from core.path_cache_manager import path_cache_manager
import logging

logger = logging.getLogger("HMML")

# 创建路由器
router = APIRouter(prefix="/pathCache", tags=["路径缓存"])


def create_success_response(data: Optional[dict] = None, message: str = "操作成功") -> StandardResponse:
    """创建成功响应"""
    return StandardResponse(
        status=200,
        message=message,
        time=int(time.time() * 1000),
        data=data
    )


def create_error_response(status: int, message: str) -> dict:
    """创建错误响应"""
    return {
        "status": status,
        "message": message,
        "time": int(time.time() * 1000)
    }


@router.get("/getAllPaths", response_model=StandardResponse, summary="获取所有缓存的路径")
async def get_all_paths():
    """
    获取所有缓存的路径
    
    Returns:
        包含麦麦主程序根目录和适配器根目录列表的响应
    """
    try:
        logger.debug('处理获取所有路径请求')
        
        paths = await path_cache_manager.get_all_paths()
        
        # 转换为标准响应格式
        response_data = GetAllPathsResponse(
            main_root=paths.get("mainRoot"),
            adapter_roots=paths.get("adapterRoots", [])
        )
        
        logger.info('获取所有路径成功')
        return create_success_response(response_data.model_dump(), '获取路径成功')
        
    except Exception as error:
        logger.error(f'获取所有路径失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '获取路径失败')
        )


@router.post("/setRootPath", response_model=StandardResponse, summary="设置主程序根目录")
async def set_root_path(request: SetRootPathRequest):
    """
    设置主程序根目录
    
    Args:
        request: 包含新的主程序根目录的请求
        
    Returns:
        设置结果响应
    """
    try:
        logger.debug(f'处理设置主程序根目录请求: {request.mainRoot}')
        
        # 设置主程序根目录
        await path_cache_manager.set_main_root(request.mainRoot)
        
        logger.info(f'主程序根目录设置成功: {request.mainRoot}')
        return create_success_response(message='主程序根目录设置成功')
        
    except ValueError as error:
        logger.warn(f'设置主程序根目录参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except Exception as error:
        logger.error(f'设置主程序根目录失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '设置主程序根目录失败')
        )


@router.get("/getMainRoot", response_model=StandardResponse, summary="获取主程序根目录")
async def get_main_root():
    """
    获取主程序根目录
    
    Returns:
        主程序根目录响应
    """
    try:
        logger.debug('处理获取主程序根目录请求')
        
        main_root = path_cache_manager.get_main_root()
        
        message = '获取主程序根目录成功' if main_root else '主程序根目录未设置'
        logger.info(message)
        
        return create_success_response({"mainRoot": main_root}, message)
        
    except Exception as error:
        logger.error(f'获取主程序根目录失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '获取主程序根目录失败')
        )


@router.post("/addAdapterRoot", response_model=StandardResponse, summary="添加适配器根目录")
async def add_adapter_root(request: AddAdapterRootRequest):
    """
    添加适配器根目录
    
    Args:
        request: 包含适配器名称和根目录路径的请求
        
    Returns:
        添加结果响应
    """
    try:
        logger.debug(f'处理添加适配器根目录请求: {request.adapterName}')
        
        # 验证适配器名称格式（与原后端保持一致）
        import re
        adapter_name_regex = r'^[a-zA-Z0-9_\-\u4e00-\u9fff]+$'
        if not re.match(adapter_name_regex, request.adapterName.strip()):
            raise ValueError('适配器名称只能包含字母、数字、下划线、连字符和中文字符')
        
        # 添加适配器根目录
        await path_cache_manager.add_adapter_root(request.adapterName, request.rootPath)
        
        logger.info(f'适配器根目录添加成功: {request.adapterName} -> {request.rootPath}')
        return create_success_response(message='适配器根目录添加成功')
        
    except ValueError as error:
        error_msg = str(error)
        
        if '已存在' in error_msg:
            logger.info(f'适配器已存在: {request.adapterName}')
            raise HTTPException(
                status_code=409,
                detail=create_error_response(409, error_msg)
            )
        elif '已达上限' in error_msg:
            logger.warn(f'适配器数量已达上限: {request.adapterName}')
            raise HTTPException(
                status_code=400,
                detail=create_error_response(400, error_msg)
            )
        else:
            logger.warn(f'添加适配器根目录参数验证失败: {error_msg}')
            raise HTTPException(
                status_code=400,
                detail=create_error_response(400, error_msg)
            )
    except Exception as error:
        logger.error(f'添加适配器根目录失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '添加适配器根目录失败')
        )


@router.delete("/removeAdapterRoot", response_model=StandardResponse, summary="移除适配器根目录")
async def remove_adapter_root(adapter_name: str = Query(..., description="适配器名称")):
    """
    移除适配器根目录
    
    Args:
        adapter_name: 要移除的适配器名称
        
    Returns:
        移除结果响应
    """
    try:
        logger.debug(f'处理移除适配器根目录请求: {adapter_name}')
        
        # 参数验证
        if not adapter_name or not adapter_name.strip():
            raise ValueError('缺少必需参数: adapterName')
        
        if len(adapter_name.strip()) > 100:
            raise ValueError('适配器名称长度不能超过100个字符')
        
        # 移除适配器根目录
        removed = await path_cache_manager.remove_adapter_root(adapter_name)
        
        if not removed:
            logger.info(f'适配器不存在: {adapter_name}')
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, '适配器不存在')
            )
        
        logger.info(f'适配器根目录移除成功: {adapter_name}')
        return create_success_response(message='适配器根目录移除成功')
        
    except ValueError as error:
        logger.warn(f'移除适配器根目录参数验证失败: {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'移除适配器根目录失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '移除适配器根目录失败')
        )


@router.put("/updateAdapterRoot", response_model=StandardResponse, summary="更新适配器根目录")
async def update_adapter_root(request: UpdateAdapterRootRequest):
    """
    更新适配器根目录
    
    Args:
        request: 包含适配器名称和新根目录路径的请求
        
    Returns:
        更新结果响应
    """
    try:
        logger.debug(f'处理更新适配器根目录请求: {request.adapterName}')
        
        # 更新适配器根目录
        await path_cache_manager.update_adapter_root(request.adapterName, request.rootPath)
        
        logger.info(f'适配器根目录更新成功: {request.adapterName} -> {request.rootPath}')
        return create_success_response(message='适配器根目录更新成功')
        
    except ValueError as error:
        error_msg = str(error)
        
        if '不存在' in error_msg:
            logger.info(f'适配器不存在: {request.adapterName}')
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, error_msg)
            )
        else:
            logger.warn(f'更新适配器根目录参数验证失败: {error_msg}')
            raise HTTPException(
                status_code=400,
                detail=create_error_response(400, error_msg)
            )
    except Exception as error:
        logger.error(f'更新适配器根目录失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '更新适配器根目录失败')
        )


@router.get("/getAdapterRoot/{adapter_name}", response_model=StandardResponse, summary="获取适配器根目录")
async def get_adapter_root(adapter_name: str):
    """
    获取适配器根目录
    
    Args:
        adapter_name: 适配器名称
        
    Returns:
        适配器根目录响应
    """
    try:
        logger.debug(f'处理获取适配器根目录请求: {adapter_name}')
        
        # 参数验证
        if not adapter_name or not adapter_name.strip():
            raise ValueError('适配器名称不能为空')
        
        if len(adapter_name.strip()) > 100:
            raise ValueError('适配器名称长度不能超过100个字符')
        
        root_path = path_cache_manager.get_adapter_root(adapter_name)
        
        if not root_path:
            logger.info(f'适配器不存在: {adapter_name}')
            raise HTTPException(
                status_code=404,
                detail=create_error_response(404, '适配器不存在')
            )
        
        response_data = {
            "adapterName": adapter_name.strip(),
            "rootPath": root_path
        }
        
        logger.info(f'获取适配器根目录成功: {adapter_name}')
        return create_success_response(response_data, '获取适配器根目录成功')
        
    except ValueError as error:
        logger.warn(f'获取适配器根目录参数验证失败: {adapter_name} - {error}')
        raise HTTPException(
            status_code=400,
            detail=create_error_response(400, str(error))
        )
    except HTTPException:
        raise
    except Exception as error:
        logger.error(f'获取适配器根目录失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '获取适配器根目录失败')
        )


@router.get("/getAllAdapters", response_model=StandardResponse, summary="获取所有适配器列表")
async def get_all_adapters():
    """
    获取所有适配器列表
    
    Returns:
        适配器列表响应
    """
    try:
        logger.debug('处理获取所有适配器列表请求')
        
        adapters = path_cache_manager.get_all_adapters()
        
        # 转换为API响应格式
        response_data = [
            {
                "adapterName": adapter.adapter_name,
                "rootPath": adapter.root_path
            } for adapter in adapters
        ]
        
        logger.info('获取适配器列表成功')
        return create_success_response(response_data, '获取适配器列表成功')
        
    except Exception as error:
        logger.error(f'获取适配器列表失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '获取适配器列表失败')
        )


@router.delete("/clearCache", response_model=StandardResponse, summary="清空所有缓存")
async def clear_cache():
    """
    清空所有缓存
    
    Returns:
        清空结果响应
    """
    try:
        logger.debug('处理清空缓存请求')
        
        await path_cache_manager.clear_cache()
        
        logger.info('缓存清空成功')
        return create_success_response(message='缓存清空成功')
        
    except Exception as error:
        logger.error(f'清空缓存失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '清空缓存失败')
        )


@router.get("/getStats", response_model=StandardResponse, summary="获取缓存统计信息")
async def get_stats():
    """
    获取缓存统计信息
    
    Returns:
        缓存统计信息响应
    """
    try:
        logger.debug('处理获取缓存统计信息请求')
        
        stats = path_cache_manager.get_cache_stats()
        
        logger.info('获取缓存统计信息成功')
        return create_success_response(stats.model_dump(), '获取缓存统计信息成功')
        
    except Exception as error:
        logger.error(f'获取缓存统计信息失败: {error}')
        raise HTTPException(
            status_code=500,
            detail=create_error_response(500, '获取缓存统计信息失败')
        )
