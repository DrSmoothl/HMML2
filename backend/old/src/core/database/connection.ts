/**
 * SQLite数据库连接管理器
 * 负责数据库连接的创建、管理和销毁
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '../logger';
import { 
  DatabaseConfig, 
  DatabaseInfo, 
  TableInfo, 
  ColumnInfo, 
  IndexInfo,
  DatabaseError 
} from '../../types/database';
import { ValidationError, InternalServerError } from '../../middleware/errorHandler';

export class DatabaseConnection {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;
  private isConnected: boolean = false;
  private connectionId: string;

  constructor(config: DatabaseConfig) {
    this.config = { ...config };
    this.connectionId = this.generateConnectionId();
    this.validateConfig();
  }

  /**
   * 生成连接ID
   * @returns 唯一的连接ID
   */
  private generateConnectionId(): string {
    return `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证配置参数
   */
  private validateConfig(): void {
    if (!this.config.path) {
      throw new ValidationError('数据库路径不能为空');
    }

    if (this.config.timeout && (this.config.timeout < 100 || this.config.timeout > 60000)) {
      throw new ValidationError('连接超时时间必须在100ms到60000ms之间');
    }
  }

  /**
   * 连接数据库
   * @returns Promise<void>
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.db) {
      logger.debug(`数据库连接 ${this.connectionId} 已经建立`);
      return;
    }

    try {
      logger.info(`正在连接数据库: ${this.config.path}`);

      // 检查数据库文件
      await this.checkDatabaseFile();

      // 创建连接选项
      const options: Database.Options = {
        readonly: this.config.readonly || false,
        fileMustExist: this.config.fileMustExist || false,
        timeout: this.config.timeout || 5000,
        verbose: this.config.verbose ? this.createVerboseLogger() : undefined
      };

      // 建立连接
      this.db = new Database(this.config.path, options);

      // 设置一些优化参数
      this.setupDatabaseOptimizations();

      this.isConnected = true;
      logger.info(`数据库连接成功: ${this.connectionId}`);

    } catch (error) {
      const dbError = this.createDatabaseError('数据库连接失败', error);
      logger.error('数据库连接失败:', dbError);
      throw dbError;
    }
  }

  /**
   * 检查数据库文件
   */
  private async checkDatabaseFile(): Promise<void> {
    const dbPath = path.resolve(this.config.path);
    const dbDir = path.dirname(dbPath);

    // 确保目录存在（除非是内存数据库）
    if (!this.config.memory && this.config.path !== ':memory:') {
      await fs.ensureDir(dbDir);

      // 如果文件必须存在但不存在，抛出错误
      if (this.config.fileMustExist && !await fs.pathExists(dbPath)) {
        throw new ValidationError(`数据库文件不存在: ${dbPath}`);
      }
    }
  }

  /**
   * 设置数据库优化参数
   */
  private setupDatabaseOptimizations(): void {
    if (!this.db) return;

    try {
      // 设置WAL模式以提高并发性能
      if (!this.config.readonly) {
        this.db.pragma('journal_mode = WAL');
      }

      // 设置同步模式
      this.db.pragma('synchronous = NORMAL');

      // 设置缓存大小（10MB）
      this.db.pragma('cache_size = 10000');

      // 设置外键约束
      this.db.pragma('foreign_keys = ON');

      logger.debug('数据库优化参数设置完成');
    } catch (error) {
      logger.warn('设置数据库优化参数时出错:', error);
    }
  }

  /**
   * 创建详细日志记录器
   * @returns 日志函数
   */
  private createVerboseLogger(): (message?: any, ...additionalArgs: any[]) => void {
    return (message?: any) => {
      logger.debug(`[SQL] ${message}`);
    };
  }

  /**
   * 断开数据库连接
   * @returns Promise<void>
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.db) {
      logger.debug(`数据库连接 ${this.connectionId} 已经关闭`);
      return;
    }

    try {
      logger.info(`正在关闭数据库连接: ${this.connectionId}`);

      // 关闭数据库连接
      this.db.close();
      this.db = null;
      this.isConnected = false;

      logger.info(`数据库连接已关闭: ${this.connectionId}`);
    } catch (error) {
      const dbError = this.createDatabaseError('关闭数据库连接失败', error);
      logger.error('关闭数据库连接失败:', dbError);
      throw dbError;
    }
  }

  /**
   * 获取数据库实例
   * @returns Database实例
   */
  public getDatabase(): Database.Database {
    if (!this.isConnected || !this.db) {
      throw new InternalServerError('数据库未连接');
    }
    return this.db;
  }

  /**
   * 检查连接状态
   * @returns 是否已连接
   */
  public isConnectionActive(): boolean {
    return this.isConnected && this.db !== null;
  }

  /**
   * 获取数据库信息
   * @returns 数据库信息
   */
  public getDatabaseInfo(): DatabaseInfo {
    if (!this.isConnected || !this.db) {
      throw new InternalServerError('数据库未连接');
    }

    return {
      path: this.config.path,
      isOpen: this.db.open,
      readonly: this.config.readonly || false,
      inTransaction: this.db.inTransaction,
      name: path.basename(this.config.path, '.db')
    };
  }

  /**
   * 获取所有表信息
   * @returns 表信息数组
   */
  public async getTablesInfo(): Promise<TableInfo[]> {
    if (!this.isConnected || !this.db) {
      throw new InternalServerError('数据库未连接');
    }

    try {
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all() as Array<{ name: string }>;

      const tablesInfo: TableInfo[] = [];

      for (const table of tables) {
        const tableInfo = await this.getTableInfo(table.name);
        tablesInfo.push(tableInfo);
      }

      return tablesInfo;
    } catch (error) {
      throw this.createDatabaseError('获取表信息失败', error);
    }
  }

  /**
   * 获取单个表信息
   * @param tableName 表名
   * @returns 表信息
   */
  public async getTableInfo(tableName: string): Promise<TableInfo> {
    if (!this.isConnected || !this.db) {
      throw new InternalServerError('数据库未连接');
    }

    try {
      // 获取列信息
      const columns = this.db.prepare(`PRAGMA table_info("${tableName}")`)
        .all() as ColumnInfo[];

      // 获取主键信息
      const primaryKeys = columns
        .filter(col => col.primaryKey)
        .map(col => col.name);

      // 获取索引信息
      const indexes = this.getTableIndexes(tableName);

      // 获取行数
      const rowCountResult = this.db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`)
        .get() as { count: number };

      return {
        name: tableName,
        columns,
        primaryKeys,
        indexes,
        rowCount: rowCountResult.count
      };
    } catch (error) {
      throw this.createDatabaseError(`获取表 ${tableName} 信息失败`, error);
    }
  }

  /**
   * 获取表的索引信息
   * @param tableName 表名
   * @returns 索引信息数组
   */
  private getTableIndexes(tableName: string): IndexInfo[] {
    if (!this.db) return [];

    try {
      const indexList = this.db.prepare(`PRAGMA index_list("${tableName}")`)
        .all() as Array<{ name: string; unique: number }>;

      const indexes: IndexInfo[] = [];

      for (const index of indexList) {
        const indexInfo = this.db.prepare(`PRAGMA index_info("${index.name}")`)
          .all() as Array<{ name: string }>;

        indexes.push({
          name: index.name,
          unique: index.unique === 1,
          columns: indexInfo.map(info => info.name)
        });
      }

      return indexes;
    } catch (error) {
      logger.warn(`获取表 ${tableName} 索引信息失败:`, error);
      return [];
    }
  }

  /**
   * 测试数据库连接
   * @returns Promise<boolean>
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.db) {
        return false;
      }

      // 执行简单查询测试连接
      this.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      logger.error('数据库连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取数据库文件大小
   * @returns 文件大小（字节）
   */
  public async getDatabaseSize(): Promise<number> {
    try {
      if (this.config.memory || this.config.path === ':memory:') {
        return 0;
      }

      const stats = await fs.stat(this.config.path);
      return stats.size;
    } catch (error) {
      logger.warn('获取数据库文件大小失败:', error);
      return 0;
    }
  }

  /**
   * 执行VACUUM操作
   * @returns Promise<void>
   */
  public async vacuum(): Promise<void> {
    if (!this.isConnected || !this.db) {
      throw new InternalServerError('数据库未连接');
    }

    if (this.config.readonly) {
      throw new ValidationError('只读数据库不能执行VACUUM操作');
    }

    try {
      logger.info('开始执行数据库VACUUM操作');
      this.db.prepare('VACUUM').run();
      logger.info('数据库VACUUM操作完成');
    } catch (error) {
      throw this.createDatabaseError('VACUUM操作失败', error);
    }
  }

  /**
   * 创建数据库错误对象
   * @param message 错误消息
   * @param originalError 原始错误
   * @returns DatabaseError
   */
  private createDatabaseError(message: string, originalError: any): DatabaseError {
    const error = new Error(message) as DatabaseError;
    error.name = 'DatabaseError';
    
    if (originalError) {
      error.code = originalError.code;
      error.sqlMessage = originalError.message;
      error.stack = originalError.stack;
    }

    return error;
  }

  /**
   * 获取连接配置
   * @returns 数据库配置
   */
  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * 获取连接ID
   * @returns 连接ID
   */
  public getConnectionId(): string {
    return this.connectionId;
  }
}
