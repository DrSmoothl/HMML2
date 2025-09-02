import { SemanticVersion, VersionComparison } from './types';

/**
 * 语义化版本解析和比较工具
 */
export class SemVerParser {
  private static readonly VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9\-\.]+))?(?:\+([a-zA-Z0-9\-\.]+))?$/;

  /**
   * 解析版本字符串
   */
  static parse(version: string): SemanticVersion {
    const match = version.match(this.VERSION_REGEX);
    
    if (!match) {
      throw new Error(`无效的语义化版本格式: ${version}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || undefined,
      build: match[5] || undefined
    };
  }

  /**
   * 将语义化版本对象转换为字符串
   */
  static stringify(semver: SemanticVersion): string {
    let version = `${semver.major}.${semver.minor}.${semver.patch}`;
    
    if (semver.prerelease) {
      version += `-${semver.prerelease}`;
    }
    
    if (semver.build) {
      version += `+${semver.build}`;
    }
    
    return version;
  }

  /**
   * 比较两个版本
   */
  static compare(version1: string | SemanticVersion, version2: string | SemanticVersion): VersionComparison {
    const v1 = typeof version1 === 'string' ? this.parse(version1) : version1;
    const v2 = typeof version2 === 'string' ? this.parse(version2) : version2;

    // 比较主版本号
    if (v1.major !== v2.major) {
      return v1.major > v2.major ? VersionComparison.GREATER : VersionComparison.LESS;
    }

    // 比较次版本号
    if (v1.minor !== v2.minor) {
      return v1.minor > v2.minor ? VersionComparison.GREATER : VersionComparison.LESS;
    }

    // 比较修订版本号
    if (v1.patch !== v2.patch) {
      return v1.patch > v2.patch ? VersionComparison.GREATER : VersionComparison.LESS;
    }

    // 比较预发布版本
    if (v1.prerelease && v2.prerelease) {
      return this.comparePrerelease(v1.prerelease, v2.prerelease);
    } else if (v1.prerelease) {
      return VersionComparison.LESS; // 预发布版本小于正式版本
    } else if (v2.prerelease) {
      return VersionComparison.GREATER; // 正式版本大于预发布版本
    }

    return VersionComparison.EQUAL;
  }

  /**
   * 比较预发布版本
   */
  private static comparePrerelease(pre1: string, pre2: string): VersionComparison {
    const parts1 = pre1.split('.');
    const parts2 = pre2.split('.');
    
    const maxLength = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i];
      const part2 = parts2[i];
      
      if (part1 === undefined) return VersionComparison.LESS;
      if (part2 === undefined) return VersionComparison.GREATER;
      
      const num1 = parseInt(part1, 10);
      const num2 = parseInt(part2, 10);
      
      // 如果都是数字，按数字比较
      if (!isNaN(num1) && !isNaN(num2)) {
        if (num1 !== num2) {
          return num1 > num2 ? VersionComparison.GREATER : VersionComparison.LESS;
        }
      } else {
        // 字符串比较
        if (part1 !== part2) {
          return part1 > part2 ? VersionComparison.GREATER : VersionComparison.LESS;
        }
      }
    }
    
    return VersionComparison.EQUAL;
  }

  /**
   * 检查版本1是否大于版本2
   */
  static gt(version1: string | SemanticVersion, version2: string | SemanticVersion): boolean {
    return this.compare(version1, version2) === VersionComparison.GREATER;
  }

  /**
   * 检查版本1是否小于版本2
   */
  static lt(version1: string | SemanticVersion, version2: string | SemanticVersion): boolean {
    return this.compare(version1, version2) === VersionComparison.LESS;
  }

  /**
   * 检查版本1是否等于版本2
   */
  static eq(version1: string | SemanticVersion, version2: string | SemanticVersion): boolean {
    return this.compare(version1, version2) === VersionComparison.EQUAL;
  }

  /**
   * 检查版本1是否大于等于版本2
   */
  static gte(version1: string | SemanticVersion, version2: string | SemanticVersion): boolean {
    const result = this.compare(version1, version2);
    return result === VersionComparison.GREATER || result === VersionComparison.EQUAL;
  }

  /**
   * 检查版本1是否小于等于版本2
   */
  static lte(version1: string | SemanticVersion, version2: string | SemanticVersion): boolean {
    const result = this.compare(version1, version2);
    return result === VersionComparison.LESS || result === VersionComparison.EQUAL;
  }

  /**
   * 验证版本字符串格式
   */
  static isValid(version: string): boolean {
    return this.VERSION_REGEX.test(version);
  }

  /**
   * 获取下一个版本
   */
  static incrementVersion(
    version: string | SemanticVersion, 
    type: 'major' | 'minor' | 'patch'
  ): SemanticVersion {
    const semver = typeof version === 'string' ? this.parse(version) : { ...version };
    
    switch (type) {
      case 'major':
        semver.major++;
        semver.minor = 0;
        semver.patch = 0;
        break;
      case 'minor':
        semver.minor++;
        semver.patch = 0;
        break;
      case 'patch':
        semver.patch++;
        break;
    }
    
    // 清除预发布和构建标识
    semver.prerelease = undefined;
    semver.build = undefined;
    
    return semver;
  }
}
