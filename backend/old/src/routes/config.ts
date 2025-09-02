/**
 * 配置相关路由入口
 * 统一管理主程序配置、模型配置和适配器配置路由
 */

import Router from '@koa/router';
import { mainConfigRouter } from './mainConfig';
import { modelConfigRouter } from './modelConfig';
import { adapterConfigRouter } from './adapterConfig';
import { logger } from '../core/logger';

const router = new Router();

// 集成主程序配置路由
router.use(mainConfigRouter.routes());

// 集成模型配置路由
router.use(modelConfigRouter.routes());

// 集成适配器配置路由
router.use(adapterConfigRouter.routes());

// 配置模块健康检查
router.get('/health', async (ctx) => {
  try {
    ctx.body = {
      status: 200,
      message: '配置模块运行正常',
      data: {
        module: 'config',
        services: ['mainConfig', 'modelConfig', 'adapterConfig'],
        timestamp: new Date().toISOString()
      },
      time: Date.now()
    };
  } catch (error) {
    logger.error('配置模块健康检查失败:', error);
    ctx.status = 500;
    ctx.body = {
      status: 500,
      message: '配置模块健康检查失败',
      time: Date.now()
    };
  }
});

export default router;
