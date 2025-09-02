// 麦麦配置API工具函数

import type { MaimaiConfig, ConfigApiResponse } from '@/types/maimaiConfig'

const API_BASE_URL = 'http://localhost:7999/api/config'

export class MaimaiConfigAPI {
  /**
   * 统一的响应处理方法
   */
  private static async handleResponse<T = any>(response: Response): Promise<ConfigApiResponse<T>> {
    // 检查响应状态
    if (!response.ok) {
      let errorMessage = `HTTP错误: ${response.status}`
      try {
        const errorText = await response.text()
        if (errorText) {
          errorMessage += ` - ${errorText}`
        }
      } catch {
        // 忽略读取错误内容的异常
      }
      throw new Error(errorMessage)
    }

    // 检查内容类型
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      throw new Error(`服务器返回非JSON响应: ${text.substring(0, 200)}`)
    }

    // 解析JSON
    try {
      return await response.json()
    } catch (error) {
      throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取主程序配置
   * GET /api/config/main/get
   */
  static async getMainConfig(): Promise<ConfigApiResponse<MaimaiConfig>> {
    try {
      const response = await fetch(`${API_BASE_URL}/main/get`)
      return await this.handleResponse<MaimaiConfig>(response)
    } catch (error) {
      throw new Error(`获取配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 更新主程序配置
   * POST /api/config/main/update
   */
  static async updateMainConfig(config: Partial<MaimaiConfig>): Promise<ConfigApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/main/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })
      return await this.handleResponse(response)
    } catch (error) {
      throw new Error(`保存配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 简单的连通性测试（通过获取配置来检查API是否可用）
   */
  static async checkHealth(): Promise<boolean> {
    try {
      await this.getMainConfig()
      return true
    } catch {
      return false
    }
  }
}

/**
 * 深度合并对象
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      const targetValue = result[key]
      
      if (sourceValue !== undefined && isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue as any)
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as any
      }
    }
  }
  
  return result
}

/**
 * 检查是否为对象
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * 获取嵌套对象的值
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * 设置嵌套对象的值
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

/**
 * 配置预设模板
 */
export const configPresets = {
  default: '默认配置',
  aggressive: '积极模式',
  conservative: '保守模式', 
  creative: '创意模式',
  professional: '专业模式'
}

/**
 * 导出配置为JSON文件
 */
export function exportConfigAsJSON(config: MaimaiConfig, filename?: string): void {
  const dataStr = JSON.stringify(config, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `maimai-config-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 从JSON文件导入配置
 */
export function importConfigFromJSON(): Promise<MaimaiConfig> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target?.result as string)
            resolve(config)
          } catch (error) {
            reject(new Error('配置文件格式错误'))
          }
        }
        reader.readAsText(file)
      } else {
        reject(new Error('未选择文件'))
      }
    }
    input.click()
  })
}

/**
 * 验证配置数据的基本结构
 */
export function validateConfigStructure(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 检查必要的顶级字段
  const requiredFields = ['bot', 'personality', 'chat']
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`缺少必要字段: ${field}`)
    }
  }
  
  // 检查bot字段
  if (config.bot) {
    if (!config.bot.platform) errors.push('缺少bot.platform字段')
    if (!config.bot.nickname) errors.push('缺少bot.nickname字段')
    if (!Array.isArray(config.bot.alias_names)) errors.push('bot.alias_names必须是数组')
  }
  
  // 检查personality字段
  if (config.personality) {
    if (!config.personality.personality) errors.push('缺少personality.personality字段')
    if (!config.personality.reply_style) errors.push('缺少personality.reply_style字段')
  }
  
  // 检查数值范围
  if (config.chat) {
    if (typeof config.chat.mentioned_bot_reply === 'number') {
      const prob = config.chat.mentioned_bot_reply
      if (prob < 0 || prob > 1) {
        errors.push('mentioned_bot_reply必须在0-1之间')
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}