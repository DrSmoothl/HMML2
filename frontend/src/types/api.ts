// API 响应基础类型 - 根据HMML API文档
export interface ApiResponse<T = any> {
  status: number
  message: string
  data?: T
  time: number
}

// 分页相关类型
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  totalPages: number
  currentPage: number
  pageSize: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

// 通用实体类型
export interface BaseEntity {
  id: number
  createdAt?: string
  updatedAt?: string
}

// 错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
}