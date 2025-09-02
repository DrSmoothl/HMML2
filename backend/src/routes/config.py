"""
配置路由
Configuration Routes
处理所有配置相关的API请求
"""

import time
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional

from core.logger import logger
from services.main_config_service import MainConfigService
from services.model_config_service import ModelConfigService
from services.adapter_config_service import AdapterConfigService
from models.config import (
    ConfigUpdateData,
    ApiProviderData,
    ModelData,
    ProviderDeleteData,
    ModelDeleteData
)

router = APIRouter(prefix='/config', tags=['配置管理'])


def create_success_response(data: Optional[dict] = None, message: str = "操作成功") -> dict:
    """创建成功响应"""
    response = {
        "status": 200,
        "message": message,
        "time": int(time.time() * 1000)
    }
    if data is not None:
        response["data"] = data
    return response


def create_error_response(status: int, message: str) -> dict:
    """创建错误响应"""
    return {
        "status": status,
        "message": message,
        "time": int(time.time() * 1000)
    }


# 麦麦主程序配置API
@router.get('/main/get')
async def get_main_config():
    """
    获取当前主程序配置
    """
    try:
        config = await MainConfigService.get_config()
        
        return create_success_response(
            data=config.model_dump(),
            message='获取成功'
        )
        
    except FileNotFoundError as error:
        logger.error(f'主程序配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        logger.error(f'主程序配置文件权限错误: {error}')
        raise HTTPException(status_code=403, detail=str(error))
    except Exception as error:
        logger.error(f'获取主程序配置失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@router.post('/main/update')
async def update_main_config(update_data: Dict[str, Any]):
    """
    更新主程序配置
    """
    try:
        config_update = ConfigUpdateData(**update_data)
        await MainConfigService.update_config(config_update)
        
        return create_success_response(message='更新成功')
        
    except ValueError as error:
        logger.error(f'主程序配置数据验证失败: {error}')
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError as error:
        logger.error(f'主程序配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        logger.error(f'主程序配置文件权限错误: {error}')
        raise HTTPException(status_code=403, detail=str(error))
    except Exception as error:
        logger.error(f'更新主程序配置失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


# 麦麦模型配置API
@router.get('/model/get')
async def get_model_config():
    """
    获取当前模型配置
    """
    try:
        config = await ModelConfigService.get_config()
        
        return create_success_response(
            data=config.model_dump(),
            message='获取成功'
        )
        
    except FileNotFoundError as error:
        logger.error(f'模型配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        logger.error(f'模型配置文件权限错误: {error}')
        raise HTTPException(status_code=403, detail=str(error))
    except Exception as error:
        logger.error(f'获取模型配置失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@router.post('/model/update')
async def update_model_config(update_data: Dict[str, Any]):
    """
    更新模型配置
    """
    try:
        config_update = ConfigUpdateData(**update_data)
        await ModelConfigService.update_config(config_update)
        
        return create_success_response(message='更新成功')
        
    except ValueError as error:
        logger.error(f'模型配置数据验证失败: {error}')
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError as error:
        logger.error(f'模型配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        logger.error(f'模型配置文件权限错误: {error}')
        raise HTTPException(status_code=403, detail=str(error))
    except Exception as error:
        logger.error(f'更新模型配置失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@router.post('/model/addProvider')
async def add_api_provider(provider_data: ApiProviderData):
    """
    添加API服务提供商
    """
    try:
        await ModelConfigService.add_provider(provider_data)
        
        return create_success_response(message='添加成功')
        
    except ValueError as error:
        logger.error(f'添加API供应商失败: {error}')
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError as error:
        logger.error(f'模型配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        logger.error(f'添加API供应商失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@router.delete('/model/deleteProvider')
async def delete_api_provider(provider_data: ProviderDeleteData):
    """
    删除API服务提供商
    """
    try:
        await ModelConfigService.delete_provider(provider_data.name)
        
        return create_success_response(message='删除成功')
        
    except ValueError as error:
        logger.error(f'删除API供应商失败: {error}')
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError as error:
        logger.error(f'模型配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        logger.error(f'删除API供应商失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@router.post('/model/addModel')
async def add_model(model_data: ModelData):
    """
    添加模型配置
    """
    try:
        await ModelConfigService.add_model(model_data)
        
        return create_success_response(message='添加成功')
        
    except ValueError as error:
        logger.error(f'添加模型失败: {error}')
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError as error:
        logger.error(f'模型配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        logger.error(f'添加模型失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@router.delete('/model/deleteModel')
async def delete_model(model_data: ModelDeleteData):
    """
    删除模型配置
    """
    try:
        await ModelConfigService.delete_model(model_data.name)
        
        return create_success_response(message='删除成功')
        
    except ValueError as error:
        logger.error(f'删除模型失败: {error}')
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError as error:
        logger.error(f'模型配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        logger.error(f'删除模型失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


# QQ适配器配置API
@router.get('/adapter/qq/get')
async def get_qq_adapter_config():
    """
    获取QQ适配器配置
    """
    try:
        config = await AdapterConfigService.get_config()
        
        return create_success_response(
            data=config.model_dump(),
            message='获取成功'
        )
        
    except FileNotFoundError as error:
        logger.error(f'QQ适配器配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        logger.error(f'QQ适配器配置文件权限错误: {error}')
        raise HTTPException(status_code=403, detail=str(error))
    except Exception as error:
        logger.error(f'获取QQ适配器配置失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))


@router.post('/adapter/qq/update')
async def update_qq_adapter_config(update_data: Dict[str, Any]):
    """
    更新QQ适配器配置
    """
    try:
        config_update = ConfigUpdateData(**update_data)
        await AdapterConfigService.update_config(config_update)
        
        return create_success_response(message='更新成功')
        
    except ValueError as error:
        logger.error(f'QQ适配器配置数据验证失败: {error}')
        raise HTTPException(status_code=400, detail=str(error))
    except FileNotFoundError as error:
        logger.error(f'QQ适配器配置文件不存在: {error}')
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        logger.error(f'QQ适配器配置文件权限错误: {error}')
        raise HTTPException(status_code=403, detail=str(error))
    except Exception as error:
        logger.error(f'更新QQ适配器配置失败: {error}')
        raise HTTPException(status_code=500, detail=str(error))
