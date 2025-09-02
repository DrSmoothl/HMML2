/**
 * Expression表操作服务
 * 提供Expression表的所有数据库操作功能
 */

import * as path from 'path';
import { databaseManager } from '../core/database';
import { pathCacheManager } from '../core/pathCacheManager';
import { logger } from '../core/logger';
import { 
  ExpressionRecord, 
  ExpressionInsertData, 
  ExpressionUpdateData,
  ExpressionPaginationParams,
  ExpressionPaginationResult,
  ExpressionStats,
  ExpressionType
} from '../types/expression';
import { 
  ValidationError, 
  NotFoundError, 
  InternalServerError 
} from '../middleware/errorHandler';

export class ExpressionService {
  private static readonly TABLE_NAME = 'expression';
  private static readonly CONNECTION_NAME = 'maimai_db';

  /**
   * 初始化数据库连接
   */
  private static async initConnection(): Promise<void> {
    const pathCache = await pathCacheManager.getAllPaths();
    const mainRoot = pathCache.mainRoot;

    if (!mainRoot) {
      throw new NotFoundError('麦麦主程序根目录未设置，请先设置根目录缓存');
    }

    const dbPath = path.join(mainRoot, 'data', 'MaiBot.db');
    
    // 检查连接是否已存在
    if (!databaseManager.hasConnection(this.CONNECTION_NAME)) {
      if (!databaseManager.isManagerInitialized()) {
        await databaseManager.initialize();
      }
      
      await databaseManager.addDatabase(this.CONNECTION_NAME, {
        path: dbPath,
        readonly: false,
        timeout: 5000,
        fileMustExist: true
      });
      
      logger.info('麦麦数据库连接已建立');
    }
  }

  /**
   * 验证Expression数据
   */
  private static validateExpressionData(data: ExpressionInsertData | ExpressionUpdateData): void {
    const errors: string[] = [];

    // 验证situation
    if ('situation' in data && data.situation !== undefined) {
      if (!data.situation || typeof data.situation !== 'string') {
        errors.push('situation必须是非空字符串');
      } else if (data.situation.length > 500) {
        errors.push('situation长度不能超过500字符');
      }
    }

    // 验证style
    if ('style' in data && data.style !== undefined) {
      if (!data.style || typeof data.style !== 'string') {
        errors.push('style必须是非空字符串');
      } else if (data.style.length > 1000) {
        errors.push('style长度不能超过1000字符');
      }
    }

    // 验证count
    if ('count' in data && data.count !== undefined) {
      if (typeof data.count !== 'number' || data.count < 0) {
        errors.push('count必须是非负数字');
      }
    }

    // 验证chat_id
    if ('chat_id' in data && data.chat_id !== undefined) {
      if (!data.chat_id || typeof data.chat_id !== 'string') {
        errors.push('chat_id必须是非空字符串');
      } else if (data.chat_id.length > 100) {
        errors.push('chat_id长度不能超过100字符');
      }
    }

    // 验证type
    if ('type' in data && data.type !== undefined) {
      if (!data.type || typeof data.type !== 'string') {
        errors.push('type必须是非空字符串');
      } else if (!Object.values(ExpressionType).includes(data.type as ExpressionType)) {
        errors.push('type必须是style或grammar');
      }
    }

    // 验证时间字段
    if ('last_active_time' in data && data.last_active_time !== undefined) {
      if (typeof data.last_active_time !== 'number' || data.last_active_time < 0) {
        errors.push('last_active_time必须是非负数字');
      }
    }

    if ('create_date' in data && data.create_date !== undefined) {
      if (typeof data.create_date !== 'number' || data.create_date < 0) {
        errors.push('create_date必须是非负数字');
      }
    }

    // 如果是插入数据，验证必需字段
    if (!('id' in data)) {
      const insertData = data as ExpressionInsertData;
      if (!insertData.situation) errors.push('situation是必需字段');
      if (!insertData.style) errors.push('style是必需字段');
      if (!insertData.chat_id) errors.push('chat_id是必需字段');
      if (!insertData.type) errors.push('type是必需字段');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
  }

  /**
   * 分页查询expression
   */
  public static async getExpressions(params: ExpressionPaginationParams): Promise<ExpressionPaginationResult> {
    try {
      // 验证分页参数
      if (params.page < 1) {
        throw new ValidationError('页码必须大于0');
      }
      if (params.pageSize < 1 || params.pageSize > 100) {
        throw new ValidationError('每页记录数必须在1-100之间');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 构建查询条件
      const conditions: any[] = [];
      
      if (params.filter) {
        const filter = params.filter;
        
        if (filter.situation) {
          conditions.push({ field: 'situation', operator: 'LIKE', value: `%${filter.situation}%` });
        }
        if (filter.style) {
          conditions.push({ field: 'style', operator: 'LIKE', value: `%${filter.style}%` });
        }
        if (filter.chat_id) {
          conditions.push({ field: 'chat_id', operator: '=', value: filter.chat_id });
        }
        if (filter.type) {
          conditions.push({ field: 'type', operator: '=', value: filter.type });
        }
        if (filter.minCount !== undefined) {
          conditions.push({ field: 'count', operator: '>=', value: filter.minCount });
        }
        if (filter.maxCount !== undefined) {
          conditions.push({ field: 'count', operator: '<=', value: filter.maxCount });
        }
        if (filter.startDate !== undefined) {
          conditions.push({ field: 'create_date', operator: '>=', value: filter.startDate });
        }
        if (filter.endDate !== undefined) {
          conditions.push({ field: 'create_date', operator: '<=', value: filter.endDate });
        }
      }

      // 获取总记录数
      const totalCount = await operator.count(this.TABLE_NAME, conditions.length > 0 ? { where: conditions } : {});

      // 计算分页信息
      const totalPages = Math.ceil(totalCount / params.pageSize);
      const offset = (params.page - 1) * params.pageSize;

      // 查询当前页数据
      const queryOptions: any = {
        limit: params.pageSize,
        offset: offset,
        orderBy: [{ 
          field: params.orderBy || 'id', 
          order: params.orderDir || 'ASC' 
        }]
      };

      if (conditions.length > 0) {
        queryOptions.where = conditions;
      }

      const items = await operator.findMany<ExpressionRecord>(this.TABLE_NAME, queryOptions);

      const result: ExpressionPaginationResult = {
        items,
        total: totalCount,
        totalPages,
        currentPage: params.page,
        pageSize: params.pageSize,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1
      };

      return result;

    } catch (error) {
      logger.error('分页查询expression失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询expression失败');
    }
  }

  /**
   * 根据ID查询单个expression
   */
  public static async getExpressionById(id: number): Promise<ExpressionRecord | null> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findOne<ExpressionRecord>(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      return result;

    } catch (error) {
      logger.error('根据ID查询expression失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询expression失败');
    }
  }

  /**
   * 插入expression
   */
  public static async insertExpression(data: ExpressionInsertData): Promise<number> {
    try {
      this.validateExpressionData(data);

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 设置默认值（只对用户未提供的字段设置默认值）
      const currentTime = Date.now() / 1000;
      const defaults = {
        count: 0,
        last_active_time: currentTime,
        create_date: currentTime,
      };
      
      // 合并数据，用户提供的数据优先
      const insertData = { ...defaults, ...data };

      const result = await operator.insertOne(this.TABLE_NAME, insertData);

      if (!result.lastInsertId) {
        throw new InternalServerError('插入expression失败，未获得插入ID');
      }

      logger.info(`expression插入成功，ID: ${result.lastInsertId}`);
      return result.lastInsertId;

    } catch (error) {
      logger.error('插入expression失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('插入expression失败');
    }
  }

  /**
   * 更新expression
   */
  public static async updateExpression(data: ExpressionUpdateData): Promise<boolean> {
    try {
      if (!data.id || data.id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      this.validateExpressionData(data);

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existingRecord = await this.getExpressionById(data.id);
      if (!existingRecord) {
        throw new NotFoundError('要更新的expression记录不存在');
      }

      // 提取更新数据（排除id）
      const { id, ...updateData } = data;

      const result = await operator.update(this.TABLE_NAME, updateData, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      if (result.affectedRows === 0) {
        throw new InternalServerError('更新expression失败，未影响任何记录');
      }

      logger.info(`expression更新成功，ID: ${id}`);
      return true;

    } catch (error) {
      logger.error('更新expression失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('更新expression失败');
    }
  }

  /**
   * 删除expression
   */
  public static async deleteExpression(id: number): Promise<boolean> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existingRecord = await this.getExpressionById(id);
      if (!existingRecord) {
        throw new NotFoundError('要删除的expression记录不存在');
      }

      const result = await operator.delete(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      if (result.affectedRows === 0) {
        throw new InternalServerError('删除expression失败，未影响任何记录');
      }

      logger.info(`expression删除成功，ID: ${id}`);
      return true;

    } catch (error) {
      logger.error('删除expression失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('删除expression失败');
    }
  }

  /**
   * 增加统计次数
   */
  public static async incrementCount(id: number): Promise<void> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 使用原生SQL更新统计次数和最后活跃时间
      await operator.executeStatement(
        'UPDATE expression SET count = count + 1, last_active_time = ? WHERE id = ?',
        [Date.now() / 1000, id]
      );

    } catch (error) {
      logger.error('增加统计次数失败:', error);
      // 这个操作失败不应该影响主要业务流程，只记录错误
    }
  }

  /**
   * 根据聊天ID查询expression
   */
  public static async getExpressionsByChatId(chatId: string, limit: number = 10): Promise<ExpressionRecord[]> {
    try {
      if (!chatId) {
        throw new ValidationError('聊天ID不能为空');
      }

      if (limit < 1 || limit > 100) {
        throw new ValidationError('限制数量必须在1-100之间');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findMany<ExpressionRecord>(this.TABLE_NAME, {
        where: [{ field: 'chat_id', operator: '=', value: chatId }],
        orderBy: [{ field: 'last_active_time', order: 'DESC' }],
        limit
      });

      return result;

    } catch (error) {
      logger.error('根据聊天ID查询expression失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询expression失败');
    }
  }

  /**
   * 根据类型查询expression
   */
  public static async getExpressionsByType(type: string, limit: number = 10): Promise<ExpressionRecord[]> {
    try {
      if (!type) {
        throw new ValidationError('类型不能为空');
      }

      if (!Object.values(ExpressionType).includes(type as ExpressionType)) {
        throw new ValidationError('类型必须是style或grammar');
      }

      if (limit < 1 || limit > 100) {
        throw new ValidationError('限制数量必须在1-100之间');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findMany<ExpressionRecord>(this.TABLE_NAME, {
        where: [{ field: 'type', operator: '=', value: type }],
        orderBy: [{ field: 'count', order: 'DESC' }],
        limit
      });

      return result;

    } catch (error) {
      logger.error('根据类型查询expression失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询expression失败');
    }
  }

  /**
   * 获取expression统计信息
   */
  public static async getExpressionStats(): Promise<ExpressionStats> {
    try {
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 获取总数
      const total = await operator.count(this.TABLE_NAME, {});

      // 获取按类型统计
      const typeStats = await operator.executeQuery<{ type: string; count: number }>(
        'SELECT type, COUNT(*) as count FROM expression GROUP BY type'
      );

      // 获取按聊天ID统计（取前10个最活跃的）
      const chatStats = await operator.executeQuery<{ chat_id: string; count: number }>(
        'SELECT chat_id, COUNT(*) as count FROM expression GROUP BY chat_id ORDER BY count DESC LIMIT 10'
      );

      // 获取平均统计次数和总统计次数
      const countStats = await operator.executeQuery<{ avgCount: number; totalCount: number }>(
        'SELECT AVG(count) as avgCount, SUM(count) as totalCount FROM expression'
      );

      // 获取最近活跃的expression数量（24小时内）
      const dayAgo = (Date.now() / 1000) - (24 * 60 * 60);
      const recentActive = await operator.count(this.TABLE_NAME, {
        where: [{ field: 'last_active_time', operator: '>=', value: dayAgo }]
      });

      // 处理统计结果
      const byType: Record<string, number> = {};
      typeStats.forEach((row) => {
        byType[row.type] = row.count;
      });

      const byChatId: Record<string, number> = {};
      chatStats.forEach((row) => {
        byChatId[row.chat_id] = row.count;
      });

      const avgCount = countStats[0]?.avgCount || 0;
      const totalCount = countStats[0]?.totalCount || 0;

      const result: ExpressionStats = {
        total,
        byType,
        byChatId,
        avgCount: Math.round(avgCount * 100) / 100, // 保留2位小数
        totalCount,
        recentActive
      };

      return result;

    } catch (error) {
      logger.error('获取expression统计信息失败:', error);
      throw new InternalServerError('获取expression统计信息失败');
    }
  }

  /**
   * 搜索expression（按情境和风格）
   */
  public static async searchExpressions(
    keyword: string, 
    limit: number = 20
  ): Promise<ExpressionRecord[]> {
    try {
      if (!keyword || keyword.trim().length === 0) {
        throw new ValidationError('搜索关键字不能为空');
      }

      if (limit < 1 || limit > 100) {
        throw new ValidationError('限制数量必须在1-100之间');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 使用原生SQL查询来实现OR逻辑
      const result = await operator.executeQuery<ExpressionRecord>(
        `SELECT * FROM ${this.TABLE_NAME} 
         WHERE situation LIKE ? OR style LIKE ? 
         ORDER BY count DESC, last_active_time DESC 
         LIMIT ?`,
        [`%${keyword}%`, `%${keyword}%`, limit]
      );

      return result;

    } catch (error) {
      logger.error('搜索expression失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('搜索expression失败');
    }
  }
}
