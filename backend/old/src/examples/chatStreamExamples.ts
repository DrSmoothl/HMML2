/**
 * ChatStream表操作示例
 * 演示聊天流数据的CRUD操作
 */

import { logger } from '../core/logger';
import { ChatStreamService } from '../services/chatStreamService';
import { ChatStreamInsertData, ChatStreamUpdateData, ChatStreamPaginationParams } from '../types/chatStream';

/**
 * 示例：插入新的聊天流记录
 */
export async function exampleInsertChatStream(): Promise<void> {
  try {
    logger.info('=== 插入聊天流记录示例 ===');
    
    const chatStreamData: ChatStreamInsertData = {
      stream_id: '3dae6257e1d175a1829e4ff3033f550a',
      create_time: Date.now(),
      group_platform: 'qq',
      group_id: '1787882683',
      group_name: '测试群',
      last_active_time: Date.now(),
      platform: 'qq',
      user_platform: 'qq',
      user_id: '1787882683',
      user_nickname: '墨梓柒(IceSakurary)',
      user_cardname: '墨梓柒(IceSakurary)'
    };

    const id = await ChatStreamService.insertChatStream(chatStreamData);
    logger.info(`成功插入聊天流，新ID: ${id}`);

    return;
  } catch (error) {
    logger.error('插入聊天流示例失败:', error);
    throw error;
  }
}

/**
 * 示例：分页查询聊天流
 */
export async function exampleGetChatStreams(): Promise<void> {
  try {
    logger.info('=== 分页查询聊天流示例 ===');
    
    const params: ChatStreamPaginationParams = {
      page: 1,
      pageSize: 10,
      orderBy: 'create_time',
      orderDir: 'DESC',
      filter: {
        platform: 'qq'
      }
    };

    const result = await ChatStreamService.getChatStreams(params);
    
    logger.info('查询结果:', {
      总记录数: result.total,
      当前页: result.currentPage,
      总页数: result.totalPages,
      记录数: result.items.length
    });

    result.items.forEach((item, index) => {
      logger.info(`聊天流 ${index + 1}:`, {
        id: item.id,
        stream_id: item.stream_id,
        group_name: item.group_name,
        user_nickname: item.user_nickname,
        platform: item.platform
      });
    });

    return;
  } catch (error) {
    logger.error('分页查询聊天流示例失败:', error);
    throw error;
  }
}

/**
 * 示例：更新聊天流记录
 */
export async function exampleUpdateChatStream(): Promise<void> {
  try {
    logger.info('=== 更新聊天流记录示例 ===');
    
    // 先插入一条测试记录
    const insertData: ChatStreamInsertData = {
      stream_id: 'test_update_stream',
      create_time: Date.now(),
      group_platform: 'qq',
      group_id: '123456789',
      group_name: '测试群_更新前',
      last_active_time: Date.now(),
      platform: 'qq',
      user_platform: 'qq',
      user_id: '987654321',
      user_nickname: '测试用户_更新前',
      user_cardname: '测试昵称_更新前'
    };

    const id = await ChatStreamService.insertChatStream(insertData);
    logger.info(`插入测试记录，ID: ${id}`);

    // 更新记录
    const updateData: ChatStreamUpdateData = {
      id: id,
      group_name: '测试群_更新后',
      user_nickname: '测试用户_更新后',
      user_cardname: '测试昵称_更新后',
      last_active_time: Date.now()
    };

    await ChatStreamService.updateChatStream(updateData);
    logger.info(`成功更新聊天流，ID: ${id}`);

    // 查询更新后的记录
    const updated = await ChatStreamService.getChatStreamById(id);
    if (updated) {
      logger.info('更新后的记录:', {
        id: updated.id,
        group_name: updated.group_name,
        user_nickname: updated.user_nickname,
        user_cardname: updated.user_cardname
      });
    }

    return;
  } catch (error) {
    logger.error('更新聊天流示例失败:', error);
    throw error;
  }
}

/**
 * 示例：根据stream_id查询聊天流
 */
export async function exampleGetChatStreamByStreamId(): Promise<void> {
  try {
    logger.info('=== 根据stream_id查询聊天流示例 ===');
    
    const testStreamId = '3dae6257e1d175a1829e4ff3033f550a';
    const chatStream = await ChatStreamService.getChatStreamByStreamId(testStreamId);
    
    if (chatStream) {
      logger.info('找到聊天流:', {
        id: chatStream.id,
        stream_id: chatStream.stream_id,
        group_name: chatStream.group_name,
        user_nickname: chatStream.user_nickname,
        platform: chatStream.platform
      });
    } else {
      logger.info(`未找到stream_id为 ${testStreamId} 的聊天流`);
    }
    
    return;
  } catch (error) {
    logger.error('根据stream_id查询聊天流示例失败:', error);
    throw error;
  }
}

/**
 * 示例：删除聊天流记录
 */
export async function exampleDeleteChatStream(): Promise<void> {
  try {
    logger.info('=== 删除聊天流记录示例 ===');
    
    // 先插入一条测试记录
    const testData: ChatStreamInsertData = {
      stream_id: 'test_delete_stream',
      create_time: Date.now(),
      group_platform: 'qq',
      group_id: '111111111',
      group_name: '待删除测试群',
      last_active_time: Date.now(),
      platform: 'qq',
      user_platform: 'qq',
      user_id: '222222222',
      user_nickname: '待删除测试用户',
      user_cardname: '待删除测试昵称'
    };

    const id = await ChatStreamService.insertChatStream(testData);
    logger.info(`插入待删除记录，ID: ${id}`);

    // 删除记录
    await ChatStreamService.deleteChatStream(id);
    logger.info(`成功删除聊天流，ID: ${id}`);

    // 验证删除
    const deleted = await ChatStreamService.getChatStreamById(id);
    if (!deleted) {
      logger.info('确认记录已被删除');
    } else {
      logger.warn('记录删除失败，仍然存在');
    }

    return;
  } catch (error) {
    logger.error('删除聊天流示例失败:', error);
    throw error;
  }
}

/**
 * 示例：获取聊天流统计信息
 */
export async function exampleGetChatStreamStats(): Promise<void> {
  try {
    logger.info('=== 获取聊天流统计信息示例 ===');
    
    const stats = await ChatStreamService.getChatStreamStats();
    
    logger.info('聊天流统计信息:', {
      总数: stats.totalCount,
      最近24小时活跃: stats.recentActiveCount,
      平台分布: stats.platformStats,
      群组平台分布: stats.groupPlatformStats
    });
    
    return;
  } catch (error) {
    logger.error('获取聊天流统计信息示例失败:', error);
    throw error;
  }
}

/**
 * 运行所有聊天流操作示例
 */
export async function runAllChatStreamExamples(): Promise<void> {
  try {
    logger.info('开始运行聊天流操作示例...');
    
    await exampleInsertChatStream();
    await exampleGetChatStreams();
    await exampleUpdateChatStream();
    await exampleGetChatStreamByStreamId();
    await exampleDeleteChatStream();
    await exampleGetChatStreamStats();
    
    logger.info('所有聊天流操作示例运行完成');
  } catch (error) {
    logger.error('聊天流操作示例运行失败:', error);
    throw error;
  }
}
