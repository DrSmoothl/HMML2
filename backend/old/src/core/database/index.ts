/**
 * SQLite数据库操作工具框架主入口
 * 导出核心数据库操作类和工具函数
 */

// 核心类导出
export { DatabaseConnection } from './connection';
export { DatabaseOperator } from './operator';
export { DatabaseManager, databaseManager } from './manager';
export { SqlQueryBuilder } from './sqlQueryBuilder';
export { PaginationUtils } from './paginationUtils';

// 类型定义导出
export * from '../../types/database';

// 核心工具函数
import { DatabaseManager, databaseManager } from './manager';
import { DatabaseConfig } from '../../types/database';

/**
 * 创建标准数据库配置的便捷函数
 * @param dbPath 数据库文件路径
 * @param readonly 是否只读模式
 * @returns DatabaseConfig
 */
export function createDatabaseConfig(dbPath: string, readonly: boolean = false): DatabaseConfig {
  return DatabaseManager.createDatabaseConfig(dbPath, { readonly });
}

/**
 * 快速连接数据库的便捷函数
 * @param dbPath 数据库路径
 * @param connectionName 连接名称，默认为 'default'
 * @param readonly 是否只读模式，默认为 false
 * @returns Promise<void>
 */
export async function connectDatabase(
  dbPath: string, 
  connectionName: string = 'default',
  readonly: boolean = false
): Promise<void> {
  const config = createDatabaseConfig(dbPath, readonly);
  
  if (!databaseManager.isManagerInitialized()) {
    await databaseManager.initialize();
  }
  
  if (databaseManager.hasConnection(connectionName)) {
    await databaseManager.removeDatabase(connectionName);
  }
  
  await databaseManager.addDatabase(connectionName, config);
}

/**
 * 快速获取数据库操作器的便捷函数
 * @param connectionName 连接名称，默认为 'default'
 * @returns DatabaseOperator
 */
export function getDatabase(connectionName: string = 'default') {
  return databaseManager.getOperator(connectionName);
}

/**
 * 关闭所有数据库连接的便捷函数
 * @returns Promise<void>
 */
export async function closeAllDatabases(): Promise<void> {
  await databaseManager.closeAllConnections();
}
