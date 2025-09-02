import { logger, LogLevel } from './core/logger';
import { configManager } from './core/config';
import { HttpServer } from './core/httpServer';
import { initializeVersionSystem, generateVersionBanner, ConfigUpdater } from './core/version';
import { pathCacheManager } from './core/pathCacheManager';
import { databaseManager } from './core/database';
import { HMML_VERSION, getCurrentEnvironment } from './version';

/**
 * HMML (Hello MaiMai Launcher) 后端服务
 * 基于MCSM框架设计的轻量级HTTP服务器
 */
class Application {
  private httpServer: HttpServer | null = null;
  private isShuttingDown = false;

  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    try {
      logger.info('正在初始化 HMML 后端服务...');
      
      // 显示版本信息
      const environment = getCurrentEnvironment();
      logger.info(`🔖 HMML 版本: ${HMML_VERSION} (${environment})`);

      // 初始化版本系统
      await initializeVersionSystem();

      // 自动修复配置文件版本
      try {
        await ConfigUpdater.autoFixConfigVersions('./config');
      } catch (error) {
        logger.warn('配置版本自动修复失败:', error);
      }

      // 加载配置
      const config = await configManager.load();
      logger.info('配置加载完成');

      // 初始化路径缓存管理器
      try {
        await pathCacheManager.initialize();
        logger.info('路径缓存管理器初始化完成');
      } catch (error) {
        logger.warn('路径缓存管理器初始化失败:', error);
      }

      // 初始化数据库管理器
      try {
        await databaseManager.initialize();
        logger.info('数据库管理器初始化完成');
      } catch (error) {
        logger.warn('数据库管理器初始化失败:', error);
      }

      // 根据配置调整日志级别
      if (config.logger.level) {
        const logLevel = LogLevel[config.logger.level.toUpperCase() as keyof typeof LogLevel];
        if (logLevel !== undefined) {
          logger.info(`设置日志级别为: ${config.logger.level.toUpperCase()}`);
        }
      }

      // 初始化HTTP服务器
      this.httpServer = new HttpServer(config);
      await this.httpServer.init();

      logger.info('应用初始化完成');
    } catch (error) {
      logger.fatal('应用初始化失败:', error);
      process.exit(1);
    }
  }

  /**
   * 启动应用
   */
  async start(): Promise<void> {
    try {
      if (!this.httpServer) {
        throw new Error('HTTP服务器未初始化');
      }

      // 启动HTTP服务器
      await this.httpServer.start();

      logger.info('HMML 后端服务启动成功');
    } catch (error) {
      logger.fatal('应用启动失败:', error);
      process.exit(1);
    }
  }

  /**
   * 优雅关闭应用
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('应用正在关闭中...');
      return;
    }

    this.isShuttingDown = true;
    logger.info('开始优雅关闭应用...');

    try {
      // 停止HTTP服务器
      if (this.httpServer) {
        await this.httpServer.stop();
      }

      // 关闭数据库连接
      try {
        await databaseManager.closeAllConnections();
        logger.info('数据库连接已关闭');
      } catch (error) {
        logger.warn('关闭数据库连接时出错:', error);
      }

      // 关闭日志系统
      await logger.close();

      logger.info('应用已优雅关闭');
      process.exit(0);
    } catch (error) {
      logger.error('应用关闭过程中发生错误:', error);
      process.exit(1);
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const app = new Application();

  try {
    // 初始化应用
    await app.initialize();

    // 启动应用
    await app.start();

    // 注册优雅关闭处理器
    registerShutdownHandlers(app);

    // 注册标准输入处理器
    registerStdinHandler(app);

  } catch (error) {
    logger.fatal('应用启动失败:', error);
    process.exit(1);
  }
}

/**
 * 注册优雅关闭处理器
 */
function registerShutdownHandlers(app: Application): void {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
  
  signals.forEach((signal) => {
    process.on(signal, () => {
      logger.warn(`收到 ${signal} 信号，开始优雅关闭...`);
      app.shutdown().catch((error) => {
        logger.error('优雅关闭失败:', error);
        process.exit(1);
      });
    });
  });

  // 处理未捕获的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝:', { reason, promise });
    // 不立即退出，但记录错误
  });

  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.fatal('未捕获的异常:', error);
    app.shutdown().catch(() => {
      process.exit(1);
    });
  });
}

/**
 * 注册标准输入处理器
 */
function registerStdinHandler(app: Application): void {
  // 启用标准输入
  process.stdin.setEncoding('utf8');
  process.stdin.resume();

  process.stdin.on('data', (data) => {
    const input = data.toString().trim().toLowerCase();
    
    switch (input) {
      case 'exit':
      case 'quit':
      case 'q':
        logger.info('用户请求退出服务');
        app.shutdown();
        break;
      case 'help':
      case 'h':
        console.log('');
        console.log('可用命令:');
        console.log('  exit, quit, q  - 退出服务');
        console.log('  help, h        - 显示帮助信息');
        console.log('  status, s      - 显示服务状态');
        console.log('  config, c      - 显示配置信息');
        console.log('');
        break;
      case 'status':
      case 's':
        showStatus();
        break;
      case 'config':
      case 'c':
        showConfig();
        break;
      default:
        if (input) {
          logger.warn(`未知命令: ${input}，输入 'help' 查看可用命令`);
        }
    }
  });
}

/**
 * 显示服务状态
 */
function showStatus(): void {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  console.log('');
  console.log('📊 服务状态:');
  console.log(`  运行时间: ${Math.floor(uptime / 3600)}小时 ${Math.floor((uptime % 3600) / 60)}分钟`);
  console.log(`  内存使用: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
  console.log(`  Node版本: ${process.version}`);
  console.log(`  进程PID: ${process.pid}`);
  console.log('');
}

/**
 * 显示配置信息
 */
function showConfig(): void {
  const config = configManager.get();
  const versionBanner = generateVersionBanner();
  
  console.log('');
  console.log('⚙️  配置信息:');
  console.log(`  服务端口: ${config.server.port}`);
  console.log(`  服务主机: ${config.server.host}`);
  console.log(`  URL前缀: ${config.server.prefix || '无'}`);
  console.log(`  反向代理模式: ${config.server.reverseProxyMode ? '启用' : '禁用'}`);
  console.log(`  日志级别: ${config.logger.level}`);
  console.log(`  CORS启用: ${config.security.corsEnabled ? '是' : '否'}`);
  console.log('');
  console.log('📋 版本信息:');
  versionBanner.forEach((line: string) => console.log(`  ${line}`));
  console.log('');
}

// 启动应用
if (require.main === module) {
  main().catch((error) => {
    console.error('应用启动失败:', error);
    process.exit(1);
  });
}
