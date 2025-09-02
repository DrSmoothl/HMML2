import api from './api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { ChatStream, ChatStreamStats, ChatStreamFormData } from '@/types/chatStream'

// 获取聊天流列表（分页）
export async function getChatStreams(params: {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDir?: 'ASC' | 'DESC'
  stream_id?: string
  group_platform?: string
  group_id?: string
  group_name?: string
  platform?: string
  user_platform?: string
  user_id?: string
  user_nickname?: string
  user_cardname?: string
}): Promise<PaginatedResponse<ChatStream>> {
  const response = await api.get<ApiResponse<PaginatedResponse<ChatStream>>>('/database/chatStreams/get', {
    params
  })
  return response.data.data!
}

// 根据ID获取单个聊天流
export async function getChatStreamById(id: number): Promise<ChatStream> {
  const response = await api.get<ApiResponse<ChatStream>>(`/database/chatStreams/getById/${id}`)
  return response.data.data!
}

// 根据stream_id获取聊天流
export async function getChatStreamByStreamId(streamId: string): Promise<ChatStream> {
  const response = await api.get<ApiResponse<ChatStream>>(`/database/chatStreams/getByStreamId/${streamId}`)
  return response.data.data!
}

// 创建新的聊天流
export async function createChatStream(data: ChatStreamFormData): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>('/database/chatStreams/insert', data)
  return response.data.data!
}

// 更新聊天流
export async function updateChatStream(data: ChatStreamFormData & { id: number }): Promise<void> {
  await api.post<ApiResponse<void>>('/database/chatStreams/update', data)
}

// 删除聊天流
export async function deleteChatStream(id: number): Promise<void> {
  await api.delete<ApiResponse<void>>('/database/chatStreams/delete', {
    data: { id }
  })
}

// 获取聊天流统计信息
export async function getChatStreamStats(): Promise<ChatStreamStats> {
  const response = await api.get<ApiResponse<ChatStreamStats>>('/database/chatStreams/stats')
  return response.data.data!
}
