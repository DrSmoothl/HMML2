import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { Writable } from 'stream';
import fs from 'fs-extra';
import { logger } from '../core/logger';
import { IPtyProcess, PtyMessageType } from '../types/pty';
import { PTY_CONSTANTS } from './constants';

/**
 * Go PTY进程适配器类
 * 负责与Go PTY程序进行通信和管理
 */
export class GoPtyProcessAdapter extends EventEmitter implements IPtyProcess {
  private pipeClient?: Writable;
  private isDestroyed = false;

  constructor(
    private readonly process: ChildProcess,
    public readonly pid: number,
    private readonly pipeName: string
  ) {
    super();
    
    logger.debug(`创建PTY进程适配器, PID: ${pid}, 管道: ${pipeName}`);

    // 监听PTY进程的输出
    this.setupProcessListeners();
    
    // 初始化命名管道连接
    this.initNamedPipe();
  }

  /**
   * 设置进程事件监听器
   */
  private setupProcessListeners(): void {
    if (this.process.stdout) {
      this.process.stdout.on('data', (data) => {
        if (!this.isDestroyed) {
          this.emit('data', data);
        }
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        if (!this.isDestroyed) {
          this.emit('data', data);
        }
      });
    }

    this.process.on('exit', (code, signal) => {
      logger.debug(`PTY进程退出, PID: ${this.pid}, 退出码: ${code}, 信号: ${signal}`);
      if (!this.isDestroyed) {
        this.emit('exit', code, signal);
      }
    });

    this.process.on('error', (error) => {
      logger.error(`PTY进程错误, PID: ${this.pid}:`, error);
      if (!this.isDestroyed) {
        this.emit('error', error);
      }
    });
  }

  /**
   * 初始化命名管道连接
   */
  private async initNamedPipe(): Promise<void> {
    try {
      logger.debug(`初始化命名管道: ${this.pipeName}`);
      
      // 确保管道目录存在（Unix系统）
      if (process.platform !== 'win32') {
        await fs.ensureDir(require('path').dirname(this.pipeName));
      }

      // 等待管道文件创建
      let retryCount = 0;
      const maxRetries = 50; // 最多等待5秒
      
      while (retryCount < maxRetries) {
        try {
          if (process.platform === 'win32' || await fs.pathExists(this.pipeName)) {
            break;
          }
        } catch (error) {
          // 忽略检查错误，继续重试
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }

      // 打开管道进行写入
      const fd = await fs.open(this.pipeName, 'w');
      const writePipe = fs.createWriteStream('', { fd });
      
      writePipe.on('error', (error) => {
        // EPIPE错误通常在停止会话时发生，这是正常的
        if ((error as any).code === 'EPIPE') {
          logger.debug(`管道连接已断开: ${this.pipeName} (会话可能已停止)`);
          return;
        }
        
        logger.error(`管道写入错误: ${this.pipeName}`, error);
        if (!this.isDestroyed) {
          this.emit('error', error);
        }
      });

      writePipe.on('close', () => {
        logger.debug(`管道已关闭: ${this.pipeName}`);
      });

      this.pipeClient = writePipe;
      logger.debug(`命名管道初始化完成: ${this.pipeName}`);
      
    } catch (error) {
      const errorMsg = `初始化命名管道失败: ${error}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * 调整终端大小
   */
  public resize(width: number, height: number): void {
    if (this.isDestroyed) {
      logger.warn('PTY进程已销毁，无法调整大小');
      return;
    }

    // 限制终端尺寸
    const w = Math.min(Math.max(width, 10), PTY_CONSTANTS.MAX_TERMINAL_WIDTH);
    const h = Math.min(Math.max(height, 10), PTY_CONSTANTS.MAX_TERMINAL_HEIGHT);
    
    logger.debug(`调整PTY终端大小: ${w}x${h}`);

    try {
      // 构造调整大小的消息
      const resizeData = JSON.stringify({ 
        width: Number(w), 
        height: Number(h) 
      });
      
      const dataLength = Buffer.byteLength(resizeData);
      const lengthBuffer = Buffer.alloc(2);
      lengthBuffer.writeInt16BE(dataLength, 0);
      
      // 消息格式: [消息类型][数据长度][JSON数据]
      const message = Buffer.concat([
        Buffer.from([PtyMessageType.RESIZE]),
        lengthBuffer,
        Buffer.from(resizeData)
      ]);
      
      this.writeToNamedPipe(message);
      
    } catch (error) {
      logger.error('调整终端大小失败:', error);
    }
  }

  /**
   * 向命名管道写入数据
   */
  public writeToNamedPipe(data: Buffer): boolean {
    if (this.isDestroyed) {
      logger.warn('PTY进程已销毁，无法写入管道');
      return false;
    }

    if (!this.pipeClient) {
      logger.warn('命名管道未初始化');
      return false;
    }

    try {
      return this.pipeClient.write(data);
    } catch (error) {
      logger.error('向命名管道写入数据失败:', error);
      return false;
    }
  }

  /**
   * 向PTY进程写入数据（用户输入）
   */
  public write(data: string): boolean {
    if (this.isDestroyed) {
      logger.warn('PTY进程已销毁，无法写入数据');
      return false;
    }

    if (!this.process.stdin) {
      logger.warn('PTY进程标准输入不可用');
      return false;
    }

    try {
      return this.process.stdin.write(data);
    } catch (error) {
      logger.error('向PTY进程写入数据失败:', error);
      return false;
    }
  }

  /**
   * 终止进程
   */
  public kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    if (this.isDestroyed) {
      return true;
    }

    logger.debug(`终止PTY进程, PID: ${this.pid}, 信号: ${signal}`);

    try {
      if (this.process && !this.process.killed) {
        this.process.kill(signal);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`终止PTY进程失败, PID: ${this.pid}:`, error);
      return false;
    }
  }

  /**
   * 强制终止进程
   */
  public forceKill(): boolean {
    logger.warn(`强制终止PTY进程, PID: ${this.pid}`);
    return this.kill('SIGKILL');
  }

  /**
   * 清理资源和销毁进程
   */
  public async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    logger.debug(`销毁PTY进程适配器, PID: ${this.pid}`);

    try {
      // 移除所有事件监听器
      this.removeAllListeners();

      // 清理进程监听器
      if (this.process) {
        if (this.process.stdout) {
          this.process.stdout.removeAllListeners();
          this.process.stdout.destroy();
        }
        
        if (this.process.stderr) {
          this.process.stderr.removeAllListeners();
          this.process.stderr.destroy();
        }

        if (this.process.stdin) {
          this.process.stdin.removeAllListeners();
          this.process.stdin.destroy();
        }

        this.process.removeAllListeners();
        
        // 终止进程
        if (!this.process.killed && this.process.exitCode === null) {
          this.process.kill('SIGTERM');
          
          // 等待一段时间后强制终止
          setTimeout(() => {
            if (!this.process.killed && this.process.exitCode === null) {
              this.process.kill('SIGKILL');
            }
          }, 3000);
        }
      }

      // 关闭命名管道
      if (this.pipeClient) {
        this.pipeClient.removeAllListeners();
        this.pipeClient.destroy();
      }

      // 删除命名管道文件
      try {
        await fs.remove(this.pipeName);
        logger.debug(`已删除管道文件: ${this.pipeName}`);
      } catch (error) {
        logger.debug(`删除管道文件失败: ${this.pipeName}`, error);
      }

    } catch (error) {
      logger.error(`销毁PTY进程适配器时发生错误:`, error);
    }
  }

  /**
   * 检查进程是否还活着
   */
  public isAlive(): boolean {
    return !this.isDestroyed && 
           this.process && 
           !this.process.killed && 
           this.process.exitCode === null;
  }

  /**
   * 获取进程状态信息
   */
  public getStatus(): {
    pid: number;
    isAlive: boolean;
    isDestroyed: boolean;
    pipeName: string;
  } {
    return {
      pid: this.pid,
      isAlive: this.isAlive(),
      isDestroyed: this.isDestroyed,
      pipeName: this.pipeName
    };
  }
}
