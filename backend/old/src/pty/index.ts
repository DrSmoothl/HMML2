import { Server as HttpServer } from 'http';
import Router from '@koa/router';
import { PtySessionManager } from './sessionManager';
import { PtyWebSocketService } from './webSocketService';
import { PtyRouteHandler, ptyEnvironmentMiddleware, ptyErrorMiddleware } from './routeHandler';
import { logger } from '../core/logger';
import { checkPtyEnvironment } from './constants';

/**
 * PTY服务管理器
 * 整合PTY会话管理、WebSocket服务和HTTP路由
 */
export class PtyService {
  private sessionManager: PtySessionManager;
  private webSocketService?: PtyWebSocketService;
  private routeHandler: PtyRouteHandler;
  private router: Router;

  constructor(maxSessions: number = 100) {
    // 创建会话管理器
    this.sessionManager = new PtySessionManager(maxSessions);
    
    // 创建路由处理器
    this.routeHandler = new PtyRouteHandler(this.sessionManager);
    
    // 创建路由
    this.router = new Router({ prefix: '/pty' });
    this.setupRoutes();
    
    logger.info('PTY服务管理器已初始化');
  }

  /**
   * 启动PTY服务（包括WebSocket）
   */
  async start(httpServer: HttpServer): Promise<void> {
    try {
      // 检查PTY环境
      const envCheck = await checkPtyEnvironment();
      if (!envCheck.exists) {
        logger.warn(`PTY环境检查失败: ${envCheck.error}`);
        logger.warn('PTY服务将在受限模式下运行');
      } else {
        logger.info('PTY环境检查通过');
      }

      // 创建WebSocket服务
      this.webSocketService = new PtyWebSocketService(httpServer, this.sessionManager);
      
      logger.info('PTY服务启动成功');
      
    } catch (error) {
      logger.error('PTY服务启动失败', error);
      throw error;
    }
  }

  /**
   * 停止PTY服务
   */
  async stop(): Promise<void> {
    try {
      logger.info('停止PTY服务');
      
      // 关闭WebSocket服务
      if (this.webSocketService) {
        await this.webSocketService.close();
      }
      
      // 清理所有会话
      await this.sessionManager.cleanup();
      
      logger.info('PTY服务已停止');
      
    } catch (error) {
      logger.error('停止PTY服务时发生错误', error);
      throw error;
    }
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 环境检查中间件
    this.router.use(ptyEnvironmentMiddleware);
    
    // 错误处理中间件
    this.router.use(ptyErrorMiddleware);

    // 环境和状态检查
    this.router.get('/environment', this.routeHandler.checkEnvironment.bind(this.routeHandler));
    this.router.get('/status', this.routeHandler.getManagerStatus.bind(this.routeHandler));

    // 会话管理
    this.router.post('/sessions', this.routeHandler.createSession.bind(this.routeHandler));
    this.router.get('/sessions', this.routeHandler.getAllSessions.bind(this.routeHandler));
    this.router.get('/sessions/:sessionId', this.routeHandler.getSessionInfo.bind(this.routeHandler));
    this.router.delete('/sessions/:sessionId', this.routeHandler.destroySession.bind(this.routeHandler));

    // 会话控制
    this.router.post('/sessions/:sessionId/start', this.routeHandler.startSession.bind(this.routeHandler));
    this.router.post('/sessions/:sessionId/stop', this.routeHandler.stopSession.bind(this.routeHandler));
    this.router.post('/sessions/:sessionId/input', this.routeHandler.sendInput.bind(this.routeHandler));
    this.router.post('/sessions/:sessionId/resize', this.routeHandler.resizeSession.bind(this.routeHandler));
  }

  /**
   * 获取路由中间件
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * 获取会话管理器
   */
  getSessionManager(): PtySessionManager {
    return this.sessionManager;
  }

  /**
   * 获取WebSocket服务
   */
  getWebSocketService(): PtyWebSocketService | undefined {
    return this.webSocketService;
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    sessionManager: {
      totalSessions: number;
      runningSessions: number;
      maxSessions: number;
    };
    webSocket: {
      enabled: boolean;
      totalConnections?: number;
      sessionRooms?: Map<string, number>;
    };
  } {
    const sessionManagerStatus = this.sessionManager.getManagerStatus();
    
    let webSocketStatus: any = { enabled: false };
    if (this.webSocketService) {
      const connectionStats = this.webSocketService.getConnectionStats();
      webSocketStatus = {
        enabled: true,
        totalConnections: connectionStats.totalConnections,
        sessionRooms: connectionStats.sessionRooms
      };
    }

    return {
      sessionManager: {
        totalSessions: sessionManagerStatus.totalSessions,
        runningSessions: sessionManagerStatus.runningSessions,
        maxSessions: sessionManagerStatus.maxSessions
      },
      webSocket: webSocketStatus
    };
  }
}

// 导出所有相关模块
export { PtySessionManager } from './sessionManager';
export { PtyWebSocketService } from './webSocketService';
export { PtyRouteHandler } from './routeHandler';
export { GoPtyProcessAdapter } from './goPtyAdapter';
export * from './constants';
export * from './commandParser';
export * from './systemUser';
export * from '../types/pty';

// 默认导出PTY服务
export default PtyService;
