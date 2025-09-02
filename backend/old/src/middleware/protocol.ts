import { AppContext, ApiResponse } from '../types';
import { logger } from '../core/logger';
import { generateUUID } from '../utils/helpers';

/**
 * 协议中间件 - 处理标准化的HTTP响应格式
 */
export async function protocolMiddleware(ctx: AppContext, next: () => Promise<void>): Promise<void> {
  // 记录请求开始时间
  ctx.startTime = Date.now();
  
  // 生成请求ID
  ctx.requestId = generateUUID();
  
  // 设置通用响应头
  ctx.set('X-Request-ID', ctx.requestId);
  ctx.set('X-Powered-By', 'HMML');
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (ctx.method === 'OPTIONS') {
    ctx.status = 200;
    return;
  }

  try {
    // 执行下一个中间件
    await next();
  } catch (error: any) {
    // 捕获并处理错误
    logger.error(`请求处理异常 [${ctx.requestId}]:`, error);
    ctx.status = error.status || 500;
    ctx.body = error;
  }

  // 响应后处理
  await postProcess(ctx);
}

/**
 * 响应后处理
 */
async function postProcess(ctx: AppContext): Promise<void> {
  const endTime = Date.now();
  const duration = ctx.startTime ? endTime - ctx.startTime : 0;
  
  // 记录请求日志
  const logMessage = `${ctx.method} ${ctx.url} - ${ctx.status} - ${duration}ms - ${ctx.requestId}`;
  if (ctx.status >= 400) {
    logger.warn(logMessage);
  } else {
    logger.info(logMessage);
  }

  // 处理响应体
  if (ctx.body instanceof Error) {
    // 处理错误响应
    const error = ctx.body as Error;
    ctx.status = ctx.status || 500;
    const response: ApiResponse = {
      status: ctx.status,
      data: null,
      message: error.message,
      time: endTime
    };
    ctx.body = response;
    return;
  }

  // 处理404
  if (ctx.status === 404) {
    const response: ApiResponse = {
      status: 404,
      data: null,
      message: 'Not Found',
      time: endTime
    };
    ctx.body = response;
    return;
  }

  // 处理空响应
  if (ctx.body === null || ctx.body === undefined || ctx.body === false) {
    ctx.status = ctx.status === 200 ? 500 : ctx.status;
    const response: ApiResponse = {
      status: ctx.status,
      data: null,
      message: ctx.status === 500 ? 'Internal Server Error' : 'No Content',
      time: endTime
    };
    ctx.body = response;
    return;
  }

  // 处理已经是标准格式的响应
  if (isApiResponse(ctx.body)) {
    return;
  }

  // 处理字符串响应
  if (typeof ctx.body === 'string') {
    const response: ApiResponse = {
      status: ctx.status || 200,
      data: ctx.body,
      time: endTime
    };
    ctx.body = response;
    return;
  }

  // 处理其他类型的响应
  if (ctx.status === 200 || !ctx.status) {
    const response: ApiResponse = {
      status: 200,
      data: ctx.body,
      time: endTime
    };
    ctx.body = response;
    return;
  }
}

/**
 * 检查是否已经是标准API响应格式
 */
function isApiResponse(obj: any): obj is ApiResponse {
  return obj && 
    typeof obj === 'object' && 
    typeof obj.status === 'number' && 
    obj.hasOwnProperty('data') && 
    typeof obj.time === 'number';
}

/**
 * 创建标准成功响应
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    status: 200,
    data,
    message,
    time: Date.now()
  };
}

/**
 * 创建标准错误响应
 */
export function createErrorResponse(status: number, message: string, data?: any): ApiResponse {
  return {
    status,
    data: data || null,
    message,
    time: Date.now()
  };
}
