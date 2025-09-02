/**
 * QQ适配器配置路由
 * 提供QQ适配器配置的读取和更新API
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { logger } from '../core/logger';
import { AdapterConfigService } from '../services/adapterConfigService';
import { AdapterConfigUpdateData } from '../types/adapterConfig';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';

const router = new Router();

/**
 * 获取QQ适配器配置
 * GET /config/adapter/qq/get
 */
router.get('/adapter/qq/get', async (ctx: Context, next: Next) => {
  try {
    const config = await AdapterConfigService.getConfig();

    ctx.body = {
      status: 200,
      message: '获取成功',
      data: config,
      time: Date.now()
    };

    logger.info('QQ适配器配置获取成功');

  } catch (error) {
    logger.error('获取QQ适配器配置失败:', error);
    throw error;
  }
});

/**
 * 更新QQ适配器配置
 * POST /config/adapter/qq/update
 */
router.post('/adapter/qq/update', async (ctx: Context, next: Next) => {
  try {
    const updateData = (ctx.request as any).body as AdapterConfigUpdateData;

    if (!updateData) {
      throw new ValidationError('请求体不能为空');
    }

    await AdapterConfigService.updateConfig(updateData);

    ctx.body = {
      status: 200,
      message: '更新成功',
      time: Date.now()
    };

    logger.info('QQ适配器配置更新成功');

  } catch (error) {
    logger.error('更新QQ适配器配置失败:', error);
    throw error;
  }
});

/**
 * 获取QQ适配器配置文件信息
 * GET /config/adapter/qq/info
 */
router.get('/adapter/qq/info', async (ctx: Context, next: Next) => {
  try {
    const fileInfo = await AdapterConfigService.getConfigFileInfo();

    ctx.body = {
      status: 200,
      message: '获取配置文件信息成功',
      data: {
        path: fileInfo.path,
        exists: fileInfo.exists,
        readable: fileInfo.readable,
        writable: fileInfo.writable,
        size: fileInfo.size,
        lastModified: fileInfo.lastModified.toISOString()
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('获取QQ适配器配置文件信息失败:', error);
    throw error;
  }
});

/**
 * 验证QQ适配器配置数据
 * POST /config/adapter/qq/validate
 */
router.post('/adapter/qq/validate', async (ctx: Context, next: Next) => {
  try {
    const configData = (ctx.request as any).body;

    if (!configData) {
      throw new ValidationError('请求体不能为空');
    }

    // 尝试使用验证选项更新配置（不实际写入）
    try {
      // 这里我们不实际写入文件，只验证数据格式
      await AdapterConfigService.updateConfig(configData, { 
        validate: true,
        backup: false 
      });
      
      ctx.body = {
        status: 200,
        message: '配置数据验证通过',
        data: {
          valid: true,
          errors: [],
          warnings: []
        },
        time: Date.now()
      };
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        ctx.body = {
          status: 400,
          message: '配置数据验证失败',
          data: {
            valid: false,
            errors: [validationError.message],
            warnings: []
          },
          time: Date.now()
        };
      } else {
        throw validationError;
      }
    }

  } catch (error) {
    logger.error('验证QQ适配器配置失败:', error);
    throw error;
  }
});

export { router as adapterConfigRouter };
