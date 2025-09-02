/**
 * 分页工具类
 * 提供分页相关的工具函数和验证
 */

import { PaginationParams, PaginatedResult } from '../../types/database';
import { ValidationError } from '../../middleware/errorHandler';

export class PaginationUtils {
  /**
   * 默认页大小
   */
  public static readonly DEFAULT_PAGE_SIZE = 20;

  /**
   * 最大页大小限制
   */
  public static readonly MAX_PAGE_SIZE = 1000;

  /**
   * 最小页大小限制
   */
  public static readonly MIN_PAGE_SIZE = 1;

  /**
   * 验证分页参数
   * @param params 分页参数
   * @returns 验证后的分页参数
   */
  public static validatePaginationParams(params: Partial<PaginationParams>): PaginationParams {
    const page = Math.max(1, Math.floor(Number(params.page) || 1));
    const pageSize = Math.max(
      this.MIN_PAGE_SIZE, 
      Math.min(this.MAX_PAGE_SIZE, Math.floor(Number(params.pageSize) || this.DEFAULT_PAGE_SIZE))
    );

    // 验证页码
    if (isNaN(page) || page < 1) {
      throw new ValidationError('页码必须是大于0的正整数');
    }

    // 验证页大小
    if (isNaN(pageSize) || pageSize < this.MIN_PAGE_SIZE || pageSize > this.MAX_PAGE_SIZE) {
      throw new ValidationError(`页大小必须在 ${this.MIN_PAGE_SIZE} 到 ${this.MAX_PAGE_SIZE} 之间`);
    }

    const offset = (page - 1) * pageSize;

    return {
      page,
      pageSize,
      offset
    };
  }

  /**
   * 创建分页结果
   * @param data 数据数组
   * @param total 总记录数
   * @param params 分页参数
   * @returns 分页结果
   */
  public static createPaginatedResult<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResult<T> {
    const { page, pageSize } = params;
    const totalPages = Math.ceil(total / pageSize);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  }

  /**
   * 计算偏移量
   * @param page 页码（从1开始）
   * @param pageSize 页大小
   * @returns 偏移量
   */
  public static calculateOffset(page: number, pageSize: number): number {
    return Math.max(0, (page - 1) * pageSize);
  }

  /**
   * 从查询参数中解析分页参数
   * @param query 查询参数对象
   * @returns 分页参数
   */
  public static parsePaginationFromQuery(query: any): PaginationParams {
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || this.DEFAULT_PAGE_SIZE;

    return this.validatePaginationParams({ page, pageSize });
  }

  /**
   * 计算分页信息摘要
   * @param params 分页参数
   * @param total 总记录数
   * @returns 分页摘要字符串
   */
  public static getPaginationSummary(params: PaginationParams, total: number): string {
    const { page, pageSize } = params;
    const totalPages = Math.ceil(total / pageSize);
    const start = Math.min((page - 1) * pageSize + 1, total);
    const end = Math.min(page * pageSize, total);

    if (total === 0) {
      return '没有数据';
    }

    return `显示第 ${start}-${end} 条记录，共 ${total} 条记录，第 ${page}/${totalPages} 页`;
  }

  /**
   * 检查是否有更多数据
   * @param currentPage 当前页码
   * @param pageSize 页大小
   * @param total 总记录数
   * @returns 是否有更多数据
   */
  public static hasMoreData(currentPage: number, pageSize: number, total: number): boolean {
    return currentPage * pageSize < total;
  }

  /**
   * 获取下一页参数
   * @param params 当前分页参数
   * @param total 总记录数
   * @returns 下一页参数，如果没有下一页则返回null
   */
  public static getNextPageParams(params: PaginationParams, total: number): PaginationParams | null {
    const { page, pageSize } = params;
    const totalPages = Math.ceil(total / pageSize);
    
    if (page >= totalPages) {
      return null;
    }

    return {
      page: page + 1,
      pageSize,
      offset: this.calculateOffset(page + 1, pageSize)
    };
  }

  /**
   * 获取上一页参数
   * @param params 当前分页参数
   * @returns 上一页参数，如果没有上一页则返回null
   */
  public static getPrevPageParams(params: PaginationParams): PaginationParams | null {
    const { page, pageSize } = params;
    
    if (page <= 1) {
      return null;
    }

    return {
      page: page - 1,
      pageSize,
      offset: this.calculateOffset(page - 1, pageSize)
    };
  }

  /**
   * 验证并调整页码范围
   * @param page 请求的页码
   * @param total 总记录数
   * @param pageSize 页大小
   * @returns 调整后的页码
   */
  public static validatePageNumber(page: number, total: number, pageSize: number): number {
    const totalPages = Math.ceil(total / pageSize);
    
    if (totalPages === 0) {
      return 1;
    }
    
    // 如果请求的页码超过总页数，返回最后一页
    if (page > totalPages) {
      return totalPages;
    }
    
    // 如果页码小于1，返回第一页
    if (page < 1) {
      return 1;
    }
    
    return page;
  }

  /**
   * 创建空的分页结果
   * @param params 分页参数
   * @returns 空的分页结果
   */
  public static createEmptyPaginatedResult<T>(params: PaginationParams): PaginatedResult<T> {
    return this.createPaginatedResult<T>([], 0, params);
  }

  /**
   * 获取分页范围信息
   * @param page 当前页码
   * @param pageSize 页大小
   * @param total 总记录数
   * @returns 分页范围信息
   */
  public static getPaginationRange(page: number, pageSize: number, total: number): {
    start: number;
    end: number;
    totalPages: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  } {
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    
    return {
      start: Math.min(start, total),
      end,
      totalPages,
      isFirstPage: page === 1,
      isLastPage: page >= totalPages
    };
  }
}
