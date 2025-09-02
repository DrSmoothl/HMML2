/**
 * ChatStream表专用路由
 * 提供chat_streams表的CRUD操作API
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { logger } from '../core/logger';
import { ChatStreamService } from '../services/chatStreamService';
import { 
  ChatStreamInsertData, 
  ChatStreamUpdateData, 
  ChatStreamPaginationParams,
  ChatStreamQueryFilter
} from '../types/chatStream';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = new Router();

/**
 * 查询聊天流（分页）
 * GET /database/chatStreams/get?page=1&pageSize=10&orderBy=id&orderDir=DESC&stream_id=xxx&platform=qq
 */
router.get('/chatStreams/get', async (ctx: Context, next: Next) => {
  try {
    const query = ctx.query as Record<string, string>;
    const {
      page = '1',
      pageSize = '10',
      orderBy,
      orderDir = 'ASC',
      // 过滤参数
      stream_id,
      group_platform,
      group_id,
      group_name,
      platform,
      user_platform,
      user_id,
      user_nickname,
      user_cardname
    } = query;

    // 验证分页参数
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('页码必须是大于0的数字');
    }

    if (isNaN(size) || size < 1 || size > 1000) {
      throw new ValidationError('页大小必须在1-1000之间');
    }

    // 构建查询参数
    const params: ChatStreamPaginationParams = {
      page: pageNum,
      pageSize: size,
      orderBy: orderBy as any,
      orderDir: orderDir as 'ASC' | 'DESC'
    };

    // 构建过滤条件
    const filter: ChatStreamQueryFilter = {};
    if (stream_id) filter.stream_id = stream_id;
    if (group_platform) filter.group_platform = group_platform;
    if (group_id) filter.group_id = group_id;
    if (group_name) filter.group_name = group_name;
    if (platform) filter.platform = platform;
    if (user_platform) filter.user_platform = user_platform;
    if (user_id) filter.user_id = user_id;
    if (user_nickname) filter.user_nickname = user_nickname;
    if (user_cardname) filter.user_cardname = user_cardname;

    if (Object.keys(filter).length > 0) {
      params.filter = filter;
    }

    const result = await ChatStreamService.getChatStreams(params);

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('查询聊天流失败:', error);
    throw error;
  }
});

/**
 * 根据ID查询单个聊天流
 * GET /database/chatStreams/getById/:id
 */
router.get('/chatStreams/getById/:id', async (ctx: Context, next: Next) => {
  try {
    const { id } = ctx.params;

    if (!id) {
      throw new ValidationError('ID不能为空');
    }

    const chatStreamId = parseInt(id);
    if (isNaN(chatStreamId) || chatStreamId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    const result = await ChatStreamService.getChatStreamById(chatStreamId);

    if (!result) {
      throw new NotFoundError(`未找到ID为 ${chatStreamId} 的聊天流记录`);
    }

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('根据ID查询聊天流失败:', error);
    throw error;
  }
});

/**
 * 根据stream_id查询聊天流
 * GET /database/chatStreams/getByStreamId/:streamId
 */
router.get('/chatStreams/getByStreamId/:streamId', async (ctx: Context, next: Next) => {
  try {
    const { streamId } = ctx.params;

    if (!streamId) {
      throw new ValidationError('stream_id不能为空');
    }

    const result = await ChatStreamService.getChatStreamByStreamId(streamId);

    if (!result) {
      throw new NotFoundError(`未找到stream_id为 ${streamId} 的聊天流记录`);
    }

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('根据stream_id查询聊天流失败:', error);
    throw error;
  }
});

/**
 * 插入新的聊天流
 * POST /database/chatStreams/insert
 */
router.post('/chatStreams/insert', async (ctx: Context, next: Next) => {
  try {
    const data = (ctx.request as any).body as ChatStreamInsertData;

    if (!data) {
      throw new ValidationError('请求体不能为空');
    }

    const id = await ChatStreamService.insertChatStream(data);

    ctx.body = {
      status: 200,
      message: '插入成功',
      data: { id },
      time: Date.now()
    };

  } catch (error) {
    logger.error('插入聊天流失败:', error);
    throw error;
  }
});

/**
 * 更新聊天流
 * POST /database/chatStreams/update
 */
router.post('/chatStreams/update', async (ctx: Context, next: Next) => {
  try {
    const data = (ctx.request as any).body as ChatStreamUpdateData;

    if (!data) {
      throw new ValidationError('请求体不能为空');
    }

    if (!data.id) {
      throw new ValidationError('更新数据必须包含ID');
    }

    await ChatStreamService.updateChatStream(data);

    ctx.body = {
      status: 200,
      message: '更新成功',
      time: Date.now()
    };

  } catch (error) {
    logger.error('更新聊天流失败:', error);
    throw error;
  }
});

/**
 * 删除聊天流
 * DELETE /database/chatStreams/delete
 */
router.delete('/chatStreams/delete', async (ctx: Context, next: Next) => {
  try {
    const { id } = (ctx.request as any).body as { id: number };

    if (!id) {
      throw new ValidationError('必须提供要删除的聊天流ID');
    }

    const chatStreamId = typeof id === 'string' ? parseInt(id) : id;
    if (isNaN(chatStreamId) || chatStreamId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    await ChatStreamService.deleteChatStream(chatStreamId);

    ctx.body = {
      status: 200,
      message: '删除成功',
      time: Date.now()
    };

  } catch (error) {
    logger.error('删除聊天流失败:', error);
    throw error;
  }
});

/**
 * 获取聊天流统计信息
 * GET /database/chatStreams/stats
 */
router.get('/chatStreams/stats', async (ctx: Context, next: Next) => {
  try {
    const result = await ChatStreamService.getChatStreamStats();

    ctx.body = {
      status: 200,
      message: '获取统计信息成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('获取聊天流统计信息失败:', error);
    throw error;
  }
});

export default router;
