/**
 * Expression表类型定义
 * 用于定义Expression表的数据结构和操作相关的类型
 */

/**
 * Expression表记录结构
 */
export interface ExpressionRecord {
  id: number;                    // 唯一标识符
  situation: string;             // 情境描述
  style: string;                 // 对应的表达风格
  count: number;                 // 统计次数
  last_active_time: number;      // 最后使用此表达方式的时间
  chat_id: string;               // 聊天ID
  type: string;                  // 类型（style (表达方式)/ grammar （语法表达方式））
  create_date: number;           // 创建时间
}

/**
 * 插入Expression时的数据结构（不包含id，因为id是自动生成的）
 */
export interface ExpressionInsertData {
  situation: string;             // 情境描述
  style: string;                 // 对应的表达风格
  count?: number;                // 统计次数（可选，默认为0）
  last_active_time?: number;     // 最后使用此表达方式的时间（可选，默认为当前时间）
  chat_id: string;               // 聊天ID
  type: string;                  // 类型（style (表达方式)/ grammar （语法表达方式））
  create_date?: number;          // 创建时间（可选，默认为当前时间）
}

/**
 * 更新Expression时的数据结构
 */
export interface ExpressionUpdateData {
  id: number;                    // 必需：要更新的记录ID
  situation?: string;            // 可选：情境描述
  style?: string;                // 可选：对应的表达风格
  count?: number;                // 可选：统计次数
  last_active_time?: number;     // 可选：最后使用此表达方式的时间
  chat_id?: string;              // 可选：聊天ID
  type?: string;                 // 可选：类型
  create_date?: number;          // 可选：创建时间
}

/**
 * Expression分页查询参数
 */
export interface ExpressionPaginationParams {
  page: number;                  // 页码，从1开始
  pageSize: number;              // 每页记录数
  orderBy?: string;              // 排序字段，默认为'id'
  orderDir?: 'ASC' | 'DESC';     // 排序方向，默认为'ASC'
  filter?: ExpressionFilterOptions; // 过滤条件
}

/**
 * Expression查询过滤选项
 */
export interface ExpressionFilterOptions {
  situation?: string;            // 按情境描述过滤
  style?: string;                // 按表达风格过滤
  chat_id?: string;              // 按聊天ID过滤
  type?: string;                 // 按类型过滤
  minCount?: number;             // 最小统计次数
  maxCount?: number;             // 最大统计次数
  startDate?: number;            // 开始创建时间
  endDate?: number;              // 结束创建时间
}

/**
 * Expression分页查询结果
 */
export interface ExpressionPaginationResult {
  items: ExpressionRecord[];     // 当前页的记录列表
  total: number;                 // 总记录数
  totalPages: number;            // 总页数
  currentPage: number;           // 当前页码
  pageSize: number;              // 每页记录数
  hasNext: boolean;              // 是否有下一页
  hasPrev: boolean;              // 是否有上一页
}

/**
 * Expression统计信息
 */
export interface ExpressionStats {
  total: number;                                 // 总记录数
  byType: Record<string, number>;                // 按类型统计
  byChatId: Record<string, number>;              // 按聊天ID统计
  avgCount: number;                              // 平均统计次数
  totalCount: number;                            // 总统计次数
  recentActive: number;                          // 最近活跃的expression数量（24小时内）
}

/**
 * Expression类型枚举
 */
export enum ExpressionType {
  STYLE = 'style',               // 表达方式
  GRAMMAR = 'grammar'            // 语法表达方式
}

/**
 * Expression验证错误信息
 */
export interface ExpressionValidationError {
  field: string;                 // 错误字段
  message: string;               // 错误信息
}
