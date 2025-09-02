import { AppContext } from '../types';
import { logger } from '../core/logger';
import { createErrorResponse } from './protocol';

/**
 * 全局错误处理中间件
 */
export async function errorHandlerMiddleware(ctx: AppContext, next: () => Promise<void>): Promise<void> {
  try {
    await next();
  } catch (error: any) {
    // 记录错误
    logger.error(`全局错误处理 [${ctx.requestId || 'unknown'}]:`, {
      url: ctx.url,
      method: ctx.method,
      headers: ctx.headers,
      body: (ctx.request as any).body,
      error: error.message,
      stack: error.stack
    });

    // 设置响应状态和内容
    const status = error.status || error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    
    ctx.status = status;
    ctx.body = createErrorResponse(status, message);

    // 触发应用级错误事件
    ctx.app.emit('error', error, ctx);
  }
}

/**
 * 404处理中间件
 */
export async function notFoundMiddleware(ctx: AppContext): Promise<void> {
  if (ctx.status === 404 || !ctx.body) {
    ctx.status = 404;
    ctx.body = createErrorResponse(404, `路径 ${ctx.url} 未找到`);
    logger.warn(`404 Not Found: ${ctx.method} ${ctx.url} [${ctx.requestId || 'unknown'}]`);
  }
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(status: number, message: string, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
    
    // 维护正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * 预定义错误类型
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(404, message, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(409, message, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = '请求过于频繁') {
    super(429, message, 'TOO_MANY_REQUESTS_ERROR');
    this.name = 'TooManyRequestsError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = '内部服务器错误') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = '服务不可用') {
    super(503, message, 'SERVICE_UNAVAILABLE_ERROR');
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * 错误处理工具函数
 */
export function handleAsyncError(fn: Function) {
  return (ctx: AppContext, next: () => Promise<void>) => {
    return Promise.resolve(fn(ctx, next)).catch(next);
  };
}

/**
 * 参数验证工具
 */
export function validateRequired(params: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => 
    params[field] === undefined || params[field] === null || params[field] === ''
  );
  
  if (missingFields.length > 0) {
    throw new ValidationError(`缺少必需参数: ${missingFields.join(', ')}`);
  }
}

/**
 * 数据类型验证
 */
export function validateType(value: any, expectedType: string, fieldName: string): void {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new ValidationError(`参数 ${fieldName} 类型错误，期望 ${expectedType}，实际 ${actualType}`);
  }
}

/**
 * 数值范围验证
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new ValidationError(`参数 ${fieldName} 超出范围，应在 ${min} 到 ${max} 之间`);
  }
}

/**
 * 字符串长度验证
 */
export function validateLength(value: string, min: number, max: number, fieldName: string): void {
  if (value.length < min || value.length > max) {
    throw new ValidationError(`参数 ${fieldName} 长度错误，应在 ${min} 到 ${max} 字符之间`);
  }
}

/**
 * 正则表达式验证
 */
export function validatePattern(value: string, pattern: RegExp, fieldName: string, message?: string): void {
  if (!pattern.test(value)) {
    throw new ValidationError(message || `参数 ${fieldName} 格式不正确`);
  }
}
