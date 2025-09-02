/**
 * 麦麦模型配置服务
 * 提供对model_config.toml文件的读取和写入操作
 */

import { logger } from '../core/logger';
import { pathCacheManager } from '../core/pathCacheManager';
import { 
  ModelConfigData, 
  ConfigUpdateData, 
  ConfigServiceOptions 
} from '../types/config';
import { ValidationError, NotFoundError, InternalServerError } from '../middleware/errorHandler';
import { stringifyConfigToCleanToml } from '../utils/tomlHelpers';
import * as TOML from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';

export class ModelConfigService {
  private static readonly CONFIG_FILE_NAME = 'model_config.toml';
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
   * 读取模型配置文件
   */
  public static async getConfig(options: Partial<ConfigServiceOptions> = {}): Promise<ModelConfigData> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      const configPath = this.getConfigPath();

      // 检查文件是否存在
      let fileExists = false;
      try {
        await fs.promises.stat(configPath);
        fileExists = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }

      if (!fileExists) {
        throw new NotFoundError(`模型配置文件不存在: ${configPath}`);
      }

      // 检查文件是否可读
      try {
        await fs.promises.access(configPath, fs.constants.R_OK);
      } catch {
        throw new InternalServerError(`模型配置文件不可读: ${configPath}`);
      }

      // 读取文件内容
      let fileContent: string;
      try {
        const content = await fs.promises.readFile(configPath, { encoding: opts.encoding });
        fileContent = typeof content === 'string' ? content : content.toString();
      } catch (error) {
        logger.error('读取模型配置文件失败:', error);
        throw new InternalServerError(`读取模型配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      // 解析TOML内容
      let configData: ModelConfigData;
      try {
        configData = TOML.parse(fileContent) as ModelConfigData;
      } catch (error) {
        logger.error('解析模型配置文件失败:', error);
        throw new ValidationError(`模型配置文件格式错误: ${error instanceof Error ? error.message : 'TOML解析失败'}`);
      }

      logger.info('模型配置读取成功');
      return configData;

    } catch (error) {
      logger.error('获取模型配置失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError || error instanceof InternalServerError
        ? error 
        : new InternalServerError('获取模型配置失败');
    }
  }

  /**
   * 更新模型配置文件
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
      let fileExists = false;
      let currentConfig: ModelConfigData = {};
      
      try {
        await fs.promises.stat(configPath);
        fileExists = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
      
      // 如果文件存在，先读取当前配置
      if (fileExists) {
        // 检查文件权限
        try {
          await fs.promises.access(configPath, fs.constants.R_OK);
        } catch {
          throw new InternalServerError(`模型配置文件不可读: ${configPath}`);
        }
        
        try {
          await fs.promises.access(configPath, fs.constants.W_OK);
        } catch {
          throw new InternalServerError(`模型配置文件不可写: ${configPath}`);
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
      if (fileExists && opts.backup) {
        await this.createBackup(configPath);
      }

      // 转换为TOML格式并写入文件
      try {
        const tomlContent = stringifyConfigToCleanToml(mergedConfig, TOML);
        await fs.promises.writeFile(configPath, tomlContent, { encoding: opts.encoding });
      } catch (error) {
        logger.error('写入模型配置文件失败:', error);
        throw new InternalServerError(`写入模型配置文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      logger.info('模型配置更新成功');

    } catch (error) {
      logger.error('更新模型配置失败:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError || error instanceof InternalServerError
        ? error 
        : new InternalServerError('更新模型配置失败');
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

    // 模型配置特定验证规则
    this.validateModelSpecificRules(data);

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
   * 验证模型配置特定规则
   */
  private static validateModelSpecificRules(data: ConfigUpdateData): void {
    // 模型相关字段验证
    if ('model_name' in data && data.model_name !== undefined) {
      if (typeof data.model_name !== 'string' || data.model_name.trim() === '') {
        throw new ValidationError('模型名称必须是非空字符串');
      }
    }

    if ('max_tokens' in data && data.max_tokens !== undefined) {
      if (typeof data.max_tokens !== 'number' || data.max_tokens <= 0) {
        throw new ValidationError('最大token数必须是正整数');
      }
    }

    if ('temperature' in data && data.temperature !== undefined) {
      if (typeof data.temperature !== 'number' || data.temperature < 0 || data.temperature > 2) {
        throw new ValidationError('temperature必须是0-2之间的数值');
      }
    }

    if ('top_p' in data && data.top_p !== undefined) {
      if (typeof data.top_p !== 'number' || data.top_p < 0 || data.top_p > 1) {
        throw new ValidationError('top_p必须是0-1之间的数值');
      }
    }

    // API相关验证
    if ('api_key' in data && data.api_key !== undefined) {
      if (typeof data.api_key !== 'string') {
        throw new ValidationError('API密钥必须是字符串格式');
      }
    }

    if ('api_base' in data && data.api_base !== undefined) {
      if (typeof data.api_base !== 'string' || !this.isValidUrl(data.api_base)) {
        throw new ValidationError('API基础URL必须是有效的URL格式');
      }
    }
  }

  /**
   * 验证URL格式
   */
  private static isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 合并配置数据（深度合并）
   */
  private static mergeConfig(current: ModelConfigData, update: ConfigUpdateData): ModelConfigData {
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

      // 创建备份目录结构：LauncherConfigBak/model/
      const backupDir = path.join(mainRoot,'config', 'LauncherConfigBak', 'model');
      await fs.promises.mkdir(backupDir, { recursive: true });

      // 生成带时间戳的备份文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const configFileName = path.basename(configPath);
      const backupFileName = `${configFileName}.backup.${timestamp}`;
      const backupPath = path.join(backupDir, backupFileName);

      // 复制配置文件到备份目录
      await fs.promises.copyFile(configPath, backupPath);
      logger.info(`模型配置备份已创建: ${backupPath}`);

    } catch (error) {
      logger.warn('创建模型配置文件备份失败:', error);
      // 备份失败不应该阻止配置更新，只记录警告
    }
  }

  /**
   * 重置配置文件到默认状态
   */
  public static async resetConfig(): Promise<void> {
    try {
      const configPath = this.getConfigPath();
      
      // 创建备份
      const fileExists = await fs.promises.access(configPath, fs.constants.F_OK).then(() => true, () => false);
      if (fileExists) {
        await this.createBackup(configPath);
        await fs.promises.unlink(configPath);
      }

      logger.info('模型配置已重置');
    } catch (error) {
      logger.error('重置模型配置失败:', error);
      throw new InternalServerError('重置模型配置失败');
    }
  }

  /**
   * 添加API服务提供商
   * @param providerData 供应商配置数据
   * @param opts 配置选项
   */
  public static async addProvider(
    providerData: {
      name: string;
      base_url: string;
      api_key: string;
      client_type?: string;
      max_retry?: number;
      timeout?: number;
      retry_interval?: number;
    },
    opts: Partial<ConfigServiceOptions> = {}
  ): Promise<void> {
    try {
      // 读取现有配置
      const currentConfig = await this.getConfig({ validate: false });
      
      // 确保api_providers数组存在
      if (!currentConfig.api_providers) {
        currentConfig.api_providers = [];
      }

      // 检查供应商名称是否已存在
      const existingProvider = currentConfig.api_providers.find(
        (provider: any) => provider.name === providerData.name
      );
      if (existingProvider) {
        throw new ValidationError(`供应商 "${providerData.name}" 已存在`);
      }

      // 添加新供应商（设置默认值）
      const newProvider = {
        name: providerData.name,
        base_url: providerData.base_url,
        api_key: providerData.api_key,
        client_type: providerData.client_type || 'openai',
        max_retry: providerData.max_retry || 2,
        timeout: providerData.timeout || 30,
        retry_interval: providerData.retry_interval || 10
      };

      currentConfig.api_providers.push(newProvider);

      // 写入配置
      await this.updateConfig(currentConfig, opts);
      logger.info(`已添加API供应商: ${providerData.name}`);

    } catch (error) {
      logger.error('添加API供应商失败:', error);
      throw error;
    }
  }

  /**
   * 删除API服务提供商
   * @param providerName 供应商名称
   * @param opts 配置选项
   */
  public static async deleteProvider(
    providerName: string,
    opts: Partial<ConfigServiceOptions> = {}
  ): Promise<void> {
    try {
      // 读取现有配置
      const currentConfig = await this.getConfig({ validate: false });
      
      if (!currentConfig.api_providers) {
        throw new NotFoundError(`供应商 "${providerName}" 不存在`);
      }

      // 查找供应商索引
      const providerIndex = currentConfig.api_providers.findIndex(
        (provider: any) => provider.name === providerName
      );
      if (providerIndex === -1) {
        throw new NotFoundError(`供应商 "${providerName}" 不存在`);
      }

      // 检查是否有模型正在使用这个供应商
      if (currentConfig.models) {
        const usingModels = currentConfig.models.filter(
          (model: any) => model.api_provider === providerName
        );
        if (usingModels.length > 0) {
          const modelNames = usingModels.map((m: any) => m.name).join(', ');
          throw new ValidationError(`无法删除供应商 "${providerName}"，以下模型正在使用: ${modelNames}`);
        }
      }

      // 删除供应商
      currentConfig.api_providers.splice(providerIndex, 1);

      // 写入配置
      await this.updateConfig(currentConfig, opts);
      logger.info(`已删除API供应商: ${providerName}`);

    } catch (error) {
      logger.error('删除API供应商失败:', error);
      throw error;
    }
  }

  /**
   * 添加模型配置
   * @param modelData 模型配置数据
   * @param opts 配置选项
   */
  public static async addModel(
    modelData: {
      model_identifier: string;
      name: string;
      api_provider: string;
      price_in?: number;
      price_out?: number;
      force_stream_mode?: boolean;
      extra_params?: Record<string, any>;
    },
    opts: Partial<ConfigServiceOptions> = {}
  ): Promise<void> {
    try {
      // 读取现有配置
      const currentConfig = await this.getConfig({ validate: false });
      
      // 确保models数组存在
      if (!currentConfig.models) {
        currentConfig.models = [];
      }

      // 检查模型名称是否已存在
      const existingModel = currentConfig.models.find(
        (model: any) => model.name === modelData.name
      );
      if (existingModel) {
        throw new ValidationError(`模型 "${modelData.name}" 已存在`);
      }

      // 检查API供应商是否存在
      if (currentConfig.api_providers) {
        const providerExists = currentConfig.api_providers.some(
          (provider: any) => provider.name === modelData.api_provider
        );
        if (!providerExists) {
          throw new ValidationError(`API供应商 "${modelData.api_provider}" 不存在`);
        }
      }

      // 添加新模型（设置默认值）
      const newModel: any = {
        model_identifier: modelData.model_identifier,
        name: modelData.name,
        api_provider: modelData.api_provider,
        price_in: modelData.price_in || 0,
        price_out: modelData.price_out || 0
      };

      // 可选参数
      if (modelData.force_stream_mode !== undefined) {
        newModel.force_stream_mode = modelData.force_stream_mode;
      }
      if (modelData.extra_params) {
        newModel.extra_params = modelData.extra_params;
      }

      currentConfig.models.push(newModel);

      // 写入配置
      await this.updateConfig(currentConfig, opts);
      logger.info(`已添加模型: ${modelData.name}`);

    } catch (error) {
      logger.error('添加模型失败:', error);
      throw error;
    }
  }

  /**
   * 删除模型配置
   * @param modelName 模型名称
   * @param opts 配置选项
   */
  public static async deleteModel(
    modelName: string,
    opts: Partial<ConfigServiceOptions> = {}
  ): Promise<void> {
    try {
      // 读取现有配置
      const currentConfig = await this.getConfig({ validate: false });
      
      if (!currentConfig.models) {
        throw new NotFoundError(`模型 "${modelName}" 不存在`);
      }

      // 查找模型索引
      const modelIndex = currentConfig.models.findIndex(
        (model: any) => model.name === modelName
      );
      if (modelIndex === -1) {
        throw new NotFoundError(`模型 "${modelName}" 不存在`);
      }

      // 检查是否有任务配置正在使用这个模型
      if (currentConfig.model_task_config) {
        const usingTasks: string[] = [];
        for (const [taskName, taskConfig] of Object.entries(currentConfig.model_task_config)) {
          if ((taskConfig as any).model_list && (taskConfig as any).model_list.includes(modelName)) {
            usingTasks.push(taskName);
          }
        }
        if (usingTasks.length > 0) {
          throw new ValidationError(`无法删除模型 "${modelName}"，以下任务配置正在使用: ${usingTasks.join(', ')}`);
        }
      }

      // 删除模型
      currentConfig.models.splice(modelIndex, 1);

      // 写入配置
      await this.updateConfig(currentConfig, opts);
      logger.info(`已删除模型: ${modelName}`);

    } catch (error) {
      logger.error('删除模型失败:', error);
      throw error;
    }
  }
}
