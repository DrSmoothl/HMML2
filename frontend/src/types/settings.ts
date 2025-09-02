import type { BaseEntity } from './api'

// 麦麦设置相关类型
export interface MaimaiConfig extends BaseEntity {
  name: string
  description?: string
  enabled: boolean
  config: Record<string, any>
}

// 模型设置相关类型
export interface ModelConfig extends BaseEntity {
  name: string
  type: 'openai' | 'claude' | 'gemini' | 'local' | 'custom'
  apiKey?: string
  baseUrl?: string
  model: string
  temperature?: number
  maxTokens?: number
  enabled: boolean
  config: Record<string, any>
}

// 适配器设置相关类型
export interface AdapterConfig extends BaseEntity {
  name: string
  type: 'qq' | 'wechat' | 'telegram' | 'discord' | 'custom'
  enabled: boolean
  config: Record<string, any>
}

// Emoji 管理相关类型
export interface EmojiItem extends BaseEntity {
  name: string
  url: string
  tags: string[]
  category: string
  usage: number
}

export interface EmojiCategory {
  id: string
  name: string
  description?: string
  count: number
}

// 表达方式管理相关类型
export interface Expression extends BaseEntity {
  name: string
  content: string
  type: 'text' | 'image' | 'audio' | 'video'
  category: string
  tags: string[]
  usage: number
}

// 人物信息管理相关类型
export interface Character extends BaseEntity {
  name: string
  avatar?: string
  description?: string
  personality: string[]
  background?: string
  relationships?: CharacterRelationship[]
  config: Record<string, any>
}

export interface CharacterRelationship {
  characterId: string
  characterName: string
  type: 'friend' | 'family' | 'enemy' | 'neutral'
  description?: string
}
