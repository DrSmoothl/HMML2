/**
 * HMML 系统版本定义
 * 这是版本号的唯一真实来源 (Single Source of Truth)
 * 
 * 修改此文件中的版本号将自动同步到：
 * - package.json
 * - version.json (应用版本文件)
 * - SEA 构建输出
 * - 所有相关配置文件
 */

export const HMML_VERSION = '1.3.0';

export const VERSION_CONFIG = {
  /** 当前系统版本（这是版本号的唯一真实来源） */
  VERSION: HMML_VERSION,
  
  /** 配置文件版本（独立于系统版本） */
  CONFIG_VERSION: '1.0.0',
  
  /** 支持的最低配置版本 */
  MIN_CONFIG_VERSION: '1.0.0',
  
  /** 环境配置 */
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test'
  } as const,
  
  /** 默认环境 */
  DEFAULT_ENVIRONMENT: 'development' as const
};

export type Environment = typeof VERSION_CONFIG.ENVIRONMENTS[keyof typeof VERSION_CONFIG.ENVIRONMENTS];

/**
 * 获取当前版本信息
 */
export function getVersionInfo() {
  return {
    version: VERSION_CONFIG.VERSION,
    configVersion: VERSION_CONFIG.CONFIG_VERSION,
    minConfigVersion: VERSION_CONFIG.MIN_CONFIG_VERSION,
    buildTime: new Date().toISOString(),
    environment: getCurrentEnvironment() // 使用新的环境检测逻辑
  };
}

/**
 * 获取当前环境
 * 基于环境变量和webpack构建标识判断环境
 */
export function getCurrentEnvironment(): Environment {
  // 检查是否是webpack构建
  const isWebpackBuild = Boolean(
    (process.env.WEBPACK_BUILD) ||
    (__filename && __filename.endsWith('app.js')) ||
    (process.argv[1]?.endsWith('app.js'))
  );
  
  // 检查环境变量
  const envFromProcess = process.env.NODE_ENV as Environment;
  
  // 如果是webpack构建且没有明确环境变量，默认为生产环境
  if (isWebpackBuild && !envFromProcess) {
    return VERSION_CONFIG.ENVIRONMENTS.PRODUCTION;
  }
  
  return envFromProcess || VERSION_CONFIG.DEFAULT_ENVIRONMENT;
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  const env = getCurrentEnvironment();
  return env === VERSION_CONFIG.ENVIRONMENTS.PRODUCTION;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  const env = getCurrentEnvironment();
  return env === VERSION_CONFIG.ENVIRONMENTS.DEVELOPMENT;
}
/**
 * 获取当前版本号
 * @return 当前版本号
 */
export function getVersion(): string {
  return VERSION_CONFIG.VERSION;
}

