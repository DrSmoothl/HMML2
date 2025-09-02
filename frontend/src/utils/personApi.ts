import api from '@/utils/api'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  PersonInfo,
  CreatePersonInfoRequest,
  UpdatePersonInfoRequest,
  PersonInfoQueryParams,
  PersonInfoStats,
  PersonInfoSearchParams,
  AvailablePlatform
} from '@/types/person'

// PersonInfo API 服务类
export class PersonInfoService {
  // 基础路径
  private static readonly BASE_PATH = '/database/person-info'

  /**
   * 分页查询PersonInfo
   */
  static async getPersonInfos(params: PersonInfoQueryParams = {}) {
    const response = await api.get<ApiResponse<PaginatedResponse<PersonInfo>>>(
      `${this.BASE_PATH}/get`,
      { params }
    )
    return response.data
  }

  /**
   * 根据ID查询单个PersonInfo
   */
  static async getPersonInfoById(id: number) {
    const response = await api.get<ApiResponse<PersonInfo>>(
      `${this.BASE_PATH}/get/${id}`
    )
    return response.data
  }

  /**
   * 新增PersonInfo
   */
  static async createPersonInfo(data: CreatePersonInfoRequest) {
    const response = await api.post<ApiResponse<{ id: number }>>(
      `${this.BASE_PATH}/insert`,
      data
    )
    return response.data
  }

  /**
   * 更新PersonInfo
   */
  static async updatePersonInfo(id: number, data: UpdatePersonInfoRequest) {
    const response = await api.put<ApiResponse<void>>(
      `${this.BASE_PATH}/update/${id}`,
      data
    )
    return response.data
  }

  /**
   * 删除PersonInfo
   */
  static async deletePersonInfo(id: number) {
    const response = await api.delete<ApiResponse<void>>(
      `${this.BASE_PATH}/delete/${id}`
    )
    return response.data
  }

  /**
   * 根据person_id查询PersonInfo
   */
  static async getPersonInfoByPersonId(personId: string) {
    const response = await api.get<ApiResponse<PersonInfo[]>>(
      `${this.BASE_PATH}/by-person/${encodeURIComponent(personId)}`
    )
    return response.data
  }

  /**
   * 根据平台和用户ID查询PersonInfo
   */
  static async getPersonInfoByPlatformAndUserId(platform: string, userId: string) {
    const response = await api.get<ApiResponse<PersonInfo[]>>(
      `${this.BASE_PATH}/by-platform/${encodeURIComponent(platform)}/user/${encodeURIComponent(userId)}`
    )
    return response.data
  }

  /**
   * 获取PersonInfo统计信息
   */
  static async getPersonInfoStats() {
    const response = await api.get<ApiResponse<PersonInfoStats>>(
      `${this.BASE_PATH}/stats`
    )
    return response.data
  }

  /**
   * 搜索PersonInfo
   */
  static async searchPersonInfo(params: PersonInfoSearchParams) {
    const response = await api.get<ApiResponse<PersonInfo[]>>(
      `${this.BASE_PATH}/search`,
      { params }
    )
    return response.data
  }

  /**
   * 获取可用平台列表
   */
  static async getAvailablePlatforms() {
    const response = await api.get<ApiResponse<AvailablePlatform[]>>(
      `${this.BASE_PATH}/platforms`
    )
    return response.data
  }
}

// 导出便捷的API函数
export const personInfoApi = PersonInfoService
