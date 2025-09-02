/**
 * SQLite数据库管理器
 * 负责管理多个数据库连接和提供统一的数据库操作接口
 */

import path from 'path';
import { logger } from '../logger';
import { DatabaseConnection } from './connection';
import { DatabaseOperator } from './operator';
import { 
  DatabaseConfig, 
  DatabaseInfo, 
  DatabaseStats,
  OperationResult,
  TableInfo 
} from '../../types/database';
import { ValidationError, InternalServerError, NotFoundError } from '../../middleware/errorHandler';

export interface DatabaseManagerConfig {
  defaultDatabase?: DatabaseConfig;
}

export class DatabaseManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private operators: Map<string, DatabaseOperator> = new Map();
  private config: DatabaseManagerConfig;
  private isInitialized: boolean = false;

  constructor(config: DatabaseManagerConfig = {}) {
    this.config = {
      ...config
    };
  }

  /**
   * 初始化数据库管理器
   * @returns Promise<void>
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('正在初始化数据库管理器...');

      // 如果配置了默认数据库，则创建连接
      if (this.config.defaultDatabase) {
        await this.addDatabase('default', this.config.defaultDatabase);
        logger.info('默认数据库连接已建立');
      }

      this.isInitialized = true;
      logger.info('数据库管理器初始化完成');
    } catch (error) {
      logger.error('数据库管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 添加数据库连接
   * @param name 连接名称
   * @param config 数据库配置
   * @returns Promise<void>
   */
  public async addDatabase(name: string, config: DatabaseConfig): Promise<void> {
    if (!name || name.trim() === '') {
      throw new ValidationError('数据库连接名称不能为空');
    }

    const connectionName = name.trim();

    if (this.connections.has(connectionName)) {
      throw new ValidationError(`数据库连接 '${connectionName}' 已存在`);
    }

    try {
      logger.info(`正在添加数据库连接: ${connectionName}`);

      // 创建数据库连接
      const connection = new DatabaseConnection(config);
      await connection.connect();

      // 创建操作器
      const operator = new DatabaseOperator(connection);

      // 存储连接和操作器
      this.connections.set(connectionName, connection);
      this.operators.set(connectionName, operator);

      logger.info(`数据库连接 '${connectionName}' 添加成功`);
    } catch (error) {
      logger.error(`添加数据库连接 '${connectionName}' 失败:`, error);
      throw error;
    }
  }

  /**
   * 移除数据库连接
   * @param name 连接名称
   * @returns Promise<void>
   */
  public async removeDatabase(name: string): Promise<void> {
    const connectionName = name.trim();

    if (!this.connections.has(connectionName)) {
      throw new NotFoundError(`数据库连接 '${connectionName}' 不存在`);
    }

    try {
      logger.info(`正在移除数据库连接: ${connectionName}`);

      const connection = this.connections.get(connectionName)!;
      await connection.disconnect();

      this.connections.delete(connectionName);
      this.operators.delete(connectionName);

      logger.info(`数据库连接 '${connectionName}' 移除成功`);
    } catch (error) {
      logger.error(`移除数据库连接 '${connectionName}' 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取数据库操作器
   * @param name 连接名称，默认为 'default'
   * @returns DatabaseOperator
   */
  public getOperator(name: string = 'default'): DatabaseOperator {
    const connectionName = name.trim();

    if (!this.operators.has(connectionName)) {
      throw new NotFoundError(`数据库连接 '${connectionName}' 不存在`);
    }

    const operator = this.operators.get(connectionName)!;
    
    // 检查连接状态
    if (!operator.getConnection().isConnectionActive()) {
      logger.warn(`数据库连接 '${connectionName}' 未激活`);
      throw new InternalServerError(`数据库连接 '${connectionName}' 未激活`);
    }

    return operator;
  }

  /**
   * 获取数据库连接
   * @param name 连接名称，默认为 'default'
   * @returns DatabaseConnection
   */
  public getConnection(name: string = 'default'): DatabaseConnection {
    const connectionName = name.trim();

    if (!this.connections.has(connectionName)) {
      throw new NotFoundError(`数据库连接 '${connectionName}' 不存在`);
    }

    return this.connections.get(connectionName)!;
  }

  /**
   * 检查连接是否存在
   * @param name 连接名称
   * @returns boolean
   */
  public hasConnection(name: string): boolean {
    return this.connections.has(name.trim());
  }

  /**
   * 获取所有连接名称
   * @returns string[]
   */
  public getConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * 获取连接统计信息
   * @returns 连接统计
   */
  public getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    connections: Array<{ name: string; info: DatabaseInfo }>;
  } {
    const connections: Array<{ name: string; info: DatabaseInfo }> = [];
    let activeConnections = 0;

    for (const [name, connection] of this.connections.entries()) {
      const info = connection.getDatabaseInfo();
      connections.push({ name, info });
      
      if (connection.isConnectionActive()) {
        activeConnections++;
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections,
      connections
    };
  }

  /**
   * 测试连接
   * @param name 连接名称
   * @returns Promise<boolean>
   */
  public async testConnection(name: string): Promise<boolean> {
    const connectionName = name.trim();

    if (!this.connections.has(connectionName)) {
      return false;
    }

    const connection = this.connections.get(connectionName)!;
    return await connection.testConnection();
  }

  /**
   * 获取数据库统计信息
   * @param name 连接名称
   * @returns Promise<DatabaseStats>
   */
  public async getDatabaseStats(name: string): Promise<DatabaseStats> {
    const operator = this.getOperator(name);
    const connection = operator.getConnection();

    try {
      // 获取所有表信息
      const tables = await connection.getTablesInfo();
      const totalTables = tables.length;
      const totalRows = tables.reduce((sum, table) => sum + (table.rowCount || 0), 0);

      // 获取数据库文件大小
      const databaseSize = await connection.getDatabaseSize();

      // 获取文件修改时间
      const dbInfo = connection.getDatabaseInfo();
      const lastModified = new Date(); // 这里可以通过文件系统API获取实际修改时间

      return {
        totalTables,
        totalRows,
        databaseSize,
        lastModified
      };
    } catch (error) {
      logger.error(`获取数据库 '${name}' 统计信息失败:`, error);
      throw error;
    }
  }

  /**
   * 执行数据库VACUUM操作
   * @param name 连接名称
   * @returns Promise<void>
   */
  public async vacuumDatabase(name: string): Promise<void> {
    const connection = this.getConnection(name);
    await connection.vacuum();
  }

  /**
   * 关闭所有数据库连接
   * @returns Promise<void>
   */
  public async closeAllConnections(): Promise<void> {
    logger.info('正在关闭所有数据库连接...');

    const closePromises = Array.from(this.connections.values()).map(async (connection) => {
      try {
        await connection.disconnect();
      } catch (error) {
        logger.error('关闭数据库连接时出错:', error);
      }
    });

    await Promise.all(closePromises);

    this.connections.clear();
    this.operators.clear();
    this.isInitialized = false;

    logger.info('所有数据库连接已关闭');
  }

  /**
   * 检查管理器是否已初始化
   * @returns boolean
   */
  public isManagerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 获取管理器配置
   * @returns DatabaseManagerConfig
   */
  public getConfig(): DatabaseManagerConfig {
    return { ...this.config };
  }

  /**
   * 创建便捷的数据库连接配置
   * @param dbPath 数据库文件路径
   * @param options 可选配置
   * @returns DatabaseConfig
   */
  public static createDatabaseConfig(
    dbPath: string, 
    options: Partial<DatabaseConfig> = {}
  ): DatabaseConfig {
    return {
      path: path.resolve(dbPath),
      readonly: false,
      timeout: 5000,
      verbose: false,
      memory: false,
      fileMustExist: false,
      ...options
    };
  }

  /**
   * 创建内存数据库配置
   * @param options 可选配置
   * @returns DatabaseConfig
   */
  public static createMemoryDatabaseConfig(options: Partial<DatabaseConfig> = {}): DatabaseConfig {
    return {
      path: ':memory:',
      memory: true,
      readonly: false,
      timeout: 5000,
      verbose: false,
      fileMustExist: false,
      ...options
    };
  }
}

// 创建全局数据库管理器实例
export const databaseManager = new DatabaseManager();
