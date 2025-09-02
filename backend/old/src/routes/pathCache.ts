import Router from '@koa/router';
import { AppContext } from '../types';
import { pathCacheManager } from '../core/pathCacheManager';
import { createSuccessResponse, createErrorResponse } from '../middleware/protocol';
import { logger } from '../core/logger';
import { 
  validateRequired, 
  validateType, 
  validateLength,
  ValidationError,
  NotFoundError,
  ConflictError 
} from '../middleware/errorHandler';
import { 
  SetRootPathRequest, 
  AddAdapterRootRequest, 
  RemoveAdapterRootRequest, 
  UpdateAdapterRootRequest,
  GetAllPathsResponse 
} from '../types/pathCache';

const router = new Router();

/**
 * 获取所有缓存的路径
 * GET /pathCache/getAllPaths
 */
router.get('/getAllPaths', async (ctx: AppContext) => {
  try {
    logger.debug('处理获取所有路径请求');

    const paths = await pathCacheManager.getAllPaths();
    const response: GetAllPathsResponse = {
      mainRoot: paths.mainRoot,
      adapterRoots: paths.adapterRoots
    };

    ctx.body = createSuccessResponse(response, '获取路径成功');
    logger.info('获取所有路径成功');
  } catch (error) {
    logger.error('获取所有路径失败:', error);
    ctx.status = 500;
    ctx.body = createErrorResponse(500, '获取路径失败', error instanceof Error ? error.message : String(error));
  }
});

/**
 * 设置主程序根目录
 * POST /pathCache/setRootPath
 */
router.post('/setRootPath', async (ctx: AppContext) => {
  try {
    logger.debug('处理设置主程序根目录请求');

    const requestBody = (ctx.request as any).body as SetRootPathRequest;

    // 参数验证
    validateRequired(requestBody, ['mainRoot']);
    validateType(requestBody.mainRoot, 'string', 'mainRoot');
    validateLength(requestBody.mainRoot.trim(), 1, 500, 'mainRoot');

    // 设置主程序根目录
    await pathCacheManager.setMainRoot(requestBody.mainRoot);

    ctx.body = createSuccessResponse(null, '主程序根目录设置成功');
    logger.info(`主程序根目录设置成功: ${requestBody.mainRoot}`);
  } catch (error) {
    logger.error('设置主程序根目录失败:', error);
    
    if (error instanceof ValidationError) {
      ctx.status = 400;
      ctx.body = createErrorResponse(400, '参数验证失败', error.message);
    } else {
      ctx.status = 500;
      ctx.body = createErrorResponse(500, '设置主程序根目录失败', error instanceof Error ? error.message : String(error));
    }
  }
});

/**
 * 获取主程序根目录
 * GET /pathCache/getMainRoot
 */
router.get('/getMainRoot', async (ctx: AppContext) => {
  try {
    logger.debug('处理获取主程序根目录请求');

    const mainRoot = pathCacheManager.getMainRoot();
    
    ctx.body = createSuccessResponse({ mainRoot }, mainRoot ? '获取主程序根目录成功' : '主程序根目录未设置');
    logger.info('获取主程序根目录成功');
  } catch (error) {
    logger.error('获取主程序根目录失败:', error);
    ctx.status = 500;
    ctx.body = createErrorResponse(500, '获取主程序根目录失败', error instanceof Error ? error.message : String(error));
  }
});

/**
 * 添加适配器根目录
 * POST /pathCache/addAdapterRoot
 */
router.post('/addAdapterRoot', async (ctx: AppContext) => {
  try {
    logger.debug('处理添加适配器根目录请求');

    const requestBody = (ctx.request as any).body as AddAdapterRootRequest;

    // 参数验证
    validateRequired(requestBody, ['adapterName', 'rootPath']);
    validateType(requestBody.adapterName, 'string', 'adapterName');
    validateType(requestBody.rootPath, 'string', 'rootPath');
    validateLength(requestBody.adapterName.trim(), 1, 100, 'adapterName');
    validateLength(requestBody.rootPath.trim(), 1, 500, 'rootPath');

    // 检查适配器名称格式
    const adapterNameRegex = /^[a-zA-Z0-9_\-\u4e00-\u9fff]+$/;
    if (!adapterNameRegex.test(requestBody.adapterName.trim())) {
      throw new ValidationError('适配器名称只能包含字母、数字、下划线、连字符和中文字符');
    }

    // 添加适配器根目录
    await pathCacheManager.addAdapterRoot(requestBody.adapterName, requestBody.rootPath);

    ctx.body = createSuccessResponse(null, '适配器根目录添加成功');
    logger.info(`适配器根目录添加成功: ${requestBody.adapterName} -> ${requestBody.rootPath}`);
  } catch (error) {
    const requestBody = (ctx.request as any).body as AddAdapterRootRequest;
    const adapterNameForLog = requestBody?.adapterName || 'unknown';
    
    if (error instanceof ValidationError) {
      logger.warn(`添加适配器根目录参数验证失败: ${adapterNameForLog}`, error);
      ctx.status = 400;
      ctx.body = createErrorResponse(400, '参数验证失败', error.message);
    } else if (error instanceof Error && error.message.includes('已存在')) {
      logger.info(`适配器已存在: ${adapterNameForLog}`);
      ctx.status = 409;
      ctx.body = createErrorResponse(409, '适配器已存在', error.message);
    } else if (error instanceof Error && error.message.includes('已达上限')) {
      logger.warn(`适配器数量已达上限: ${adapterNameForLog}`, error);
      ctx.status = 400;
      ctx.body = createErrorResponse(400, '适配器数量限制', error.message);
    } else {
      logger.error('添加适配器根目录失败:', error);
      ctx.status = 500;
      ctx.body = createErrorResponse(500, '添加适配器根目录失败', error instanceof Error ? error.message : String(error));
    }
  }
});

/**
 * 移除适配器根目录
 * DELETE /pathCache/removeAdapterRoot?adapterName=xxx
 */
router.delete('/removeAdapterRoot', async (ctx: AppContext) => {
  try {
    logger.debug('处理移除适配器根目录请求');

    const adapterName = ctx.query.adapterName as string;

    // 参数验证
    if (!adapterName || typeof adapterName !== 'string') {
      throw new ValidationError('缺少必需参数: adapterName');
    }
    validateLength(adapterName.trim(), 1, 100, 'adapterName');

    // 移除适配器根目录
    const removed = await pathCacheManager.removeAdapterRoot(adapterName);

    if (!removed) {
      throw new NotFoundError('适配器不存在');
    }

    ctx.body = createSuccessResponse(null, '适配器根目录移除成功');
    logger.info(`适配器根目录移除成功: ${adapterName}`);
  } catch (error) {
    logger.error('移除适配器根目录失败:', error);
    
    if (error instanceof ValidationError) {
      ctx.status = 400;
      ctx.body = createErrorResponse(400, '参数验证失败', error.message);
    } else if (error instanceof NotFoundError) {
      ctx.status = 404;
      ctx.body = createErrorResponse(404, '适配器不存在', error.message);
    } else {
      ctx.status = 500;
      ctx.body = createErrorResponse(500, '移除适配器根目录失败', error instanceof Error ? error.message : String(error));
    }
  }
});

/**
 * 更新适配器根目录
 * PUT /pathCache/updateAdapterRoot
 */
router.put('/updateAdapterRoot', async (ctx: AppContext) => {
  try {
    logger.debug('处理更新适配器根目录请求');

    const requestBody = (ctx.request as any).body as UpdateAdapterRootRequest;

    // 参数验证
    validateRequired(requestBody, ['adapterName', 'rootPath']);
    validateType(requestBody.adapterName, 'string', 'adapterName');
    validateType(requestBody.rootPath, 'string', 'rootPath');
    validateLength(requestBody.adapterName.trim(), 1, 100, 'adapterName');
    validateLength(requestBody.rootPath.trim(), 1, 500, 'rootPath');

    // 更新适配器根目录
    await pathCacheManager.updateAdapterRoot(requestBody.adapterName, requestBody.rootPath);

    ctx.body = createSuccessResponse(null, '适配器根目录更新成功');
    logger.info(`适配器根目录更新成功: ${requestBody.adapterName} -> ${requestBody.rootPath}`);
  } catch (error) {
    logger.error('更新适配器根目录失败:', error);
    
    if (error instanceof ValidationError) {
      ctx.status = 400;
      ctx.body = createErrorResponse(400, '参数验证失败', error.message);
    } else if (error instanceof Error && error.message.includes('不存在')) {
      ctx.status = 404;
      ctx.body = createErrorResponse(404, '适配器不存在', error.message);
    } else {
      ctx.status = 500;
      ctx.body = createErrorResponse(500, '更新适配器根目录失败', error instanceof Error ? error.message : String(error));
    }
  }
});

/**
 * 获取适配器根目录
 * GET /pathCache/getAdapterRoot/:adapterName
 */
router.get('/getAdapterRoot/:adapterName', async (ctx: AppContext) => {
  try {
    logger.debug(`处理获取适配器根目录请求: ${ctx.params.adapterName}`);

    const adapterName = ctx.params.adapterName;
    
    // 参数验证
    if (!adapterName || adapterName.trim() === '') {
      throw new ValidationError('适配器名称不能为空');
    }

    validateLength(adapterName.trim(), 1, 100, 'adapterName');

    const rootPath = pathCacheManager.getAdapterRoot(adapterName);
    
    if (!rootPath) {
      throw new NotFoundError('适配器不存在');
    }

    ctx.body = createSuccessResponse({ 
      adapterName: adapterName.trim(), 
      rootPath 
    }, '获取适配器根目录成功');
    
    logger.info(`获取适配器根目录成功: ${adapterName}`);
  } catch (error) {
    const adapterNameForLog = ctx.params.adapterName || 'unknown';
    
    if (error instanceof ValidationError) {
      logger.warn(`获取适配器根目录参数验证失败: ${adapterNameForLog}`, error);
      ctx.status = 400;
      ctx.body = createErrorResponse(400, '参数验证失败', error.message);
    } else if (error instanceof NotFoundError) {
      logger.info(`适配器不存在: ${adapterNameForLog}`);
      ctx.status = 404;
      ctx.body = createErrorResponse(404, '适配器不存在', error.message);
    } else {
      logger.error('获取适配器根目录失败:', error);
      ctx.status = 500;
      ctx.body = createErrorResponse(500, '获取适配器根目录失败', error instanceof Error ? error.message : String(error));
    }
  }
});

/**
 * 获取所有适配器列表
 * GET /pathCache/getAllAdapters
 */
router.get('/getAllAdapters', async (ctx: AppContext) => {
  try {
    logger.debug('处理获取所有适配器列表请求');

    const adapters = pathCacheManager.getAllAdapters();
    
    ctx.body = createSuccessResponse(adapters, '获取适配器列表成功');
    logger.info('获取适配器列表成功');
  } catch (error) {
    logger.error('获取适配器列表失败:', error);
    ctx.status = 500;
    ctx.body = createErrorResponse(500, '获取适配器列表失败', error instanceof Error ? error.message : String(error));
  }
});

/**
 * 清空所有缓存
 * DELETE /pathCache/clearCache
 */
router.delete('/clearCache', async (ctx: AppContext) => {
  try {
    logger.debug('处理清空缓存请求');

    await pathCacheManager.clearCache();
    
    ctx.body = createSuccessResponse(null, '缓存清空成功');
    logger.info('缓存清空成功');
  } catch (error) {
    logger.error('清空缓存失败:', error);
    ctx.status = 500;
    ctx.body = createErrorResponse(500, '清空缓存失败', error instanceof Error ? error.message : String(error));
  }
});

/**
 * 获取缓存统计信息
 * GET /pathCache/getStats
 */
router.get('/getStats', async (ctx: AppContext) => {
  try {
    logger.debug('处理获取缓存统计信息请求');

    const stats = pathCacheManager.getCacheStats();
    
    ctx.body = createSuccessResponse(stats, '获取缓存统计信息成功');
    logger.info('获取缓存统计信息成功');
  } catch (error) {
    logger.error('获取缓存统计信息失败:', error);
    ctx.status = 500;
    ctx.body = createErrorResponse(500, '获取缓存统计信息失败', error instanceof Error ? error.message : String(error));
  }
});

export default router;
