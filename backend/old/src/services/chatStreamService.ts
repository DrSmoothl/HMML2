/**
 * ChatStream表专用操作服务
 * 提供对chat_streams表的高级操作功能
 */

import { logger } from '../core/logger';
import { databaseManager } from '../core/database';
import { pathCacheManager } from '../core/pathCacheManager';
import { 
  ChatStreamRecord, 
  ChatStreamInsertData, 
  ChatStreamUpdateData,
  ChatStreamQueryFilter,
  ChatStreamPaginationParams,
  ChatStreamQueryResponse
} from '../types/chatStream';
import { QueryFilter, PaginationParams, SortParams } from '../types/database';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';
import path from 'path';

export class ChatStreamService {
  private static readonly TABLE_NAME = 'chat_streams';
  private static readonly CONNECTION_NAME = 'maibot';

  /**
   * 初始化麦麦数据库连接
   */
  private static async initConnection(): Promise<void> {
    const mainRoot = pathCacheManager.getMainRoot();
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
   * 验证聊天流数据
   */
  private static validateChatStreamData(data: ChatStreamInsertData | ChatStreamUpdateData): void {
    const requiredFields = ['stream_id', 'group_platform', 'group_id', 'group_name', 'platform', 'user_platform', 'user_id', 'user_nickname', 'user_cardname'];
    
    for (const field of requiredFields) {
      if (!(field in data) || !data[field as keyof typeof data]) {
        throw new ValidationError(`字段 ${field} 不能为空`);
      }
    }

    // 验证数字字段
    const numericFields = ['create_time', 'last_active_time'];
    for (const field of numericFields) {
      if (field in data && typeof data[field as keyof typeof data] !== 'number') {
        throw new ValidationError(`字段 ${field} 必须是数字类型`);
      }
    }

    // 验证时间字段的合理性
    if ('create_time' in data && data.create_time !== undefined && data.create_time <= 0) {
      throw new ValidationError('create_time 必须是大于0的时间戳');
    }

    if ('last_active_time' in data && data.last_active_time !== undefined && data.last_active_time <= 0) {
      throw new ValidationError('last_active_time 必须是大于0的时间戳');
    }
  }

  /**
   * 构建查询过滤条件
   */
  private static buildQueryFilters(filter: ChatStreamQueryFilter): QueryFilter[] {
    const conditions: QueryFilter[] = [];

    if (filter.stream_id) {
      conditions.push({ field: 'stream_id', operator: '=', value: filter.stream_id });
    }

    if (filter.group_platform) {
      conditions.push({ field: 'group_platform', operator: '=', value: filter.group_platform });
    }

    if (filter.group_id) {
      conditions.push({ field: 'group_id', operator: '=', value: filter.group_id });
    }

    if (filter.group_name) {
      conditions.push({ field: 'group_name', operator: 'LIKE', value: `%${filter.group_name}%` });
    }

    if (filter.platform) {
      conditions.push({ field: 'platform', operator: '=', value: filter.platform });
    }

    if (filter.user_platform) {
      conditions.push({ field: 'user_platform', operator: '=', value: filter.user_platform });
    }

    if (filter.user_id) {
      conditions.push({ field: 'user_id', operator: '=', value: filter.user_id });
    }

    if (filter.user_nickname) {
      conditions.push({ field: 'user_nickname', operator: 'LIKE', value: `%${filter.user_nickname}%` });
    }

    if (filter.user_cardname) {
      conditions.push({ field: 'user_cardname', operator: 'LIKE', value: `%${filter.user_cardname}%` });
    }

    return conditions;
  }

  /**
   * 分页查询聊天流
   */
  public static async getChatStreams(params: ChatStreamPaginationParams): Promise<ChatStreamQueryResponse> {
    try {
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 构建查询条件
      const conditions = params.filter ? this.buildQueryFilters(params.filter) : [];

      // 构建分页参数
      const paginationParams: PaginationParams = {
        page: params.page,
        pageSize: params.pageSize
      };

      // 构建排序参数
      const orderByParams: SortParams[] | undefined = params.orderBy ? [{
        field: params.orderBy,
        order: params.orderDir || 'ASC'
      }] : undefined;

      const result = await operator.findWithPagination<ChatStreamRecord>(
        this.TABLE_NAME,
        paginationParams,
        {
          where: conditions.length > 0 ? conditions : undefined,
          orderBy: orderByParams
        }
      );

      return {
        items: result.data,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev
      };

    } catch (error) {
      logger.error('查询聊天流失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询聊天流失败');
    }
  }

  /**
   * 根据ID获取单个聊天流
   */
  public static async getChatStreamById(id: number): Promise<ChatStreamRecord | null> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findOne<ChatStreamRecord>(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      return result;

    } catch (error) {
      logger.error('根据ID查询聊天流失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询聊天流失败');
    }
  }

  /**
   * 插入新的聊天流
   */
  public static async insertChatStream(data: ChatStreamInsertData): Promise<number> {
    try {
      this.validateChatStreamData(data);
      
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.insertOne(this.TABLE_NAME, data);
      
      logger.info(`成功插入聊天流，ID: ${result.lastInsertId}, stream_id: ${data.stream_id}`);
      return result.lastInsertId || 0;

    } catch (error) {
      logger.error('插入聊天流失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('插入聊天流失败');
    }
  }

  /**
   * 更新聊天流
   */
  public static async updateChatStream(data: ChatStreamUpdateData): Promise<void> {
    try {
      if (!data.id || data.id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      this.validateChatStreamData(data);
      
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existing = await this.getChatStreamById(data.id);
      if (!existing) {
        throw new NotFoundError(`未找到ID为 ${data.id} 的聊天流记录`);
      }

      const { id, ...updateData } = data;
      const result = await operator.update(
        this.TABLE_NAME,
        updateData,
        { where: [{ field: 'id', operator: '=', value: id }] }
      );

      if (result.affectedRows === 0) {
        throw new NotFoundError(`未找到ID为 ${id} 的聊天流记录`);
      }

      logger.info(`成功更新聊天流，ID: ${id}`);

    } catch (error) {
      logger.error('更新聊天流失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('更新聊天流失败');
    }
  }

  /**
   * 删除聊天流
   */
  public static async deleteChatStream(id: number): Promise<void> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existing = await this.getChatStreamById(id);
      if (!existing) {
        throw new NotFoundError(`未找到ID为 ${id} 的聊天流记录`);
      }

      const result = await operator.delete(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      if (result.affectedRows === 0) {
        throw new NotFoundError(`未找到ID为 ${id} 的聊天流记录`);
      }

      logger.info(`成功删除聊天流，ID: ${id}`);

    } catch (error) {
      logger.error('删除聊天流失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('删除聊天流失败');
    }
  }

  /**
   * 根据stream_id查询聊天流
   */
  public static async getChatStreamByStreamId(streamId: string): Promise<ChatStreamRecord | null> {
    try {
      if (!streamId) {
        throw new ValidationError('stream_id不能为空');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findOne<ChatStreamRecord>(this.TABLE_NAME, {
        where: [{ field: 'stream_id', operator: '=', value: streamId }]
      });

      return result;

    } catch (error) {
      logger.error('根据stream_id查询聊天流失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询聊天流失败');
    }
  }

  /**
   * 获取聊天流统计信息
   */
  public static async getChatStreamStats(): Promise<any> {
    try {
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 总数统计
      const totalCount = await operator.count(this.TABLE_NAME);

      // 按平台统计
      const platformStats = await operator.executeQuery(`
        SELECT platform, COUNT(*) as count 
        FROM ${this.TABLE_NAME} 
        GROUP BY platform
      `);

      // 按群组平台统计
      const groupPlatformStats = await operator.executeQuery(`
        SELECT group_platform, COUNT(*) as count 
        FROM ${this.TABLE_NAME} 
        GROUP BY group_platform
      `);

      // 最近活跃的聊天流
      const recentActiveStreams = await operator.executeQuery(`
        SELECT COUNT(*) as count 
        FROM ${this.TABLE_NAME} 
        WHERE last_active_time > ?
      `, [Date.now() - 24 * 60 * 60 * 1000]); // 24小时内

      return {
        totalCount,
        platformStats,
        groupPlatformStats,
        recentActiveCount: recentActiveStreams[0]?.count || 0
      };

    } catch (error) {
      logger.error('获取聊天流统计信息失败:', error);
      throw new InternalServerError('获取聊天流统计信息失败');
    }
  }
}
