/**
 * 麦麦主程序配置服务
 * 提供对bot_config.toml文件的读取和写入操作
 */

import { logger } from '../core/logger';
import { pathCacheManager } from '../core/pathCacheManager';
import { 
  MainConfigData, 
  ConfigUpdateData, 
  ConfigFileInfo, 
  ConfigServiceOptions 
} from '../types/config';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';
import { stringifyConfigToCleanToml } from '../utils/tomlHelpers';
import * as TOML from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';export class MainConfigService {
  private static readonly CONFIG_FILE_NAME = 'bot_config.toml';
  private static readonly CONFIG_DIR = 'config';
  private static readonly DEFAULT_OPTIONS: ConfigServiceOptions = {
    encoding: 'utf-8',
    backup: true,
    validate: true
  };

  /**
   * 获取配置文件的完整路径
   */
  private static getConfigPath(): string {
    const mainRoot = pathCacheManager.getMainRoot();
    if (!mainRoot) {
      throw new NotFoundError('麦麦主程序根目录未设置，请先设置根目录缓存');
    }

    return path.join(mainRoot, this.CONFIG_DIR, this.CONFIG_FILE_NAME);
  }

  /**
   * 检查配置文件信息
   */
  public static async getConfigFileInfo(): Promise<ConfigFileInfo> {
    try {
      const configPath = this.getConfigPath();
      
      let stats: fs.Stats | null = null;
      let exists = false;
      
      try {
        stats = await fs.promises.stat(configPath);
        exists = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }

      const info: ConfigFileInfo = {
        path: configPath,
        exists,
        readable: false,
        writable: false,
        size: 0,
        lastModified: new Date(0)
      };

      if (exists && stats) {
        info.size = stats.size;
        info.lastModified = stats.mtime;

        // 检查读写权限
        try {
          await fs.promises.access(configPath, fs.constants.R_OK);
          info.readable = true;
        } catch {
          info.readable = false;
        }

        try {
          await fs.promises.access(configPath, fs.constants.W_OK);
          info.writable = true;
        } catch {
          info.writable = false;
        }
      }

      return info;
    } catch (error) {
      logger.error('获取配置文件信息失败:', error);
      throw new InternalServerError('获取配置文件信息失败');
    }
  }

  /**
   * 读取主程序配置文件
   */
  public static async getConfig(options: Partial<ConfigServiceOptions> = {}): Promise<MainConfigData> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      const configPath = this.getConfigPath();

      // 检查文件是否存在
      const fileInfo = await this.getConfigFileInfo();
      if (!fileInfo.exists) {
        throw new NotFoundError(`主程序配置文件不存在: ${configPath}`);
      }

      if (!fileInfo.readable) {
        throw new InternalServerError(`主程序配置文件不可读: ${configPath}`);
      }

      // 读取文件内容
      let fileContent: string;
      try {
        const content = await fs.promises.readFile(configPath, { encoding: opts.encoding });
        fileContent = typeof content === 'string' ? content : content.toString();
      } catch (error) {
        logger.error('读取主程序配置文件失败:', error);
        throw new InternalServerError(`读取主程序配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      // 解析TOML内容
      let configData: MainConfigData;
      try {
        configData = TOML.parse(fileContent) as MainConfigData;
      } catch (error) {
        logger.error('解析主程序配置文件失败:', error);
        throw new ValidationError(`主程序配置文件格式错误: ${error instanceof Error ? error.message : 'TOML解析失败'}`);
      }

      logger.info('主程序配置读取成功');
      return configData;

    } catch (error) {
      logger.error('获取主程序配置失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError || error instanceof InternalServerError
        ? error 
        : new InternalServerError('获取主程序配置失败');
    }
  }

  /**
   * 更新主程序配置文件
   */
  public static async updateConfig(
    updateData: ConfigUpdateData, 
    options: Partial<ConfigServiceOptions> = {}
  ): Promise<void> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      const configPath = this.getConfigPath();

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new ValidationError('更新数据不能为空');
      }

      // 验证更新数据格式
      if (opts.validate) {
        this.validateConfigData(updateData);
      }

      // 检查文件状态
      const fileInfo = await this.getConfigFileInfo();
      
      let currentConfig: MainConfigData = {};
      
      // 如果文件存在，先读取当前配置
      if (fileInfo.exists) {
        if (!fileInfo.readable) {
          throw new InternalServerError(`主程序配置文件不可读: ${configPath}`);
        }
        if (!fileInfo.writable) {
          throw new InternalServerError(`主程序配置文件不可写: ${configPath}`);
        }
        
        currentConfig = await this.getConfig({ validate: false });
      } else {
        // 确保目录存在
        const configDir = path.dirname(configPath);
        await fs.promises.mkdir(configDir, { recursive: true });
      }

      // 合并配置数据
      const mergedConfig = this.mergeConfig(currentConfig, updateData);

      // 创建备份（如果文件存在且启用备份）
      if (fileInfo.exists && opts.backup) {
        await this.createBackup(configPath);
      }

      // 转换为TOML格式并写入文件
      try {
        const tomlContent = stringifyConfigToCleanToml(mergedConfig, TOML);
        await fs.promises.writeFile(configPath, tomlContent, { encoding: opts.encoding });
      } catch (error) {
        logger.error('写入主程序配置文件失败:', error);
        throw new InternalServerError(`写入主程序配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      logger.info('主程序配置更新成功');

    } catch (error) {
      logger.error('更新主程序配置失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError || error instanceof InternalServerError
        ? error 
        : new InternalServerError('更新主程序配置失败');
    }
  }

  /**
   * 验证配置数据格式
   */
  private static validateConfigData(data: ConfigUpdateData): void {
    // 基础类型检查
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new ValidationError('配置数据必须是一个对象');
    }

    // 递归检查嵌套对象，确保数据结构合理
    const validateObject = (obj: any, path = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // 检查键名
        if (typeof key !== 'string' || key.trim() === '') {
          throw new ValidationError(`配置项键名无效: ${currentPath}`);
        }

        // 检查值类型（TOML支持的类型）
        const valueType = typeof value;
        const isValidType = [
          'string', 'number', 'boolean'
        ].includes(valueType) || 
        value === null || 
        Array.isArray(value) || 
        (valueType === 'object' && value !== null);

        if (!isValidType) {
          throw new ValidationError(`配置项类型不支持: ${currentPath} (${valueType})`);
        }

        // 递归验证嵌套对象
        if (valueType === 'object' && value !== null && !Array.isArray(value)) {
          validateObject(value, currentPath);
        }

        // 验证数组元素类型一致性
        if (Array.isArray(value) && value.length > 0) {
          const firstType = typeof value[0];
          const allSameType = value.every(item => typeof item === firstType);
          if (!allSameType) {
            throw new ValidationError(`数组元素类型不一致: ${currentPath}`);
          }
        }
      }
    };

    validateObject(data);
  }

  /**
   * 合并配置数据（深度合并）
   */
  private static mergeConfig(current: MainConfigData, update: ConfigUpdateData): MainConfigData {
    const merged = { ...current };

    for (const [key, value] of Object.entries(update)) {
      if (value !== undefined) {
        if (
          typeof value === 'object' && 
          value !== null && 
          !Array.isArray(value) &&
          typeof merged[key] === 'object' && 
          merged[key] !== null && 
          !Array.isArray(merged[key])
        ) {
          // 递归合并嵌套对象
          merged[key] = this.mergeConfig(merged[key], value);
        } else {
          // 直接替换值
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  /**
   * 创建配置文件备份
   */
  private static async createBackup(configPath: string): Promise<void> {
    try {
      const mainRoot = pathCacheManager.getMainRoot();
      if (!mainRoot) {
        throw new Error('无法获取麦麦根目录路径');
      }

      // 创建备份目录结构：LauncherConfigBak/main/
      const backupDir = path.join(mainRoot,'config', 'LauncherConfigBak', 'main');
      await fs.promises.mkdir(backupDir, { recursive: true });

      // 生成带时间戳的备份文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const configFileName = path.basename(configPath);
      const backupFileName = `${configFileName}.backup.${timestamp}`;
      const backupPath = path.join(backupDir, backupFileName);

      // 复制配置文件到备份目录
      await fs.promises.copyFile(configPath, backupPath);
      logger.info(`主程序配置备份已创建: ${backupPath}`);

    } catch (error) {
      logger.warn('创建配置文件备份失败:', error);
      // 备份失败不应该阻止配置更新，只记录警告
    }
  }
}
