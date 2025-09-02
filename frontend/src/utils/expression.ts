import api from '@/utils/api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { 
  Expression, 
  ExpressionQueryParams, 
  ExpressionCreateParams, 
  ExpressionUpdateParams,
  ExpressionStats,
  ExpressionSearchParams
} from '@/types/expression'

// 分页查询表达方式
export const getExpressions = async (params: ExpressionQueryParams = {}) => {
  const response = await api.get<ApiResponse<PaginatedResponse<Expression>>>('/database/expression/get', {
    params: {
      page: 1,
      pageSize: 20,
      orderBy: 'id',
      orderDir: 'DESC',
      ...params
    }
  })
  return response.data
}

// 根据ID查询单个表达方式
export const getExpression = async (id: number) => {
  const response = await api.get<ApiResponse<Expression>>(`/database/expression/get/${id}`)
  return response.data
}

// 创建表达方式
export const createExpression = async (data: ExpressionCreateParams) => {
  const response = await api.post<ApiResponse<{ id: number }>>('/database/expression/insert', {
    ...data,
    create_date: data.create_date || Date.now() / 1000,
    last_active_time: data.last_active_time || Date.now() / 1000,
    count: data.count || 0
  })
  return response.data
}

// 更新表达方式
export const updateExpression = async (data: ExpressionUpdateParams) => {
  const response = await api.post<ApiResponse<void>>('/database/expression/update', data)
  return response.data
}

// 删除表达方式
export const deleteExpression = async (id: number) => {
  const response = await api.delete<ApiResponse<void>>('/database/expression/delete', {
    data: { id }
  })
  return response.data
}

// 根据聊天ID查询表达方式
export const getExpressionsByChat = async (chatId: string, limit: number = 10) => {
  const response = await api.get<ApiResponse<Expression[]>>(`/database/expression/chat/${chatId}`, {
    params: { limit }
  })
  return response.data
}

// 根据类型查询表达方式
export const getExpressionsByType = async (type: string) => {
  const response = await api.get<ApiResponse<Expression[]>>(`/database/expression/type/${type}`)
  return response.data
}

// 获取表达方式统计信息
export const getExpressionStats = async () => {
  const response = await api.get<ApiResponse<ExpressionStats>>('/database/expression/stats')
  return response.data
}

// 增加表达方式统计次数
export const incrementExpressionCount = async (id: number) => {
  const response = await api.post<ApiResponse<void>>(`/database/expression/increment/${id}`)
  return response.data
}

// 搜索表达方式
export const searchExpressions = async (params: ExpressionSearchParams) => {
  const response = await api.get<ApiResponse<Expression[]>>('/database/expression/search', {
    params: {
      limit: 20,
      ...params
    }
  })
  return response.data
}
