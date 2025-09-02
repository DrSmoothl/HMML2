import api from './api'
import type {
  ModelConfig,
  ModelConfigApiResponse,
  AddProviderRequest,
  DeleteProviderRequest,
  AddModelRequest,
  DeleteModelRequest,
  UpdateModelConfigRequest,
  GetModelsRequest,
  GetModelsResponse
} from '@/types/modelConfig'

export class ModelConfigApi {
  // 获取当前模型配置
  static async getCurrentConfig(): Promise<ModelConfig> {
    const response = await api.get<ModelConfigApiResponse<ModelConfig>>('/config/model/get')
    return response.data.data!
  }

  // 更新模型配置
  static async updateConfig(config: UpdateModelConfigRequest): Promise<void> {
    await api.post<ModelConfigApiResponse>('/config/model/update', config)
  }

  // 添加API服务提供商
  static async addProvider(provider: AddProviderRequest): Promise<void> {
    await api.post<ModelConfigApiResponse>('/config/model/addProvider', provider)
  }

  // 删除API服务提供商
  static async deleteProvider(request: DeleteProviderRequest): Promise<void> {
    await api.delete<ModelConfigApiResponse>('/config/model/deleteProvider', { data: request })
  }

  // 添加模型配置
  static async addModel(model: AddModelRequest): Promise<void> {
    await api.post<ModelConfigApiResponse>('/config/model/addModel', model)
  }

  // 删除模型配置
  static async deleteModel(request: DeleteModelRequest): Promise<void> {
    await api.delete<ModelConfigApiResponse>('/config/model/deleteModel', { data: request })
  }

  // 测试API提供商连接
  static async testProviderConnection(providerName: string): Promise<boolean> {
    try {
      const response = await api.post<ModelConfigApiResponse<{ connected: boolean }>>(
        '/config/model/testProvider', 
        { name: providerName }
      )
      return response.data.data?.connected ?? false
    } catch (error) {
      return false
    }
  }

  // 获取API提供商的模型列表
  static async getModels(request: GetModelsRequest): Promise<string[]> {
    try {
      const response = await api.post<GetModelsResponse>('/tools/getModels', request)
      return response.data.data.models
    } catch (error) {
      console.error('Failed to get models:', error)
      throw error
    }
  }
}

export default ModelConfigApi
