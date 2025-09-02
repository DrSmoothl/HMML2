// Emoji 相关类型定义

export interface EmojiItem {
  id: number
  full_path: string
  format: string
  emoji_hash: string
  description?: string
  query_count?: number
  is_registered?: number
  is_banned?: number
  emotion?: string
  record_time?: number
  register_time?: number
  usage_count?: number
  last_used_time?: number
}

export interface EmojiListResponse {
  items: EmojiItem[]
  totalPages: number
  currentPage: number
  pageSize: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

export interface EmojiFilters {
  description?: string
  format?: string
  emotion?: string
  is_registered?: number
  is_banned?: number
  emoji_hash?: string
}

export interface EmojiCreateData {
  full_path: string
  format: string
  emoji_hash?: string
  description?: string
  emotion?: string
  query_count?: number
  is_registered?: number
  is_banned?: number
  usage_count?: number
}

export interface EmojiUpdateData extends Partial<EmojiCreateData> {
  id: number
}

export type EmotionType = 'happy' | 'sad' | 'angry' | 'surprised' | 'confused' | 'love'
export type EmojiFormat = 'png' | 'jpg' | 'gif' | 'webp'
