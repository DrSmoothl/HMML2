/**
 * PersonInfo表操作服务
 * 提供PersonInfo表的所有数据库操作功能
 */

import * as path from 'path';
import { databaseManager } from '../core/database';
import { pathCacheManager } from '../core/pathCacheManager';
import { logger } from '../core/logger';
import { 
  PersonInfoRecord, 
  PersonInfoInsertData, 
  PersonInfoUpdateData,
  PersonInfoPaginationParams,
  PersonInfoPaginationResult,
  PersonInfoStats,
  Platform,
  FriendlyValueRange,
  AttitudeAssessment,
  PersonalityLevel
} from '../types/personInfo';
import { 
  ValidationError, 
  NotFoundError, 
  InternalServerError 
} from '../middleware/errorHandler';

export class PersonInfoService {
  private static readonly TABLE_NAME = 'person_info';
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
   * 验证PersonInfo数据
   */
  private static validatePersonInfoData(data: PersonInfoInsertData | PersonInfoUpdateData): void {
    const errors: string[] = [];

    // 验证person_id
    if ('person_id' in data && data.person_id !== undefined) {
      if (!data.person_id || typeof data.person_id !== 'string') {
        errors.push('person_id必须是非空字符串');
      } else if (data.person_id.length > 100) {
        errors.push('person_id长度不能超过100字符');
      }
    }

    // 验证person_name
    if ('person_name' in data && data.person_name !== undefined) {
      if (!data.person_name || typeof data.person_name !== 'string') {
        errors.push('person_name必须是非空字符串');
      } else if (data.person_name.length > 200) {
        errors.push('person_name长度不能超过200字符');
      }
    }

    // 验证平台
    if ('platform' in data && data.platform !== undefined) {
      if (!data.platform || typeof data.platform !== 'string') {
        errors.push('platform必须是非空字符串');
      } else if (!Object.values(Platform).includes(data.platform as Platform) && data.platform !== 'other') {
        // 允许自定义平台，不严格限制枚举
        if (data.platform.length > 50) {
          errors.push('platform长度不能超过50字符');
        }
      }
    }

    // 验证user_id
    if ('user_id' in data && data.user_id !== undefined) {
      if (!data.user_id || typeof data.user_id !== 'string') {
        errors.push('user_id必须是非空字符串');
      } else if (data.user_id.length > 100) {
        errors.push('user_id长度不能超过100字符');
      }
    }

    // 验证is_known
    if ('is_known' in data && data.is_known !== undefined) {
      if (typeof data.is_known !== 'number' || (data.is_known !== 0 && data.is_known !== 1)) {
        errors.push('is_known必须是0或1');
      }
    }

    // 验证字符串字段长度
    const stringFields = [
      { field: 'nickname', maxLength: 200 },
      { field: 'name_reason', maxLength: 500 },
      { field: 'points', maxLength: 5000 },
      { field: 'attitude_to_me', maxLength: 200 },
      { field: 'rudeness', maxLength: 200 },
      { field: 'neuroticism', maxLength: 200 },
      { field: 'conscientiousness', maxLength: 200 },
      { field: 'likeness', maxLength: 200 }
    ];

    stringFields.forEach(({ field, maxLength }) => {
      if (field in data && data[field as keyof typeof data] !== undefined) {
        const value = data[field as keyof typeof data];
        if (value && typeof value === 'string' && value.length > maxLength) {
          errors.push(`${field}长度不能超过${maxLength}字符`);
        }
      }
    });

    // 验证数字字段
    if ('know_times' in data && data.know_times !== undefined) {
      if (typeof data.know_times !== 'number' || data.know_times < 0) {
        errors.push('know_times必须是非负数字');
      }
    }

    if ('friendly_value' in data && data.friendly_value !== undefined) {
      if (typeof data.friendly_value !== 'number' || data.friendly_value < 0 || data.friendly_value > 1) {
        errors.push('friendly_value必须是0-1之间的数字');
      }
    }

    // 验证置信度字段
    const confidenceFields = [
      'attitude_to_me_confidence',
      'friendly_value_confidence', 
      'rudeness_confidence',
      'neuroticism_confidence',
      'conscientiousness_confidence',
      'likeness_confidence'
    ];

    confidenceFields.forEach(field => {
      if (field in data && data[field as keyof typeof data] !== undefined) {
        const value = data[field as keyof typeof data];
        if (typeof value !== 'number' || value < 0) {
          errors.push(`${field}必须是非负数字`);
        }
      }
    });

    // 验证时间字段
    const timeFields = ['know_since', 'last_know'];
    timeFields.forEach(field => {
      if (field in data && data[field as keyof typeof data] !== undefined) {
        const value = data[field as keyof typeof data];
        if (typeof value !== 'number' || value < 0) {
          errors.push(`${field}必须是非负数字`);
        }
      }
    });

    // 如果是插入数据，验证必需字段
    if (!('id' in data)) {
      const insertData = data as PersonInfoInsertData;
      if (!insertData.person_id) errors.push('person_id是必需字段');
      if (!insertData.person_name) errors.push('person_name是必需字段');
      if (!insertData.platform) errors.push('platform是必需字段');
      if (!insertData.user_id) errors.push('user_id是必需字段');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
  }

  /**
   * 分页查询PersonInfo
   */
  public static async getPersonInfos(params: PersonInfoPaginationParams): Promise<PersonInfoPaginationResult> {
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
        
        if (filter.person_id) {
          conditions.push({ field: 'person_id', operator: '=', value: filter.person_id });
        }
        if (filter.person_name) {
          conditions.push({ field: 'person_name', operator: 'LIKE', value: `%${filter.person_name}%` });
        }
        if (filter.platform) {
          conditions.push({ field: 'platform', operator: '=', value: filter.platform });
        }
        if (filter.user_id) {
          conditions.push({ field: 'user_id', operator: '=', value: filter.user_id });
        }
        if (filter.nickname) {
          conditions.push({ field: 'nickname', operator: 'LIKE', value: `%${filter.nickname}%` });
        }
        if (filter.is_known !== undefined) {
          conditions.push({ field: 'is_known', operator: '=', value: filter.is_known });
        }
        if (filter.points) {
          conditions.push({ field: 'points', operator: 'LIKE', value: `%${filter.points}%` });
        }
        if (filter.attitude_to_me) {
          conditions.push({ field: 'attitude_to_me', operator: 'LIKE', value: `%${filter.attitude_to_me}%` });
        }
        if (filter.rudeness) {
          conditions.push({ field: 'rudeness', operator: 'LIKE', value: `%${filter.rudeness}%` });
        }
        if (filter.neuroticism) {
          conditions.push({ field: 'neuroticism', operator: 'LIKE', value: `%${filter.neuroticism}%` });
        }
        if (filter.conscientiousness) {
          conditions.push({ field: 'conscientiousness', operator: 'LIKE', value: `%${filter.conscientiousness}%` });
        }
        if (filter.likeness) {
          conditions.push({ field: 'likeness', operator: 'LIKE', value: `%${filter.likeness}%` });
        }
        if (filter.minKnowTimes !== undefined) {
          conditions.push({ field: 'know_times', operator: '>=', value: filter.minKnowTimes });
        }
        if (filter.maxKnowTimes !== undefined) {
          conditions.push({ field: 'know_times', operator: '<=', value: filter.maxKnowTimes });
        }
        if (filter.minFriendlyValue !== undefined) {
          conditions.push({ field: 'friendly_value', operator: '>=', value: filter.minFriendlyValue });
        }
        if (filter.maxFriendlyValue !== undefined) {
          conditions.push({ field: 'friendly_value', operator: '<=', value: filter.maxFriendlyValue });
        }
        if (filter.knowSinceStart !== undefined) {
          conditions.push({ field: 'know_since', operator: '>=', value: filter.knowSinceStart });
        }
        if (filter.knowSinceEnd !== undefined) {
          conditions.push({ field: 'know_since', operator: '<=', value: filter.knowSinceEnd });
        }
        if (filter.lastKnowStart !== undefined) {
          conditions.push({ field: 'last_know', operator: '>=', value: filter.lastKnowStart });
        }
        if (filter.lastKnowEnd !== undefined) {
          conditions.push({ field: 'last_know', operator: '<=', value: filter.lastKnowEnd });
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

      const items = await operator.findMany<PersonInfoRecord>(this.TABLE_NAME, queryOptions);

      const result: PersonInfoPaginationResult = {
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
      logger.error('分页查询PersonInfo失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询PersonInfo失败');
    }
  }

  /**
   * 根据ID查询单个PersonInfo
   */
  public static async getPersonInfoById(id: number): Promise<PersonInfoRecord | null> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findOne<PersonInfoRecord>(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      return result;

    } catch (error) {
      logger.error('根据ID查询PersonInfo失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询PersonInfo失败');
    }
  }

  /**
   * 插入PersonInfo
   */
  public static async insertPersonInfo(data: PersonInfoInsertData): Promise<number> {
    try {
      this.validatePersonInfoData(data);

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查person_id + platform + user_id是否已存在
      const existingRecord = await operator.findOne<PersonInfoRecord>(this.TABLE_NAME, {
        where: [
          { field: 'person_id', operator: '=', value: data.person_id },
          { field: 'platform', operator: '=', value: data.platform },
          { field: 'user_id', operator: '=', value: data.user_id }
        ]
      });

      if (existingRecord) {
        throw new ValidationError(`person_id: ${data.person_id} 在平台 ${data.platform} 上的用户 ${data.user_id} 已存在`);
      }

      // 设置默认值
      const currentTime = Date.now() / 1000;
      const defaults = {
        is_known: 0,
        name_reason: '',
        nickname: data.person_name, // 默认昵称为人物名称
        points: '',
        know_times: 0,
        know_since: currentTime,
        last_know: currentTime,
        attitude_to_me: '',
        attitude_to_me_confidence: 0,
        friendly_value: 0,
        friendly_value_confidence: 0,
        rudeness: '',
        rudeness_confidence: 0,
        neuroticism: '',
        neuroticism_confidence: 0,
        conscientiousness: '',
        conscientiousness_confidence: 0,
        likeness: '',
        likeness_confidence: 0
      };
      
      // 合并数据，用户提供的数据优先
      const insertData = { ...defaults, ...data };

      const result = await operator.insertOne(this.TABLE_NAME, insertData);

      if (!result.lastInsertId) {
        throw new InternalServerError('插入PersonInfo失败，未获得插入ID');
      }

      logger.info(`PersonInfo插入成功，ID: ${result.lastInsertId}`);
      return result.lastInsertId;

    } catch (error) {
      logger.error('插入PersonInfo失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('插入PersonInfo失败');
    }
  }

  /**
   * 更新PersonInfo
   */
  public static async updatePersonInfo(data: PersonInfoUpdateData): Promise<boolean> {
    try {
      if (!data.id || data.id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      this.validatePersonInfoData(data);

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existingRecord = await this.getPersonInfoById(data.id);
      if (!existingRecord) {
        throw new NotFoundError('要更新的PersonInfo记录不存在');
      }

      // 提取更新数据（排除id）
      const { id, ...updateData } = data;

      const result = await operator.update(this.TABLE_NAME, updateData, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      if (result.affectedRows === 0) {
        throw new InternalServerError('更新PersonInfo失败，未影响任何记录');
      }

      logger.info(`PersonInfo更新成功，ID: ${id}`);
      return true;

    } catch (error) {
      logger.error('更新PersonInfo失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('更新PersonInfo失败');
    }
  }

  /**
   * 删除PersonInfo
   */
  public static async deletePersonInfo(id: number): Promise<boolean> {
    try {
      if (!id || id < 1) {
        throw new ValidationError('ID必须是大于0的数字');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 检查记录是否存在
      const existingRecord = await this.getPersonInfoById(id);
      if (!existingRecord) {
        throw new NotFoundError('要删除的PersonInfo记录不存在');
      }

      const result = await operator.delete(this.TABLE_NAME, {
        where: [{ field: 'id', operator: '=', value: id }]
      });

      if (result.affectedRows === 0) {
        throw new InternalServerError('删除PersonInfo失败，未影响任何记录');
      }

      logger.info(`PersonInfo删除成功，ID: ${id}`);
      return true;

    } catch (error) {
      logger.error('删除PersonInfo失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError
        ? error 
        : new InternalServerError('删除PersonInfo失败');
    }
  }

  /**
   * 根据person_id查询PersonInfo
   */
  public static async getPersonInfoByPersonId(personId: string): Promise<PersonInfoRecord[]> {
    try {
      if (!personId) {
        throw new ValidationError('person_id不能为空');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findMany<PersonInfoRecord>(this.TABLE_NAME, {
        where: [{ field: 'person_id', operator: '=', value: personId }],
        orderBy: [{ field: 'last_know', order: 'DESC' }]
      });

      return result;

    } catch (error) {
      logger.error('根据person_id查询PersonInfo失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询PersonInfo失败');
    }
  }

  /**
   * 根据平台和用户ID查询PersonInfo
   */
  public static async getPersonInfoByPlatformUser(platform: string, userId: string): Promise<PersonInfoRecord[]> {
    try {
      if (!platform || !userId) {
        throw new ValidationError('platform和user_id不能为空');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      const result = await operator.findMany<PersonInfoRecord>(this.TABLE_NAME, {
        where: [
          { field: 'platform', operator: '=', value: platform },
          { field: 'user_id', operator: '=', value: userId }
        ],
        orderBy: [{ field: 'last_know', order: 'DESC' }]
      });

      return result;

    } catch (error) {
      logger.error('根据平台和用户ID查询PersonInfo失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('查询PersonInfo失败');
    }
  }

  /**
   * 获取PersonInfo统计信息
   */
  public static async getPersonInfoStats(): Promise<PersonInfoStats> {
    try {
      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 获取总数
      const total = await operator.count(this.TABLE_NAME, {});

      // 获取已认识和未认识的人数
      const totalKnown = await operator.count(this.TABLE_NAME, {
        where: [{ field: 'is_known', operator: '=', value: 1 }]
      });
      const totalUnknown = total - totalKnown;

      // 获取按平台统计
      const platformStats = await operator.executeQuery<{ platform: string; count: number }>(
        'SELECT platform, COUNT(*) as count FROM person_info GROUP BY platform ORDER BY count DESC'
      );

      // 获取按友好度范围统计
      const friendlyValueStats = await operator.executeQuery<{ range_name: string; count: number }>(
        `SELECT 
          CASE 
            WHEN friendly_value BETWEEN 0 AND 0.2 THEN 'very_low'
            WHEN friendly_value BETWEEN 0.21 AND 0.4 THEN 'low'
            WHEN friendly_value BETWEEN 0.41 AND 0.6 THEN 'neutral'
            WHEN friendly_value BETWEEN 0.61 AND 0.8 THEN 'high'
            ELSE 'very_high'
          END as range_name,
          COUNT(*) as count
        FROM person_info 
        GROUP BY range_name
        ORDER BY count DESC`
      );

      // 获取平均认知次数、平均友好度和总认知次数
      const avgStats = await operator.executeQuery<{ avgKnowTimes: number; avgFriendlyValue: number; totalKnowTimes: number }>(
        'SELECT AVG(know_times) as avgKnowTimes, AVG(friendly_value) as avgFriendlyValue, SUM(know_times) as totalKnowTimes FROM person_info'
      );

      // 获取最近活跃的人数（7天内有认知的）
      const weekAgo = (Date.now() / 1000) - (7 * 24 * 60 * 60);
      const recentActive = await operator.count(this.TABLE_NAME, {
        where: [{ field: 'last_know', operator: '>=', value: weekAgo }]
      });

      // 获取认知次数最高的前10个人
      const topPersons = await operator.findMany<PersonInfoRecord>(this.TABLE_NAME, {
        orderBy: [{ field: 'know_times', order: 'DESC' }],
        limit: 10
      });

      // 获取按态度统计
      const attitudeStats = await operator.executeQuery<{ attitude: string; count: number }>(
        'SELECT attitude_to_me as attitude, COUNT(*) as count FROM person_info WHERE attitude_to_me IS NOT NULL AND attitude_to_me != \'\' GROUP BY attitude_to_me ORDER BY count DESC'
      );

      // 获取按其他特征统计
      const rudenessStats = await operator.executeQuery<{ trait: string; count: number }>(
        'SELECT rudeness as trait, COUNT(*) as count FROM person_info WHERE rudeness IS NOT NULL AND rudeness != \'\' GROUP BY rudeness ORDER BY count DESC'
      );

      const neuroticismStats = await operator.executeQuery<{ trait: string; count: number }>(
        'SELECT neuroticism as trait, COUNT(*) as count FROM person_info WHERE neuroticism IS NOT NULL AND neuroticism != \'\' GROUP BY neuroticism ORDER BY count DESC'
      );

      const conscientiousnessStats = await operator.executeQuery<{ trait: string; count: number }>(
        'SELECT conscientiousness as trait, COUNT(*) as count FROM person_info WHERE conscientiousness IS NOT NULL AND conscientiousness != \'\' GROUP BY conscientiousness ORDER BY count DESC'
      );

      const likenessStats = await operator.executeQuery<{ trait: string; count: number }>(
        'SELECT likeness as trait, COUNT(*) as count FROM person_info WHERE likeness IS NOT NULL AND likeness != \'\' GROUP BY likeness ORDER BY count DESC'
      );

      // 处理统计结果
      const byPlatform: Record<string, number> = {};
      platformStats.forEach((row) => {
        byPlatform[row.platform] = row.count;
      });

      const byFriendlyValue: Record<string, number> = {};
      friendlyValueStats.forEach((row) => {
        byFriendlyValue[row.range_name] = row.count;
      });

      const byAttitudeToMe: Record<string, number> = {};
      attitudeStats.forEach((row) => {
        byAttitudeToMe[row.attitude] = row.count;
      });

      const byRudeness: Record<string, number> = {};
      rudenessStats.forEach((row) => {
        byRudeness[row.trait] = row.count;
      });

      const byNeuroticism: Record<string, number> = {};
      neuroticismStats.forEach((row) => {
        byNeuroticism[row.trait] = row.count;
      });

      const byConscientiousness: Record<string, number> = {};
      conscientiousnessStats.forEach((row) => {
        byConscientiousness[row.trait] = row.count;
      });

      const byLikeness: Record<string, number> = {};
      likenessStats.forEach((row) => {
        byLikeness[row.trait] = row.count;
      });

      const avgKnowTimes = avgStats[0]?.avgKnowTimes || 0;
      const avgFriendlyValue = avgStats[0]?.avgFriendlyValue || 0;
      const totalKnowTimes = avgStats[0]?.totalKnowTimes || 0;

      const result: PersonInfoStats = {
        total,
        totalKnown,
        totalUnknown,
        byPlatform,
        byFriendlyValue,
        avgKnowTimes: Math.round(avgKnowTimes * 100) / 100, // 保留2位小数
        avgFriendlyValue: Math.round(avgFriendlyValue * 100) / 100,   // 保留2位小数
        totalKnowTimes,
        recentActive,
        topPersons,
        byAttitudeToMe,
        byRudeness,
        byNeuroticism,
        byConscientiousness,
        byLikeness
      };

      return result;

    } catch (error) {
      logger.error('获取PersonInfo统计信息失败:', error);
      throw new InternalServerError('获取PersonInfo统计信息失败');
    }
  }

  /**
   * 搜索PersonInfo（按姓名、昵称、印象等）
   */
  public static async searchPersonInfos(
    keyword: string, 
    limit: number = 20
  ): Promise<PersonInfoRecord[]> {
    try {
      if (!keyword || keyword.trim().length === 0) {
        throw new ValidationError('搜索关键字不能为空');
      }

      if (limit < 1 || limit > 100) {
        throw new ValidationError('限制数量必须在1-100之间');
      }

      await this.initConnection();
      const operator = databaseManager.getOperator(this.CONNECTION_NAME);

      // 使用原生SQL查询来实现多字段搜索
      const result = await operator.executeQuery<PersonInfoRecord>(
        `SELECT * FROM ${this.TABLE_NAME} 
         WHERE person_name LIKE ? OR nickname LIKE ? OR points LIKE ? OR attitude_to_me LIKE ?
         ORDER BY know_times DESC, last_know DESC 
         LIMIT ?`,
        [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, limit]
      );

      return result;

    } catch (error) {
      logger.error('搜索PersonInfo失败:', error);
      throw error instanceof ValidationError 
        ? error 
        : new InternalServerError('搜索PersonInfo失败');
    }
  }
}
