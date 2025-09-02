/**
 * QQ适配器配置相关类型定义
 */

// QQ适配器配置结构
export interface AdapterConfig {
  inner: {
    version: string;
  };
  nickname: string;
  napcat_server: {
    host: string;
    port: number;
    heartbeat_interval: number;
  };
  maibot_server: {
    host: string;
    port: number;
  };
  chat: {
    group_list_type: 'whitelist' | 'blacklist';
    group_list: number[];
    private_list_type: 'whitelist' | 'blacklist';
    private_list: number[];
    ban_user_id: number[];
    ban_qq_bot: boolean;
    enable_poke: boolean;
  };
  voice: {
    use_tts: boolean;
  };
  debug: {
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  };
}

// 适配器配置更新数据接口
export interface AdapterConfigUpdateData {
  [key: string]: any; // 允许部分更新任意字段
}

// 适配器配置获取响应
export interface AdapterConfigGetResponse {
  status: number;
  message: string;
  data: AdapterConfig;
  time: number;
}

// 适配器配置更新响应
export interface AdapterConfigUpdateResponse {
  status: number;
  message: string;
  time: number;
}

// 适配器配置文件信息
export interface AdapterConfigFileInfo {
  path: string;           // 文件绝对路径
  exists: boolean;        // 文件是否存在
  readable: boolean;      // 是否可读
  writable: boolean;      // 是否可写
  size: number;          // 文件大小（字节）
  lastModified: Date;    // 最后修改时间
}

// 适配器配置服务选项
export interface AdapterConfigServiceOptions {
  encoding?: BufferEncoding;  // 文件编码，默认utf-8
  backup?: boolean;           // 是否在更新前创建备份，默认true
  validate?: boolean;         // 是否验证配置格式，默认true
}
