import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';

export class FileManager {
  /**
   * 安全读取JSON文件
   */
  static async readJSON<T = any>(filePath: string, defaultValue?: T): Promise<T | null> {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        logger.warn(`文件不存在: ${filePath}`);
        return defaultValue ?? null;
      }

      const data = await fs.readJSON(filePath);
      logger.debug(`成功读取JSON文件: ${filePath}`);
      return data;
    } catch (error) {
      logger.error(`读取JSON文件失败: ${filePath}`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * 安全写入JSON文件
   */
  static async writeJSON(filePath: string, data: any, options: fs.WriteOptions = {}): Promise<boolean> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeJSON(filePath, data, { spaces: 2, ...options });
      logger.debug(`成功写入JSON文件: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`写入JSON文件失败: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 安全读取文本文件
   */
  static async readText(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string | null> {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        logger.warn(`文件不存在: ${filePath}`);
        return null;
      }

      const data = await fs.readFile(filePath, encoding);
      logger.debug(`成功读取文本文件: ${filePath}`);
      return data;
    } catch (error) {
      logger.error(`读取文本文件失败: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 安全写入文本文件
   */
  static async writeText(filePath: string, data: string, encoding: BufferEncoding = 'utf8'): Promise<boolean> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, data, encoding);
      logger.debug(`成功写入文本文件: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`写入文本文件失败: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 安全删除文件或目录
   */
  static async remove(targetPath: string): Promise<boolean> {
    try {
      const exists = await fs.pathExists(targetPath);
      if (!exists) {
        logger.warn(`路径不存在: ${targetPath}`);
        return true;
      }

      await fs.remove(targetPath);
      logger.debug(`成功删除: ${targetPath}`);
      return true;
    } catch (error) {
      logger.error(`删除失败: ${targetPath}`, error);
      return false;
    }
  }

  /**
   * 安全复制文件或目录
   */
  static async copy(src: string, dest: string): Promise<boolean> {
    try {
      const exists = await fs.pathExists(src);
      if (!exists) {
        logger.error(`源路径不存在: ${src}`);
        return false;
      }

      await fs.ensureDir(path.dirname(dest));
      await fs.copy(src, dest);
      logger.debug(`成功复制: ${src} -> ${dest}`);
      return true;
    } catch (error) {
      logger.error(`复制失败: ${src} -> ${dest}`, error);
      return false;
    }
  }

  /**
   * 安全移动文件或目录
   */
  static async move(src: string, dest: string): Promise<boolean> {
    try {
      const exists = await fs.pathExists(src);
      if (!exists) {
        logger.error(`源路径不存在: ${src}`);
        return false;
      }

      await fs.ensureDir(path.dirname(dest));
      await fs.move(src, dest);
      logger.debug(`成功移动: ${src} -> ${dest}`);
      return true;
    } catch (error) {
      logger.error(`移动失败: ${src} -> ${dest}`, error);
      return false;
    }
  }

  /**
   * 确保目录存在
   */
  static async ensureDir(dirPath: string): Promise<boolean> {
    try {
      await fs.ensureDir(dirPath);
      logger.debug(`目录已确保存在: ${dirPath}`);
      return true;
    } catch (error) {
      logger.error(`创建目录失败: ${dirPath}`, error);
      return false;
    }
  }

  /**
   * 列出目录内容
   */
  static async listDir(dirPath: string, options: { withStats?: boolean } = {}): Promise<any[]> {
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) {
        logger.warn(`目录不存在: ${dirPath}`);
        return [];
      }

      const items = await fs.readdir(dirPath);
      
      if (options.withStats) {
        const itemsWithStats = await Promise.all(
          items.map(async (item) => {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);
            return {
              name: item,
              path: itemPath,
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
              size: stats.size,
              mtime: stats.mtime,
              ctime: stats.ctime
            };
          })
        );
        return itemsWithStats;
      }

      return items.map(item => ({ name: item, path: path.join(dirPath, item) }));
    } catch (error) {
      logger.error(`读取目录失败: ${dirPath}`, error);
      return [];
    }
  }

  /**
   * 检查路径是否存在
   */
  static async exists(targetPath: string): Promise<boolean> {
    try {
      return await fs.pathExists(targetPath);
    } catch (error) {
      logger.error(`检查路径存在性失败: ${targetPath}`, error);
      return false;
    }
  }

  /**
   * 获取文件或目录的统计信息
   */
  static async getStats(targetPath: string): Promise<fs.Stats | null> {
    try {
      const exists = await fs.pathExists(targetPath);
      if (!exists) {
        return null;
      }

      const stats = await fs.stat(targetPath);
      return stats;
    } catch (error) {
      logger.error(`获取文件统计信息失败: ${targetPath}`, error);
      return null;
    }
  }

  /**
   * 获取文件大小（以字节为单位）
   */
  static async getFileSize(filePath: string): Promise<number> {
    const stats = await this.getStats(filePath);
    return stats ? stats.size : 0;
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 创建备份文件
   */
  static async backup(filePath: string, backupSuffix: string = '.backup'): Promise<boolean> {
    const backupPath = filePath + backupSuffix;
    return await this.copy(filePath, backupPath);
  }

  /**
   * 恢复备份文件
   */
  static async restore(filePath: string, backupSuffix: string = '.backup'): Promise<boolean> {
    const backupPath = filePath + backupSuffix;
    return await this.move(backupPath, filePath);
  }
}
