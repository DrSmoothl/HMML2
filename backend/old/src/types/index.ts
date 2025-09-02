import { Context } from 'koa';

// 导出路径缓存相关类型
export * from './pathCache';

// 导出数据库相关类型
export * from './database';

// HTTP响应格式
export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message?: string;
  time: number;
}

// 错误信息格式
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 请求上下文扩展
export interface AppContext extends Context {
  // 可以在这里添加自定义属性
  requestId?: string;
  startTime?: number;
}

// 路由处理器类型
export type RouteHandler = (ctx: AppContext, next?: () => Promise<void>) => Promise<void>;

// 中间件类型
export type Middleware = (ctx: AppContext, next: () => Promise<void>) => Promise<void>;

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// 分页响应
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 排序参数
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// 查询参数
export interface QueryParams {
  pagination?: PaginationParams;
  sort?: SortParams;
  filter?: Record<string, any>;
  search?: string;
}

// 文件上传信息
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// 系统状态
export interface SystemStatus {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
}

// 日志级别枚举
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// 操作结果
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string | ApiError;
}

// 数据库连接配置（预留）
export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  options?: Record<string, any>;
}

// 缓存配置（预留）
export interface CacheConfig {
  type: 'memory' | 'redis';
  ttl: number;
  maxSize?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
}

// 任务状态（预留）
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 任务信息（预留）
export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: any;
}
