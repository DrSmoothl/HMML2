import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PtySessionManager } from './sessionManager';
import { logger } from '../core/logger';
import {
  IPtyInstanceConfig,
  IWatcherInfo,
  PtySessionStatus,
  PtyWebSocketEvents
} from '../types/pty';
import { PTY_CONSTANTS } from './constants';

// 回调函数类型定义
type CallbackResponse = {
  success: boolean;
  [key: string]: any;
};

type CallbackFunction = (response: CallbackResponse) => void;

/**
 * PTY WebSocket服务
 * 处理WebSocket连接和PTY会话之间的通信
 */
export class PtyWebSocketService {
  private io: SocketServer;
  private sessionManager: PtySessionManager;

  constructor(httpServer: HttpServer, sessionManager: PtySessionManager) {
    this.sessionManager = sessionManager;
    
    // 创建Socket.io服务器
    this.io = new SocketServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupSocketHandlers();
    this.setupSessionManagerEvents();
    
    logger.info('PTY WebSocket服务已初始化');
  }

  /**
   * 设置Socket事件处理器
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.debug(`WebSocket连接建立: ${socket.id}`);

      // PTY会话创建
      socket.on(PtyWebSocketEvents.CREATE_SESSION, async (data: any, callback?: CallbackFunction) => {
        try {
          logger.debug(`收到创建会话请求: ${socket.id}`, data);
          
          const config = this.validateSessionConfig(data);
          const sessionId = await this.sessionManager.createSession(config);
          
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              sessionId,
              message: '会话创建成功'
            });
          }
          
        } catch (error) {
          logger.error(`创建会话失败: ${socket.id}`, error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : '创建会话失败'
            });
          }
        }
      });

      // PTY会话启动
      socket.on(PtyWebSocketEvents.START_SESSION, async (data: any, callback?: CallbackFunction) => {
        try {
          logger.debug(`收到启动会话请求: ${socket.id}`, data);
          
          const { sessionId } = data;
          if (!sessionId || typeof sessionId !== 'string') {
            throw new Error('会话ID无效');
          }

          await this.sessionManager.startSession(sessionId);
          
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              message: '会话启动成功'
            });
          }
          
        } catch (error) {
          logger.error(`启动会话失败: ${socket.id}`, error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : '启动会话失败'
            });
          }
        }
      });

      // PTY会话停止
      socket.on(PtyWebSocketEvents.STOP_SESSION, async (data: any, callback?: CallbackFunction) => {
        try {
          logger.debug(`收到停止会话请求: ${socket.id}`, data);
          
          const { sessionId, force = false } = data;
          if (!sessionId || typeof sessionId !== 'string') {
            throw new Error('会话ID无效');
          }

          await this.sessionManager.stopSession(sessionId, force);
          
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              message: '会话停止成功'
            });
          }
          
        } catch (error) {
          logger.error(`停止会话失败: ${socket.id}`, error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : '停止会话失败'
            });
          }
        }
      });

      // 发送输入到PTY会话
      socket.on(PtyWebSocketEvents.INPUT, (data: any) => {
        try {
          const { sessionId, input } = data;
          if (!sessionId || typeof sessionId !== 'string' || typeof input !== 'string') {
            logger.warn(`无效的输入数据: ${socket.id}`, data);
            return;
          }

          const success = this.sessionManager.sendInput(sessionId, input);
          if (!success) {
            logger.warn(`发送输入失败: 会话不存在或不可用 ${sessionId}`);
            socket.emit(PtyWebSocketEvents.ERROR, {
              sessionId,
              error: '会话不存在或不可用'
            });
          }
          
        } catch (error) {
          logger.error(`处理输入失败: ${socket.id}`, error);
          socket.emit(PtyWebSocketEvents.ERROR, {
            sessionId: data?.sessionId,
            error: error instanceof Error ? error.message : '处理输入失败'
          });
        }
      });

      // 调整终端大小
      socket.on(PtyWebSocketEvents.RESIZE, (data: any) => {
        try {
          const { sessionId, width, height } = data;
          if (!sessionId || typeof sessionId !== 'string') {
            logger.warn(`无效的调整大小数据: ${socket.id}`, data);
            return;
          }

          if (typeof width !== 'number' || typeof height !== 'number' || 
              width <= 0 || height <= 0 || 
              width > PTY_CONSTANTS.MAX_TERMINAL_WIDTH || 
              height > PTY_CONSTANTS.MAX_TERMINAL_HEIGHT) {
            logger.warn(`无效的终端尺寸: ${socket.id}`, { width, height });
            return;
          }

          const success = this.sessionManager.resizeSession(sessionId, width, height);
          if (!success) {
            logger.warn(`调整终端大小失败: 会话不存在或不可用 ${sessionId}`);
          }
          
        } catch (error) {
          logger.error(`处理终端大小调整失败: ${socket.id}`, error);
        }
      });

      // 加入会话观察（开始接收输出）
      socket.on(PtyWebSocketEvents.JOIN_SESSION, (data: any, callback?: CallbackFunction) => {
        try {
          const { sessionId, terminalSize = { width: 80, height: 24 } } = data;
          
          if (!sessionId || typeof sessionId !== 'string') {
            throw new Error('会话ID无效');
          }

          const watcherInfo: IWatcherInfo = {
            socketId: socket.id,
            terminalSize: {
              width: Math.max(1, Math.min(terminalSize.width || 80, PTY_CONSTANTS.MAX_TERMINAL_WIDTH)),
              height: Math.max(1, Math.min(terminalSize.height || 24, PTY_CONSTANTS.MAX_TERMINAL_HEIGHT))
            },
            joinTime: Date.now()
          };

          const success = this.sessionManager.addWatcher(sessionId, watcherInfo);
          if (!success) {
            throw new Error('会话不存在');
          }

          // 将socket加入会话房间
          socket.join(sessionId);
          
          logger.debug(`观察者加入会话: ${sessionId}, Socket: ${socket.id}`);
          
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              message: '加入会话成功'
            });
          }
          
        } catch (error) {
          logger.error(`加入会话失败: ${socket.id}`, error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : '加入会话失败'
            });
          }
        }
      });

      // 离开会话观察
      socket.on(PtyWebSocketEvents.LEAVE_SESSION, (data: any, callback?: CallbackFunction) => {
        try {
          const { sessionId } = data;
          if (!sessionId || typeof sessionId !== 'string') {
            throw new Error('会话ID无效');
          }

          this.handleLeaveSession(socket, sessionId);
          
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              message: '离开会话成功'
            });
          }
          
        } catch (error) {
          logger.error(`离开会话失败: ${socket.id}`, error);
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : '离开会话失败'
            });
          }
        }
      });

      // 获取会话状态
      socket.on(PtyWebSocketEvents.GET_SESSION_STATUS, (data: any, callback?: CallbackFunction) => {
        try {
          const { sessionId } = data;
          if (!sessionId || typeof sessionId !== 'string') {
            throw new Error('会话ID无效');
          }

          const session = this.sessionManager.getSession(sessionId);
          if (!session) {
            throw new Error('会话不存在');
          }

          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              session: {
                id: sessionId,
                status: session.status,
                startTime: session.startTime,
                endTime: session.endTime,
                startCount: session.startCount,
                watcherCount: session.watchers.size
              }
            });
          }
          
        } catch (error) {
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : '获取会话状态失败'
            });
          }
        }
      });

      // 获取管理器状态
      socket.on('get-manager-status', (callback?: CallbackFunction) => {
        try {
          const status = this.sessionManager.getManagerStatus();
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              status
            });
          }
        } catch (error) {
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error instanceof Error ? error.message : '获取管理器状态失败'
            });
          }
        }
      });

      // 处理连接断开
      socket.on('disconnect', (reason) => {
        logger.debug(`WebSocket连接断开: ${socket.id}, 原因: ${reason}`);
        this.handleSocketDisconnect(socket);
      });
    });
  }

  /**
   * 设置会话管理器事件监听
   */
  private setupSessionManagerEvents(): void {
    // 会话输出
    this.sessionManager.on('sessionOutput', (sessionId: string, data: Buffer) => {
      const outputData = data.toString();
      logger.debug(`会话输出: ${sessionId}, 数据长度: ${outputData.length}`);
      
      this.io.to(sessionId).emit(PtyWebSocketEvents.OUTPUT, {
        sessionId,
        data: outputData
      });
    });

    // 会话状态变化
    this.sessionManager.on('sessionStatusChanged', (sessionId: string, status: PtySessionStatus) => {
      this.io.to(sessionId).emit(PtyWebSocketEvents.STATUS_CHANGE, {
        sessionId,
        status
      });
    });

    // 会话错误
    this.sessionManager.on('sessionError', (sessionId: string, error: Error) => {
      this.io.to(sessionId).emit(PtyWebSocketEvents.ERROR, {
        sessionId,
        error: error.message
      });
    });

    // 会话停止
    this.sessionManager.on('sessionStopped', (sessionId: string, exitCode?: number, signal?: string) => {
      this.io.to(sessionId).emit(PtyWebSocketEvents.SESSION_STOPPED, {
        sessionId,
        exitCode,
        signal
      });
    });

    // 会话销毁
    this.sessionManager.on('sessionDestroyed', (sessionId: string) => {
      this.io.to(sessionId).emit(PtyWebSocketEvents.SESSION_DESTROYED, {
        sessionId
      });
      
      // 清空房间
      this.io.in(sessionId).socketsLeave(sessionId);
    });
  }

  /**
   * 处理离开会话
   */
  private handleLeaveSession(socket: Socket, sessionId: string): void {
    // 从会话管理器中移除观察者
    this.sessionManager.removeWatcher(sessionId, socket.id);
    
    // 离开Socket房间
    socket.leave(sessionId);
    
    logger.debug(`观察者离开会话: ${sessionId}, Socket: ${socket.id}`);
  }

  /**
   * 处理Socket断开连接
   */
  private handleSocketDisconnect(socket: Socket): void {
    // 获取socket参与的所有房间（会话）
    const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    
    // 从所有会话中移除此观察者
    rooms.forEach(sessionId => {
      this.sessionManager.removeWatcher(sessionId, socket.id);
    });
  }

  /**
   * 验证会话配置
   */
  private validateSessionConfig(config: any): IPtyInstanceConfig {
    if (!config || typeof config !== 'object') {
      throw new Error('会话配置无效');
    }

    // 验证必要字段
    if (!config.command?.startCommand || typeof config.command.startCommand !== 'string') {
      throw new Error('启动命令不能为空');
    }

    if (!config.command?.cwd || typeof config.command.cwd !== 'string') {
      throw new Error('工作目录不能为空');
    }

    // 设置默认值
    const validatedConfig: IPtyInstanceConfig = {
      uuid: config.uuid || undefined,
      command: {
        startCommand: config.command.startCommand.trim(),
        stopCommand: config.command.stopCommand || '^C',
        cwd: config.command.cwd.trim(),
        ie: config.command.ie || 'utf-8',
        oe: config.command.oe || 'utf-8',
        env: config.command.env || {},
        runAs: config.command.runAs || undefined
      },
      terminal: {
        haveColor: true,
        pty: true,
        ptyWindowCol: Math.max(1, Math.min(config.terminal?.ptyWindowCol || PTY_CONSTANTS.DEFAULT_TERMINAL_WIDTH, PTY_CONSTANTS.MAX_TERMINAL_WIDTH)),
        ptyWindowRow: Math.max(1, Math.min(config.terminal?.ptyWindowRow || PTY_CONSTANTS.DEFAULT_TERMINAL_HEIGHT, PTY_CONSTANTS.MAX_TERMINAL_HEIGHT))
      }
    };

    return validatedConfig;
  }

  /**
   * 获取IO实例
   */
  getIO(): SocketServer {
    return this.io;
  }

  /**
   * 广播消息到所有连接
   */
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * 发送消息到特定会话的所有观察者
   */
  sendToSession(sessionId: string, event: string, data: any): void {
    this.io.to(sessionId).emit(event, data);
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): {
    totalConnections: number;
    sessionRooms: Map<string, number>;
  } {
    const sessionRooms = new Map<string, number>();
    
    // 统计每个会话房间的连接数
    this.io.of('/').adapter.rooms.forEach((sockets, roomId) => {
      // 过滤掉socket自身的房间ID
      if (roomId.length > 20) { // 假设会话ID长度大于20
        sessionRooms.set(roomId, sockets.size);
      }
    });

    return {
      totalConnections: this.io.engine.clientsCount,
      sessionRooms
    };
  }

  /**
   * 关闭WebSocket服务
   */
  async close(): Promise<void> {
    logger.info('关闭PTY WebSocket服务');
    
    return new Promise((resolve) => {
      this.io.close(() => {
        logger.info('PTY WebSocket服务已关闭');
        resolve();
      });
    });
  }
}
