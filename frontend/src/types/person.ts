// 人物信息相关类型定义 - 根据HMML API文档PersonInfo表结构
export interface PersonInfo {
  id: number
  is_known: number // 是否已经认识
  person_id: string
  person_name: string
  name_reason?: string
  platform: string
  user_id: string
  nickname?: string
  know_times: number
  know_since: number // Unix时间戳
  last_know: number // Unix时间戳
  memory_points?: string // 记忆点,JSON格式字符串
}

// 创建/更新人物信息的请求类型
export interface CreatePersonInfoRequest {
  is_known?: number
  person_id: string
  person_name: string
  name_reason?: string
  platform: string
  user_id: string
  nickname?: string
  know_times?: number
  know_since?: number
  last_know?: number
  memory_points?: string
}

export interface UpdatePersonInfoRequest {
  is_known?: number
  person_name?: string
  name_reason?: string
  nickname?: string
  know_times?: number
  know_since?: number
  last_know?: number
  memory_points?: string
}

// 查询参数类型
export interface PersonInfoQueryParams {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDir?: 'ASC' | 'DESC'
  person_id?: string
  person_name?: string
  platform?: string
  user_id?: string
  nickname?: string
  is_known?: number
  minKnowTimes?: number
  maxKnowTimes?: number
  knowSinceStart?: number
  knowSinceEnd?: number
  lastKnowStart?: number
  lastKnowEnd?: number
}

// 统计信息类型
export interface PersonInfoStats {
  total: number
  byPlatform: Record<string, number>
  avgKnowTimes: number
  totalKnowTimes: number
  recentActive: number
  topPersons: Array<{
    id: number
    person_name: string
    know_times: number
  }>
}

// 搜索请求类型
export interface PersonInfoSearchParams {
  keyword: string
  limit?: number
}

// 可用平台列表
export type AvailablePlatform = 'qq' | 'wechat' | 'telegram' | 'discord' | 'line' | 'other'
