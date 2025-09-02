import path from 'path';
import { logger } from '../core/logger';
import { FileManager } from '../core/fileManager';
import { PathValidator } from '../utils/pathValidator';
import { 
  PathCacheData, 
  AdapterRootInfo, 
  PathCacheConfig,
  PathValidationResult 
} from '../types/pathCache';

/**
 * 路径缓存管理器
 * 负责管理麦麦主程序和适配器根目录的缓存
 */
export class PathCacheManager {
  private config: PathCacheConfig;
  private cacheData: PathCacheData;
  private isLoaded: boolean = false;

  constructor(config: Partial<PathCacheConfig> = {}) {
    // 默认配置
    this.config = {
      cacheFilePath: path.join(process.cwd(), 'data', 'pathCache.json'),
      enableValidation: true,
      autoCreateDirectory: false,
      maxAdapters: 50,
      ...config
    };

    // 初始化缓存数据
    this.cacheData = this.getDefaultCacheData();
    
    logger.info('路径缓存管理器已初始化');
  }

  /**
   * 获取默认缓存数据
   */
  private getDefaultCacheData(): PathCacheData {
    return {
      mainRoot: undefined,
      adapterRoots: [],
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * 初始化缓存管理器
   */
  async initialize(): Promise<void> {
    try {
      await this.loadCache();
      logger.info('路径缓存管理器初始化完成');
    } catch (error) {
      logger.error('路径缓存管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载缓存数据
   */
  async loadCache(): Promise<void> {
    try {
      // 确保缓存目录存在
      const cacheDir = path.dirname(this.config.cacheFilePath);
      await FileManager.ensureDir(cacheDir);

      // 尝试读取缓存文件
      const data = await FileManager.readJSON<PathCacheData>(this.config.cacheFilePath);
      
      if (data) {
        // 验证数据结构
        if (this.validateCacheData(data)) {
          this.cacheData = data;
          logger.info('路径缓存数据加载成功');
        } else {
          logger.warn('缓存数据格式无效，使用默认数据');
          this.cacheData = this.getDefaultCacheData();
          await this.saveCache();
        }
      } else {
        // 文件不存在，创建默认缓存
        logger.info('缓存文件不存在，创建默认缓存文件');
        await this.saveCache();
      }

      this.isLoaded = true;
    } catch (error) {
      logger.error('加载路径缓存失败:', error);
      // 使用默认数据
      this.cacheData = this.getDefaultCacheData();
      this.isLoaded = true;
    }
  }

  /**
   * 保存缓存数据
   */
  async saveCache(): Promise<void> {
    try {
      // 更新时间戳
      this.cacheData.lastUpdated = new Date().toISOString();
      
      // 保存到文件
      const success = await FileManager.writeJSON(this.config.cacheFilePath, this.cacheData);
      
      if (!success) {
        throw new Error('写入缓存文件失败');
      }

      logger.debug('路径缓存数据已保存');
    } catch (error) {
      logger.error('保存路径缓存失败:', error);
      throw error;
    }
  }

  /**
   * 验证缓存数据格式
   */
  private validateCacheData(data: any): data is PathCacheData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.adapterRoots) &&
      typeof data.lastUpdated === 'string' &&
      typeof data.version === 'string'
    );
  }

  /**
   * 获取所有缓存的路径
   */
  async getAllPaths(): Promise<{ mainRoot?: string; adapterRoots: AdapterRootInfo[] }> {
    this.ensureLoaded();
    return {
      mainRoot: this.cacheData.mainRoot,
      adapterRoots: [...this.cacheData.adapterRoots]
    };
  }

  /**
   * 设置主程序根目录
   */
  async setMainRoot(rootPath: string): Promise<void> {
    this.ensureLoaded();

    // 路径验证
    if (this.config.enableValidation) {
      const validation = await PathValidator.validatePath(rootPath, !this.config.autoCreateDirectory);
      if (!validation.isValid) {
        throw new Error(validation.error || '路径验证失败');
      }

      // 如果启用自动创建目录且目录不存在
      if (this.config.autoCreateDirectory && !validation.exists) {
        const created = await PathValidator.ensureDirectory(validation.absolutePath!);
        if (!created) {
          throw new Error('无法创建目录');
        }
      }

      // 使用绝对路径
      this.cacheData.mainRoot = validation.absolutePath;
    } else {
      // 不验证，直接规范化路径
      this.cacheData.mainRoot = PathValidator.normalizePath(rootPath);
    }

    await this.saveCache();
    logger.info(`主程序根目录已设置: ${this.cacheData.mainRoot}`);
  }

  /**
   * 获取主程序根目录
   */
  getMainRoot(): string | undefined {
    this.ensureLoaded();
    return this.cacheData.mainRoot;
  }

  /**
   * 添加适配器根目录
   */
  async addAdapterRoot(adapterName: string, rootPath: string): Promise<void> {
    this.ensureLoaded();

    // 验证适配器名称
    if (!adapterName || adapterName.trim() === '') {
      throw new Error('适配器名称不能为空');
    }

    const trimmedName = adapterName.trim();

    // 检查适配器数量限制
    if (this.cacheData.adapterRoots.length >= this.config.maxAdapters) {
      throw new Error(`适配器数量已达上限 (${this.config.maxAdapters})`);
    }

    // 检查适配器是否已存在
    if (this.isAdapterExists(trimmedName)) {
      throw new Error(`适配器 "${trimmedName}" 已存在`);
    }

    // 路径验证
    let finalPath: string;
    if (this.config.enableValidation) {
      const validation = await PathValidator.validatePath(rootPath, !this.config.autoCreateDirectory);
      if (!validation.isValid) {
        throw new Error(validation.error || '路径验证失败');
      }

      // 如果启用自动创建目录且目录不存在
      if (this.config.autoCreateDirectory && !validation.exists) {
        const created = await PathValidator.ensureDirectory(validation.absolutePath!);
        if (!created) {
          throw new Error('无法创建目录');
        }
      }

      finalPath = validation.absolutePath!;
    } else {
      finalPath = PathValidator.normalizePath(rootPath);
    }

    // 添加适配器
    this.cacheData.adapterRoots.push({
      adapterName: trimmedName,
      rootPath: finalPath
    });

    await this.saveCache();
    logger.info(`适配器根目录已添加: ${trimmedName} -> ${finalPath}`);
  }

  /**
   * 移除适配器根目录
   */
  async removeAdapterRoot(adapterName: string): Promise<boolean> {
    this.ensureLoaded();

    const trimmedName = adapterName.trim();
    const initialCount = this.cacheData.adapterRoots.length;

    this.cacheData.adapterRoots = this.cacheData.adapterRoots.filter(
      adapter => adapter.adapterName !== trimmedName
    );

    const removed = this.cacheData.adapterRoots.length < initialCount;

    if (removed) {
      await this.saveCache();
      logger.info(`适配器根目录已移除: ${trimmedName}`);
    }

    return removed;
  }

  /**
   * 更新适配器根目录
   */
  async updateAdapterRoot(adapterName: string, newRootPath: string): Promise<void> {
    this.ensureLoaded();

    const trimmedName = adapterName.trim();
    const adapterIndex = this.cacheData.adapterRoots.findIndex(
      adapter => adapter.adapterName === trimmedName
    );

    if (adapterIndex === -1) {
      throw new Error(`适配器 "${trimmedName}" 不存在`);
    }

    // 路径验证
    let finalPath: string;
    if (this.config.enableValidation) {
      const validation = await PathValidator.validatePath(newRootPath, !this.config.autoCreateDirectory);
      if (!validation.isValid) {
        throw new Error(validation.error || '路径验证失败');
      }

      // 如果启用自动创建目录且目录不存在
      if (this.config.autoCreateDirectory && !validation.exists) {
        const created = await PathValidator.ensureDirectory(validation.absolutePath!);
        if (!created) {
          throw new Error('无法创建目录');
        }
      }

      finalPath = validation.absolutePath!;
    } else {
      finalPath = PathValidator.normalizePath(newRootPath);
    }

    // 更新适配器路径
    this.cacheData.adapterRoots[adapterIndex].rootPath = finalPath;

    await this.saveCache();
    logger.info(`适配器根目录已更新: ${trimmedName} -> ${finalPath}`);
  }

  /**
   * 获取适配器根目录
   */
  getAdapterRoot(adapterName: string): string | undefined {
    this.ensureLoaded();
    const adapter = this.cacheData.adapterRoots.find(
      adapter => adapter.adapterName === adapterName.trim()
    );
    return adapter?.rootPath;
  }

  /**
   * 获取所有适配器
   */
  getAllAdapters(): AdapterRootInfo[] {
    this.ensureLoaded();
    return [...this.cacheData.adapterRoots];
  }

  /**
   * 检查适配器是否存在
   */
  isAdapterExists(adapterName: string): boolean {
    this.ensureLoaded();
    return this.cacheData.adapterRoots.some(
      adapter => adapter.adapterName === adapterName.trim()
    );
  }

  /**
   * 清空所有缓存
   */
  async clearCache(): Promise<void> {
    this.ensureLoaded();
    this.cacheData = this.getDefaultCacheData();
    await this.saveCache();
    logger.info('路径缓存已清空');
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { hasMainRoot: boolean; adapterCount: number; lastUpdated: string } {
    this.ensureLoaded();
    return {
      hasMainRoot: !!this.cacheData.mainRoot,
      adapterCount: this.cacheData.adapterRoots.length,
      lastUpdated: this.cacheData.lastUpdated
    };
  }

  /**
   * 确保缓存已加载
   */
  private ensureLoaded(): void {
    if (!this.isLoaded) {
      throw new Error('路径缓存管理器未初始化，请先调用 initialize()');
    }
  }
}

// 创建全局路径缓存管理器实例
export const pathCacheManager = new PathCacheManager();
