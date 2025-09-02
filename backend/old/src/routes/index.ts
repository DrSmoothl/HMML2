import Koa from 'koa';
import Router from '@koa/router';
import baseRouter from './base';
import pathCacheRouter from './pathCache';
import databaseRouter from './database';
import configRouter from './config';
import { logger } from '../core/logger';

/**
 * 路由管理器
 */
export class RouteManager {
  private app: Koa;
  private apiRouter: Router;
  private additionalRouters: Router[] = [];

  constructor(app: Koa) {
    this.app = app;
    this.apiRouter = new Router({ prefix: '/api' });
  }

  /**
   * 初始化所有路由
   */
  init(): void {
    this.registerRoutes();
    this.mountRoutes();
    logger.info('路由初始化完成');
  }

  /**
   * 注册路由
   */
  private registerRoutes(): void {
    // 注册基础路由到API路由器（需要/api前缀）
    this.apiRouter.use(baseRouter.routes());

    // 注册路径缓存路由
    this.apiRouter.use('/pathCache', pathCacheRouter.routes());

    // 注册数据库操作路由
    this.apiRouter.use('/database', databaseRouter.routes());

    // 注册配置管理路由
    this.apiRouter.use('/config', configRouter.routes());

    // 这里可以添加更多路由模块
    // this.apiRouter.use('/users', userRouter.routes());
    // this.apiRouter.use('/files', fileRouter.routes());

    logger.debug('路由注册完成');
  }

  /**
   * 挂载路由到应用
   */
  private mountRoutes(): void {
    // 挂载API路由
    this.app.use(this.apiRouter.routes());
    this.app.use(this.apiRouter.allowedMethods());

    // 挂载额外的路由器
    this.additionalRouters.forEach(router => {
      this.app.use(router.routes());
      this.app.use(router.allowedMethods());
    });

    // 记录所有注册的路由
    this.logRoutes();
  }

  /**
   * 记录所有路由信息
   */
  private logRoutes(): void {
    const routes: string[] = [];
    
    // 获取API路由（apiRouter已经有/api前缀，不需要再添加）
    this.apiRouter.stack.forEach(layer => {
      const methods = layer.methods.filter(method => method !== 'HEAD').join(', ');
      const path = layer.path; // 不再添加额外的/api前缀
      routes.push(`${methods.padEnd(20)} ${path}`);
    });

    // 获取额外路由器的路由
    this.additionalRouters.forEach(router => {
      router.stack.forEach(layer => {
        const methods = layer.methods.filter(method => method !== 'HEAD').join(', ');
        const path = layer.path;
        routes.push(`${methods.padEnd(20)} ${path}`);
      });
    });

    if (routes.length > 0) {
      logger.info('已注册的路由:');
      routes.forEach(route => logger.info(`  ${route}`));
    }
  }

  /**
   * 添加新的路由模块到API路由器
   */
  addRouteModule(prefix: string, router: Router): void {
    this.apiRouter.use(prefix, router.routes());
    logger.info(`添加API路由模块: ${prefix}`);
  }

  /**
   * 添加独立的路由器（不带API前缀）
   */
  addRouter(router: Router, description?: string): void {
    this.additionalRouters.push(router);
    logger.info(`添加独立路由器: ${description || '未命名路由器'}`);
    
    // 立即挂载新添加的路由器
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
    
    // 重新记录所有路由信息
    this.logRoutes();
  }

  /**
   * 获取路由统计信息
   */
  getRouteStats(): { totalRoutes: number; routesList: string[] } {
    const routesList: string[] = [];
    
    // API路由（apiRouter已经有/api前缀，不需要再添加）
    this.apiRouter.stack.forEach(layer => {
      const methods = layer.methods.filter(method => method !== 'HEAD').join(', ');
      const path = layer.path; // 不再添加额外的/api前缀
      routesList.push(`${methods} ${path}`);
    });

    // 额外路由器的路由
    this.additionalRouters.forEach(router => {
      router.stack.forEach(layer => {
        const methods = layer.methods.filter(method => method !== 'HEAD').join(', ');
        const path = layer.path;
        routesList.push(`${methods} ${path}`);
      });
    });

    return {
      totalRoutes: routesList.length,
      routesList
    };
  }
}

/**
 * 初始化路由管理器
 */
export function initRoutes(app: Koa): RouteManager {
  const routeManager = new RouteManager(app);
  routeManager.init();
  return routeManager;
}
