import { EventEmitter } from 'events';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import readline from 'readline';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../core/logger';
import { FileManager } from '../core/fileManager';
import { generateUUID } from '../utils/helpers';
import { 
  IPtySession, 
  IPtyInstanceConfig, 
  IWatcherInfo, 
  PtySessionStatus,
  IPtySubProcessConfig 
} from '../types/pty';
import { GoPtyProcessAdapter } from './goPtyAdapter';
import { PTY_PATH, PTY_CONSTANTS, generatePipeName, checkPtyEnvironment } from './constants';
import { parseCommandString, validateCommand } from './commandParser';
import { getRunAsUserParams } from './systemUser';

/**
 * PTY会话管理器
 * 负责管理所有PTY会话的生命周期
 */
export class PtySessionManager extends EventEmitter {
  private sessions = new Map<string, IPtySession>();
  private readonly maxSessions: number;

  constructor(maxSessions: number = 100) {
    super();
    this.maxSessions = maxSessions;
    logger.info('PTY会话管理器已初始化');
  }

  /**
   * 创建新的PTY会话
   */
  async createSession(config: IPtyInstanceConfig): Promise<string> {
    // 检查会话数量限制
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`会话数量已达上限 (${this.maxSessions})`);
    }

    // 验证配置
    this.validateSessionConfig(config);

    const sessionId = config.uuid || generateUUID();
    
    logger.info(`创建PTY会话: ${sessionId}, 命令: ${config.command.startCommand}`);

    // 创建会话对象
    const session: IPtySession = {
      uuid: sessionId,
      status: PtySessionStatus.STOPPED,
      config,
      watchers: new Map<string, IWatcherInfo>(),
      startCount: 0
    };

    this.sessions.set(sessionId, session);
    this.emit('sessionCreated', sessionId, session);

    return sessionId;
  }

  /**
   * 启动PTY会话
   */
  async startSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    if (session.status !== PtySessionStatus.STOPPED) {
      throw new Error(`会话状态错误，无法启动: ${session.status}`);
    }

    logger.info(`启动PTY会话: ${sessionId}`);

    try {
      session.status = PtySessionStatus.STARTING;
      session.startCount++;
      session.startTime = Date.now();
      
      this.emit('sessionStatusChanged', sessionId, session.status);

      // 检查PTY环境
      const envCheck = await checkPtyEnvironment();
      if (!envCheck.exists) {
        throw new Error(`PTY环境检查失败: ${envCheck.error}`);
      }

      // 创建PTY进程
      const ptyProcess = await this.createPtyProcess(session);
      session.process = ptyProcess;
      session.status = PtySessionStatus.RUNNING;

      // 设置进程事件监听
      this.setupProcessEvents(sessionId, ptyProcess);

      logger.info(`PTY会话启动成功: ${sessionId}, PID: ${ptyProcess.pid}`);
      this.emit('sessionStarted', sessionId, session);
      this.emit('sessionStatusChanged', sessionId, session.status);

      // 发送一个换行符来触发初始输出（如果需要的话）
      setTimeout(() => {
        if (session.process && session.process.isAlive()) {
          logger.debug(`向会话发送初始换行符: ${sessionId}`);
          session.process.write('\n');
        }
      }, 1000);

    } catch (error) {
      session.status = PtySessionStatus.ERROR;
      session.endTime = Date.now();
      
      logger.error(`PTY会话启动失败: ${sessionId}`, error);
      this.emit('sessionError', sessionId, error);
      this.emit('sessionStatusChanged', sessionId, session.status);
      
      throw error;
    }
  }

  /**
   * 停止PTY会话
   */
  async stopSession(sessionId: string, force = false): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    if (session.status === PtySessionStatus.STOPPED) {
      return; // 已经停止
    }

    logger.info(`停止PTY会话: ${sessionId}, 强制: ${force}`);

    try {
      session.status = PtySessionStatus.STOPPING;
      this.emit('sessionStatusChanged', sessionId, session.status);

      if (session.process) {
        if (force) {
          session.process.forceKill();
        } else {
          // 发送停止命令
          const stopCommand = session.config.command.stopCommand || '^C';
          if (stopCommand === '^C') {
            // 发送Ctrl+C信号
            session.process.write('\x03');
          } else {
            // 发送自定义停止命令
            session.process.write(stopCommand + '\n');
          }
          
          // 等待进程自然退出，超时后强制终止
          setTimeout(() => {
            if (session.process && session.process.isAlive()) {
              logger.warn(`会话进程未在预期时间内退出，强制终止: ${sessionId}`);
              session.process.forceKill();
            }
          }, 5000);
        }
      }

    } catch (error) {
      logger.error(`停止PTY会话时发生错误: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * 销毁PTY会话
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      return; // 会话不存在
    }

    logger.info(`销毁PTY会话: ${sessionId}`);

    try {
      // 先停止会话
      if (session.status === PtySessionStatus.RUNNING) {
        await this.stopSession(sessionId, true);
      }

      // 清理进程资源
      if (session.process) {
        await session.process.destroy();
      }

      // 清理观察者
      session.watchers.clear();

      // 从管理器中移除
      this.sessions.delete(sessionId);
      
      logger.info(`PTY会话已销毁: ${sessionId}`);
      this.emit('sessionDestroyed', sessionId);

    } catch (error) {
      logger.error(`销毁PTY会话时发生错误: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): IPtySession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): Map<string, IPtySession> {
    return new Map(this.sessions);
  }

  /**
   * 向会话发送输入
   */
  sendInput(sessionId: string, input: string): boolean {
    const session = this.getSession(sessionId);
    if (!session || !session.process) {
      return false;
    }

    return session.process.write(input);
  }

  /**
   * 调整会话终端大小
   */
  resizeSession(sessionId: string, width: number, height: number): boolean {
    const session = this.getSession(sessionId);
    if (!session || !session.process) {
      return false;
    }

    session.process.resize(width, height);
    return true;
  }

  /**
   * 添加会话观察者
   */
  addWatcher(sessionId: string, watcherInfo: IWatcherInfo): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    session.watchers.set(watcherInfo.socketId, watcherInfo);
    logger.debug(`添加会话观察者: ${sessionId}, 观察者: ${watcherInfo.socketId}`);
    
    // 自动调整终端大小为所有观察者的最小尺寸
    this.autoResizeSession(sessionId);
    
    return true;
  }

  /**
   * 移除会话观察者
   */
  removeWatcher(sessionId: string, socketId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const removed = session.watchers.delete(socketId);
    if (removed) {
      logger.debug(`移除会话观察者: ${sessionId}, 观察者: ${socketId}`);
      
      // 重新计算终端大小
      this.autoResizeSession(sessionId);
    }
    
    return removed;
  }

  /**
   * 自动调整会话终端大小（取所有观察者的最小尺寸）
   */
  private autoResizeSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session || !session.process || session.watchers.size === 0) {
      return;
    }

    let minWidth: number = PTY_CONSTANTS.DEFAULT_TERMINAL_WIDTH;
    let minHeight: number = PTY_CONSTANTS.DEFAULT_TERMINAL_HEIGHT;

    // 找出所有观察者终端尺寸的最小值
    for (const watcher of session.watchers.values()) {
      if (watcher.terminalSize.width > 0) {
        minWidth = Math.min(minWidth, watcher.terminalSize.width);
      }
      if (watcher.terminalSize.height > 0) {
        minHeight = Math.min(minHeight, watcher.terminalSize.height);
      }
    }

    session.process.resize(minWidth, minHeight);
    logger.debug(`自动调整会话终端大小: ${sessionId}, ${minWidth}x${minHeight}`);
  }

  /**
   * 创建PTY进程
   */
  private async createPtyProcess(session: IPtySession): Promise<GoPtyProcessAdapter> {
    const config = session.config;
    
    // 验证和解析启动命令
    const commandValidation = validateCommand(config.command.startCommand);
    if (!commandValidation.valid) {
      throw new Error(`命令验证失败: ${commandValidation.error}`);
    }

    // 创建工作目录
    const workDir = path.resolve(config.command.cwd || process.cwd());
    await FileManager.ensureDir(workDir);

    // 解析命令行参数
    let commandList: string[];
    if (os.platform() === 'win32') {
      commandList = [config.command.startCommand];
    } else {
      commandList = parseCommandString(config.command.startCommand);
    }

    if (commandList.length === 0) {
      throw new Error('解析后的命令为空');
    }

    // 生成管道名称
    const pipeName = generatePipeName(session.uuid);

    // 确保管道目录存在
    if (process.platform !== 'win32') {
      await FileManager.ensureDir(path.dirname(pipeName));
    }

    // 获取运行用户配置
    const runAsConfig = await getRunAsUserParams(config.command.runAs);

    // 构建PTY程序参数
    const ptyArgs = [
      '-size',
      `${config.terminal.ptyWindowCol},${config.terminal.ptyWindowRow}`,
      '-coder',
      config.command.oe || 'utf-8',
      '-dir',
      workDir,
      '-fifo',
      pipeName,
      '-cmd',
      JSON.stringify(commandList)
    ];

    logger.debug('启动PTY进程', {
      ptyPath: PTY_PATH,
      args: ptyArgs,
      workDir,
      runAsUser: runAsConfig.runAsName
    });

    // 生成环境变量
    const env = {
      ...process.env,
      ...config.command.env
    };

    // 创建PTY子进程
    const childProcess = spawn(PTY_PATH, ptyArgs, {
      ...runAsConfig,
      cwd: path.dirname(PTY_PATH),
      stdio: 'pipe',
      windowsHide: true,
      env,
      detached: false
    });

    if (!childProcess || !childProcess.pid) {
      throw new Error('PTY进程创建失败');
    }

    // 读取PTY子进程配置
    const subProcessConfig = await this.readPtySubProcessConfig(childProcess);
    if (subProcessConfig.pid <= 0) {
      childProcess.kill();
      throw new Error('PTY子进程配置读取失败');
    }

    // 创建进程适配器
    const adapter = new GoPtyProcessAdapter(childProcess, subProcessConfig.pid, pipeName);

    // 验证进程状态
    if (childProcess.exitCode !== null || !adapter.isAlive()) {
      await adapter.destroy();
      throw new Error('PTY进程启动验证失败');
    }

    return adapter;
  }

  /**
   * 读取PTY子进程配置
   */
  private readPtySubProcessConfig(childProcess: ChildProcessWithoutNullStreams): Promise<IPtySubProcessConfig> {
    return new Promise((resolve) => {
      const errorConfig = { pid: 0 };
      let resolved = false;

      const rl = readline.createInterface({
        input: childProcess.stdout,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        if (resolved) return;
        
        try {
          rl.removeAllListeners();
          const config = JSON.parse(line.trim()) as IPtySubProcessConfig;
          
          if (typeof config.pid === 'number' && config.pid > 0) {
            resolved = true;
            resolve(config);
          } else {
            resolved = true;
            resolve(errorConfig);
          }
        } catch (error) {
          logger.debug('解析PTY配置失败:', line, error);
          resolved = true;
          resolve(errorConfig);
        }
      });

      // 超时处理
      setTimeout(() => {
        if (!resolved) {
          rl.removeAllListeners();
          resolved = true;
          resolve(errorConfig);
        }
      }, PTY_CONSTANTS.PTY_CONFIG_READ_TIMEOUT);
    });
  }

  /**
   * 设置进程事件监听
   */
  private setupProcessEvents(sessionId: string, ptyProcess: GoPtyProcessAdapter): void {
    ptyProcess.on('data', (data) => {
      logger.debug(`PTY会话输出: ${sessionId}, 数据长度: ${data.length}`, { 
        preview: data.toString().substring(0, 100) 
      });
      this.emit('sessionOutput', sessionId, data);
    });

    ptyProcess.on('exit', (code, signal) => {
      const session = this.getSession(sessionId);
      if (session) {
        session.status = PtySessionStatus.STOPPED;
        session.endTime = Date.now();
        logger.info(`PTY会话进程退出: ${sessionId}, 退出码: ${code}, 信号: ${signal}`);
        this.emit('sessionStopped', sessionId, code, signal);
        this.emit('sessionStatusChanged', sessionId, session.status);
      }
    });

    ptyProcess.on('error', (error) => {
      const session = this.getSession(sessionId);
      if (session) {
        // EPIPE错误通常在停止会话时发生，这是正常的，不需要作为错误处理
        if ((error as any).code === 'EPIPE') {
          logger.debug(`PTY会话管道断开: ${sessionId} (会话可能已停止)`);
          return;
        }
        
        session.status = PtySessionStatus.ERROR;
        session.endTime = Date.now();
        logger.error(`PTY会话进程错误: ${sessionId}`, error);
        this.emit('sessionError', sessionId, error);
        this.emit('sessionStatusChanged', sessionId, session.status);
      }
    });
  }

  /**
   * 验证会话配置
   */
  private validateSessionConfig(config: IPtyInstanceConfig): void {
    if (!config.command.startCommand || config.command.startCommand.trim() === '') {
      throw new Error('启动命令不能为空');
    }

    if (!config.command.cwd || config.command.cwd.trim() === '') {
      throw new Error('工作目录不能为空');
    }

    if (!config.command.ie || !config.command.oe) {
      throw new Error('编码设置不能为空');
    }

    if (config.terminal.ptyWindowCol <= 0 || config.terminal.ptyWindowRow <= 0) {
      throw new Error('终端尺寸必须大于0');
    }
  }

  /**
   * 清理所有会话
   */
  async cleanup(): Promise<void> {
    logger.info('清理所有PTY会话');
    
    const sessionIds = Array.from(this.sessions.keys());
    const cleanupPromises = sessionIds.map(sessionId => 
      this.destroySession(sessionId).catch(error => 
        logger.error(`清理会话失败: ${sessionId}`, error)
      )
    );

    await Promise.all(cleanupPromises);
    logger.info('PTY会话清理完成');
  }

  /**
   * 获取管理器状态
   */
  getManagerStatus(): {
    totalSessions: number;
    runningSessions: number;
    maxSessions: number;
    sessions: Array<{
      id: string;
      status: PtySessionStatus;
      watcherCount: number;
      startTime?: number;
      startCount: number;
    }>;
  } {
    const sessions = Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      status: session.status,
      watcherCount: session.watchers.size,
      startTime: session.startTime,
      startCount: session.startCount
    }));

    return {
      totalSessions: this.sessions.size,
      runningSessions: sessions.filter(s => s.status === PtySessionStatus.RUNNING).length,
      maxSessions: this.maxSessions,
      sessions
    };
  }
}
