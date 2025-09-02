/**
 * Emoji表操作使用示例
 * 展示如何使用EmojiService进行各种emoji操作
 */

import { EmojiService } from '../services/emojiService';
import { 
  EmojiInsertData, 
  EmojiUpdateData, 
  EmojiPaginationParams 
} from '../types/emoji';
import { logger } from '../core/logger';

/**
 * 示例：插入emoji数据
 */
export async function exampleInsertEmoji(): Promise<void> {
  try {
    logger.info('=== 插入emoji示例 ===');
    
    const emojiData: EmojiInsertData = {
      full_path: '/maimai/emojis/happy_face.png',
      format: 'png',
      emoji_hash: 'abc123def456',
      description: '开心的笑脸emoji',
      emotion: 'happy',
      query_count: 0,
      is_registered: 1,
      is_banned: 0,
      record_time: Date.now() / 1000,
      register_time: Date.now() / 1000,
      usage_count: 0,
      last_used_time: Date.now() / 1000
    };

    const insertId = await EmojiService.insertEmoji(emojiData);
    logger.info(`emoji插入成功，ID: ${insertId}`);
    
    return;
  } catch (error) {
    logger.error('插入emoji示例失败:', error);
    throw error;
  }
}

/**
 * 示例：查询emoji列表（分页）
 */
export async function exampleQueryEmojis(): Promise<void> {
  try {
    logger.info('=== 查询emoji列表示例 ===');
    
    const params: EmojiPaginationParams = {
      page: 1,
      pageSize: 10,
      orderBy: 'usage_count',
      orderDir: 'DESC',
      filter: {
        emotion: 'happy',
        is_registered: 1,
        is_banned: 0
      }
    };

    const result = await EmojiService.getEmojis(params);
    
    logger.info(`查询结果: 共${result.total}条记录，当前页${result.currentPage}/${result.totalPages}`);
    logger.info(`本页emoji数量: ${result.items.length}`);
    
    // 显示前3个emoji的详细信息
    result.items.slice(0, 3).forEach((emoji, index) => {
      logger.info(`emoji ${index + 1}:`, {
        id: emoji.id,
        description: emoji.description,
        format: emoji.format,
        emotion: emoji.emotion,
        usage_count: emoji.usage_count
      });
    });
    
    return;
  } catch (error) {
    logger.error('查询emoji列表示例失败:', error);
    throw error;
  }
}

/**
 * 示例：根据ID查询单个emoji
 */
export async function exampleGetEmojiById(emojiId: number): Promise<void> {
  try {
    logger.info('=== 根据ID查询emoji示例 ===');
    
    const emoji = await EmojiService.getEmojiById(emojiId);
    
    if (emoji) {
      logger.info('找到emoji:', {
        id: emoji.id,
        full_path: emoji.full_path,
        description: emoji.description,
        emotion: emoji.emotion,
        usage_count: emoji.usage_count,
        query_count: emoji.query_count
      });
    } else {
      logger.warn(`未找到ID为${emojiId}的emoji`);
    }
    
    return;
  } catch (error) {
    logger.error('根据ID查询emoji示例失败:', error);
    throw error;
  }
}

/**
 * 示例：更新emoji数据
 */
export async function exampleUpdateEmoji(emojiId: number): Promise<void> {
  try {
    logger.info('=== 更新emoji示例 ===');
    
    const updateData: EmojiUpdateData = {
      id: emojiId,
      description: '更新后的emoji描述',
      emotion: 'excited',
      usage_count: 100,
      last_used_time: Date.now() / 1000
    };

    const success = await EmojiService.updateEmoji(updateData);
    
    if (success) {
      logger.info(`emoji ${emojiId} 更新成功`);
    } else {
      logger.warn(`emoji ${emojiId} 更新失败`);
    }
    
    return;
  } catch (error) {
    logger.error('更新emoji示例失败:', error);
    throw error;
  }
}

/**
 * 示例：删除emoji
 */
export async function exampleDeleteEmoji(emojiId: number): Promise<void> {
  try {
    logger.info('=== 删除emoji示例 ===');
    
    const success = await EmojiService.deleteEmoji(emojiId);
    
    if (success) {
      logger.info(`emoji ${emojiId} 删除成功`);
    } else {
      logger.warn(`emoji ${emojiId} 删除失败`);
    }
    
    return;
  } catch (error) {
    logger.error('删除emoji示例失败:', error);
    throw error;
  }
}

/**
 * 示例：根据哈希值查询emoji
 */
export async function exampleGetEmojiByHash(): Promise<void> {
  try {
    logger.info('=== 根据哈希值查询emoji示例 ===');
    
    const testHash = 'abc123def456';
    const emoji = await EmojiService.getEmojiByHash(testHash);
    
    if (emoji) {
      logger.info('找到emoji:', {
        id: emoji.id,
        full_path: emoji.full_path,
        emoji_hash: emoji.emoji_hash,
        description: emoji.description
      });
    } else {
      logger.info(`未找到哈希值为 ${testHash} 的emoji`);
    }
    
    return;
  } catch (error) {
    logger.error('根据哈希值查询emoji示例失败:', error);
    throw error;
  }
}

/**
 * 示例：获取emoji统计信息
 */
export async function exampleGetEmojiStats(): Promise<void> {
  try {
    logger.info('=== 获取emoji统计信息示例 ===');
    
    const stats = await EmojiService.getEmojiStats();
    
    logger.info('emoji统计信息:', {
      总数: stats.total,
      已注册: stats.registered,
      被禁止: stats.banned
    });
    
    logger.info('按格式统计:', stats.byFormat);
    logger.info('按情感统计:', stats.byEmotion);
    
    return;
  } catch (error) {
    logger.error('获取emoji统计信息示例失败:', error);
    throw error;
  }
}

/**
 * 批量操作示例：导入emoji数据
 */
export async function exampleBatchImportEmojis(): Promise<void> {
  try {
    logger.info('=== 批量导入emoji示例 ===');
    
    const emojiList: EmojiInsertData[] = [
      {
        full_path: '/maimai/emojis/smile.png',
        format: 'png',
        emoji_hash: 'smile_001',
        description: '微笑表情',
        emotion: 'happy',
        query_count: 0,
        is_registered: 1,
        is_banned: 0,
        record_time: Date.now() / 1000,
        register_time: Date.now() / 1000,
        usage_count: 0,
        last_used_time: Date.now() / 1000
      },
      {
        full_path: '/maimai/emojis/sad.png',
        format: 'png',
        emoji_hash: 'sad_001',
        description: '伤心表情',
        emotion: 'sad',
        query_count: 0,
        is_registered: 1,
        is_banned: 0,
        record_time: Date.now() / 1000,
        register_time: Date.now() / 1000,
        usage_count: 0,
        last_used_time: Date.now() / 1000
      },
      {
        full_path: '/maimai/emojis/angry.gif',
        format: 'gif',
        emoji_hash: 'angry_001',
        description: '生气表情',
        emotion: 'angry',
        query_count: 0,
        is_registered: 1,
        is_banned: 0,
        record_time: Date.now() / 1000,
        register_time: Date.now() / 1000,
        usage_count: 0,
        last_used_time: Date.now() / 1000
      }
    ];
    
    const insertedIds: number[] = [];
    
    for (const emojiData of emojiList) {
      try {
        const id = await EmojiService.insertEmoji(emojiData);
        insertedIds.push(id);
        logger.info(`插入emoji成功: ${emojiData.description} (ID: ${id})`);
      } catch (error) {
        logger.error(`插入emoji失败: ${emojiData.description}`, error);
      }
    }
    
    logger.info(`批量导入完成，成功插入${insertedIds.length}条emoji记录`);
    
    return;
  } catch (error) {
    logger.error('批量导入emoji示例失败:', error);
    throw error;
  }
}

/**
 * 综合示例：完整的emoji操作流程
 */
export async function exampleCompleteWorkflow(): Promise<void> {
  try {
    logger.info('=== 完整emoji操作流程示例 ===');
    
    // 1. 插入一个新emoji
    const newEmojiData: EmojiInsertData = {
      full_path: '/maimai/emojis/workflow_test.png',
      format: 'png',
      emoji_hash: 'workflow_test_001',
      description: '工作流测试emoji',
      emotion: 'neutral',
      query_count: 0,
      is_registered: 1,
      is_banned: 0,
      record_time: Date.now() / 1000,
      register_time: Date.now() / 1000,
      usage_count: 0,
      last_used_time: Date.now() / 1000
    };
    
    const newEmojiId = await EmojiService.insertEmoji(newEmojiData);
    logger.info(`步骤1: 插入emoji成功，ID: ${newEmojiId}`);
    
    // 2. 查询刚插入的emoji
    const insertedEmoji = await EmojiService.getEmojiById(newEmojiId);
    logger.info('步骤2: 查询插入的emoji:', insertedEmoji?.description);
    
    // 3. 更新emoji信息
    await EmojiService.updateEmoji({
      id: newEmojiId,
      description: '更新后的工作流测试emoji',
      emotion: 'happy'
    });
    logger.info('步骤3: 更新emoji成功');
    
    // 4. 增加查询次数  
    await EmojiService.incrementQueryCount(newEmojiId);
    logger.info('步骤4: 增加查询次数成功');
    
    // 5. 查看最终结果
    const finalEmoji = await EmojiService.getEmojiById(newEmojiId);
    logger.info('步骤5: 最终结果:', {
      id: finalEmoji?.id,
      description: finalEmoji?.description,
      emotion: finalEmoji?.emotion,
      query_count: finalEmoji?.query_count
    });
    
    // 6. 清理测试数据（可选）
    // await EmojiService.deleteEmoji(newEmojiId);
    // logger.info('步骤6: 清理测试数据完成');
    
    logger.info('完整工作流程执行成功！');
    
    return;
  } catch (error) {
    logger.error('完整emoji操作流程示例失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  async function runAllExamples() {
    try {
      // 这里需要先确保数据库连接和路径缓存已设置
      logger.info('开始执行所有emoji操作示例...');
      
      // await exampleInsertEmoji();
      // await exampleQueryEmojis();
      // await exampleGetEmojiByHash();
      // await exampleGetEmojiStats();
      // await exampleBatchImportEmojis();
      // await exampleCompleteWorkflow();
      
      logger.info('所有示例执行完成！');
    } catch (error) {
      logger.error('执行示例时出错:', error);
    }
  }
  
  runAllExamples();
}
