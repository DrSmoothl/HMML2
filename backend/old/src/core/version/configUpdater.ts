/**
 * 配置文件更新工具
 * 负责将版本信息写入配置文件
 */

import fs from 'fs-extra';
import path from 'path';
import { VERSION_CONFIG } from '../../version';
import { logger } from '../logger';

export class ConfigUpdater {
  /**
   * 更新配置文件，注入版本信息
   */
  static async updateConfigWithVersion(configPath: string): Promise<void> {
    try {
      if (!await fs.pathExists(configPath)) {
        logger.warn(`配置文件不存在: ${configPath}`);
        return;
      }

      const config = await fs.readJSON(configPath);
      
      // 注入版本信息
      config.version = VERSION_CONFIG.CONFIG_VERSION;
      config.lastUpdated = new Date().toISOString();
      config._metadata = {
        systemVersion: VERSION_CONFIG.VERSION,
        configVersion: VERSION_CONFIG.CONFIG_VERSION,
        minConfigVersion: VERSION_CONFIG.MIN_CONFIG_VERSION,
        updatedAt: new Date().toISOString()
      };

      await fs.writeJSON(configPath, config, { spaces: 2 });
      logger.info(`配置文件版本已更新: ${configPath} -> ${VERSION_CONFIG.CONFIG_VERSION}`);
      
    } catch (error) {
      logger.error(`更新配置文件失败: ${configPath}`, error);
      throw error;
    }
  }

  /**
   * 批量更新配置目录中的所有配置文件
   */
  static async updateAllConfigs(configDir: string = './config'): Promise<void> {
    try {
      if (!await fs.pathExists(configDir)) {
        logger.warn(`配置目录不存在: ${configDir}`);
        return;
      }

      const files = await fs.readdir(configDir);
      const configFiles = files.filter(file => 
        file.endsWith('.json') && 
        !file.startsWith('.') && 
        !file.includes('version')
      );

      for (const file of configFiles) {
        const filePath = path.join(configDir, file);
        await this.updateConfigWithVersion(filePath);
      }

      logger.info(`已更新 ${configFiles.length} 个配置文件`);
      
    } catch (error) {
      logger.error('批量更新配置文件失败:', error);
      throw error;
    }
  }

  /**
   * 验证配置文件版本
   */
  static async validateConfigVersion(configPath: string): Promise<{
    isValid: boolean;
    currentVersion?: string;
    expectedVersion: string;
    needsUpdate: boolean;
  }> {
    try {
      if (!await fs.pathExists(configPath)) {
        return {
          isValid: false,
          expectedVersion: VERSION_CONFIG.CONFIG_VERSION,
          needsUpdate: true
        };
      }

      const config = await fs.readJSON(configPath);
      const currentVersion = config.version;
      const expectedVersion = VERSION_CONFIG.CONFIG_VERSION;
      
      return {
        isValid: !!currentVersion,
        currentVersion,
        expectedVersion,
        needsUpdate: currentVersion !== expectedVersion
      };
      
    } catch (error) {
      logger.error(`验证配置版本失败: ${configPath}`, error);
      return {
        isValid: false,
        expectedVersion: VERSION_CONFIG.CONFIG_VERSION,
        needsUpdate: true
      };
    }
  }

  /**
   * 检查并自动修复配置版本
   */
  static async autoFixConfigVersions(configDir: string = './config'): Promise<void> {
    logger.info('开始检查配置文件版本...');
    
    try {
      if (!await fs.pathExists(configDir)) {
        logger.info('配置目录不存在，跳过版本检查');
        return;
      }

      const files = await fs.readdir(configDir);
      const configFiles = files.filter(file => 
        file.endsWith('.json') && 
        !file.startsWith('.') && 
        !file.includes('version')
      );

      let updatedCount = 0;
      
      for (const file of configFiles) {
        const filePath = path.join(configDir, file);
        const validation = await this.validateConfigVersion(filePath);
        
        if (validation.needsUpdate) {
          logger.info(`修复配置版本: ${file} (${validation.currentVersion || 'none'} -> ${validation.expectedVersion})`);
          await this.updateConfigWithVersion(filePath);
          updatedCount++;
        } else {
          logger.debug(`配置版本正确: ${file} (${validation.currentVersion})`);
        }
      }

      if (updatedCount > 0) {
        logger.info(`配置版本检查完成，已修复 ${updatedCount} 个文件`);
      } else {
        logger.info('配置版本检查完成，所有文件版本正确');
      }
      
    } catch (error) {
      logger.error('自动修复配置版本失败:', error);
      throw error;
    }
  }
}
