import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { format } from 'util';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxFileSize: number; // MB
  maxFiles: number;
}

export class Logger {
  private config: LogConfig;
  private logQueue: string[] = [];
  private writeTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      logDir: path.join(process.cwd(), 'logs'),
      maxFileSize: 10, // 10MB
      maxFiles: 5,
      ...config
    };

    // 确保日志目录存在
    if (this.config.enableFile) {
      fs.ensureDirSync(this.config.logDir);
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  private formatMessage(level: string, ...messages: any[]): string {
    const timestamp = this.getTimestamp();
    const formattedMessages = messages.map(msg => 
      typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg)
    ).join(' ');
    return `[${timestamp}] [${level}] ${formattedMessages}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private writeToConsole(level: LogLevel, message: string): void {
    if (!this.config.enableConsole) return;

    let coloredMessage: string;
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    
    switch (level) {
      case LogLevel.DEBUG:
        coloredMessage = `${timestamp} ${chalk.magenta('[DEBUG]')} ${chalk.gray(message)}`;
        break;
      case LogLevel.INFO:
        coloredMessage = `${timestamp} ${chalk.cyan('[INFO]')} ${chalk.white(message)}`;
        break;
      case LogLevel.WARN:
        coloredMessage = `${timestamp} ${chalk.yellow('[WARN]')} ${chalk.yellow(message)}`;
        break;
      case LogLevel.ERROR:
        coloredMessage = `${timestamp} ${chalk.red('[ERROR]')} ${chalk.red(message)}`;
        break;
      case LogLevel.FATAL:
        coloredMessage = `${timestamp} ${chalk.bgRed.white('[FATAL]')} ${chalk.redBright(message)}`;
        break;
      default:
        coloredMessage = `${timestamp} ${chalk.white('[LOG]')} ${message}`;
    }

    console.log(coloredMessage);
  }

  private async writeToFile(message: string): Promise<void> {
    if (!this.config.enableFile) return;

    // 添加到队列
    this.logQueue.push(message + '\n');

    // 批量写入，减少IO操作
    if (!this.writeTimer) {
      this.writeTimer = setTimeout(async () => {
        await this.flushLogs();
        this.writeTimer = null;
      }, 100);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.config.logDir, `hmml-${today}.log`);
    const errorLogFile = path.join(this.config.logDir, `hmml-error-${today}.log`);

    try {
      const logsToWrite = this.logQueue.splice(0);
      const errorLogs = logsToWrite.filter(log => log.includes('[ERROR]') || log.includes('[FATAL]'));
      const allLogs = logsToWrite.join('');

      // 写入所有日志
      await fs.appendFile(logFile, allLogs);

      // 单独写入错误日志
      if (errorLogs.length > 0) {
        await fs.appendFile(errorLogFile, errorLogs.join(''));
      }

      // 检查文件大小并轮转
      await this.rotateLogsIfNeeded(logFile);
      await this.rotateLogsIfNeeded(errorLogFile);
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  private async rotateLogsIfNeeded(logFile: string): Promise<void> {
    try {
      const stats = await fs.stat(logFile);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > this.config.maxFileSize) {
        const timestamp = Date.now();
        const rotatedFile = logFile.replace('.log', `.${timestamp}.log`);
        await fs.move(logFile, rotatedFile);

        // 清理旧文件
        await this.cleanOldLogs(path.dirname(logFile));
      }
    } catch (error) {
      // 文件不存在或其他错误，忽略
    }
  }

  private async cleanOldLogs(logDir: string): Promise<void> {
    try {
      const files = await fs.readdir(logDir);
      const logFiles = files
        .filter(file => file.startsWith('hmml-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          stats: fs.statSync(path.join(logDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // 保留最新的文件，删除超过限制的文件
      if (logFiles.length > this.config.maxFiles) {
        const filesToDelete = logFiles.slice(this.config.maxFiles);
        for (const file of filesToDelete) {
          await fs.remove(file.path);
        }
      }
    } catch (error) {
      console.error('清理旧日志文件失败:', error);
    }
  }

  debug(...messages: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const message = this.formatMessage('DEBUG', ...messages);
    this.writeToConsole(LogLevel.DEBUG, format(...messages));
    this.writeToFile(message);
  }

  info(...messages: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const message = this.formatMessage('INFO', ...messages);
    this.writeToConsole(LogLevel.INFO, format(...messages));
    this.writeToFile(message);
  }

  warn(...messages: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const message = this.formatMessage('WARN', ...messages);
    this.writeToConsole(LogLevel.WARN, format(...messages));
    this.writeToFile(message);
  }

  error(...messages: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const message = this.formatMessage('ERROR', ...messages);
    this.writeToConsole(LogLevel.ERROR, format(...messages));
    this.writeToFile(message);
  }

  fatal(...messages: any[]): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const message = this.formatMessage('FATAL', ...messages);
    this.writeToConsole(LogLevel.FATAL, format(...messages));
    this.writeToFile(message);
    // 致命错误后退出
    process.exit(1);
  }

  async close(): Promise<void> {
    // 清理定时器并确保所有日志被写入
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    await this.flushLogs();
  }
}

// 创建默认logger实例
export const logger = new Logger();

// 导出便捷方法
export const log = {
  debug: (...messages: any[]) => logger.debug(...messages),
  info: (...messages: any[]) => logger.info(...messages),
  warn: (...messages: any[]) => logger.warn(...messages),
  error: (...messages: any[]) => logger.error(...messages),
  fatal: (...messages: any[]) => logger.fatal(...messages)
};
