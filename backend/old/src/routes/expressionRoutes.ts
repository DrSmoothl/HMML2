/**
 * Expression表操作路由
 * 提供Expression表的HTTP API接口
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { ExpressionService } from '../services/expressionService';
import { logger } from '../core/logger';
import { 
  ValidationError, 
  NotFoundError, 
  InternalServerError 
} from '../middleware/errorHandler';
import { 
  ExpressionInsertData, 
  ExpressionUpdateData, 
  ExpressionPaginationParams 
} from '../types/expression';

const router = new Router();

/**
 * 查询expression列表（分页）
 * GET /database/expression/get?page=1&pageSize=10
 */
router.get('/expression/get', async (ctx: Context, next: Next) => {
  try {
    const { 
      page = '1', 
      pageSize = '10',
      orderBy = 'id',
      orderDir = 'ASC',
      situation,
      style,
      chat_id,
      type,
      minCount,
      maxCount,
      startDate,
      endDate
    } = ctx.query as Record<string, string>;

    // 验证分页参数
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('页码必须是大于0的数字');
    }

    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new ValidationError('每页记录数必须在1-100之间');
    }

    // 构建查询参数
    const params: ExpressionPaginationParams = {
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir: (orderDir as 'ASC' | 'DESC') || 'ASC',
      filter: {}
    };

    // 添加过滤条件
    if (situation) params.filter!.situation = situation;
    if (style) params.filter!.style = style;
    if (chat_id) params.filter!.chat_id = chat_id;
    if (type) params.filter!.type = type;
    if (minCount) params.filter!.minCount = parseInt(minCount);
    if (maxCount) params.filter!.maxCount = parseInt(maxCount);
    if (startDate) params.filter!.startDate = parseFloat(startDate);
    if (endDate) params.filter!.endDate = parseFloat(endDate);

    // 查询数据
    const result = await ExpressionService.getExpressions(params);

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: {
        items: result.items,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('查询expression列表失败:', error);
    throw error;
  }
});

/**
 * 根据ID查询单个expression
 * GET /database/expression/get/:id
 */
router.get('/expression/get/:id', async (ctx: Context, next: Next) => {
  try {
    const { id } = ctx.params;
    const expressionId = parseInt(id);

    if (isNaN(expressionId) || expressionId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    const result = await ExpressionService.getExpressionById(expressionId);

    if (!result) {
      throw new NotFoundError(`未找到ID为 ${expressionId} 的expression记录`);
    }

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('根据ID查询expression失败:', error);
    throw error;
  }
});

/**
 * 插入expression
 * POST /database/expression/insert
 */
router.post('/expression/insert', async (ctx: Context, next: Next) => {
  try {
    const requestBody = (ctx.request as any).body as ExpressionInsertData;

    if (!requestBody) {
      throw new ValidationError('请求体不能为空');
    }

    // 验证必需字段
    const requiredFields = ['situation', 'style', 'chat_id', 'type'];
    for (const field of requiredFields) {
      if (!requestBody[field as keyof ExpressionInsertData]) {
        throw new ValidationError(`字段 ${field} 不能为空`);
      }
    }

    const insertId = await ExpressionService.insertExpression(requestBody);

    ctx.body = {
      status: 200,
      message: '插入成功',
      data: {
        id: insertId
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('插入expression失败:', error);
    throw error;
  }
});

/**
 * 更新expression
 * POST /database/expression/update
 */
router.post('/expression/update', async (ctx: Context, next: Next) => {
  try {
    const requestBody = (ctx.request as any).body as ExpressionUpdateData;

    if (!requestBody) {
      throw new ValidationError('请求体不能为空');
    }

    if (!requestBody.id) {
      throw new ValidationError('ID不能为空');
    }

    await ExpressionService.updateExpression(requestBody);

    ctx.body = {
      status: 200,
      message: '更新成功',
      time: Date.now()
    };

  } catch (error) {
    logger.error('更新expression失败:', error);
    throw error;
  }
});

/**
 * 删除expression
 * DELETE /database/expression/delete
 */
router.delete('/expression/delete', async (ctx: Context, next: Next) => {
  try {
    const requestBody = (ctx.request as any).body as { id: number };

    if (!requestBody || !requestBody.id) {
      throw new ValidationError('ID不能为空');
    }

    const id = requestBody.id;
    if (isNaN(id) || id < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    await ExpressionService.deleteExpression(id);

    ctx.body = {
      status: 200,
      message: '删除成功',
      time: Date.now()
    };

  } catch (error) {
    logger.error('删除expression失败:', error);
    throw error;
  }
});

/**
 * 根据聊天ID查询expression
 * GET /database/expression/chat/:chatId?limit=10
 */
router.get('/expression/chat/:chatId', async (ctx: Context, next: Next) => {
  try {
    const { chatId } = ctx.params;
    const { limit = '10' } = ctx.query as Record<string, string>;
    const limitNum = parseInt(limit);

    if (!chatId) {
      throw new ValidationError('聊天ID不能为空');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('限制数量必须在1-100之间');
    }

    const result = await ExpressionService.getExpressionsByChatId(chatId, limitNum);

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: {
        items: result,
        count: result.length
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('根据聊天ID查询expression失败:', error);
    throw error;
  }
});

/**
 * 根据类型查询expression
 * GET /database/expression/type/:type?limit=10
 */
router.get('/expression/type/:type', async (ctx: Context, next: Next) => {
  try {
    const { type } = ctx.params;
    const { limit = '10' } = ctx.query as Record<string, string>;
    const limitNum = parseInt(limit);

    if (!type) {
      throw new ValidationError('类型不能为空');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('限制数量必须在1-100之间');
    }

    const result = await ExpressionService.getExpressionsByType(type, limitNum);

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: {
        items: result,
        count: result.length
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('根据类型查询expression失败:', error);
    throw error;
  }
});

/**
 * 获取expression统计信息
 * GET /database/expression/stats
 */
router.get('/expression/stats', async (ctx: Context, next: Next) => {
  try {
    const result = await ExpressionService.getExpressionStats();

    ctx.body = {
      status: 200,
      message: '获取统计信息成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('获取expression统计信息失败:', error);
    throw error;
  }
});

/**
 * 增加expression统计次数
 * POST /database/expression/increment/:id
 */
router.post('/expression/increment/:id', async (ctx: Context, next: Next) => {
  try {
    const { id } = ctx.params;
    const expressionId = parseInt(id);

    if (isNaN(expressionId) || expressionId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    // 检查expression是否存在
    const expression = await ExpressionService.getExpressionById(expressionId);
    if (!expression) {
      throw new NotFoundError(`未找到ID为 ${expressionId} 的expression记录`);
    }

    await ExpressionService.incrementCount(expressionId);

    ctx.body = {
      status: 200,
      message: '统计次数已更新',
      time: Date.now()
    };

  } catch (error) {
    logger.error('更新expression统计次数失败:', error);
    throw error;
  }
});

/**
 * 搜索expression
 * GET /database/expression/search?keyword=keyword&limit=20
 */
router.get('/expression/search', async (ctx: Context, next: Next) => {
  try {
    const { keyword, limit = '20' } = ctx.query as Record<string, string>;
    const limitNum = parseInt(limit);

    if (!keyword || keyword.trim().length === 0) {
      throw new ValidationError('搜索关键字不能为空');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('限制数量必须在1-100之间');
    }

    const result = await ExpressionService.searchExpressions(keyword.trim(), limitNum);

    ctx.body = {
      status: 200,
      message: '搜索成功',
      data: {
        items: result,
        count: result.length,
        keyword: keyword.trim()
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('搜索expression失败:', error);
    throw error;
  }
});

export default router;
