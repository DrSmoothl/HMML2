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
  points?: string // JSON格式字符串
  know_times: number
  know_since: number // Unix时间戳
  last_know: number // Unix时间戳
  attitude_to_me?: string // 对自己的态度
  attitude_to_me_confidence?: number // 对自己的态度的累计权重
  friendly_value?: number // 友好度
  friendly_value_confidence?: number // 友好度的累计权重
  rudeness?: string // 粗鲁度
  rudeness_confidence?: number // 粗鲁度的累计权重
  neuroticism?: string // 神经质程度
  neuroticism_confidence?: number // 神经质程度的累计权重
  conscientiousness?: string // 尽责程度
  conscientiousness_confidence?: number // 尽责程度的累计权重
  likeness?: string // 喜爱程度
  likeness_confidence?: number // 喜爱程度的累计权重
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
  points?: string
  know_times?: number
  know_since?: number
  last_know?: number
  attitude_to_me?: string
  attitude_to_me_confidence?: number
  friendly_value?: number
  friendly_value_confidence?: number
  rudeness?: string
  rudeness_confidence?: number
  neuroticism?: string
  neuroticism_confidence?: number
  conscientiousness?: string
  conscientiousness_confidence?: number
  likeness?: string
  likeness_confidence?: number
}

export interface UpdatePersonInfoRequest {
  is_known?: number
  person_name?: string
  name_reason?: string
  nickname?: string
  points?: string
  know_times?: number
  know_since?: number
  last_know?: number
  attitude_to_me?: string
  attitude_to_me_confidence?: number
  friendly_value?: number
  friendly_value_confidence?: number
  rudeness?: string
  rudeness_confidence?: number
  neuroticism?: string
  neuroticism_confidence?: number
  conscientiousness?: string
  conscientiousness_confidence?: number
  likeness?: string
  likeness_confidence?: number
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
  points?: string
  attitude_to_me?: string
  rudeness?: string
  neuroticism?: string
  conscientiousness?: string
  likeness?: string
  minKnowTimes?: number
  maxKnowTimes?: number
  minFriendlyValue?: number
  maxFriendlyValue?: number
  knowSinceStart?: number
  knowSinceEnd?: number
  lastKnowStart?: number
  lastKnowEnd?: number
}

// 统计信息类型
export interface PersonInfoStats {
  total: number
  byPlatform: Record<string, number>
  byFriendlyValue: Record<string, number>
  byAttitudeToMe: Record<string, number>
  byRudeness: Record<string, number>
  byNeuroticism: Record<string, number>
  byConscientiousness: Record<string, number>
  byLikeness: Record<string, number>
  avgKnowTimes: number
  avgFriendlyValue: number
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
