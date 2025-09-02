/**
 * Emoji表相关类型定义
 */

// Emoji记录结构
export interface EmojiRecord {
  id: number;                    // 唯一标识符
  full_path: string;            // 完整路径
  format: string;               // 格式
  emoji_hash: string;           // 哈希值
  description: string;          // 描述
  query_count: number;          // 查询次数
  is_registered: number;        // 是否注册 (0/1)
  is_banned: number;           // 是否被禁止 (0/1)
  emotion: string;             // 情感
  record_time: number;         // 记录时间
  register_time: number;       // 注册时间
  usage_count: number;         // 使用次数
  last_used_time: number;      // 最后使用时间
}

// 插入Emoji时的数据结构（不包含id）
export interface EmojiInsertData {
  full_path: string;
  format: string;
  emoji_hash: string;
  description: string;
  query_count: number;
  is_registered: number;
  is_banned: number;
  emotion: string;
  record_time: number;
  register_time: number;
  usage_count: number;
  last_used_time: number;
}

// 更新Emoji时的数据结构
export interface EmojiUpdateData extends Partial<EmojiInsertData> {
  id: number; // 更新时必须包含id
}

// Emoji查询过滤参数
export interface EmojiQueryFilter {
  format?: string;              // 按格式过滤
  emotion?: string;             // 按情感过滤
  is_registered?: number;       // 按注册状态过滤
  is_banned?: number;          // 按禁止状态过滤
  description?: string;         // 按描述模糊搜索
  emoji_hash?: string;         // 按哈希值查找
}

// Emoji分页查询参数
export interface EmojiPaginationParams {
  page: number;                 // 页码，从1开始
  pageSize: number;            // 每页数量
  orderBy?: 'id' | 'query_count' | 'usage_count' | 'last_used_time' | 'record_time'; // 排序字段
  orderDir?: 'ASC' | 'DESC';   // 排序方向
  filter?: EmojiQueryFilter;   // 过滤条件
}

// Emoji查询响应
export interface EmojiQueryResponse {
  items: EmojiRecord[];         // emoji内容
  totalPages: number;           // 总页数
  currentPage: number;          // 当前页
  pageSize: number;            // 每页大小
  total: number;               // 总记录数
  hasNext: boolean;            // 是否有下一页
  hasPrev: boolean;            // 是否有上一页
}

// API响应基础结构
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  time: number;
}

// Emoji插入响应
export interface EmojiInsertResponse extends ApiResponse<{ id: number }> {}

// Emoji更新响应
export interface EmojiUpdateResponse extends ApiResponse {}

// Emoji删除响应
export interface EmojiDeleteResponse extends ApiResponse {}

// Emoji查询响应
export interface EmojiGetResponse extends ApiResponse<EmojiQueryResponse> {}

// 获取单个emoji图片响应
export interface EmojiImageResponse extends ApiResponse<{ imageb64: string }> {}
