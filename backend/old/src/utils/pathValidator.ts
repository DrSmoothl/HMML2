import path from 'path';
import fs from 'fs-extra';
import { logger } from '../core/logger';
import { PathValidationResult } from '../types/pathCache';

/**
 * 路径验证工具类
 * 提供路径有效性检查和规范化功能
 */
export class PathValidator {
  /**
   * 验证路径是否有效
   * @param inputPath 要验证的路径
   * @param shouldExist 路径是否应该存在
   * @returns 验证结果
   */
  static async validatePath(inputPath: string, shouldExist: boolean = true): Promise<PathValidationResult> {
    try {
      // 检查路径是否为空
      if (!inputPath || inputPath.trim() === '') {
        return {
          isValid: false,
          error: '路径不能为空',
          exists: false,
          isDirectory: false
        };
      }

      // 获取绝对路径
      const absolutePath = path.resolve(inputPath.trim());

      // 检查路径格式是否合法
      if (!this.isValidPathFormat(absolutePath)) {
        return {
          isValid: false,
          error: '路径格式不合法',
          exists: false,
          isDirectory: false,
          absolutePath
        };
      }

      // 检查路径是否存在
      const exists = await fs.pathExists(absolutePath);

      if (!exists) {
        return {
          isValid: !shouldExist,
          error: shouldExist ? '路径不存在' : undefined,
          exists: false,
          isDirectory: false,
          absolutePath
        };
      }

      // 检查是否为目录
      const stats = await fs.stat(absolutePath);
      const isDirectory = stats.isDirectory();

      if (!isDirectory) {
        return {
          isValid: false,
          error: '路径不是一个目录',
          exists: true,
          isDirectory: false,
          absolutePath
        };
      }

      return {
        isValid: true,
        exists: true,
        isDirectory: true,
        absolutePath
      };

    } catch (error) {
      logger.error('路径验证失败:', error);
      return {
        isValid: false,
        error: `路径验证失败: ${error instanceof Error ? error.message : String(error)}`,
        exists: false,
        isDirectory: false
      };
    }
  }

  /**
   * 检查路径格式是否合法
   * @param pathStr 路径字符串
   * @returns 是否合法
   */
  private static isValidPathFormat(pathStr: string): boolean {
    try {
      // Windows路径特殊字符检查
      if (process.platform === 'win32') {
        // 检查路径中不允许的字符（排除冒号，因为驱动器号需要冒号）
        const invalidChars = /[<>"|?*]/;
        if (invalidChars.test(pathStr)) {
          return false;
        }
        
        // 检查是否包含驱动器号后的无效冒号
        const drivePattern = /^[A-Za-z]:/;
        if (!drivePattern.test(pathStr)) {
          // 如果不是以驱动器号开头，则不能包含冒号
          if (pathStr.includes(':')) {
            return false;
          }
        } else {
          // 如果以驱动器号开头，检查后续部分是否包含冒号
          const afterDrive = pathStr.substring(2);
          if (afterDrive.includes(':')) {
            return false;
          }
        }
      }

      // 通用路径长度检查
      if (pathStr.length > 260 && process.platform === 'win32') {
        return false; // Windows路径长度限制
      }

      if (pathStr.length > 4096) {
        return false; // Linux/Unix路径长度限制
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 规范化路径
   * @param inputPath 输入路径
   * @returns 规范化后的路径
   */
  static normalizePath(inputPath: string): string {
    if (!inputPath) return '';
    
    try {
      return path.resolve(inputPath.trim());
    } catch (error) {
      logger.error('路径规范化失败:', error);
      return inputPath.trim();
    }
  }

  /**
   * 检查路径是否可写
   * @param dirPath 目录路径
   * @returns 是否可写
   */
  static async isWritable(dirPath: string): Promise<boolean> {
    try {
      await fs.access(dirPath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查路径是否可读
   * @param dirPath 目录路径
   * @returns 是否可读
   */
  static async isReadable(dirPath: string): Promise<boolean> {
    try {
      await fs.access(dirPath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 确保目录存在（如果需要的话创建）
   * @param dirPath 目录路径
   * @returns 是否成功
   */
  static async ensureDirectory(dirPath: string): Promise<boolean> {
    try {
      await fs.ensureDir(dirPath);
      return true;
    } catch (error) {
      logger.error(`创建目录失败 ${dirPath}:`, error);
      return false;
    }
  }

  /**
   * 检查两个路径是否相同
   * @param path1 路径1
   * @param path2 路径2
   * @returns 是否相同
   */
  static isSamePath(path1: string, path2: string): boolean {
    try {
      const normalized1 = path.resolve(path1.trim());
      const normalized2 = path.resolve(path2.trim());
      return normalized1 === normalized2;
    } catch {
      return false;
    }
  }
}
