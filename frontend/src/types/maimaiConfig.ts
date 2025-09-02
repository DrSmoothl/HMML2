// 麦麦配置相关的类型定义

export interface BotConfig {
  platform: string
  qq_account: number
  nickname: string
  alias_names: string[]
}

export interface PersonalityConfig {
  personality: string
  reply_style: string
  emotion_style: string
  interest: string
}

export interface ExpressionConfig {
  enable_expression: boolean
  expression_style: string
  enable_expression_learning: boolean
  learning_interval: number
  expression_groups: string[][]
}

export interface RelationshipConfig {
  enable_relationship: boolean
}

export interface ChatConfig {
  focus_value: number
  max_context_size: number
  mentioned_bot_reply: number
  at_bot_inevitable_reply: boolean
  talk_frequency: number
  planner_size: number
  focus_value_adjust: string[][]
  talk_frequency_adjust: string[][]
}

export interface MessageReceiveConfig {
  ban_words: string[]
  ban_msgs_regex: string[]
}

export interface NormalChatConfig {
  willing_mode: string
}

export interface ToolConfig {
  enable_tool: boolean
}

export interface EmojiConfig {
  emoji_chance: number
  emoji_activate_type: string
  max_reg_num: number
  do_replace: boolean
  check_interval: number
  steal_emoji: boolean
  content_filtration: boolean
  filtration_prompt: string
}

export interface MemoryConfig {
  enable_memory: boolean
  forget_memory_interval: number
  memory_forget_time: number
  memory_forget_percentage: number
  memory_ban_words: string[]
}

export interface VoiceConfig {
  enable_asr: boolean
}

export interface MoodConfig {
  enable_mood: boolean
  mood_update_threshold: number
}

export interface LpmmKnowledgeConfig {
  enable: boolean
  rag_synonym_search_top_k: number
  rag_synonym_threshold: number
  info_extraction_workers: number
  qa_relation_search_top_k: number
  qa_relation_threshold: number
  qa_paragraph_search_top_k: number
  qa_paragraph_node_weight: number
  qa_ent_filter_top_k: number
  qa_ppr_damping: number
  qa_res_top_k: number
  embedding_dimension: number
}

export interface KeywordReactionRule {
  name: string
  keywords: string[]
  reactions: string[]
  probability: number
  match_type: string
}

export interface KeywordReactionConfig {
  enable: boolean
  rules: KeywordReactionRule[]
}

export interface PromptVariable {
  name: string
  value: string
}

export interface CustomPromptConfig {
  enable: boolean
  system_prompt: string
  user_template: string
  variables: PromptVariable[]
  priority: string
}

export interface ResponsePostProcessConfig {
  enable_response_post_process: boolean
}

export interface ChineseTypoConfig {
  enable: boolean
  error_rate: number
  min_freq: number
  tone_error_rate: number
  word_replace_rate: number
}

export interface ResponseSplitterConfig {
  enable: boolean
  max_length: number
  max_sentence_num: number
  enable_kaomoji_protection: boolean
}

export interface LogConfig {
  date_style: string
  log_level_style: string
  color_text: string
  log_level: string
  console_log_level: string
  file_log_level: string
  suppress_libraries: string[]
  library_log_levels: Record<string, string>
}

export interface DebugConfig {
  show_prompt: boolean
}

export interface MaimMessageConfig {
  auth_token: string[]
  use_custom: boolean
  host: string
  port: number
  mode: string
  use_wss: boolean
  cert_file: string
  key_file: string
}

export interface TelemetryConfig {
  enable: boolean
}

export interface ExperimentalConfig {
  enable_friend_chat: boolean
}

export interface InnerConfig {
  version: string
}

// 主配置接口
export interface MaimaiConfig {
  inner: InnerConfig
  bot: BotConfig
  personality: PersonalityConfig
  expression: ExpressionConfig
  relationship: RelationshipConfig
  chat: ChatConfig
  message_receive: MessageReceiveConfig
  normal_chat: NormalChatConfig
  tool: ToolConfig
  emoji: EmojiConfig
  memory: MemoryConfig
  voice: VoiceConfig
  mood: MoodConfig
  lpmm_knowledge: LpmmKnowledgeConfig
  keyword_reaction: KeywordReactionConfig
  custom_prompt: CustomPromptConfig
  response_post_process: ResponsePostProcessConfig
  chinese_typo: ChineseTypoConfig
  response_splitter: ResponseSplitterConfig
  log: LogConfig
  debug: DebugConfig
  maim_message: MaimMessageConfig
  telemetry: TelemetryConfig
  experimental: ExperimentalConfig
}

// API响应类型
export interface ConfigApiResponse<T = any> {
  status: number
  message: string
  data?: T
  time: number
}

// 配置验证结果
export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// 配置文件信息
export interface ConfigFileInfo {
  path: string
  exists: boolean
  readable: boolean
  writable: boolean
  size: number
  lastModified: string
}
