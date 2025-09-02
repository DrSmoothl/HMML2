/**
 * Emoji表专用操作服务
 * 提供对emoji表的高级操作功能
 */

import { logger } from '../core/logger';
import { databaseManager } from '../core/database';
import { pathCacheManager } from '../core/pathCacheManager';
import { 
  EmojiRecord, 
  EmojiInsertData, 
  EmojiUpdateData,
  EmojiQueryFilter,
  EmojiPaginationParams,
  EmojiQueryResponse
} from '../types/emoji';
import { QueryFilter, PaginationParams, SortParams } from '../types/database';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export class EmojiService {
  private static readonly TABLE_NAME = 'emoji';
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
   * 验证emoji数据
   */
  private static validateEmojiData(data: EmojiInsertData | EmojiUpdateData): void {
    const requiredFields = ['full_path', 'format', 'emoji_hash', 'description', 'emotion'];
    
    for (const field of requiredFields) {
      if (!(field in data) || !data[field as keyof typeof data]) {
        throw new ValidationError(`字段 ${field} 不能为空`);
      }
    }

    // 验证数字字段
    const numericFields = ['query_count', 'is_registered', 'is_banned', 'record_time', 'register_time', 'usage_count', 'last_used_time'];
    for (const field of numericFields) {
      if (field in data && typeof data[field as keyof typeof data] !== 'number') {
        throw new ValidationError(`字段 ${field} 必须是数字类型`);
      }
    }

    // 验证布尔字段（0或1）
    if ('is_registered' in data && (data.is_registered !== 0 && data.is_registered !== 1)) {
      throw new ValidationError('is_registered 必须是0或1');
    }

    if ('is_banned' in data && (data.is_banned !== 0 && data.is_banned !== 1)) {
      throw new ValidationError('is_banned 必须是0或1');
    }
  }

  /**
   * 构建查询条件
   */
  private static buildWhereConditions(filter?: EmojiQueryFilter): QueryFilter[] {
    if (!filter) return [];

    const conditions: QueryFilter[] = [];

    if (filter.format) {
      conditions.push({ field: 'format', operator: '=', value: filter.format });
    }

    if (filter.emotion) {
      conditions.push({ field: 'emotion', operator: '=', value: filter.emotion });
    }

    if (filter.is_registered !== undefined) {
      conditions.push({ field: 'is_registered', operator: '=', value: filter.is_registered });
    }

    if (filter.is_banned !== undefined) {
      conditions.push({ field: 'is_banned', operator: '=', value: filter.is_banned });
    }

    if (filter.description) {
      conditions.push({ field: 'description', operator: 'LIKE', value: `%${filter.description}%` });
    }

    if (filter.emoji_hash) {
      conditions.push({ field: 'emoji_hash', operator: '=', value: filter.emoji_hash });
    }

    return conditions;
  }

  /**
   * 查询emoji（分页）
   */
  public static async getEmojis(params: EmojiPaginationParams): Promise<EmojiQueryResponse> {
    try {
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 验证分页参数
      if (params.page < 1) {
        throw new ValidationError('页码必须大于0');
      }

      if (params.pageSize < 1 || params.pageSize > 1000) {
        throw new ValidationError('页大小必须在1-1000之间');
      }

      // 构建查询参数
      const paginationParams: PaginationParams = {
        page: params.page,
        pageSize: params.pageSize,
        offset: (params.page - 1) * params.pageSize
      };

      const queryParams: any = {};

      // 构建WHERE条件
      if (params.filter) {
        queryParams.where = this.buildWhereConditions(params.filter);
      }

      // 构建排序条件
      if (params.orderBy) {
        const orderBy: SortParams[] = [{
          field: params.orderBy,
          order: params.orderDir || 'ASC'
        }];
        queryParams.orderBy = orderBy;
      } else {
        // 默认按ID降序排列
        queryParams.orderBy = [{ field: 'id', order: 'DESC' }];
      }

      // 执行查询
      const result = await operator.findWithPagination<EmojiRecord>(
        this.TABLE_NAME,
        paginationParams,
        queryParams
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
      logger.error('查询emoji失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError 
        ? error 
        : new InternalServerError('查询emoji失败');
    }
  }

  /**
   * 根据ID查询单个emoji
   */
  public static async getEmojiById(id: number): Promise<EmojiRecord | null> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findOne<EmojiRecord>(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      return result;

    } catch (error) {
      logger.error('根据ID查询emoji失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询emoji失败');
    }
  }

  /**
   * 插入emoji
   */
  public static async insertEmoji(data: EmojiInsertData): Promise<number> {
    try {
      this.validateEmojiData(data);

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 设置默认值（只对用户未提供的字段设置默认值）
      const currentTime = Date.now() / 1000;
      const defaults = {
        query_count: 0,
        is_registered: 0,
        is_banned: 0,
        record_time: currentTime,
        register_time: currentTime,
        usage_count: 0,
        last_used_time: currentTime,
      };
      
      // 合并数据，用户提供的数据优先
      const insertData = { ...defaults, ...data };

      const result = await operator.insertOne(this.TABLE_NAME, insertData);

      if (!result.lastInsertId) {
        throw new InternalServerError('插入emoji失败，未获得插入ID');
      }

      logger.info(`emoji插入成功，ID: ${result.lastInsertId}`);
      return result.lastInsertId;

    } catch (error) {
      logger.error('插入emoji失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('插入emoji失败');
    }
  }

  /**
   * 更新emoji
   */
  public static async updateEmoji(data: EmojiUpdateData): Promise<boolean> {
    try {
      if (!data.id || data.id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      // 验证更新数据（排除id字段）
      const { id, ...updateData } = data;
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('更新数据不能为空');
      }

      this.validateEmojiData(updateData as EmojiInsertData);

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existingRecord = await this.getEmojiById(id);
      if (!existingRecord) {
        throw new NotFoundError('要更新的emoji记录不存在');
      }

      const result = await operator.update(this.TABLE_NAME, updateData, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      if (result.affectedRows === 0) {
        throw new InternalServerError('更新emoji失败，未影响任何记录');
      }

      logger.info(`emoji更新成功，ID: ${id}`);
      return true;

    } catch (error) {
      logger.error('更新emoji失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('更新emoji失败');
    }
  }

  /**
   * 删除emoji
   */
  public static async deleteEmoji(id: number): Promise<boolean> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existingRecord = await this.getEmojiById(id);
      if (!existingRecord) {
        throw new NotFoundError('要删除的emoji记录不存在');
      }

      const result = await operator.delete(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      if (result.affectedRows === 0) {
        throw new InternalServerError('删除emoji失败，未影响任何记录');
      }

      logger.info(`emoji删除成功，ID: ${id}`);
      return true;

    } catch (error) {
      logger.error('删除emoji失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('删除emoji失败');
    }
  }

  /**
   * 增加查询次数
   */
  public static async incrementQueryCount(id: number): Promise<void> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 使用原生SQL更新查询次数
      await operator.executeStatement(
        'UPDATE emoji SET query_count = query_count + 1, last_used_time = ? WHERE id = ?',
        [Date.now() / 1000, id]
      );

    } catch (error) {
      logger.error('增加查询次数失败:', error);
      // 这个操作失败不应该影响主要业务流程，只记录错误
    }
  }

  /**
   * 根据哈希值查询emoji
   */
  public static async getEmojiByHash(emojiHash: string): Promise<EmojiRecord | null> {
    try {
      if (!emojiHash) {
        throw new ValidationError('emoji哈希值不能为空');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findOne<EmojiRecord>(this.TABLE_NAME, {
        where: [{ field: 'emoji_hash', operator: '=', value: emojiHash }]
      });

      return result;

    } catch (error) {
      logger.error('根据哈希值查询emoji失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询emoji失败');
    }
  }

  /**
   * 根据ID获取emoji图片的Base64编码
   */
  public static async getEmojiImage(id: number): Promise<string> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      // 获取emoji记录
      const emojiRecord = await this.getEmojiById(id);
      if (!emojiRecord) {
        throw new NotFoundError(`未找到ID为 ${id} 的emoji记录`);
      }

      // 获取麦麦根目录
      const mainRoot = pathCacheManager.getMainRoot();
      if (!mainRoot) {
        throw new NotFoundError('麦麦主程序根目录未设置，请先设置根目录缓存');
      }

      // 构建完整文件路径
      // full_path 是相对于麦麦根目录的路径，例如：data\emoji_registed\1753422909_5df38f6a.gif
      const fullFilePath = path.join(mainRoot, emojiRecord.full_path);
      
      // 检查文件是否存在
      if (!fs.existsSync(fullFilePath)) {
        throw new NotFoundError(`emoji文件不存在: ${fullFilePath}`);
      }

      // 读取文件内容并转换为Base64
      try {
        const fileBuffer = fs.readFileSync(fullFilePath);
        const base64String = fileBuffer.toString('base64');
        
        logger.info(`成功读取emoji图片，ID: ${id}, 文件大小: ${fileBuffer.length} 字节`);
        return base64String;
      } catch (fileError) {
        logger.error(`读取emoji文件失败: ${fullFilePath}`, fileError);
        throw new InternalServerError(`读取emoji文件失败: ${fileError instanceof Error ? fileError.message : '未知错误'}`);
      }

    } catch (error) {
      logger.error('获取emoji图片失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('获取emoji图片失败');
    }
  }

  /**
   * 获取emoji统计信息
   */
  public static async getEmojiStats(): Promise<{
    total: number;
    registered: number;
    banned: number;
    byFormat: Record<string, number>;
    byEmotion: Record<string, number>;
  }> {
    try {
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 获取总数
      const total = await operator.count(this.TABLE_NAME);

      // 获取已注册数量
      const registered = await operator.count(this.TABLE_NAME, {
        where: [{ field: 'is_registered', operator: '=', value: 1 }]
      });

      // 获取被禁止数量
      const banned = await operator.count(this.TABLE_NAME, {
        where: [{ field: 'is_banned', operator: '=', value: 1 }]
      });

      // 按格式统计
      const formatStats = await operator.executeQuery<{ format: string; count: number }>(
        'SELECT format, COUNT(*) as count FROM emoji GROUP BY format ORDER BY count DESC'
      );

      // 按情感统计
      const emotionStats = await operator.executeQuery<{ emotion: string; count: number }>(
        'SELECT emotion, COUNT(*) as count FROM emoji GROUP BY emotion ORDER BY count DESC'
      );

      return {
        total,
        registered,
        banned,
        byFormat: Object.fromEntries(formatStats.map(item => [item.format, item.count])),
        byEmotion: Object.fromEntries(emotionStats.map(item => [item.emotion, item.count]))
      };

    } catch (error) {
      logger.error('获取emoji统计信息失败:', error);
      throw new InternalServerError('获取emoji统计信息失败');
    }
  }

  /**
   * 根据图片路径计算哈希值
   */
  public static async calculateImageHash(imagePath: string): Promise<string> {
    try {
      if (!imagePath) {
        throw new ValidationError('图片路径不能为空');
      }

      // 获取麦麦根目录
      const mainRoot = pathCacheManager.getMainRoot();
      if (!mainRoot) {
        throw new NotFoundError('麦麦主程序根目录未设置，请先设置根目录缓存');
      }

      // 构建完整文件路径
      const fullFilePath = path.join(mainRoot, imagePath);
      
      // 检查文件是否存在
      if (!fs.existsSync(fullFilePath)) {
        throw new NotFoundError(`图片文件不存在: ${fullFilePath}`);
      }

      // 读取文件内容
      try {
        const fileBuffer = fs.readFileSync(fullFilePath);
        
        // 计算MD5哈希值 (与第462行的算法保持一致)
        const imageHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        
        logger.info(`成功计算图片哈希值，路径: ${imagePath}, 哈希值: ${imageHash}, 文件大小: ${fileBuffer.length} 字节`);
        return imageHash;
        
      } catch (fileError) {
        logger.error(`读取图片文件失败: ${fullFilePath}`, fileError);
        throw new InternalServerError(`读取图片文件失败: ${fileError instanceof Error ? fileError.message : '未知错误'}`);
      }

    } catch (error) {
      logger.error('计算图片哈希值失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('计算图片哈希值失败');
    }
  }
}
