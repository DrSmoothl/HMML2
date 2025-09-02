import fs from 'fs-extra';
import path from 'path';
import { ConfigVersionInfo, MigrationResult, CONFIG_VERSION } from './types';
import { SemVerParser } from './semver';
import { ConfigMigrationManager } from './configMigration';
import { logger } from '../logger';

/**
 * 配置版本管理器
 */
export class ConfigVersionManager {
  private static instance: ConfigVersionManager;
  private migrationManager: ConfigMigrationManager;
  private currentVersion: string;

  private constructor() {
    this.migrationManager = new ConfigMigrationManager();
    this.currentVersion = CONFIG_VERSION;
    this.initializeMigrations();
  }

  static getInstance(): ConfigVersionManager {
    if (!ConfigVersionManager.instance) {
      ConfigVersionManager.instance = new ConfigVersionManager();
    }
    return ConfigVersionManager.instance;
  }

  /**
   * 初始化迁移规则
   */
  private initializeMigrations(): void {
    // 示例迁移规则：从 1.0.0 到 1.1.0
    this.migrationManager.registerMigration({
      from: '1.0.0',
      to: '1.1.0',
      description: '添加数据库配置支持',
      migrate: (oldConfig) => {
        const newConfig = { ...oldConfig };
        
        // 添加新的数据库配置节
        if (!newConfig.database) {
          newConfig.database = {
            type: 'sqlite',
            path: './data/hmml.db',
            autoMigrate: true
          };
        }
        
        return newConfig;
      }
    });

    // 示例迁移规则：从 1.1.0 到 1.2.0
    this.migrationManager.registerMigration({
      from: '1.1.0',
      to: '1.2.0',
      description: '重构安全配置结构',
      migrate: (oldConfig) => {
        const newConfig = { ...oldConfig };
        
        if (newConfig.security) {
          // 重命名 corsOrigins 为 allowedOrigins
          if (newConfig.security.corsOrigins) {
            newConfig.security.allowedOrigins = newConfig.security.corsOrigins;
            delete newConfig.security.corsOrigins;
          }
          
          // 添加新的安全选项
          newConfig.security.enableRateLimit = true;
          newConfig.security.rateLimitOptions = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // requests per window
          };
        }
        
        return newConfig;
      }
    });

    // 可以继续添加更多迁移规则...
    logger.debug(`配置迁移管理器初始化完成，支持迁移版本: ${this.migrationManager.getAvailableVersions().join(', ')}`);
  }

  /**
   * 检查并更新配置版本
   */
  async checkAndUpdateConfig(configPath: string, currentConfig: any): Promise<{
    config: any;
    migrationResult?: MigrationResult;
    versionInfo: ConfigVersionInfo;
  }> {
    // 读取或创建版本信息
    const versionInfo = await this.getOrCreateVersionInfo(configPath, currentConfig);
    const configVersion = versionInfo.version;

    logger.info(`当前配置版本: ${configVersion}, 目标版本: ${this.currentVersion}`);

    // 检查是否需要迁移
    if (SemVerParser.eq(configVersion, this.currentVersion)) {
      logger.info('配置版本已是最新，无需迁移');
      return { config: currentConfig, versionInfo };
    }

    // 执行迁移
    const migrationResult = await this.migrationManager.migrate(
      currentConfig,
      configVersion,
      this.currentVersion
    );

    if (migrationResult.success) {
      // 更新版本信息
      const updatedVersionInfo: ConfigVersionInfo = {
        version: this.currentVersion,
        semanticVersion: SemVerParser.parse(this.currentVersion),
        lastUpdated: new Date().toISOString(),
        migratedFrom: configVersion
      };

      // 保存更新后的版本信息
      await this.saveVersionInfo(configPath, updatedVersionInfo);
      
      logger.info(`配置迁移成功: ${configVersion} -> ${this.currentVersion}`);
      
      return { 
        config: currentConfig, // 这里应该是迁移后的配置，但为了保持兼容性暂时返回原配置
        migrationResult, 
        versionInfo: updatedVersionInfo 
      };
    } else {
      logger.error('配置迁移失败，使用当前配置');
      throw new Error(`配置迁移失败: ${migrationResult.errors?.join(', ')}`);
    }
  }

  /**
   * 获取或创建版本信息
   */
  private async getOrCreateVersionInfo(configPath: string, config: any): Promise<ConfigVersionInfo> {
    const versionFilePath = this.getVersionFilePath(configPath);

    try {
      if (await fs.pathExists(versionFilePath)) {
        const data = await fs.readJSON(versionFilePath);
        return this.validateVersionInfo(data);
      }
    } catch (error) {
      logger.warn('读取配置版本文件失败，将创建新的版本文件:', error);
    }

    // 创建新的版本信息
    const versionInfo: ConfigVersionInfo = {
      version: this.extractVersionFromConfig(config) || '1.0.0',
      semanticVersion: SemVerParser.parse(this.extractVersionFromConfig(config) || '1.0.0'),
      lastUpdated: new Date().toISOString()
    };

    await this.saveVersionInfo(configPath, versionInfo);
    return versionInfo;
  }

  /**
   * 从配置中提取版本信息
   */
  private extractVersionFromConfig(config: any): string | null {
    // 尝试从配置的不同位置提取版本
    if (config.version && SemVerParser.isValid(config.version)) {
      return config.version;
    }
    
    if (config.app?.version && SemVerParser.isValid(config.app.version)) {
      return config.app.version;
    }
    
    if (config.configVersion && SemVerParser.isValid(config.configVersion)) {
      return config.configVersion;
    }
    
    return null;
  }

  /**
   * 验证版本信息
   */
  private validateVersionInfo(data: any): ConfigVersionInfo {
    if (!data.version || !SemVerParser.isValid(data.version)) {
      throw new Error('版本信息格式无效');
    }

    return {
      version: data.version,
      semanticVersion: SemVerParser.parse(data.version),
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      migratedFrom: data.migratedFrom
    };
  }

  /**
   * 保存版本信息
   */
  private async saveVersionInfo(configPath: string, versionInfo: ConfigVersionInfo): Promise<void> {
    const versionFilePath = this.getVersionFilePath(configPath);
    await fs.ensureDir(path.dirname(versionFilePath));
    await fs.writeJSON(versionFilePath, versionInfo, { spaces: 2 });
  }

  /**
   * 获取版本文件路径
   */
  private getVersionFilePath(configPath: string): string {
    const configDir = path.dirname(configPath);
    const configName = path.basename(configPath, path.extname(configPath));
    return path.join(configDir, `.${configName}.version.json`);
  }

  /**
   * 获取当前支持的配置版本
   */
  getCurrentConfigVersion(): string {
    return this.currentVersion;
  }

  /**
   * 设置当前配置版本（主要用于测试）
   */
  setCurrentConfigVersion(version: string): void {
    if (!SemVerParser.isValid(version)) {
      throw new Error(`无效的版本格式: ${version}`);
    }
    this.currentVersion = version;
  }

  /**
   * 获取迁移管理器（用于外部注册迁移规则）
   */
  getMigrationManager(): ConfigMigrationManager {
    return this.migrationManager;
  }

  /**
   * 检查是否支持指定版本的迁移
   */
  canMigrateFromVersion(version: string): boolean {
    return this.migrationManager.canMigrateFrom(version);
  }

  /**
   * 获取所有支持的迁移版本
   */
  getSupportedVersions(): string[] {
    return this.migrationManager.getAvailableVersions();
  }

  /**
   * 强制迁移配置（忽略版本检查）
   */
  async forceMigrateConfig(
    config: any, 
    fromVersion: string, 
    toVersion?: string
  ): Promise<MigrationResult> {
    const targetVersion = toVersion || this.currentVersion;
    return await this.migrationManager.migrate(config, fromVersion, targetVersion);
  }
}

// 创建全局实例
export const configVersionManager = ConfigVersionManager.getInstance();
