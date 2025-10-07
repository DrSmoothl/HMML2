import axios from 'axios'
import type { ApiResponse, ApiError } from '@/types/api'

// 动态解析 API 基础地址
function resolveBaseURL(): string {
  // 优先级1: 运行时注入（由 index.html 中的脚本设置）
  const runtime = (window as any).__HMML_API_BASE__
  if (typeof runtime === 'string' && runtime.trim()) {
    return runtime.trim()
  }
  
  // 优先级2: 环境变量（构建时配置）
  const envVar = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (envVar && envVar.trim()) {
    return envVar.trim()
  }
  
  // 优先级3: 回退到 localhost（本地开发）
  return 'http://localhost:7999/api'
}

const apiBaseURL = resolveBaseURL()

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.status === 200) {
      return response
    } else {
      const error: ApiError = {
        code: data.status?.toString() || 'UNKNOWN_ERROR',
        message: data.message || '未知错误',
        details: data,
      }
      return Promise.reject(error)
    }
  },
  (error) => {
    const apiError: ApiError = {
      code: error.response?.status?.toString() || 'NETWORK_ERROR',
      message: error.response?.data?.message || error.message || '网络错误',
      details: error.response?.data,
    }
    return Promise.reject(apiError)
  }
)

export { apiBaseURL }
export default api
