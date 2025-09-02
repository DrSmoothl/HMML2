/**
 * 通用数据库操作器
 * 提供完整的CRUD操作和高级查询功能
 */

import Database from 'better-sqlite3';
import { logger } from '../logger';
import { DatabaseConnection } from './connection';
import { SqlQueryBuilder } from './sqlQueryBuilder';
import { PaginationUtils } from './paginationUtils';
import {
  QueryParams,
  PaginationParams,
  PaginatedResult,
  OperationResult,
  BatchOperationParams,
  TransactionOptions,
  DatabaseError
} from '../../types/database';
import { ValidationError, InternalServerError } from '../../middleware/errorHandler';

export class DatabaseOperator {
  private connection: DatabaseConnection;

  constructor(connection: DatabaseConnection) {
    this.connection = connection;
  }

  /**
   * 查询单条记录
   * @param tableName 表名
   * @param params 查询参数
   * @returns 查询结果
   */
  public async findOne<T = any>(tableName: string, params: QueryParams = {}): Promise<T | null> {
    this.validateConnection();
    
    try {
      const startTime = Date.now();
      
      const builder = SqlQueryBuilder.select(tableName);
      
      // 设置查询字段
      if (params.select && params.select.length > 0) {
        builder.fields(params.select);
      }
      
      // 设置WHERE条件
      if (params.where && params.where.length > 0) {
        builder.where(params.where);
      }
      
      // 设置排序
      if (params.orderBy && params.orderBy.length > 0) {
        builder.orderBy(params.orderBy);
      }
      
      // 限制为1条记录
      builder.limit(1);
      
      const { sql, bindings } = builder.build();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行查询: ${sql}`, { bindings });
      
      const result = db.prepare(sql).get(...bindings) as T | undefined;
      
      const executionTime = Date.now() - startTime;
      logger.debug(`查询执行完成，耗时: ${executionTime}ms`);
      
      return result || null;
    } catch (error) {
      throw this.createDatabaseError('查询单条记录失败', error, { tableName, params });
    }
  }

  /**
   * 查询多条记录
   * @param tableName 表名
   * @param params 查询参数
   * @returns 查询结果数组
   */
  public async findMany<T = any>(tableName: string, params: QueryParams = {}): Promise<T[]> {
    this.validateConnection();
    
    try {
      const startTime = Date.now();
      
      const builder = SqlQueryBuilder.select(tableName);
      
      // 设置查询字段
      if (params.select && params.select.length > 0) {
        builder.fields(params.select);
      }
      
      // 设置WHERE条件
      if (params.where && params.where.length > 0) {
        builder.where(params.where);
      }
      
      // 设置排序
      if (params.orderBy && params.orderBy.length > 0) {
        builder.orderBy(params.orderBy);
      }
      
      // 设置分组
      if (params.groupBy && params.groupBy.length > 0) {
        builder.groupBy(params.groupBy);
      }
      
      // 设置HAVING条件
      if (params.having && params.having.length > 0) {
        builder.having(params.having);
      }
      
      // 设置限制和偏移
      if (params.limit !== undefined) {
        builder.limit(params.limit);
      }
      if (params.offset !== undefined) {
        builder.offset(params.offset);
      }
      
      const { sql, bindings } = builder.build();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行查询: ${sql}`, { bindings });
      
      const results = db.prepare(sql).all(...bindings) as T[];
      
      const executionTime = Date.now() - startTime;
      logger.debug(`查询执行完成，返回 ${results.length} 条记录，耗时: ${executionTime}ms`);
      
      return results;
    } catch (error) {
      throw this.createDatabaseError('查询多条记录失败', error, { tableName, params });
    }
  }

  /**
   * 分页查询
   * @param tableName 表名
   * @param paginationParams 分页参数
   * @param queryParams 查询参数
   * @returns 分页结果
   */
  public async findWithPagination<T = any>(
    tableName: string,
    paginationParams: PaginationParams,
    queryParams: QueryParams = {}
  ): Promise<PaginatedResult<T>> {
    this.validateConnection();
    
    try {
      const startTime = Date.now();
      
      // 验证分页参数
      const validatedParams = PaginationUtils.validatePaginationParams(paginationParams);
      
      // 首先获取总记录数
      const total = await this.count(tableName, queryParams);
      
      // 如果没有数据，返回空结果
      if (total === 0) {
        return PaginationUtils.createEmptyPaginatedResult<T>(validatedParams);
      }
      
      // 验证页码范围
      const adjustedPage = PaginationUtils.validatePageNumber(
        validatedParams.page,
        total,
        validatedParams.pageSize
      );
      
      if (adjustedPage !== validatedParams.page) {
        validatedParams.page = adjustedPage;
        validatedParams.offset = PaginationUtils.calculateOffset(adjustedPage, validatedParams.pageSize);
      }
      
      // 执行数据查询
      const modifiedParams: QueryParams = {
        ...queryParams,
        limit: validatedParams.pageSize,
        offset: validatedParams.offset
      };
      
      const data = await this.findMany<T>(tableName, modifiedParams);
      
      const executionTime = Date.now() - startTime;
      logger.debug(`分页查询执行完成，耗时: ${executionTime}ms`);
      
      return PaginationUtils.createPaginatedResult(data, total, validatedParams);
    } catch (error) {
      throw this.createDatabaseError('分页查询失败', error, { tableName, paginationParams, queryParams });
    }
  }

  /**
   * 计数查询
   * @param tableName 表名
   * @param params 查询参数
   * @returns 记录总数
   */
  public async count(tableName: string, params: QueryParams = {}): Promise<number> {
    this.validateConnection();
    
    try {
      const builder = SqlQueryBuilder.select(tableName).fields(['COUNT(*) as count']);
      
      // 设置WHERE条件
      if (params.where && params.where.length > 0) {
        builder.where(params.where);
      }
      
      // 设置分组和HAVING条件
      if (params.groupBy && params.groupBy.length > 0) {
        builder.groupBy(params.groupBy);
        if (params.having && params.having.length > 0) {
          builder.having(params.having);
        }
      }
      
      const { sql, bindings } = builder.build();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行计数查询: ${sql}`, { bindings });
      
      const result = db.prepare(sql).get(...bindings) as { count: number } | undefined;
      
      return result?.count || 0;
    } catch (error) {
      throw this.createDatabaseError('计数查询失败', error, { tableName, params });
    }
  }

  /**
   * 插入单条记录
   * @param tableName 表名
   * @param data 要插入的数据
   * @returns 操作结果
   */
  public async insertOne<T = any>(tableName: string, data: Record<string, any>): Promise<OperationResult<T>> {
    this.validateConnection();
    
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('插入数据不能为空');
    }
    
    try {
      const startTime = Date.now();
      
      const builder = SqlQueryBuilder.insert(tableName).fields(data);
      const { sql, bindings } = builder.build();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行插入: ${sql}`, { bindings });
      
      const stmt = db.prepare(sql);
      const result = stmt.run(...bindings);
      
      const executionTime = Date.now() - startTime;
      logger.debug(`插入执行完成，影响 ${result.changes} 行，耗时: ${executionTime}ms`);
      
      return {
        success: true,
        affectedRows: result.changes,
        lastInsertId: Number(result.lastInsertRowid),
        executionTime
      };
    } catch (error) {
      throw this.createDatabaseError('插入记录失败', error, { tableName, data });
    }
  }

  /**
   * 批量插入记录
   * @param tableName 表名
   * @param dataArray 要插入的数据数组
   * @param batchSize 批次大小
   * @returns 操作结果
   */
  public async insertMany<T = any>(
    tableName: string, 
    dataArray: Record<string, any>[], 
    batchSize: number = 100
  ): Promise<OperationResult<T>> {
    this.validateConnection();
    
    if (!dataArray || dataArray.length === 0) {
      throw new ValidationError('插入数据数组不能为空');
    }
    
    if (batchSize < 1 || batchSize > 1000) {
      throw new ValidationError('批次大小必须在1到1000之间');
    }
    
    try {
      const startTime = Date.now();
      let totalAffectedRows = 0;
      let lastInsertId = 0;
      
      // 获取第一条记录的字段作为模板
      const fields = Object.keys(dataArray[0]);
      const placeholders = fields.map(() => '?').join(', ');
      const fieldsList = fields.map(field => `"${field}"`).join(', ');
      
      const sql = `INSERT INTO "${tableName}" (${fieldsList}) VALUES (${placeholders})`;
      const db = this.connection.getDatabase();
      const stmt = db.prepare(sql);
      
      // 分批处理
      for (let i = 0; i < dataArray.length; i += batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        
        const transaction = db.transaction((batch: Record<string, any>[]) => {
          for (const record of batch) {
            const values = fields.map(field => record[field]);
            const result = stmt.run(...values);
            totalAffectedRows += result.changes;
            if (result.lastInsertRowid) {
              lastInsertId = Number(result.lastInsertRowid);
            }
          }
        });
        
        transaction(batch);
      }
      
      const executionTime = Date.now() - startTime;
      logger.info(`批量插入完成，共插入 ${totalAffectedRows} 条记录，耗时: ${executionTime}ms`);
      
      return {
        success: true,
        affectedRows: totalAffectedRows,
        lastInsertId,
        executionTime
      };
    } catch (error) {
      throw this.createDatabaseError('批量插入记录失败', error, { tableName, dataCount: dataArray.length });
    }
  }

  /**
   * 更新记录
   * @param tableName 表名
   * @param data 要更新的数据
   * @param params 查询参数（WHERE条件）
   * @returns 操作结果
   */
  public async update<T = any>(
    tableName: string, 
    data: Record<string, any>, 
    params: QueryParams = {}
  ): Promise<OperationResult<T>> {
    this.validateConnection();
    
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('更新数据不能为空');
    }
    
    try {
      const startTime = Date.now();
      
      const builder = SqlQueryBuilder.update(tableName).fields(data);
      
      // 设置WHERE条件
      if (params.where && params.where.length > 0) {
        builder.where(params.where);
      }
      
      const { sql, bindings } = builder.build();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行更新: ${sql}`, { bindings });
      
      const stmt = db.prepare(sql);
      const result = stmt.run(...bindings);
      
      const executionTime = Date.now() - startTime;
      logger.debug(`更新执行完成，影响 ${result.changes} 行，耗时: ${executionTime}ms`);
      
      return {
        success: true,
        affectedRows: result.changes,
        executionTime
      };
    } catch (error) {
      throw this.createDatabaseError('更新记录失败', error, { tableName, data, params });
    }
  }

  /**
   * 删除记录
   * @param tableName 表名
   * @param params 查询参数（WHERE条件）
   * @returns 操作结果
   */
  public async delete<T = any>(tableName: string, params: QueryParams = {}): Promise<OperationResult<T>> {
    this.validateConnection();
    
    try {
      const startTime = Date.now();
      
      const builder = SqlQueryBuilder.delete(tableName);
      
      // 设置WHERE条件
      if (params.where && params.where.length > 0) {
        builder.where(params.where);
      } else {
        logger.warn(`删除操作未指定WHERE条件，将删除表 ${tableName} 的所有记录`);
      }
      
      const { sql, bindings } = builder.build();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行删除: ${sql}`, { bindings });
      
      const stmt = db.prepare(sql);
      const result = stmt.run(...bindings);
      
      const executionTime = Date.now() - startTime;
      logger.debug(`删除执行完成，影响 ${result.changes} 行，耗时: ${executionTime}ms`);
      
      return {
        success: true,
        affectedRows: result.changes,
        executionTime
      };
    } catch (error) {
      throw this.createDatabaseError('删除记录失败', error, { tableName, params });
    }
  }

  /**
   * 执行原生SQL查询
   * @param sql SQL语句
   * @param bindings 参数绑定
   * @returns 查询结果
   */
  public async executeQuery<T = any>(sql: string, bindings: any[] = []): Promise<T[]> {
    this.validateConnection();
    
    if (!sql || sql.trim() === '') {
      throw new ValidationError('SQL语句不能为空');
    }
    
    try {
      const startTime = Date.now();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行原生SQL: ${sql}`, { bindings });
      
      const stmt = db.prepare(sql);
      const results = stmt.all(...bindings) as T[];
      
      const executionTime = Date.now() - startTime;
      logger.debug(`SQL执行完成，返回 ${results.length} 条记录，耗时: ${executionTime}ms`);
      
      return results;
    } catch (error) {
      throw this.createDatabaseError('执行SQL查询失败', error, { sql, bindings });
    }
  }

  /**
   * 执行原生SQL语句（非查询）
   * @param sql SQL语句
   * @param bindings 参数绑定
   * @returns 操作结果
   */
  public async executeStatement<T = any>(sql: string, bindings: any[] = []): Promise<OperationResult<T>> {
    this.validateConnection();
    
    if (!sql || sql.trim() === '') {
      throw new ValidationError('SQL语句不能为空');
    }
    
    try {
      const startTime = Date.now();
      const db = this.connection.getDatabase();
      
      logger.debug(`执行SQL语句: ${sql}`, { bindings });
      
      const stmt = db.prepare(sql);
      const result = stmt.run(...bindings);
      
      const executionTime = Date.now() - startTime;
      logger.debug(`SQL执行完成，影响 ${result.changes} 行，耗时: ${executionTime}ms`);
      
      return {
        success: true,
        affectedRows: result.changes,
        lastInsertId: result.lastInsertRowid ? Number(result.lastInsertRowid) : undefined,
        executionTime
      };
    } catch (error) {
      throw this.createDatabaseError('执行SQL语句失败', error, { sql, bindings });
    }
  }

  /**
   * 执行事务
   * @param operations 事务操作函数
   * @param options 事务选项
   * @returns 事务执行结果
   */
  public async transaction<T = any>(
    operations: (operator: DatabaseOperator) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    this.validateConnection();
    
    const db = this.connection.getDatabase();
    
    // 创建事务函数
    const transactionType = options.exclusive ? 'EXCLUSIVE' : options.immediate ? 'IMMEDIATE' : 'DEFERRED';
    const transaction = db.transaction(async () => {
      return await operations(this);
    });
    
    try {
      logger.debug(`开始执行事务 (${transactionType})`);
      const startTime = Date.now();
      
      const result = transaction();
      
      const executionTime = Date.now() - startTime;
      logger.debug(`事务执行完成，耗时: ${executionTime}ms`);
      
      return result;
    } catch (error) {
      logger.error('事务执行失败:', error);
      throw this.createDatabaseError('事务执行失败', error);
    }
  }

  /**
   * 验证连接状态
   */
  private validateConnection(): void {
    if (!this.connection.isConnectionActive()) {
      throw new InternalServerError('数据库连接未激活');
    }
  }

  /**
   * 创建数据库错误
   * @param message 错误消息
   * @param originalError 原始错误
   * @param context 上下文信息
   * @returns DatabaseError
   */
  private createDatabaseError(message: string, originalError: any, context?: any): DatabaseError {
    const error = new Error(message) as DatabaseError;
    error.name = 'DatabaseError';
    
    if (originalError) {
      error.code = originalError.code;
      error.sqlMessage = originalError.message;
      error.stack = originalError.stack;
    }
    
    if (context) {
      logger.error('数据库操作上下文:', context);
    }
    
    return error;
  }

  /**
   * 获取数据库连接
   * @returns 数据库连接实例
   */
  public getConnection(): DatabaseConnection {
    return this.connection;
  }
}
