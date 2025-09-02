// 模型配置相关的类型定义

export interface ApiProvider {
  name: string
  base_url: string
  api_key: string
  client_type: string
  max_retry: number
  timeout: number
  retry_interval: number
}

export interface ModelExtraParams {
  enable_thinking?: boolean
  [key: string]: any
}

export interface Model {
  model_identifier: string
  name: string
  api_provider: string
  price_in?: number
  price_out?: number
  force_stream_mode?: boolean
  extra_params?: ModelExtraParams
}

export interface ModelTaskConfig {
  model_list: string[]
  temperature?: number
  max_tokens?: number
}

export interface ModelTaskConfigs {
  utils: ModelTaskConfig
  utils_small: ModelTaskConfig
  replyer: ModelTaskConfig
  planner: ModelTaskConfig
  emotion: ModelTaskConfig
  vlm: ModelTaskConfig
  voice: ModelTaskConfig
  tool_use: ModelTaskConfig
  embedding: ModelTaskConfig
  lpmm_entity_extract: ModelTaskConfig
  lpmm_rdf_build: ModelTaskConfig
  lpmm_qa: ModelTaskConfig
}

export interface InnerModelConfig {
  version: string
}

export interface ModelConfig {
  inner: InnerModelConfig
  api_providers: ApiProvider[]
  models: Model[]
  model_task_config: ModelTaskConfigs
}

// API 响应类型
export interface ModelConfigApiResponse<T = any> {
  status: number
  message: string
  data?: T
  time: number
}

// 添加 API Provider 请求类型
export interface AddProviderRequest {
  name: string
  base_url: string
  api_key: string
  client_type: string
  max_retry: number
  timeout: number
  retry_interval: number
}

// 删除 API Provider 请求类型
export interface DeleteProviderRequest {
  name: string
}

// 添加模型请求类型
export interface AddModelRequest {
  model_identifier: string
  name: string
  api_provider: string
  price_in?: number
  price_out?: number
  force_stream_mode?: boolean
  extra_params?: ModelExtraParams
}

// 删除模型请求类型
export interface DeleteModelRequest {
  name: string
}

// 更新模型配置请求类型
export interface UpdateModelConfigRequest {
  [key: string]: any
}

// 获取模型列表请求类型
export interface GetModelsRequest {
  api_url: string
  api_key: string
}

// 获取模型列表响应类型
export interface GetModelsResponse {
  status: number
  message: string
  data: {
    models: string[]
  }
  time: number
}

// 客户端类型选项
export const CLIENT_TYPES = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' }
] as const

// 任务配置类型选项
export const TASK_CONFIG_TYPES = [
  { key: 'utils', label: '通用工具', description: '在麦麦的一些组件中使用的模型，例如表情包模块，取名模块，关系模块' },
  { key: 'utils_small', label: '小型工具', description: '消耗量较大，建议使用速度较快的小模型' },
  { key: 'replyer', label: '首要回复', description: '首要回复模型，还用于表达器和表达方式学习' },
  { key: 'planner', label: '决策规划', description: '负责决定麦麦该做什么的模型' },
  { key: 'emotion', label: '情绪管理', description: '负责麦麦的情绪变化' },
  { key: 'vlm', label: '图像识别', description: '图像识别模型' },
  { key: 'voice', label: '语音识别', description: '语音识别模型' },
  { key: 'tool_use', label: '工具调用', description: '工具调用模型，需要使用支持工具调用的模型' },
  { key: 'embedding', label: '嵌入模型', description: '用于向量嵌入的模型' },
  { key: 'lpmm_entity_extract', label: 'LPMM实体提取', description: '实体提取模型' },
  { key: 'lpmm_rdf_build', label: 'LPMM RDF构建', description: 'RDF构建模型' },
  { key: 'lpmm_qa', label: 'LPMM问答', description: '问答模型' }
] as const
