/**
 * 版本管理类型定义
 */

/**
 * 语义化版本接口
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

/**
 * 版本信息接口
 */
export interface VersionInfo {
  version: string;
  semanticVersion: SemanticVersion;
  buildTime: string;
  gitHash?: string;
  environment: 'development' | 'production' | 'test';
}

/**
 * 配置版本信息
 */
export interface ConfigVersionInfo {
  version: string;
  semanticVersion: SemanticVersion;
  lastUpdated: string;
  migratedFrom?: string;
}

/**
 * 版本迁移规则接口
 */
export interface MigrationRule {
  from: string;
  to: string;
  description: string;
  migrate: (oldConfig: any) => any;
}

/**
 * 版本比较结果
 */
export enum VersionComparison {
  EQUAL = 0,
  GREATER = 1,
  LESS = -1
}

/**
 * 迁移结果接口
 */
export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  changes: ConfigChange[];
  errors?: string[];
}

/**
 * 配置变更记录
 */
export interface ConfigChange {
  type: 'add' | 'remove' | 'modify' | 'rename';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

/**
 * 应用版本常量
 */
export const APP_VERSION = '1.0.0';
export const CONFIG_VERSION = '1.0.0';
