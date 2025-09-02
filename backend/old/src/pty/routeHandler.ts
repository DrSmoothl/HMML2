import { Context, Next } from 'koa';
import { PtySessionManager } from './sessionManager';
import { logger } from '../core/logger';
import { 
  IPtyInstanceConfig, 
  PtySessionStatus 
} from '../types/pty';
import { PTY_CONSTANTS, checkPtyEnvironment } from './constants';

/**
 * PTY路由处理器
 * 提供HTTP接口管理PTY会话
 */
export class PtyRouteHandler {
  private sessionManager: PtySessionManager;

  constructor(sessionManager: PtySessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * 创建PTY会话
   * POST /pty/sessions
   */
  async createSession(ctx: Context): Promise<void> {
    try {
      const config = (ctx.request as any).body as IPtyInstanceConfig;
      
      // 验证配置
      this.validateSessionConfig(config);
      
      const sessionId = await this.sessionManager.createSession(config);
      
      ctx.body = {
        success: true,
        data: {
          sessionId,
          message: '会话创建成功'
        }
      };
      
      logger.info(`HTTP API: 创建PTY会话成功 - ${sessionId}`);
      
    } catch (error) {
      logger.error('HTTP API: 创建PTY会话失败', error);
      
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '创建会话失败'
      };
    }
  }

  /**
   * 启动PTY会话
   * POST /pty/sessions/:sessionId/start
   */
  async startSession(ctx: Context): Promise<void> {
    try {
      const { sessionId } = ctx.params;
      
      if (!sessionId) {
        throw new Error('会话ID不能为空');
      }

      await this.sessionManager.startSession(sessionId);
      
      ctx.body = {
        success: true,
        data: {
          sessionId,
          message: '会话启动成功'
        }
      };
      
      logger.info(`HTTP API: 启动PTY会话成功 - ${sessionId}`);
      
    } catch (error) {
      logger.error(`HTTP API: 启动PTY会话失败 - ${ctx.params.sessionId}`, error);
      
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '启动会话失败'
      };
    }
  }

  /**
   * 停止PTY会话
   * POST /pty/sessions/:sessionId/stop
   */
  async stopSession(ctx: Context): Promise<void> {
    try {
      const { sessionId } = ctx.params;
      const { force = false } = (ctx.request as any).body as { force?: boolean };
      
      if (!sessionId) {
        throw new Error('会话ID不能为空');
      }

      await this.sessionManager.stopSession(sessionId, force);
      
      ctx.body = {
        success: true,
        data: {
          sessionId,
          message: '会话停止成功'
        }
      };
      
      logger.info(`HTTP API: 停止PTY会话成功 - ${sessionId}, 强制: ${force}`);
      
    } catch (error) {
      logger.error(`HTTP API: 停止PTY会话失败 - ${ctx.params.sessionId}`, error);
      
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '停止会话失败'
      };
    }
  }

  /**
   * 销毁PTY会话
   * DELETE /pty/sessions/:sessionId
   */
  async destroySession(ctx: Context): Promise<void> {
    try {
      const { sessionId } = ctx.params;
      
      if (!sessionId) {
        throw new Error('会话ID不能为空');
      }

      await this.sessionManager.destroySession(sessionId);
      
      ctx.body = {
        success: true,
        data: {
          sessionId,
          message: '会话销毁成功'
        }
      };
      
      logger.info(`HTTP API: 销毁PTY会话成功 - ${sessionId}`);
      
    } catch (error) {
      logger.error(`HTTP API: 销毁PTY会话失败 - ${ctx.params.sessionId}`, error);
      
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '销毁会话失败'
      };
    }
  }

  /**
   * 获取PTY会话信息
   * GET /pty/sessions/:sessionId
   */
  async getSessionInfo(ctx: Context): Promise<void> {
    try {
      const { sessionId } = ctx.params;
      
      if (!sessionId) {
        throw new Error('会话ID不能为空');
      }

      const session = this.sessionManager.getSession(sessionId);
      
      if (!session) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: '会话不存在'
        };
        return;
      }

      ctx.body = {
        success: true,
        data: {
          id: sessionId,
          status: session.status,
          config: {
            command: session.config.command,
            terminal: session.config.terminal
          },
          startTime: session.startTime,
          endTime: session.endTime,
          startCount: session.startCount,
          watcherCount: session.watchers.size,
          processInfo: session.process ? {
            pid: session.process.pid,
            isAlive: session.process.isAlive()
          } : null
        }
      };
      
    } catch (error) {
      logger.error(`HTTP API: 获取PTY会话信息失败 - ${ctx.params.sessionId}`, error);
      
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '获取会话信息失败'
      };
    }
  }

  /**
   * 获取所有PTY会话列表
   * GET /pty/sessions
   */
  async getAllSessions(ctx: Context): Promise<void> {
    try {
      const sessions = this.sessionManager.getAllSessions();
      const sessionList = Array.from(sessions.entries()).map(([id, session]) => ({
        id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        startCount: session.startCount,
        watcherCount: session.watchers.size,
        command: session.config.command.startCommand,
        workdir: session.config.command.cwd
      }));

      ctx.body = {
        success: true,
        data: {
          sessions: sessionList,
          total: sessionList.length
        }
      };
      
    } catch (error) {
      logger.error('HTTP API: 获取PTY会话列表失败', error);
      
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '获取会话列表失败'
      };
    }
  }

  /**
   * 向PTY会话发送输入
   * POST /pty/sessions/:sessionId/input
   */
  async sendInput(ctx: Context): Promise<void> {
    try {
      const { sessionId } = ctx.params;
      const { input } = (ctx.request as any).body as { input: string };
      
      if (!sessionId) {
        throw new Error('会话ID不能为空');
      }
      
      if (typeof input !== 'string') {
        throw new Error('输入内容必须是字符串');
      }

      const success = this.sessionManager.sendInput(sessionId, input);
      
      if (!success) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: '会话不存在或不可用'
        };
        return;
      }

      ctx.body = {
        success: true,
        data: {
          sessionId,
          message: '输入发送成功'
        }
      };
      
    } catch (error) {
      logger.error(`HTTP API: 发送输入失败 - ${ctx.params.sessionId}`, error);
      
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '发送输入失败'
      };
    }
  }

  /**
   * 调整PTY会话终端大小
   * POST /pty/sessions/:sessionId/resize
   */
  async resizeSession(ctx: Context): Promise<void> {
    try {
      const { sessionId } = ctx.params;
      const { width, height } = (ctx.request as any).body as { width: number; height: number };
      
      if (!sessionId) {
        throw new Error('会话ID不能为空');
      }
      
      if (typeof width !== 'number' || typeof height !== 'number' || 
          width <= 0 || height <= 0 || 
          width > PTY_CONSTANTS.MAX_TERMINAL_WIDTH || 
          height > PTY_CONSTANTS.MAX_TERMINAL_HEIGHT) {
        throw new Error(`无效的终端尺寸: ${width}x${height}`);
      }

      const success = this.sessionManager.resizeSession(sessionId, width, height);
      
      if (!success) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: '会话不存在或不可用'
        };
        return;
      }

      ctx.body = {
        success: true,
        data: {
          sessionId,
          width,
          height,
          message: '终端大小调整成功'
        }
      };
      
    } catch (error) {
      logger.error(`HTTP API: 调整终端大小失败 - ${ctx.params.sessionId}`, error);
      
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '调整终端大小失败'
      };
    }
  }

  /**
   * 获取PTY管理器状态
   * GET /pty/status
   */
  async getManagerStatus(ctx: Context): Promise<void> {
    try {
      const status = this.sessionManager.getManagerStatus();
      
      ctx.body = {
        success: true,
        data: status
      };
      
    } catch (error) {
      logger.error('HTTP API: 获取管理器状态失败', error);
      
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '获取管理器状态失败'
      };
    }
  }

  /**
   * 检查PTY环境
   * GET /pty/environment
   */
  async checkEnvironment(ctx: Context): Promise<void> {
    try {
      const envCheck = await checkPtyEnvironment();
      
      ctx.body = {
        success: true,
        data: {
          environment: {
            ptyPath: envCheck.path,
            exists: envCheck.exists,
            error: envCheck.error
          },
          constants: PTY_CONSTANTS
        }
      };
      
    } catch (error) {
      logger.error('HTTP API: 检查PTY环境失败', error);
      
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '检查环境失败'
      };
    }
  }

  /**
   * 验证会话配置
   */
  private validateSessionConfig(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new Error('会话配置无效');
    }

    if (!config.command?.startCommand || typeof config.command.startCommand !== 'string') {
      throw new Error('启动命令不能为空');
    }

    if (!config.command?.cwd || typeof config.command.cwd !== 'string') {
      throw new Error('工作目录不能为空');
    }

    if (config.terminal && (
        typeof config.terminal.ptyWindowCol !== 'number' || 
        typeof config.terminal.ptyWindowRow !== 'number' ||
        config.terminal.ptyWindowCol <= 0 ||
        config.terminal.ptyWindowRow <= 0
    )) {
      throw new Error('终端尺寸配置无效');
    }
  }
}

/**
 * PTY中间件：环境检查
 */
export async function ptyEnvironmentMiddleware(ctx: Context, next: Next): Promise<void> {
  // 对PTY相关路由进行环境检查
  if (ctx.path.startsWith('/pty/')) {
    try {
      const envCheck = await checkPtyEnvironment();
      if (!envCheck.exists) {
        ctx.status = 503;
        ctx.body = {
          success: false,
          error: `PTY环境不可用: ${envCheck.error}`
        };
        return;
      }
    } catch (error) {
      logger.error('PTY环境检查中间件错误', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: 'PTY环境检查失败'
      };
      return;
    }
  }
  
  await next();
}

/**
 * PTY错误处理中间件
 */
export async function ptyErrorMiddleware(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (error) {
    logger.error('PTY路由处理错误', error);
    
    ctx.status = ctx.status || 500;
    ctx.body = {
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    };
  }
}
