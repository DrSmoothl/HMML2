/**
 * QQ适配器配置服务
 * 提供对QQ适配器config.toml文件的读取和写入操作
 */

import { logger } from '../core/logger';
import { pathCacheManager } from '../core/pathCacheManager';
import { 
  AdapterConfig,
  AdapterConfigUpdateData, 
  AdapterConfigFileInfo, 
  AdapterConfigServiceOptions 
} from '../types/adapterConfig';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';
import { stringifyConfigToCleanToml } from '../utils/tomlHelpers';
import * as TOML from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';

export class AdapterConfigService {
  private static readonly CONFIG_FILE_NAME = 'config.toml';
  private static readonly ADAPTER_NAME = 'QQ适配器';
  private static readonly DEFAULT_OPTIONS: AdapterConfigServiceOptions = {
    encoding: 'utf-8',
    backup: true,
    validate: true
  };

  /**
   * 获取配置文件的完整路径
   */
  private static getConfigPath(): string {
    const adapterRoot = pathCacheManager.getAdapterRoot(this.ADAPTER_NAME);
    if (!adapterRoot) {
      throw new NotFoundError('QQ适配器根目录未设置，请先在路径缓存中设置适配器根目录');
    }

    return path.join(adapterRoot, this.CONFIG_FILE_NAME);
  }

  /**
   * 检查配置文件信息
   */
  public static async getConfigFileInfo(): Promise<AdapterConfigFileInfo> {
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

      const info: AdapterConfigFileInfo = {
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
      logger.error('获取QQ适配器配置文件信息失败:', error);
      throw new InternalServerError('获取QQ适配器配置文件信息失败');
    }
  }

  /**
   * 读取QQ适配器配置文件
   */
  public static async getConfig(options: Partial<AdapterConfigServiceOptions> = {}): Promise<AdapterConfig> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      const configPath = this.getConfigPath();

      // 检查文件是否存在
      const fileInfo = await this.getConfigFileInfo();
      if (!fileInfo.exists) {
        throw new NotFoundError(`QQ适配器配置文件不存在: ${configPath}`);
      }

      if (!fileInfo.readable) {
        throw new InternalServerError(`QQ适配器配置文件不可读: ${configPath}`);
      }

      // 读取文件内容
      let fileContent: string;
      try {
        const content = await fs.promises.readFile(configPath, { encoding: opts.encoding });
        fileContent = typeof content === 'string' ? content : content.toString();
      } catch (error) {
        logger.error('读取QQ适配器配置文件失败:', error);
        throw new InternalServerError(`读取QQ适配器配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      // 解析TOML内容
      let configData: AdapterConfig;
      try {
        configData = TOML.parse(fileContent) as unknown as AdapterConfig;
      } catch (error) {
        logger.error('解析QQ适配器配置文件失败:', error);
        throw new ValidationError(`QQ适配器配置文件格式错误: ${error instanceof Error ? error.message : 'TOML解析失败'}`);
      }

      logger.info('QQ适配器配置读取成功');
      return configData;

    } catch (error) {
      logger.error('获取QQ适配器配置失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError || error instanceof InternalServerError
        ? error 
        : new InternalServerError('获取QQ适配器配置失败');
    }
  }

  /**
   * 更新QQ适配器配置文件
   */
  public static async updateConfig(
    updateData: AdapterConfigUpdateData, 
    options: Partial<AdapterConfigServiceOptions> = {}
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
      
      let currentConfig: AdapterConfig;
      
      // 如果文件存在，先读取当前配置
      if (fileInfo.exists) {
        if (!fileInfo.readable) {
          throw new InternalServerError(`QQ适配器配置文件不可读: ${configPath}`);
        }
        if (!fileInfo.writable) {
          throw new InternalServerError(`QQ适配器配置文件不可写: ${configPath}`);
        }
        
        currentConfig = await this.getConfig({ validate: false });
      } else {
        // 文件不存在，使用默认配置结构
        throw new NotFoundError(`QQ适配器配置文件不存在: ${configPath}`);
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
        logger.error('写入QQ适配器配置文件失败:', error);
        throw new InternalServerError(`写入QQ适配器配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      logger.info('QQ适配器配置更新成功');

    } catch (error) {
      logger.error('更新QQ适配器配置失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError || error instanceof InternalServerError
        ? error 
        : new InternalServerError('更新QQ适配器配置失败');
    }
  }

  /**
   * 验证配置数据格式
   */
  private static validateConfigData(data: AdapterConfigUpdateData): void {
    // 基础类型检查
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new ValidationError('配置数据必须是一个对象');
    }

    // 验证特定的配置结构
    if (data.napcat_server) {
      this.validateServerConfig(data.napcat_server, 'napcat_server');
    }

    if (data.maibot_server) {
      this.validateServerConfig(data.maibot_server, 'maibot_server');
    }

    if (data.chat) {
      this.validateChatConfig(data.chat);
    }

    if (data.debug && data.debug.level) {
      const validLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
      if (!validLevels.includes(data.debug.level)) {
        throw new ValidationError(`无效的日志等级: ${data.debug.level}`);
      }
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
   * 验证服务器配置
   */
  private static validateServerConfig(serverConfig: any, configName: string): void {
    if (typeof serverConfig !== 'object' || serverConfig === null) {
      throw new ValidationError(`${configName} 必须是一个对象`);
    }

    if (serverConfig.host && typeof serverConfig.host !== 'string') {
      throw new ValidationError(`${configName}.host 必须是字符串`);
    }

    if (serverConfig.port) {
      if (typeof serverConfig.port !== 'number' || serverConfig.port < 1 || serverConfig.port > 65535) {
        throw new ValidationError(`${configName}.port 必须是1-65535之间的数字`);
      }
    }

    if (serverConfig.heartbeat_interval) {
      if (typeof serverConfig.heartbeat_interval !== 'number' || serverConfig.heartbeat_interval < 1) {
        throw new ValidationError(`${configName}.heartbeat_interval 必须是大于0的数字`);
      }
    }
  }

  /**
   * 验证聊天配置
   */
  private static validateChatConfig(chatConfig: any): void {
    if (typeof chatConfig !== 'object' || chatConfig === null) {
      throw new ValidationError('chat 配置必须是一个对象');
    }

    // 验证名单类型
    if (chatConfig.group_list_type && !['whitelist', 'blacklist'].includes(chatConfig.group_list_type)) {
      throw new ValidationError('group_list_type 必须是 whitelist 或 blacklist');
    }

    if (chatConfig.private_list_type && !['whitelist', 'blacklist'].includes(chatConfig.private_list_type)) {
      throw new ValidationError('private_list_type 必须是 whitelist 或 blacklist');
    }

    // 验证列表是否为数字数组
    const validateNumberArray = (arr: any, name: string) => {
      if (!Array.isArray(arr)) {
        throw new ValidationError(`${name} 必须是数组`);
      }
      if (!arr.every(item => typeof item === 'number' && Number.isInteger(item) && item > 0)) {
        throw new ValidationError(`${name} 数组中的所有元素必须是正整数`);
      }
    };

    if (chatConfig.group_list) {
      validateNumberArray(chatConfig.group_list, 'group_list');
    }

    if (chatConfig.private_list) {
      validateNumberArray(chatConfig.private_list, 'private_list');
    }

    if (chatConfig.ban_user_id) {
      validateNumberArray(chatConfig.ban_user_id, 'ban_user_id');
    }

    // 验证布尔值
    if (chatConfig.ban_qq_bot !== undefined && typeof chatConfig.ban_qq_bot !== 'boolean') {
      throw new ValidationError('ban_qq_bot 必须是布尔值');
    }

    if (chatConfig.enable_poke !== undefined && typeof chatConfig.enable_poke !== 'boolean') {
      throw new ValidationError('enable_poke 必须是布尔值');
    }
  }

  /**
   * 合并配置数据（深度合并）
   */
  private static mergeConfig(current: AdapterConfig, update: AdapterConfigUpdateData): AdapterConfig {
    const merged = { ...current };

    for (const [key, value] of Object.entries(update)) {
      if (value !== undefined) {
        if (
          typeof value === 'object' && 
          value !== null && 
          !Array.isArray(value) &&
          typeof merged[key as keyof AdapterConfig] === 'object' && 
          merged[key as keyof AdapterConfig] !== null && 
          !Array.isArray(merged[key as keyof AdapterConfig])
        ) {
          // 递归合并嵌套对象
          (merged as any)[key] = this.mergeConfig((merged as any)[key], value);
        } else {
          // 直接替换值
          (merged as any)[key] = value;
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
      const adapterRoot = pathCacheManager.getAdapterRoot(this.ADAPTER_NAME);
      if (!adapterRoot) {
        throw new Error('无法获取QQ适配器根目录路径');
      }

      // 创建备份目录结构：LauncherConfigBak/adapter/qq/
      const backupDir = path.join(path.dirname(adapterRoot), 'config', 'LauncherConfigBak', 'adapter', 'qq');
      await fs.promises.mkdir(backupDir, { recursive: true });

      // 生成带时间戳的备份文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const configFileName = path.basename(configPath);
      const backupFileName = `${configFileName}.backup.${timestamp}`;
      const backupPath = path.join(backupDir, backupFileName);

      // 复制配置文件到备份目录
      await fs.promises.copyFile(configPath, backupPath);
      logger.info(`QQ适配器配置备份已创建: ${backupPath}`);

    } catch (error) {
      logger.warn('创建QQ适配器配置文件备份失败:', error);
      // 备份失败不应该阻止配置更新，只记录警告
    }
  }
}
