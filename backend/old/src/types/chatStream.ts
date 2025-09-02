/**
 * ChatStream表相关类型定义
 */

// 聊天流记录结构
export interface ChatStreamRecord {
  id: number;                    // 唯一标识符
  stream_id: string;            // 聊天流id
  create_time: number;          // 创建时间
  group_platform: string;       // 群组平台
  group_id: string;             // 群组id
  group_name: string;           // 群组名称
  last_active_time: number;     // 最后活跃时间
  platform: string;            // 平台
  user_platform: string;       // 用户平台
  user_id: string;              // 用户id
  user_nickname: string;        // 用户昵称
  user_cardname: string;        // 用户群昵称
}

// 插入聊天流时的数据结构（不包含id）
export interface ChatStreamInsertData {
  stream_id: string;
  create_time: number;
  group_platform: string;
  group_id: string;
  group_name: string;
  last_active_time: number;
  platform: string;
  user_platform: string;
  user_id: string;
  user_nickname: string;
  user_cardname: string;
}

// 更新聊天流时的数据结构
export interface ChatStreamUpdateData extends Partial<ChatStreamInsertData> {
  id: number; // 更新时必须包含id
}

// 聊天流查询过滤参数
export interface ChatStreamQueryFilter {
  stream_id?: string;           // 按聊天流id过滤
  group_platform?: string;      // 按群组平台过滤
  group_id?: string;            // 按群组id过滤
  group_name?: string;          // 按群组名称模糊搜索
  platform?: string;           // 按平台过滤
  user_platform?: string;      // 按用户平台过滤
  user_id?: string;             // 按用户id过滤
  user_nickname?: string;       // 按用户昵称模糊搜索
  user_cardname?: string;       // 按用户群昵称模糊搜索
}

// 聊天流分页查询参数
export interface ChatStreamPaginationParams {
  page: number;                 // 页码，从1开始
  pageSize: number;            // 每页数量
  orderBy?: 'id' | 'create_time' | 'last_active_time'; // 排序字段
  orderDir?: 'ASC' | 'DESC';   // 排序方向
  filter?: ChatStreamQueryFilter; // 过滤条件
}

// 聊天流查询响应
export interface ChatStreamQueryResponse {
  items: ChatStreamRecord[];    // 聊天流内容
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

// 聊天流插入响应
export interface ChatStreamInsertResponse extends ApiResponse<{ id: number }> {}

// 聊天流更新响应
export interface ChatStreamUpdateResponse extends ApiResponse {}

// 聊天流删除响应
export interface ChatStreamDeleteResponse extends ApiResponse {}

// 聊天流查询响应
export interface ChatStreamGetResponse extends ApiResponse<ChatStreamQueryResponse> {}
