// 聊天流相关类型定义
export interface ChatStream {
  id: number
  stream_id: string
  create_time: number
  group_platform: string
  group_id: string
  group_name: string
  last_active_time: number
  platform: string
  user_platform: string
  user_id: string
  user_nickname: string
  user_cardname: string
}

export interface ChatStreamStats {
  totalCount: number
  recentActiveCount: number
  platformStats: Array<{
    platform: string
    count: number
  }>
  groupPlatformStats: Array<{
    group_platform: string
    count: number
  }>
}

export interface ChatStreamFilters {
  stream_id?: string
  group_platform?: string
  group_id?: string
  group_name?: string
  user_platform?: string
  user_id?: string
  user_nickname?: string
  user_cardname?: string
}

export interface ChatStreamFormData {
  stream_id: string
  create_time: number
  group_platform: string
  group_id: string
  group_name: string
  last_active_time: number
  platform: string
  user_platform: string
  user_id: string
  user_nickname: string
  user_cardname: string
}
