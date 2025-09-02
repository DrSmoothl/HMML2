/**
 * Emoji表专用路由
 * 提供emoji表的CRUD操作API
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { logger } from '../core/logger';
import { EmojiService } from '../services/emojiService';
import { 
  EmojiInsertData, 
  EmojiUpdateData, 
  EmojiPaginationParams,
  EmojiQueryFilter
} from '../types/emoji';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = new Router();

/**
 * 查询emoji（分页）
 * GET /database/emoji/get?page=1&pageSize=10&orderBy=id&orderDir=DESC&format=png&emotion=happy
 */
router.get('/emoji/get', async (ctx: Context, next: Next) => {
  try {
    const query = ctx.query as Record<string, string>;
    const {
      page = '1',
      pageSize = '10',
      orderBy,
      orderDir = 'ASC',
      // 过滤参数
      format,
      emotion,
      is_registered,
      is_banned,
      description,
      emoji_hash
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
    const params: EmojiPaginationParams = {
      page: pageNum,
      pageSize: size
    };

    // 排序字段验证和设置
    if (orderBy) {
      const validOrderBy = ['id', 'query_count', 'usage_count', 'last_used_time', 'record_time'];
      if (validOrderBy.includes(orderBy)) {
        params.orderBy = orderBy as any;
        params.orderDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      } else {
        throw new ValidationError(`排序字段必须是以下之一: ${validOrderBy.join(', ')}`);
      }
    }

    // 构建过滤条件
    const filter: EmojiQueryFilter = {};
    if (format) filter.format = format;
    if (emotion) filter.emotion = emotion;
    if (description) filter.description = description;
    if (emoji_hash) filter.emoji_hash = emoji_hash;
    
    if (is_registered !== undefined) {
      const regValue = parseInt(is_registered);
      if (regValue === 0 || regValue === 1) {
        filter.is_registered = regValue;
      }
    }
    
    if (is_banned !== undefined) {
      const banValue = parseInt(is_banned);
      if (banValue === 0 || banValue === 1) {
        filter.is_banned = banValue;
      }
    }

    if (Object.keys(filter).length > 0) {
      params.filter = filter;
    }

    // 执行查询
    const result = await EmojiService.getEmojis(params);

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('查询emoji失败:', error);
    throw error;
  }
});

/**
 * 根据ID查询单个emoji
 * GET /database/emoji/get/:id
 */
router.get('/emoji/get/:id', async (ctx: Context, next: Next) => {
  try {
    const { id } = ctx.params;
    const emojiId = parseInt(id);

    if (isNaN(emojiId) || emojiId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    const result = await EmojiService.getEmojiById(emojiId);

    if (!result) {
      throw new NotFoundError(`未找到ID为 ${emojiId} 的emoji记录`);
    }

    // 增加查询次数
    await EmojiService.incrementQueryCount(emojiId);

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('根据ID查询emoji失败:', error);
    throw error;
  }
});

/**
 * 插入emoji
 * POST /database/emoji/insert
 */
router.post('/emoji/insert', async (ctx: Context, next: Next) => {
  try {
    const data = (ctx.request as any).body as EmojiInsertData;

    if (!data) {
      throw new ValidationError('请求体不能为空');
    }

    const insertId = await EmojiService.insertEmoji(data);

    ctx.body = {
      status: 200,
      message: '插入成功',
      data: {
        id: insertId
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('插入emoji失败:', error);
    throw error;
  }
});

/**
 * 更新emoji
 * POST /database/emoji/update
 */
router.post('/emoji/update', async (ctx: Context, next: Next) => {
  try {
    const data = (ctx.request as any).body as EmojiUpdateData;

    if (!data) {
      throw new ValidationError('请求体不能为空');
    }

    if (!data.id) {
      throw new ValidationError('更新操作必须提供ID');
    }

    await EmojiService.updateEmoji(data);

    ctx.body = {
      status: 200,
      message: '更新成功',
      time: Date.now()
    };

  } catch (error) {
    logger.error('更新emoji失败:', error);
    throw error;
  }
});

/**
 * 删除emoji
 * DELETE /database/emoji/delete/:id
 */
router.delete('/emoji/delete/:id', async (ctx: Context, next: Next) => {
  try {
    const { id } = ctx.params;

    if (!id) {
      throw new ValidationError('删除操作必须提供ID');
    }

    const emojiId = parseInt(String(id));
    if (isNaN(emojiId) || emojiId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    await EmojiService.deleteEmoji(emojiId);

    ctx.body = {
      status: 200,
      message: '删除成功',
      time: Date.now()
    };

  } catch (error) {
    logger.error('删除emoji失败:', error);
    throw error;
  }
});

/**
 * 删除emoji (兼容旧版本，请求体方式)
 * DELETE /database/emoji/delete
 */
router.delete('/emoji/delete', async (ctx: Context, next: Next) => {
  try {
    const { id } = (ctx.request as any).body as { id: number };

    if (!id) {
      throw new ValidationError('删除操作必须提供ID');
    }

    const emojiId = parseInt(String(id));
    if (isNaN(emojiId) || emojiId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    await EmojiService.deleteEmoji(emojiId);

    ctx.body = {
      status: 200,
      message: '删除成功',
      time: Date.now()
    };

  } catch (error) {
    logger.error('删除emoji失败:', error);
    throw error;
  }
});

/**
 * 根据哈希值查询emoji
 * GET /database/emoji/hash/:hash
 */
router.get('/emoji/hash/:hash', async (ctx: Context, next: Next) => {
  try {
    const { hash } = ctx.params;

    if (!hash) {
      throw new ValidationError('emoji哈希值不能为空');
    }

    const result = await EmojiService.getEmojiByHash(hash);

    if (!result) {
      throw new NotFoundError(`未找到哈希值为 ${hash} 的emoji记录`);
    }

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('根据哈希值查询emoji失败:', error);
    throw error;
  }
});

/**
 * 获取单个emoji图片的Base64编码
 * GET /database/emoji/getSingleEmojiImage
 * 请求体: { "id": 1 }
 */
router.get('/emoji/getSingleEmojiImage', async (ctx: Context, next: Next) => {
  try {
    const query = ctx.query as Record<string, string>;
    const { id } = query;

    if (!id) {
      throw new ValidationError('必须提供emoji的ID参数');
    }

    const emojiId = parseInt(id);
    if (isNaN(emojiId) || emojiId < 1) {
      throw new ValidationError('ID必须是大于0的数字');
    }

    const imageBase64 = await EmojiService.getEmojiImage(emojiId);

    ctx.body = {
      status: 200,
      message: '查询成功',
      data: {
        imageb64: imageBase64
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('获取emoji图片失败:', error);
    throw error;
  }
});

/**
 * 获取emoji统计信息
 * GET /database/emoji/stats
 */
router.get('/emoji/stats', async (ctx: Context, next: Next) => {
  try {
    const result = await EmojiService.getEmojiStats();

    ctx.body = {
      status: 200,
      message: '获取统计信息成功',
      data: result,
      time: Date.now()
    };

  } catch (error) {
    logger.error('获取emoji统计信息失败:', error);
    throw error;
  }
});

/**
 * 计算图片哈希值
 * POST /database/emoji/calculateHash
 * 请求体: { "imagePath": "data/emoji_registed/example.png" }
 */
router.post('/emoji/calculateHash', async (ctx: Context, next: Next) => {
  try {
    const { imagePath } = (ctx.request as any).body as { imagePath: string };

    if (!imagePath) {
      throw new ValidationError('图片路径不能为空');
    }

    const imageHash = await EmojiService.calculateImageHash(imagePath);

    ctx.body = {
      status: 200,
      message: '计算哈希值成功',
      data: {
        imagePath,
        imageHash
      },
      time: Date.now()
    };

  } catch (error) {
    logger.error('计算图片哈希值失败:', error);
    throw error;
  }
});

export default router;
