import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';
import { configVersionManager } from './version/configVersion';

export interface ServerConfig {
  version?: string; // 添加版本字段
  server: {
    port: number;
    host: string;
    prefix: string;
    reverseProxyMode: boolean;
  };
  logger: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    maxFileSize: number;
    maxFiles: number;
  };
  security: {
    sessionSecret: string;
    corsEnabled: boolean;
    corsOrigins: string[];
    maxRequestSize: string;
  };
  app: {
    name: string;
    version: string;
    description: string;
  };
}

const defaultConfig: ServerConfig = {
  version: '1.0.0', // 添加默认配置版本
  server: {
    port: 7999,
    host: '0.0.0.0',
    prefix: '',
    reverseProxyMode: false
  },
  logger: {
    level: 'INFO',
    enableConsole: true,
    enableFile: true,
    maxFileSize: 10,
    maxFiles: 5
  },
  security: {
    sessionSecret: 'hmml-default-secret-key',
    corsEnabled: true,
    corsOrigins: ['*'],
    maxRequestSize: '10mb'
  },
  app: {
    name: 'HMML',
    version: '1.0.0',
    description: 'Hello MaiMai Launcher Backend Service'
  }
};

export class ConfigManager {
  private configPath: string;
  private config: ServerConfig;

  constructor(configPath: string = path.join(process.cwd(), 'config', 'server.json')) {
    this.configPath = configPath;
    this.config = { ...defaultConfig };
  }

  async load(): Promise<ServerConfig> {
    try {
      // 确保配置目录存在
      await fs.ensureDir(path.dirname(this.configPath));

      // 检查配置文件是否存在
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJSON(this.configPath);
        
        // 使用版本管理器检查和更新配置
        try {
          const versionResult = await configVersionManager.checkAndUpdateConfig(
            this.configPath,
            configData
          );
          
          this.config = this.mergeConfig(defaultConfig, configData);
          
          // 如果有迁移结果，记录变更信息
          if (versionResult.migrationResult && versionResult.migrationResult.changes.length > 0) {
            logger.info(`配置已迁移，变更数量: ${versionResult.migrationResult.changes.length}`);
            versionResult.migrationResult.changes.forEach(change => {
              logger.debug(`配置变更: ${change.type} ${change.path} - ${change.description}`);
            });
            
            // 保存更新后的配置
            await this.save();
          }
          
        } catch (migrationError) {
          logger.warn('配置版本迁移失败，使用当前配置:', migrationError);
          this.config = this.mergeConfig(defaultConfig, configData);
        }
        
        logger.info(`配置文件加载成功: ${this.configPath}`);
      } else {
        // 创建默认配置文件
        await this.save();
        logger.info(`创建默认配置文件: ${this.configPath}`);
      }

      return this.config;
    } catch (error) {
      logger.error('加载配置文件失败:', error);
      logger.info('使用默认配置');
      return this.config;
    }
  }

  async save(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJSON(this.configPath, this.config, { spaces: 2 });
      logger.info('配置文件保存成功');
    } catch (error) {
      logger.error('保存配置文件失败:', error);
      throw error;
    }
  }

  get(): ServerConfig {
    return { ...this.config };
  }

  set(newConfig: Partial<ServerConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
  }

  getSection<K extends keyof ServerConfig>(section: K): ServerConfig[K] {
    const sectionData = this.config[section];
    if (typeof sectionData === 'object' && sectionData !== null) {
      return { ...sectionData } as ServerConfig[K];
    }
    return sectionData;
  }

  setSection<K extends keyof ServerConfig>(section: K, sectionConfig: Partial<ServerConfig[K]>): void {
    const currentSection = this.config[section];
    if (typeof currentSection === 'object' && currentSection !== null && typeof sectionConfig === 'object' && sectionConfig !== null) {
      this.config[section] = { ...currentSection, ...sectionConfig } as ServerConfig[K];
    } else {
      this.config[section] = sectionConfig as ServerConfig[K];
    }
  }

  private mergeConfig(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.mergeConfig(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  async reload(): Promise<ServerConfig> {
    return await this.load();
  }
}

// 创建全局配置管理实例
export const configManager = new ConfigManager();
