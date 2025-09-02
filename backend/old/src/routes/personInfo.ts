/**
 * PersonInfo表操作路由
 * 提供PersonInfo的RESTful API接口
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { PersonInfoService } from '../services/personInfoService';
import { 
  PersonInfoInsertData, 
  PersonInfoUpdateData, 
  PersonInfoPaginationParams,
  PersonInfoFilterOptions,
  Platform
} from '../types/personInfo';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = new Router();

/**
 * GET /database/person-info/get
 * 分页查询PersonInfo
 * 查询参数：
 * - page: 页码 (默认1)
 * - pageSize: 每页记录数 (默认20)
 * - orderBy: 排序字段 (默认id)
 * - orderDir: 排序方向 ASC|DESC (默认ASC)
 * - person_id: 过滤人物ID
 * - person_name: 过滤人物名称 (模糊匹配)
 * - platform: 过滤平台
 * - user_id: 过滤用户ID
 * - nickname: 过滤昵称 (模糊匹配)
 * - is_known: 过滤是否认识 (0或1)
 * - points: 过滤认知点 (模糊匹配)
 * - attitude_to_me: 过滤对自己的态度 (模糊匹配)
 * - rudeness: 过滤粗鲁度 (模糊匹配)
 * - neuroticism: 过滤神经质程度 (模糊匹配)
 * - conscientiousness: 过滤尽责程度 (模糊匹配)
 * - likeness: 过滤喜爱程度 (模糊匹配)
 * - minKnowTimes: 最小认知次数
 * - maxKnowTimes: 最大认知次数
 * - minFriendlyValue: 最小友好度
 * - maxFriendlyValue: 最大友好度
 * - knowSinceStart: 认识起始时间戳
 * - knowSinceEnd: 认识结束时间戳
 * - lastKnowStart: 最后认知起始时间戳
 * - lastKnowEnd: 最后认知结束时间戳
 */
router.get('/person-info/get', async (ctx: Context, next: Next) => {
  try {
    const query = ctx.query as Record<string, string>;
    
    // 解析分页参数
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 20));
    const orderBy = query.orderBy || 'id';
    const orderDir = query.orderDir === 'DESC' ? 'DESC' : 'ASC';

    // 构建过滤条件
    const filter: PersonInfoFilterOptions = {};
    
    if (query.person_id) filter.person_id = query.person_id;
    if (query.person_name) filter.person_name = query.person_name;
    if (query.platform) filter.platform = query.platform;
    if (query.user_id) filter.user_id = query.user_id;
    if (query.nickname) filter.nickname = query.nickname;
    if (query.is_known !== undefined) {
      const isKnown = parseInt(query.is_known);
      if (isKnown === 0 || isKnown === 1) {
        filter.is_known = isKnown;
      }
    }
    if (query.points) filter.points = query.points;
    if (query.attitude_to_me) filter.attitude_to_me = query.attitude_to_me;
    if (query.rudeness) filter.rudeness = query.rudeness;
    if (query.neuroticism) filter.neuroticism = query.neuroticism;
    if (query.conscientiousness) filter.conscientiousness = query.conscientiousness;
    if (query.likeness) filter.likeness = query.likeness;
    
    if (query.minKnowTimes !== undefined) {
      filter.minKnowTimes = parseInt(query.minKnowTimes);
    }
    if (query.maxKnowTimes !== undefined) {
      filter.maxKnowTimes = parseInt(query.maxKnowTimes);
    }
    if (query.minFriendlyValue !== undefined) {
      filter.minFriendlyValue = parseFloat(query.minFriendlyValue);
    }
    if (query.maxFriendlyValue !== undefined) {
      filter.maxFriendlyValue = parseFloat(query.maxFriendlyValue);
    }
    if (query.knowSinceStart !== undefined) {
      filter.knowSinceStart = parseInt(query.knowSinceStart);
    }
    if (query.knowSinceEnd !== undefined) {
      filter.knowSinceEnd = parseInt(query.knowSinceEnd);
    }
    if (query.lastKnowStart !== undefined) {
      filter.lastKnowStart = parseInt(query.lastKnowStart);
    }
    if (query.lastKnowEnd !== undefined) {
      filter.lastKnowEnd = parseInt(query.lastKnowEnd);
    }

    const params: PersonInfoPaginationParams = {
      page,
      pageSize,
      orderBy,
      orderDir,
      filter: Object.keys(filter).length > 0 ? filter : undefined
    };

    const result = await PersonInfoService.getPersonInfos(params);
    
    ctx.body = {
      status: 200,
      message: '查询PersonInfo成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * GET /database/person-info/get/:id
 * 根据ID查询单个PersonInfo
 */
router.get('/person-info/get/:id', async (ctx: Context, next: Next) => {
  try {
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id) || id < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    const result = await PersonInfoService.getPersonInfoById(id);
    
    if (!result) {
      throw new NotFoundError(`未找到ID为${id}的PersonInfo记录`);
    }

    ctx.body = {
      status: 200,
      message: '查询PersonInfo成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * POST /database/person-info/insert
 * 新增PersonInfo
 * 请求体：PersonInfoInsertData
 */
router.post('/person-info/insert', async (ctx: Context, next: Next) => {
  try {
    const data: PersonInfoInsertData = (ctx.request as any).body;
    
    if (!data || typeof data !== 'object') {
      throw new ValidationError('请求体必须是有效的JSON对象');
    }

    const insertId = await PersonInfoService.insertPersonInfo(data);
    
    ctx.body = {
      status: 200,
      message: 'PersonInfo创建成功',
      data: {
        id: insertId,
        ...data
      },
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * PUT /database/person-info/update/:id
 * 更新PersonInfo
 * 请求体：PersonInfoUpdateData (不包含id)
 */
router.put('/person-info/update/:id', async (ctx: Context, next: Next) => {
  try {
    const id = parseInt(ctx.params.id);
    const data: Partial<PersonInfoInsertData> = (ctx.request as any).body;
    
    if (isNaN(id) || id < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    if (!data || typeof data !== 'object') {
      throw new ValidationError('请求体必须是有效的JSON对象');
    }

    // 构建更新数据
    const updateData: PersonInfoUpdateData = { id, ...data };
    
    await PersonInfoService.updatePersonInfo(updateData);
    
    ctx.body = {
      status: 200,
      message: 'PersonInfo更新成功',
      data: updateData,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * DELETE /database/person-info/delete/:id
 * 删除PersonInfo
 */
router.delete('/person-info/delete/:id', async (ctx: Context, next: Next) => {
  try {
    const id = parseInt(ctx.params.id);
    
    if (isNaN(id) || id < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    await PersonInfoService.deletePersonInfo(id);
    
    ctx.body = {
      status: 200,
      message: 'PersonInfo删除成功',
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * GET /database/person-info/by-person/:personId
 * 根据person_id查询PersonInfo列表
 */
router.get('/person-info/by-person/:personId', async (ctx: Context, next: Next) => {
  try {
    const personId = ctx.params.personId;
    
    if (!personId) {
      throw new ValidationError('person_id不能为空');
    }

    const result = await PersonInfoService.getPersonInfoByPersonId(personId);
    
    ctx.body = {
      status: 200,
      message: `查询person_id为${personId}的PersonInfo成功`,
      data: result,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * GET /database/person-info/by-platform/:platform/user/:userId
 * 根据平台和用户ID查询PersonInfo列表
 */
router.get('/person-info/by-platform/:platform/user/:userId', async (ctx: Context, next: Next) => {
  try {
    const platform = ctx.params.platform;
    const userId = ctx.params.userId;
    
    if (!platform || !userId) {
      throw new ValidationError('platform和userId不能为空');
    }

    const result = await PersonInfoService.getPersonInfoByPlatformUser(platform, userId);
    
    ctx.body = {
      status: 200,
      message: `查询平台${platform}上用户${userId}的PersonInfo成功`,
      data: result,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * GET /database/person-info/stats
 * 获取PersonInfo统计信息
 */
router.get('/person-info/stats', async (ctx: Context, next: Next) => {
  try {
    const result = await PersonInfoService.getPersonInfoStats();
    
    ctx.body = {
      status: 200,
      message: '获取PersonInfo统计信息成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * GET /database/person-info/search
 * 搜索PersonInfo (支持按姓名、昵称、认知点、对自己的态度搜索)
 * 查询参数：
 * - keyword: 搜索关键字 (必需)
 * - limit: 限制数量 (默认20，最大100)
 */
router.get('/person-info/search', async (ctx: Context, next: Next) => {
  try {
    const keyword = ctx.query.keyword as string;
    const limit = Math.min(100, Math.max(1, parseInt(ctx.query.limit as string) || 20));
    
    if (!keyword || keyword.trim().length === 0) {
      throw new ValidationError('搜索关键字不能为空');
    }

    const result = await PersonInfoService.searchPersonInfos(keyword.trim(), limit);
    
    ctx.body = {
      status: 200,
      message: `搜索PersonInfo成功，找到${result.length}条记录`,
      data: result,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

/**
 * GET /database/person-info/platforms
 * 获取可用平台列表
 */
router.get('/person-info/platforms', async (ctx: Context, next: Next) => {
  try {
    const platforms = Object.values(Platform);
    
    ctx.body = {
      status: 200,
      message: '获取平台列表成功',
      data: platforms,
      time: Date.now()
    };

  } catch (error) {
    throw error;
  }
});

export { router as personInfoRouter };
