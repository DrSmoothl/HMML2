// Expression 表相关类型定义
export interface Expression {
  id: number
  situation: string
  style: string
  count: number
  last_active_time: number
  chat_id: string
  type: string
  create_date: number
}

// 查询参数
export interface ExpressionQueryParams {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDir?: 'ASC' | 'DESC'
  situation?: string
  style?: string
  chat_id?: string
  type?: string
  minCount?: number
  maxCount?: number
  startDate?: number
  endDate?: number
}

// 创建/更新参数
export interface ExpressionCreateParams {
  situation: string
  style: string
  count?: number
  last_active_time?: number
  chat_id?: string
  type?: string
  create_date?: number
}

export interface ExpressionUpdateParams extends Partial<ExpressionCreateParams> {
  id: number
}

// 统计信息
export interface ExpressionStats {
  total: number
  byType: Record<string, number>
  avgCount: number
  totalCount: number
  recentActive: number
}

// 搜索参数
export interface ExpressionSearchParams {
  keyword: string
  limit?: number
}
