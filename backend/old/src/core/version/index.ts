/**
 * 版本管理模块主入口
 */

// 导出类型定义
export * from './types';

// 导出核心类
export { SemVerParser } from './semver';
export { ApplicationVersionManager, appVersionManager } from './appVersion';
export { ConfigMigrationManager } from './configMigration';
export { ConfigVersionManager, configVersionManager } from './configVersion';
export { ConfigUpdater } from './configUpdater';

// 导出工具函数
export { 
  initializeVersionSystem, 
  getSystemVersionInfo,
  generateVersionBanner,
  formatVersionInfo,
  formatBuildTime,
  checkForUpdates
} from './utils';
