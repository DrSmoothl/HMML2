import { VersionInfo, ConfigVersionInfo } from './types';
import { appVersionManager } from './appVersion';
import { configVersionManager } from './configVersion';
import { SemVerParser } from './semver';
import { logger } from '../logger';

/**
 * 系统版本信息接口
 */
export interface SystemVersionInfo {
  application: VersionInfo | null;
  config: {
    version: string;
    lastUpdated: string;
  };
  compatibility: {
    isSupported: boolean;
    message?: string;
  };
}

/**
 * 初始化版本系统
 */
export async function initializeVersionSystem(): Promise<void> {
  try {
    logger.info('初始化版本管理系统...');
    
    // 初始化应用版本管理器
    await appVersionManager.initialize();
    
    logger.info('版本管理系统初始化完成');
  } catch (error) {
    logger.error('版本管理系统初始化失败:', error);
    throw error;
  }
}

/**
 * 获取系统版本信息
 */
export function getSystemVersionInfo(): SystemVersionInfo {
  const appVersionInfo = appVersionManager.getVersionInfo();
  const configVersion = configVersionManager.getCurrentConfigVersion();

  return {
    application: appVersionInfo,
    config: {
      version: configVersion,
      lastUpdated: new Date().toISOString()
    },
    compatibility: checkVersionCompatibility(appVersionInfo, configVersion)
  };
}

/**
 * 检查版本兼容性
 */
function checkVersionCompatibility(
  appVersionInfo: VersionInfo | null,
  configVersion: string
): { isSupported: boolean; message?: string } {
  if (!appVersionInfo) {
    return {
      isSupported: false,
      message: '应用版本信息不可用'
    };
  }

  // 这里可以实现具体的兼容性检查逻辑
  // 例如：检查应用版本和配置版本的主版本号是否匹配
  
  return {
    isSupported: true,
    message: '版本兼容'
  };
}

/**
 * 格式化版本信息用于显示
 */
export function formatVersionInfo(versionInfo: VersionInfo): string {
  const parts = [versionInfo.version];
  
  if (versionInfo.environment !== 'production') {
    parts.push(`(${versionInfo.environment})`);
  }
  
  if (versionInfo.gitHash) {
    const shortHash = versionInfo.gitHash.substring(0, 8);
    parts.push(`[${shortHash}]`);
  }
  
  return parts.join(' ');
}

/**
 * 格式化构建时间
 */
export function formatBuildTime(buildTime: string): string {
  const date = new Date(buildTime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 生成版本横幅信息
 */
export function generateVersionBanner(): string[] {
  const systemInfo = getSystemVersionInfo();
  const appInfo = systemInfo.application;
  
  if (!appInfo) {
    return ['版本信息不可用'];
  }

  const lines: string[] = [];
  lines.push(`🔖 版本: ${formatVersionInfo(appInfo)}`);
  lines.push(`🌍 环境: ${appInfo.environment}`);
  
  if (appInfo.buildTime) {
    lines.push(`🕐 构建时间: ${formatBuildTime(appInfo.buildTime)}`);
  }
  
  if (appInfo.gitHash) {
    lines.push(`📝 Git提交: ${appInfo.gitHash.substring(0, 12)}`);
  }
  
  lines.push(`⚙️  配置版本: ${systemInfo.config.version}`);
  
  return lines;
}

/**
 * 检查是否需要更新
 */
export async function checkForUpdates(
  latestVersion?: string
): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateType?: 'major' | 'minor' | 'patch';
}> {
  const currentVersion = appVersionManager.getVersion();
  
  if (!latestVersion) {
    return {
      hasUpdate: false,
      currentVersion
    };
  }

  const comparison = appVersionManager.compareWith(latestVersion);
  
  if (comparison < 0) {
    // 当前版本低于最新版本
    const current = appVersionManager.getSemanticVersion();
    const latest = SemVerParser.parse(latestVersion);
    
    let updateType: 'major' | 'minor' | 'patch' = 'patch';
    
    if (current && latest.major > current.major) {
      updateType = 'major';
    } else if (current && latest.minor > current.minor) {
      updateType = 'minor';
    }
    
    return {
      hasUpdate: true,
      currentVersion,
      latestVersion,
      updateType
    };
  }
  
  return {
    hasUpdate: false,
    currentVersion,
    latestVersion
  };
}
