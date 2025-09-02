/**
 * 麦麦主程序配置路由
 * 提供主程序配置的读取和更新API
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { logger } from '../core/logger';
import { MainConfigService } from '../services/mainConfigService';
import { ConfigUpdateData } from '../types/config';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';

const router = new Router();

/**
 * 获取当前主程序配置
 * GET /config/main/get
 */
router.get('/main/get', async (ctx: Context, next: Next) => {
  try {
    const config = await MainConfigService.getConfig();

    ctx.body = {
      status: 200,
      message: '获取成功',
      data: config,
      time: Date.now()
    };

    logger.info('主程序配置获取成功');

  } catch (error) {
    logger.error('获取主程序配置失败:', error);
    throw error;
  }
});

/**
 * 更新主程序配置
 * POST /config/main/update
 */
router.post('/main/update', async (ctx: Context, next: Next) => {
  try {
    const updateData = (ctx.request as any).body as ConfigUpdateData;

    if (!updateData) {
      throw new ValidationError('请求体不能为空');
    }

    await MainConfigService.updateConfig(updateData);

    ctx.body = {
      status: 200,
      message: '更新成功',
      time: Date.now()
    };

    logger.info('主程序配置更新成功');

  } catch (error) {
    logger.error('更新主程序配置失败:', error);
    throw error;
  }
});

/**
 * 获取主程序配置文件信息
 * GET /config/main/info
 */
router.get('/main/info', async (ctx: Context, next: Next) => {
  try {
    const fileInfo = await MainConfigService.getConfigFileInfo();

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
    logger.error('获取主程序配置文件信息失败:', error);
    throw error;
  }
});

/**
 * 验证主程序配置数据
 * POST /config/main/validate
 */
router.post('/main/validate', async (ctx: Context, next: Next) => {
  try {
    const configData = (ctx.request as any).body;

    if (!configData) {
      throw new ValidationError('请求体不能为空');
    }

    // 尝试使用验证选项更新配置（不实际写入）
    try {
      // 这里我们不实际写入文件，只验证数据格式
      await MainConfigService.updateConfig(configData, { 
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
    logger.error('验证主程序配置失败:', error);
    throw error;
  }
});

export { router as mainConfigRouter };
