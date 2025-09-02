/**
 * PTY服务集成示例
 * 展示如何将PTY功能集成到现有的HMML服务器中
 */

import Koa from 'koa';
// import bodyParser from 'koa-bodyparser'; // 需要安装: npm install koa-bodyparser
import { createServer } from 'http';
import PtyService from '../pty';
import { logger } from '../core/logger';

// 假设这是现有的HMML服务器设置
export async function setupPtyIntegration(app: Koa, port: number = 7999) {
  try {
    // 1. 添加body解析中间件（如果还没有的话）
    // 注意: 需要先安装 koa-bodyparser: npm install koa-bodyparser
    // app.use(bodyParser({
    //   jsonLimit: '10mb',
    //   formLimit: '10mb',
    //   textLimit: '10mb'
    // }));

    // 2. 创建HTTP服务器
    const httpServer = createServer(app.callback());

    // 3. 创建PTY服务实例
    const ptyService = new PtyService(100); // 最多支持100个PTY会话

    // 4. 将PTY路由添加到Koa应用
    app.use(ptyService.getRouter().routes());
    app.use(ptyService.getRouter().allowedMethods());

    // 5. 启动HTTP服务器
    httpServer.listen(port, () => {
      logger.info(`HTTP服务器运行在端口 ${port}`);
    });

    // 6. 启动PTY服务（包括WebSocket）
    await ptyService.start(httpServer);

    logger.info('PTY服务集成完成');
    logger.info('可用的API端点:');
    logger.info('  WebSocket: ws://localhost:' + port + '/socket.io');
    logger.info('  HTTP API: http://localhost:' + port + '/pty/*');

    // 优雅关闭处理
    const gracefulShutdown = async () => {
      logger.info('开始优雅关闭服务器...');
      
      try {
        // 停止PTY服务
        await ptyService.stop();
        
        // 关闭HTTP服务器
        httpServer.close(() => {
          logger.info('HTTP服务器已关闭');
          process.exit(0);
        });
        
        // 强制退出超时
        setTimeout(() => {
          logger.error('强制退出超时');
          process.exit(1);
        }, 10000);
        
      } catch (error) {
        logger.error('优雅关闭过程中发生错误', error);
        process.exit(1);
      }
    };

    // 监听进程信号
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常', error);
      gracefulShutdown();
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('未处理的Promise拒绝', reason);
      gracefulShutdown();
    });

    return { httpServer, ptyService };

  } catch (error) {
    logger.error('PTY服务集成失败', error);
    throw error;
  }
}

// 如果直接运行此文件，启动示例服务器
if (require.main === module) {
  const app = new Koa();
  
  // 添加基本的错误处理中间件
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error: any) {
      logger.error('请求处理错误', error);
      ctx.status = error.status || 500;
      ctx.body = {
        success: false,
        error: error.message || '服务器内部错误'
      };
    }
  });

  // 添加简单的健康检查端点
  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      ctx.body = {
        success: true,
        message: 'HMML服务器运行正常',
        timestamp: new Date().toISOString()
      };
      return;
    }
    await next();
  });

  setupPtyIntegration(app, 7999).catch((error) => {
    logger.error('启动失败', error);
    process.exit(1);
  });
}
