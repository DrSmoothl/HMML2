import Koa from 'koa';
import koaBody from 'koa-body';
import session from 'koa-session';
import koaStatic from 'koa-static';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import http from 'http';

import { logger } from './logger';
import { configManager, ServerConfig } from './config';
import { protocolMiddleware } from '../middleware/protocol';
import { errorHandlerMiddleware, notFoundMiddleware } from '../middleware/errorHandler';
import { initRoutes, RouteManager } from '../routes';
import { removeTrail } from '../utils/helpers';
import PtyService from '../pty';
import { getCurrentEnvironment, getVersion } from '../version';

export class HttpServer {
  private app: Koa;
  private server: http.Server | null = null;
  private config: ServerConfig;
  private routeManager?: RouteManager;
  private ptyService?: PtyService;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = new Koa({
      proxy: config.server.reverseProxyMode || false,
      proxyIpHeader: 'X-Real-IP'
    });
  }

  /**
   * 初始化HTTP服务器
   */
  async init(): Promise<void> {
    try {
      this.setupErrorHandling();
      this.setupMiddlewares();
      this.setupRoutes();
      logger.info('HTTP服务器初始化完成');
    } catch (error) {
      logger.error('HTTP服务器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 监听Koa应用级错误事件
    this.app.on('error', (error, ctx) => {
      // 这里可以进行额外的错误处理，比如发送到监控系统
      // 当受到短连接洪水攻击时，容易出现错误消息刷屏
      // 所以这里不再重复记录错误（已在errorHandlerMiddleware中处理）
    });

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.fatal('未捕获的异常:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', { reason, promise });
    });
  }

  /**
   * 设置中间件
   */
  private setupMiddlewares(): void {
    // 全局错误处理中间件（必须最先注册）
    this.app.use(errorHandlerMiddleware);

    // 请求体解析中间件
    this.app.use(
      koaBody({
        multipart: true,
        formidable: {
          maxFileSize: this.parseSize(this.config.security.maxRequestSize),
          maxFiles: 10,
          multiples: true
        },
        jsonLimit: this.config.security.maxRequestSize,
        textLimit: this.config.security.maxRequestSize,
        onError: (error, ctx) => {
          logger.error('koaBody解析错误:', error);
        }
      })
    );

    // 会话中间件
    this.app.keys = [this.config.security.sessionSecret || uuidv4()];
    this.app.use(
      session(
        {
          key: 'hmml.sess',
          maxAge: 24 * 60 * 60 * 1000, // 24小时
          overwrite: true,
          httpOnly: true,
          signed: true,
          rolling: false,
          renew: false,
          secure: false,
          sameSite: 'lax'
        },
        this.app
      )
    );

    // URL前缀处理中间件
    if (this.config.server.prefix) {
      this.setupPrefixMiddleware();
    }

    // 协议处理中间件
    this.app.use(protocolMiddleware);

    // 静态文件服务中间件
    this.app.use(
      koaStatic(path.join(process.cwd(), 'public'), {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天缓存
        gzip: true,
        brotli: true
      })
    );

    logger.debug('中间件设置完成');
  }

  /**
   * 设置URL前缀中间件
   */
  private setupPrefixMiddleware(): void {
    const prefix = this.config.server.prefix;
    
    this.app.use(async (ctx, next) => {
      if (ctx.url.startsWith(prefix)) {
        const originalUrl = ctx.url;
        ctx.url = ctx.url.slice(prefix.length);
        
        if (!ctx.url.startsWith('/')) {
          ctx.url = '/' + ctx.url;
        }
        
        await next();
        ctx.url = originalUrl;
      } else {
        ctx.redirect(removeTrail(prefix, '/') + ctx.url);
      }
    });

    logger.debug(`URL前缀中间件设置完成: ${prefix}`);
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    this.routeManager = initRoutes(this.app);
    
    // 集成PTY服务路由
    this.setupPtyService();
    
    // 404处理中间件（必须在所有路由之后注册）
    this.app.use(notFoundMiddleware);
    
    logger.debug('路由设置完成');
  }

  /**
   * 设置PTY服务
   */
  private setupPtyService(): void {
    try {
      // 创建PTY服务实例
      this.ptyService = new PtyService(100); // 默认最多100个会话
      
      // 注册PTY路由
      if (this.routeManager) {
        this.routeManager.addRouter(this.ptyService.getRouter(), 'PTY虚拟终端路由');
      }
      
      logger.info('PTY服务路由已注册');
    } catch (error) {
      logger.error('PTY服务初始化失败:', error);
      logger.warn('PTY功能将不可用');
    }
  }

  /**
   * 启动HTTP服务器
   */
  async start(): Promise<void> {
    try {
      this.server = http.createServer(this.app.callback());

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.fatal(`端口 ${this.config.server.port} 已被占用`);
        } else {
          logger.fatal('HTTP服务器启动失败:', error);
        }
      });

      // 启动PTY WebSocket服务
      if (this.ptyService && this.server) {
        try {
          await this.ptyService.start(this.server);
          logger.info('PTY WebSocket服务已启动');
        } catch (error) {
          logger.error('PTY WebSocket服务启动失败:', error);
          logger.warn('PTY WebSocket功能将不可用');
        }
      }

      this.server.listen(this.config.server.port, this.config.server.host);
      
      this.printStartupInfo();
      logger.info(`HTTP服务器已启动，监听 ${this.config.server.host}:${this.config.server.port}`);
    } catch (error) {
      logger.fatal('HTTP服务器启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止HTTP服务器
   */
  async stop(): Promise<void> {
    // 停止PTY服务
    if (this.ptyService) {
      try {
        await this.ptyService.stop();
        logger.info('PTY服务已停止');
      } catch (error) {
        logger.error('停止PTY服务时出错:', error);
      }
    }

    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          logger.info('HTTP服务器已停止');
          resolve();
        });
      });
    }
  }

  /**
   * 获取Koa应用实例
   */
  getApp(): Koa {
    return this.app;
  }

  /**
   * 打印启动信息
   */
  private printStartupInfo(): void {
    const config = this.config;
    const host = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
    const baseUrl = `http://${host}:${config.server.port}`;
    const prefixedUrl = config.server.prefix ? `${baseUrl}${config.server.prefix}` : baseUrl;

    console.log('');
    console.log('██╗  ██╗███╗   ███╗███╗   ███╗██╗     ');
    console.log('██║  ██║████╗ ████║████╗ ████║██║     ');
    console.log('███████║██╔████╔██║██╔████╔██║██║     ');
    console.log('██╔══██║██║╚██╔╝██║██║╚██╔╝██║██║     ');
    console.log('██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗');
    console.log('╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝');
    console.log('');
    console.log(`📦 服务名称: ${config.app.name}`);
    console.log(`📝 服务描述: ${config.app.description}`);
    console.log(`🔖 版本: ${getVersion()}`);
    console.log(`🌍 环境: ${getCurrentEnvironment()}`);
    console.log(`🚀 服务地址: ${prefixedUrl}`);
    console.log(`📊 健康检查: ${prefixedUrl}/api/health`);
    console.log(`ℹ️  服务信息: ${prefixedUrl}/api/info`);
    console.log('');
    console.log('🎉 服务已成功启动！');
    console.log('');
    console.log('💡 提示: 输入 "exit" 退出服务');
    console.log('==========================================');
  }

  /**
   * 解析文件大小字符串
   */
  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+)([kmg]?b?)$/i);
    if (!match) return 1024 * 1024; // 默认1MB

    const size = parseInt(match[1]);
    const unit = (match[2] || '').toLowerCase();

    switch (unit) {
      case 'gb':
      case 'g':
        return size * 1024 * 1024 * 1024;
      case 'mb':
      case 'm':
        return size * 1024 * 1024;
      case 'kb':
      case 'k':
        return size * 1024;
      default:
        return size;
    }
  }
}
