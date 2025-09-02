/**
 * 麦麦模型配置路由
 * 提供模型配置的读取和更新API
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { logger } from '../core/logger';
import { ModelConfigService } from '../services/modelConfigService';
import { ConfigUpdateData } from '../types/config';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';

const router = new Router();

/**
 * 获取当前模型配置
 * GET /config/model/get
 */
router.get('/model/get', async (ctx: Context, next: Next) => {
  try {
    const config = await ModelConfigService.getConfig();

    ctx.body = {
      status: 200,
      message: '获取成功',
      data: config,
      time: Date.now()
    };

    logger.info('模型配置获取成功');

  } catch (error) {
    logger.error('获取模型配置失败:', error);
    throw error;
  }
});

/**
 * 更新模型配置
 * POST /config/model/update
 */
router.post('/model/update', async (ctx: Context, next: Next) => {
  try {
    const updateData = (ctx.request as any).body as ConfigUpdateData;

    if (!updateData) {
      throw new ValidationError('请求体不能为空');
    }

    await ModelConfigService.updateConfig(updateData);

    ctx.body = {
      status: 200,
      message: '更新成功',
      time: Date.now()
    };

    logger.info('模型配置更新成功');

  } catch (error) {
    logger.error('更新模型配置失败:', error);
    throw error;
  }
});

/**
 * 添加API服务提供商
 * POST /config/model/addProvider
 */
router.post('/model/addProvider', async (ctx: Context, next: Next) => {
  try {
    const providerData = (ctx.request as any).body as {
      name: string;
      base_url: string;
      api_key: string;
      client_type?: string;
      max_retry?: number;
      timeout?: number;
      retry_interval?: number;
    };

    // 参数验证
    if (!providerData.name || !providerData.base_url || !providerData.api_key) {
      throw new ValidationError('name、base_url和api_key为必填字段');
    }

    await ModelConfigService.addProvider(providerData);

    ctx.body = {
      status: 200,
      message: '添加成功',
      time: Date.now()
    };

    logger.info(`已添加API供应商: ${providerData.name}`);

  } catch (error) {
    logger.error('添加API供应商失败:', error);
    throw error;
  }
});

/**
 * 删除API服务提供商
 * DELETE /config/model/deleteProvider
 */
router.delete('/model/deleteProvider', async (ctx: Context, next: Next) => {
  try {
    const { name } = (ctx.request as any).body as { name: string };

    // 参数验证
    if (!name) {
      throw new ValidationError('name为必填字段');
    }

    await ModelConfigService.deleteProvider(name);

    ctx.body = {
      status: 200,
      message: '删除成功',
      time: Date.now()
    };

    logger.info(`已删除API供应商: ${name}`);

  } catch (error) {
    logger.error('删除API供应商失败:', error);
    throw error;
  }
});

/**
 * 添加模型配置
 * POST /config/model/addModel
 */
router.post('/model/addModel', async (ctx: Context, next: Next) => {
  try {
    const modelData = (ctx.request as any).body as {
      model_identifier: string;
      name: string;
      api_provider: string;
      price_in?: number;
      price_out?: number;
      force_stream_mode?: boolean;
      extra_params?: Record<string, any>;
    };

    // 参数验证
    if (!modelData.model_identifier || !modelData.name || !modelData.api_provider) {
      throw new ValidationError('model_identifier、name和api_provider为必填字段');
    }

    await ModelConfigService.addModel(modelData);

    ctx.body = {
      status: 200,
      message: '添加成功',
      time: Date.now()
    };

    logger.info(`已添加模型: ${modelData.name}`);

  } catch (error) {
    logger.error('添加模型失败:', error);
    throw error;
  }
});

/**
 * 删除模型配置
 * DELETE /config/model/deleteModel
 */
router.delete('/model/deleteModel', async (ctx: Context, next: Next) => {
  try {
    const { name } = (ctx.request as any).body as { name: string };

    // 参数验证
    if (!name) {
      throw new ValidationError('name为必填字段');
    }

    await ModelConfigService.deleteModel(name);

    ctx.body = {
      status: 200,
      message: '删除成功',
      time: Date.now()
    };

    logger.info(`已删除模型: ${name}`);

  } catch (error) {
    logger.error('删除模型失败:', error);
    throw error;
  }
});

export { router as modelConfigRouter };
