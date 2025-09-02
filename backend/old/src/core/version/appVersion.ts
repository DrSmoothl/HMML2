import fs from 'fs-extra';
import path from 'path';
import { VersionInfo, SemanticVersion } from './types';
import { SemVerParser } from './semver';
import { logger } from '../logger';
import { HMML_VERSION, VERSION_CONFIG, getCurrentEnvironment } from '../../version';

/**
 * 应用版本管理器
 */
export class ApplicationVersionManager {
  private static instance: ApplicationVersionManager;
  private versionInfo: VersionInfo | null = null;
  private readonly versionFile: string;

  private constructor() {
    this.versionFile = path.join(process.cwd(), 'version.json');
  }

  static getInstance(): ApplicationVersionManager {
    if (!ApplicationVersionManager.instance) {
      ApplicationVersionManager.instance = new ApplicationVersionManager();
    }
    return ApplicationVersionManager.instance;
  }

  /**
   * 初始化版本信息
   */
  async initialize(): Promise<void> {
    try {
      await this.loadVersionInfo();
      logger.info(`应用版本已加载: ${this.versionInfo?.version || 'unknown'}`);
    } catch (error) {
      logger.error('版本信息初始化失败:', error);
      await this.createDefaultVersionFile();
    }
  }

  /**
   * 加载版本信息
   */
  private async loadVersionInfo(): Promise<void> {
    if (await fs.pathExists(this.versionFile)) {
      const data = await fs.readJSON(this.versionFile);
      this.versionInfo = this.validateVersionInfo(data);
    } else {
      await this.createDefaultVersionFile();
    }
  }

  /**
   * 创建默认版本文件
   */
  private async createDefaultVersionFile(): Promise<void> {
    // 使用系统版本作为默认版本
    const version = HMML_VERSION;
    const environment = getCurrentEnvironment();

    this.versionInfo = {
      version,
      semanticVersion: SemVerParser.parse(version),
      buildTime: new Date().toISOString(),
      environment
    };

    await this.saveVersionInfo();
    logger.info(`创建默认版本文件: ${version} (${environment})`);
  }

  /**
   * 验证版本信息
   */
  private validateVersionInfo(data: any): VersionInfo {
    if (!data.version || !SemVerParser.isValid(data.version)) {
      throw new Error('无效的版本格式');
    }

    return {
      version: data.version,
      semanticVersion: SemVerParser.parse(data.version),
      buildTime: data.buildTime || new Date().toISOString(),
      gitHash: data.gitHash,
      environment: data.environment || 'development'
    };
  }

  /**
   * 保存版本信息
   */
  private async saveVersionInfo(): Promise<void> {
    if (!this.versionInfo) {
      throw new Error('版本信息未初始化');
    }

    await fs.writeJSON(this.versionFile, this.versionInfo, { spaces: 2 });
  }

  /**
   * 获取当前版本信息
   */
  getVersionInfo(): VersionInfo | null {
    return this.versionInfo ? { ...this.versionInfo } : null;
  }

  /**
   * 获取版本字符串
   */
  getVersion(): string {
    return this.versionInfo?.version || 'unknown';
  }

  /**
   * 获取语义化版本对象
   */
  getSemanticVersion(): SemanticVersion | null {
    return this.versionInfo?.semanticVersion ? { ...this.versionInfo.semanticVersion } : null;
  }

  /**
   * 更新版本
   */
  async updateVersion(
    newVersion: string,
    options: {
      buildTime?: string;
      gitHash?: string;
      environment?: 'development' | 'production' | 'test';
    } = {}
  ): Promise<void> {
    if (!SemVerParser.isValid(newVersion)) {
      throw new Error(`无效的版本格式: ${newVersion}`);
    }

    const oldVersion = this.versionInfo?.version;
    
    this.versionInfo = {
      version: newVersion,
      semanticVersion: SemVerParser.parse(newVersion),
      buildTime: options.buildTime || new Date().toISOString(),
      gitHash: options.gitHash,
      environment: options.environment || this.versionInfo?.environment || 'development'
    };

    await this.saveVersionInfo();
    
    logger.info(`版本已更新: ${oldVersion || 'unknown'} -> ${newVersion}`);
  }

  /**
   * 增量更新版本
   */
  async incrementVersion(type: 'major' | 'minor' | 'patch'): Promise<string> {
    if (!this.versionInfo) {
      throw new Error('版本信息未初始化');
    }

    const newSemver = SemVerParser.incrementVersion(this.versionInfo.semanticVersion, type);
    const newVersion = SemVerParser.stringify(newSemver);

    await this.updateVersion(newVersion, {
      buildTime: new Date().toISOString()
    });

    return newVersion;
  }

  /**
   * 比较版本
   */
  compareWith(otherVersion: string): number {
    if (!this.versionInfo) {
      throw new Error('版本信息未初始化');
    }

    return SemVerParser.compare(this.versionInfo.version, otherVersion);
  }

  /**
   * 检查是否为开发版本
   */
  isDevelopment(): boolean {
    return this.versionInfo?.environment === 'development';
  }

  /**
   * 检查是否为生产版本
   */
  isProduction(): boolean {
    return this.versionInfo?.environment === 'production';
  }

  /**
   * 获取构建时间
   */
  getBuildTime(): Date | null {
    return this.versionInfo?.buildTime ? new Date(this.versionInfo.buildTime) : null;
  }

  /**
   * 获取Git哈希
   */
  getGitHash(): string | undefined {
    return this.versionInfo?.gitHash;
  }
}

// 创建全局实例
export const appVersionManager = ApplicationVersionManager.getInstance();
