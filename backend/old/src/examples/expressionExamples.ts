/**
 * Expression表操作使用示例
 * 展示如何使用ExpressionService进行各种expression操作
 */

import { ExpressionService } from '../services/expressionService';
import { 
  ExpressionInsertData, 
  ExpressionUpdateData, 
  ExpressionPaginationParams,
  ExpressionType
} from '../types/expression';
import { logger } from '../core/logger';

/**
 * 示例：插入expression数据
 */
export async function exampleInsertExpression(): Promise<void> {
  try {
    logger.info('=== 插入expression示例 ===');
    
    const expressionData: ExpressionInsertData = {
      situation: '确认对方是否接收到图片信息',
      style: '你现在能看得见这张图吗',
      count: 5,
      last_active_time: Date.now() / 1000,
      chat_id: 'chat_001',
      type: ExpressionType.STYLE,
      create_date: Date.now() / 1000
    };

    const insertId = await ExpressionService.insertExpression(expressionData);
    logger.info(`expression插入成功，ID: ${insertId}`);
    
    return;
  } catch (error) {
    logger.error('插入expression示例失败:', error);
    throw error;
  }
}

/**
 * 示例：查询expression列表（分页）
 */
export async function exampleQueryExpressions(): Promise<void> {
  try {
    logger.info('=== 查询expression列表示例 ===');
    
    const params: ExpressionPaginationParams = {
      page: 1,
      pageSize: 10,
      orderBy: 'count',
      orderDir: 'DESC',
      filter: {
        type: ExpressionType.STYLE,
        chat_id: 'chat_001',
        minCount: 1
      }
    };

    const result = await ExpressionService.getExpressions(params);
    
    logger.info(`查询结果: 共${result.total}条记录，当前页${result.currentPage}/${result.totalPages}`);
    logger.info(`本页expression数量: ${result.items.length}`);
    
    // 显示前3个expression的详细信息
    result.items.slice(0, 3).forEach((expression, index) => {
      logger.info(`expression ${index + 1}:`, {
        id: expression.id,
        situation: expression.situation,
        style: expression.style,
        count: expression.count,
        type: expression.type,
        chat_id: expression.chat_id
      });
    });
    
    return;
  } catch (error) {
    logger.error('查询expression列表示例失败:', error);
    throw error;
  }
}

/**
 * 示例：根据ID查询单个expression
 */
export async function exampleGetExpressionById(expressionId: number): Promise<void> {
  try {
    logger.info('=== 根据ID查询expression示例 ===');
    
    const expression = await ExpressionService.getExpressionById(expressionId);
    
    if (expression) {
      logger.info('找到expression:', {
        id: expression.id,
        situation: expression.situation,
        style: expression.style,
        count: expression.count,
        type: expression.type,
        chat_id: expression.chat_id,
        last_active_time: new Date(expression.last_active_time * 1000).toLocaleString()
      });
    } else {
      logger.warn(`未找到ID为${expressionId}的expression`);
    }
    
    return;
  } catch (error) {
    logger.error('根据ID查询expression示例失败:', error);
    throw error;
  }
}

/**
 * 示例：更新expression数据
 */
export async function exampleUpdateExpression(expressionId: number): Promise<void> {
  try {
    logger.info('=== 更新expression示例 ===');
    
    const updateData: ExpressionUpdateData = {
      id: expressionId,
      situation: '更新后的情境描述',
      style: '更新后的表达风格',
      count: 100,
      last_active_time: Date.now() / 1000
    };

    const success = await ExpressionService.updateExpression(updateData);
    
    if (success) {
      logger.info(`expression ${expressionId} 更新成功`);
    } else {
      logger.warn(`expression ${expressionId} 更新失败`);
    }
    
    return;
  } catch (error) {
    logger.error('更新expression示例失败:', error);
    throw error;
  }
}

/**
 * 示例：删除expression
 */
export async function exampleDeleteExpression(expressionId: number): Promise<void> {
  try {
    logger.info('=== 删除expression示例 ===');
    
    const success = await ExpressionService.deleteExpression(expressionId);
    
    if (success) {
      logger.info(`expression ${expressionId} 删除成功`);
    } else {
      logger.warn(`expression ${expressionId} 删除失败`);
    }
    
    return;
  } catch (error) {
    logger.error('删除expression示例失败:', error);
    throw error;
  }
}

/**
 * 示例：根据聊天ID查询expression
 */
export async function exampleGetExpressionsByChatId(): Promise<void> {
  try {
    logger.info('=== 根据聊天ID查询expression示例 ===');
    
    const chatId = 'chat_001';
    const expressions = await ExpressionService.getExpressionsByChatId(chatId, 5);
    
    logger.info(`聊天${chatId}共找到${expressions.length}个expression:`);
    expressions.forEach((expression, index) => {
      logger.info(`  ${index + 1}. ${expression.situation} -> ${expression.style} (使用${expression.count}次)`);
    });
    
    return;
  } catch (error) {
    logger.error('根据聊天ID查询expression示例失败:', error);
    throw error;
  }
}

/**
 * 示例：根据类型查询expression
 */
export async function exampleGetExpressionsByType(): Promise<void> {
  try {
    logger.info('=== 根据类型查询expression示例 ===');
    
    const type = ExpressionType.STYLE;
    const expressions = await ExpressionService.getExpressionsByType(type, 5);
    
    logger.info(`类型${type}共找到${expressions.length}个expression:`);
    expressions.forEach((expression, index) => {
      logger.info(`  ${index + 1}. ${expression.situation} -> ${expression.style} (使用${expression.count}次)`);
    });
    
    return;
  } catch (error) {
    logger.error('根据类型查询expression示例失败:', error);
    throw error;
  }
}

/**
 * 示例：获取expression统计信息
 */
export async function exampleGetExpressionStats(): Promise<void> {
  try {
    logger.info('=== 获取expression统计信息示例 ===');
    
    const stats = await ExpressionService.getExpressionStats();
    
    logger.info('expression统计信息:', {
      总数: stats.total,
      平均使用次数: stats.avgCount,
      总使用次数: stats.totalCount,
      最近活跃数: stats.recentActive
    });
    
    logger.info('按类型统计:', stats.byType);
    logger.info('按聊天ID统计（前10）:', stats.byChatId);
    
    return;
  } catch (error) {
    logger.error('获取expression统计信息示例失败:', error);
    throw error;
  }
}

/**
 * 示例：增加expression统计次数
 */
export async function exampleIncrementCount(expressionId: number): Promise<void> {
  try {
    logger.info('=== 增加expression统计次数示例 ===');
    
    // 模拟使用expression的场景
    await ExpressionService.incrementCount(expressionId);
    logger.info(`expression ${expressionId} 统计次数已增加`);
    
    // 查看更新后的数据
    const expression = await ExpressionService.getExpressionById(expressionId);
    if (expression) {
      logger.info('更新后的统计次数:', expression.count);
    }
    
    return;
  } catch (error) {
    logger.error('增加expression统计次数示例失败:', error);
    throw error;
  }
}

/**
 * 示例：搜索expression
 */
export async function exampleSearchExpressions(): Promise<void> {
  try {
    logger.info('=== 搜索expression示例 ===');
    
    const keyword = '图片';
    const results = await ExpressionService.searchExpressions(keyword, 5);
    
    logger.info(`搜索关键字"${keyword}"找到${results.length}个结果:`);
    results.forEach((expression, index) => {
      logger.info(`  ${index + 1}. ${expression.situation} -> ${expression.style}`);
    });
    
    return;
  } catch (error) {
    logger.error('搜索expression示例失败:', error);
    throw error;
  }
}

/**
 * 批量操作示例：导入expression数据
 */
export async function exampleBatchImportExpressions(): Promise<void> {
  try {
    logger.info('=== 批量导入expression示例 ===');
    
    const expressionList: ExpressionInsertData[] = [
      {
        situation: '询问对方近况',
        style: '最近怎么样啊',
        count: 0,
        chat_id: 'chat_002',
        type: ExpressionType.STYLE,
        last_active_time: Date.now() / 1000,
        create_date: Date.now() / 1000
      },
      {
        situation: '表达感谢',
        style: '真的太谢谢你了',
        count: 0,
        chat_id: 'chat_002',
        type: ExpressionType.STYLE,
        last_active_time: Date.now() / 1000,
        create_date: Date.now() / 1000
      },
      {
        situation: '确认时间安排',
        style: '明天几点开始呢',
        count: 0,
        chat_id: 'chat_003',
        type: ExpressionType.GRAMMAR,
        last_active_time: Date.now() / 1000,
        create_date: Date.now() / 1000
      }
    ];
    
    const insertedIds: number[] = [];
    
    for (const expressionData of expressionList) {
      try {
        const id = await ExpressionService.insertExpression(expressionData);
        insertedIds.push(id);
        logger.info(`插入expression成功: ${expressionData.situation} -> ${expressionData.style} (ID: ${id})`);
      } catch (error) {
        logger.error(`插入expression失败: ${expressionData.situation}`, error);
      }
    }
    
    logger.info(`批量导入完成，成功插入${insertedIds.length}条expression记录`);
    
    return;
  } catch (error) {
    logger.error('批量导入expression示例失败:', error);
    throw error;
  }
}

/**
 * 综合示例：完整的expression操作流程
 */
export async function exampleCompleteExpressionWorkflow(): Promise<void> {
  try {
    logger.info('=== 完整expression操作流程示例 ===');
    
    // 1. 插入一个新expression
    const newExpressionData: ExpressionInsertData = {
      situation: '工作流测试情境',
      style: '这是一个测试用的表达风格',
      count: 0,
      chat_id: 'test_chat',
      type: ExpressionType.STYLE,
      last_active_time: Date.now() / 1000,
      create_date: Date.now() / 1000
    };
    
    const newExpressionId = await ExpressionService.insertExpression(newExpressionData);
    logger.info(`步骤1: 插入expression成功，ID: ${newExpressionId}`);
    
    // 2. 查询刚插入的expression
    const insertedExpression = await ExpressionService.getExpressionById(newExpressionId);
    logger.info('步骤2: 查询插入的expression:', insertedExpression?.situation);
    
    // 3. 更新expression信息
    await ExpressionService.updateExpression({
      id: newExpressionId,
      situation: '更新后的工作流测试情境',
      style: '更新后的测试用表达风格'
    });
    logger.info('步骤3: 更新expression成功');
    
    // 4. 增加统计次数
    await ExpressionService.incrementCount(newExpressionId);
    logger.info('步骤4: 增加统计次数成功');
    
    // 5. 查看最终结果
    const finalExpression = await ExpressionService.getExpressionById(newExpressionId);
    logger.info('步骤5: 最终结果:', {
      id: finalExpression?.id,
      situation: finalExpression?.situation,
      style: finalExpression?.style,
      count: finalExpression?.count
    });
    
    // 6. 清理测试数据（可选）
    // await ExpressionService.deleteExpression(newExpressionId);
    // logger.info('步骤6: 清理测试数据完成');
    
    logger.info('完整工作流程执行成功！');
    
    return;
  } catch (error) {
    logger.error('完整expression操作流程示例失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  async function runAllExamples() {
    try {
      // 这里需要先确保数据库连接和路径缓存已设置
      logger.info('开始执行所有expression操作示例...');
      
      // await exampleInsertExpression();
      // await exampleQueryExpressions();
      // await exampleGetExpressionsByChatId();
      // await exampleGetExpressionsByType();
      // await exampleGetExpressionStats();
      // await exampleSearchExpressions();
      // await exampleBatchImportExpressions();
      // await exampleCompleteExpressionWorkflow();
      
      logger.info('所有示例执行完成！');
    } catch (error) {
      logger.error('执行示例时出错:', error);
    }
  }
  
  runAllExamples();
}
