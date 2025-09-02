/**
 * 数据库操作路由
 * 提供通用的数据库CRUD操作接口和emoji表专用操作
 */

import Router from '@koa/router';
import { Context, Next } from 'koa';
import { logger } from '../core/logger';
import { databaseManager } from '../core/database';
import { pathCacheManager } from '../core/pathCacheManager';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';
import emojiRoutes from './emojiRoutes';
import expressionRoutes from './expressionRoutes';
import chatStreamRoutes from './chatStreamRoutes';
import { personInfoRouter } from './personInfo';
import path from 'path';

const router = new Router();

/**
 * 获取麦麦数据库路径
 */
async function getMaiBotDbPath(): Promise<string> {
  const mainRoot = pathCacheManager.getMainRoot();
  if (!mainRoot) {
    throw new NotFoundError('麦麦主程序根目录未设置，请先设置根目录缓存');
  }
  return path.join(mainRoot, 'data', 'MaiBot.db');
}

/**
 * 初始化麦麦数据库连接
 */
async function initMaiBotConnection(): Promise<void> {
  const dbPath = await getMaiBotDbPath();
  
  // 检查连接是否已存在
  if (!databaseManager.hasConnection('maibot')) {
    if (!databaseManager.isManagerInitialized()) {
      await databaseManager.initialize();
    }
    
    await databaseManager.addDatabase('maibot', {
      path: dbPath,
      readonly: false,
      timeout: 5000,
      fileMustExist: true
    });
  }
}

/**
 * 获取数据库连接状态
 * GET /database/status
 */
router.get('/status', async (ctx: Context, next: Next) => {
  try {
    const stats = databaseManager.getConnectionStats();
    
    ctx.body = {
      status: 200,
      message: '数据库状态获取成功',
      data: {
        totalConnections: stats.totalConnections,
        activeConnections: stats.activeConnections,
        connections: stats.connections.map(conn => ({
          name: conn.name,
          isOpen: conn.info.isOpen,
          readonly: conn.info.readonly,
          path: conn.info.path
        }))
      },
      time: Date.now()
    };
  } catch (error) {
    logger.error('获取数据库状态失败:', error);
    throw new InternalServerError('获取数据库状态失败');
  }
});

/**
 * 测试数据库连接
 * GET /database/test
 */
router.get('/test', async (ctx: Context, next: Next) => {
  try {
    await initMaiBotConnection();
    const isConnected = await databaseManager.testConnection('maibot');
    
    ctx.body = {
      status: 200,
      message: isConnected ? '数据库连接正常' : '数据库连接失败',
      data: {
        connected: isConnected,
        dbPath: await getMaiBotDbPath()
      },
      time: Date.now()
    };
  } catch (error: any) {
    logger.error('数据库连接测试失败:', error);
    ctx.body = {
      status: 500,
      message: `数据库连接测试失败: ${error.message || '未知错误'}`,
      data: {
        connected: false,
        error: error.message || '未知错误'
      },
      time: Date.now()
    };
  }
});

/**
 * 获取数据库统计信息
 * GET /database/stats
 */
router.get('/stats', async (ctx: Context, next: Next) => {
  try {
    await initMaiBotConnection();
    const stats = await databaseManager.getDatabaseStats('maibot');
    
    ctx.body = {
      status: 200,
      message: '数据库统计信息获取成功',
      data: stats,
      time: Date.now()
    };
  } catch (error) {
    logger.error('获取数据库统计信息失败:', error);
    throw new InternalServerError('获取数据库统计信息失败');
  }
});

/**
 * 获取表列表
 * GET /database/tables
 */
router.get('/tables', async (ctx: Context, next: Next) => {
  try {
    await initMaiBotConnection();
    const connection = databaseManager.getConnection('maibot');
    const tables = await connection.getTablesInfo();
    
    ctx.body = {
      status: 200,
      message: '表列表获取成功',
      data: {
        tables: tables.map(table => ({
          name: table.name,
          columnCount: table.columns.length,
          rowCount: table.rowCount,
          primaryKeys: table.primaryKeys
        }))
      },
      time: Date.now()
    };
  } catch (error) {
    logger.error('获取表列表失败:', error);
    throw new InternalServerError('获取表列表失败');
  }
});

/**
 * 获取表结构信息
 * GET /database/table/:tableName
 */
router.get('/table/:tableName', async (ctx: Context, next: Next) => {
  try {
    const { tableName } = ctx.params;
    
    if (!tableName) {
      throw new ValidationError('表名不能为空');
    }
    
    await initMaiBotConnection();
    const connection = databaseManager.getConnection('maibot');
    const tableInfo = await connection.getTableInfo(tableName);
    
    ctx.body = {
      status: 200,
      message: '表结构获取成功',
      data: tableInfo,
      time: Date.now()
    };
  } catch (error: any) {
    logger.error(`获取表结构失败: ${error.message || '未知错误'}`);
    if (error.message && error.message.includes('no such table')) {
      throw new NotFoundError(`表 ${ctx.params.tableName} 不存在`);
    }
    throw new InternalServerError('获取表结构失败');
  }
});

// 集成emoji专用路由
router.use(emojiRoutes.routes());

// 集成expression专用路由
router.use(expressionRoutes.routes());

// 集成chatStream专用路由
router.use(chatStreamRoutes.routes());

// 集成person_info专用路由
router.use(personInfoRouter.routes());

export default router;