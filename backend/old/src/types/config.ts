/**
 * 麦麦配置文件相关类型定义
 */

// API响应基础结构
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  time: number;
}

// 主程序配置内容接口（可扩展）
export interface MainConfigData {
  [key: string]: any; // 允许任意配置项，因为TOML格式可能有不同的配置结构
}

// 模型配置内容接口（可扩展）
export interface ModelConfigData {
  [key: string]: any; // 允许任意配置项，因为模型配置可能有不同的结构
}

// 配置更新数据接口
export interface ConfigUpdateData {
  [key: string]: any; // 允许部分更新任意字段
}

// 主程序配置获取响应
export interface MainConfigGetResponse extends ApiResponse<MainConfigData> {}

// 主程序配置更新响应
export interface MainConfigUpdateResponse extends ApiResponse {}

// 模型配置获取响应
export interface ModelConfigGetResponse extends ApiResponse<ModelConfigData> {}

// 模型配置更新响应
export interface ModelConfigUpdateResponse extends ApiResponse {}

// 配置文件信息
export interface ConfigFileInfo {
  path: string;           // 文件绝对路径
  exists: boolean;        // 文件是否存在
  readable: boolean;      // 是否可读
  writable: boolean;      // 是否可写
  size: number;          // 文件大小（字节）
  lastModified: Date;    // 最后修改时间
}

// 配置服务选项
export interface ConfigServiceOptions {
  encoding?: BufferEncoding;  // 文件编码，默认utf-8
  backup?: boolean;           // 是否在更新前创建备份，默认true
  validate?: boolean;         // 是否验证配置格式，默认true
}
