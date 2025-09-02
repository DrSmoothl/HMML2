/**
 * SQLite 数据库操作相关类型定义
 */

// 分页参数
export interface PaginationParams {
  page: number;        // 页码，从1开始
  pageSize: number;    // 每页数量
  offset?: number;     // 偏移量，由page和pageSize计算得出
}

// 分页响应
export interface PaginatedResult<T = any> {
  data: T[];           // 当前页数据
  pagination: {
    total: number;     // 总记录数
    page: number;      // 当前页码
    pageSize: number;  // 每页大小
    totalPages: number; // 总页数
    hasNext: boolean;   // 是否有下一页
    hasPrev: boolean;   // 是否有上一页
  };
}

// 排序参数
export interface SortParams {
  field: string;               // 排序字段
  order: 'ASC' | 'DESC';      // 排序方向
}

// 查询过滤器
export interface QueryFilter {
  field: string;               // 字段名
  operator: FilterOperator;    // 操作符
  value: any;                 // 值
  logicalOperator?: 'AND' | 'OR'; // 逻辑操作符
}

// 过滤操作符
export type FilterOperator = 
  | '='           // 等于
  | '!='          // 不等于
  | '>'           // 大于
  | '>='          // 大于等于
  | '<'           // 小于
  | '<='          // 小于等于
  | 'LIKE'        // 模糊匹配
  | 'NOT LIKE'    // 不匹配
  | 'IN'          // 在范围内
  | 'NOT IN'      // 不在范围内
  | 'IS NULL'     // 为空
  | 'IS NOT NULL' // 不为空
  | 'BETWEEN';    // 在区间内

// 查询参数
export interface QueryParams {
  select?: string[];          // 选择字段，默认为 *
  where?: QueryFilter[];      // WHERE条件
  orderBy?: SortParams[];     // 排序
  groupBy?: string[];         // 分组字段
  having?: QueryFilter[];     // HAVING条件
  limit?: number;             // 限制数量
  offset?: number;            // 偏移量
}

// 数据库配置
export interface DatabaseConfig {
  path: string;               // 数据库文件路径
  readonly?: boolean;         // 是否只读模式
  timeout?: number;           // 连接超时时间（毫秒）
  verbose?: boolean;          // 是否启用详细日志
  memory?: boolean;           // 是否使用内存数据库
  fileMustExist?: boolean;    // 文件是否必须存在
}

// 数据库连接信息
export interface DatabaseInfo {
  path: string;               // 数据库路径
  isOpen: boolean;           // 是否已打开
  readonly: boolean;         // 是否只读
  inTransaction: boolean;    // 是否在事务中
  name: string;              // 数据库名称
}

// 表信息
export interface TableInfo {
  name: string;              // 表名
  columns: ColumnInfo[];     // 列信息
  primaryKeys: string[];     // 主键列名
  indexes: IndexInfo[];      // 索引信息
  rowCount?: number;         // 行数（可选）
}

// 列信息
export interface ColumnInfo {
  cid: number;               // 列ID
  name: string;              // 列名
  type: string;              // 数据类型
  notNull: boolean;          // 是否非空
  defaultValue: any;         // 默认值
  primaryKey: boolean;       // 是否主键
}

// 索引信息
export interface IndexInfo {
  name: string;              // 索引名
  unique: boolean;           // 是否唯一索引
  columns: string[];         // 索引列名
}

// 事务选项
export interface TransactionOptions {
  immediate?: boolean;       // 是否立即事务
  exclusive?: boolean;       // 是否排他事务
}

// 批量操作参数
export interface BatchOperationParams<T = any> {
  tableName: string;         // 表名
  data: T[];                // 数据数组
  updateOnConflict?: boolean; // 冲突时是否更新
  conflictColumns?: string[]; // 冲突检测列
}

// 统计信息
export interface DatabaseStats {
  totalTables: number;       // 总表数
  totalRows: number;         // 总行数
  databaseSize: number;      // 数据库大小（字节）
  lastModified: Date;        // 最后修改时间
}

// 操作结果
export interface OperationResult<T = any> {
  success: boolean;          // 是否成功
  data?: T;                 // 返回数据
  affectedRows?: number;     // 影响行数
  lastInsertId?: number;     // 最后插入ID
  error?: string;           // 错误信息
  executionTime?: number;    // 执行时间（毫秒）
}

// SQL构建器参数
export interface SqlBuilderParams {
  table: string;             // 表名
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'; // SQL类型
  fields?: string[] | Record<string, any>; // 字段
  where?: QueryFilter[];     // WHERE条件
  orderBy?: SortParams[];    // 排序
  groupBy?: string[];        // 分组
  having?: QueryFilter[];    // HAVING条件
  limit?: number;            // 限制
  offset?: number;           // 偏移
  joins?: JoinParams[];      // 连接
}

// JOIN参数
export interface JoinParams {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'; // JOIN类型
  table: string;             // 连接表名
  on: string;                // ON条件
  alias?: string;            // 表别名
}

// 数据库备份配置
export interface BackupConfig {
  sourcePath: string;        // 源数据库路径
  targetPath: string;        // 目标路径
  includeData?: boolean;     // 是否包含数据
  compressionLevel?: number; // 压缩级别（0-9）
}

// 错误类型
export interface DatabaseError extends Error {
  code?: string;             // 错误代码
  sqlMessage?: string;       // SQL错误信息
  sql?: string;              // 执行的SQL
  parameters?: any[];        // SQL参数
}
