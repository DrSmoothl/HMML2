/**
 * 路径缓存相关类型定义
 */

/**
 * 适配器根目录信息
 */
export interface AdapterRootInfo {
  /** 适配器名称 */
  adapterName: string;
  /** 适配器根目录路径 */
  rootPath: string;
}

/**
 * 路径缓存数据结构
 */
export interface PathCacheData {
  /** 麦麦主程序根目录 */
  mainRoot?: string;
  /** 适配器根目录列表 */
  adapterRoots: AdapterRootInfo[];
  /** 最后更新时间 */
  lastUpdated: string;
  /** 数据版本 */
  version: string;
}

/**
 * API响应 - 获取所有路径
 */
export interface GetAllPathsResponse {
  /** 麦麦主程序根目录 */
  mainRoot?: string;
  /** 适配器根目录列表 */
  adapterRoots: AdapterRootInfo[];
}

/**
 * API请求 - 设置主程序根目录
 */
export interface SetRootPathRequest {
  /** 新的麦麦主程序根目录 */
  mainRoot: string;
}

/**
 * API请求 - 添加适配器根目录
 */
export interface AddAdapterRootRequest {
  /** 适配器名称 */
  adapterName: string;
  /** 适配器根目录路径 */
  rootPath: string;
}

/**
 * API请求 - 移除适配器根目录
 */
export interface RemoveAdapterRootRequest {
  /** 适配器名称 */
  adapterName: string;
}

/**
 * API请求 - 更新适配器根目录
 */
export interface UpdateAdapterRootRequest {
  /** 适配器名称 */
  adapterName: string;
  /** 新的根目录路径 */
  rootPath: string;
}

/**
 * 路径验证结果
 */
export interface PathValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误消息（如果无效） */
  error?: string;
  /** 路径是否存在 */
  exists: boolean;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 绝对路径 */
  absolutePath?: string;
}

/**
 * 路径缓存配置
 */
export interface PathCacheConfig {
  /** 缓存文件路径 */
  cacheFilePath: string;
  /** 是否启用路径验证 */
  enableValidation: boolean;
  /** 是否自动创建目录 */
  autoCreateDirectory: boolean;
  /** 最大适配器数量 */
  maxAdapters: number;
}
