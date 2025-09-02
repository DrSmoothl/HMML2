import axios from 'axios'
import type { ApiResponse, ApiError } from '@/types/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:7999/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 这里可以添加认证 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    // 根据HMML API文档，成功状态码是200
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

export default api
