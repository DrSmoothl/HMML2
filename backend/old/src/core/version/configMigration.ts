import { MigrationRule, MigrationResult, ConfigChange } from './types';
import { SemVerParser } from './semver';
import { logger } from '../logger';

/**
 * 配置迁移管理器
 */
export class ConfigMigrationManager {
  private migrations: Map<string, MigrationRule[]> = new Map();

  /**
   * 注册迁移规则
   */
  registerMigration(rule: MigrationRule): void {
    const rules = this.migrations.get(rule.from) || [];
    rules.push(rule);
    this.migrations.set(rule.from, rules);
    
    logger.debug(`注册配置迁移规则: ${rule.from} -> ${rule.to}`);
  }

  /**
   * 批量注册迁移规则
   */
  registerMigrations(rules: MigrationRule[]): void {
    rules.forEach(rule => this.registerMigration(rule));
  }

  /**
   * 执行配置迁移
   */
  async migrate(currentConfig: any, fromVersion: string, toVersion: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      fromVersion,
      toVersion,
      changes: [],
      errors: []
    };

    try {
      logger.info(`开始配置迁移: ${fromVersion} -> ${toVersion}`);

      // 如果版本相同，无需迁移
      if (SemVerParser.eq(fromVersion, toVersion)) {
        logger.info('配置版本相同，无需迁移');
        return result;
      }

      // 找到迁移路径
      const migrationPath = this.findMigrationPath(fromVersion, toVersion);
      if (migrationPath.length === 0) {
        throw new Error(`无法找到从 ${fromVersion} 到 ${toVersion} 的迁移路径`);
      }

      let migratedConfig = { ...currentConfig };

      // 按路径执行迁移
      for (const rule of migrationPath) {
        try {
          logger.info(`执行迁移: ${rule.from} -> ${rule.to} (${rule.description})`);
          
          const oldConfig = { ...migratedConfig };
          migratedConfig = rule.migrate(migratedConfig);
          
          // 记录变更
          const changes = this.detectChanges(oldConfig, migratedConfig, rule);
          result.changes.push(...changes);
          
        } catch (error) {
          const errorMsg = `迁移失败 ${rule.from} -> ${rule.to}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors?.push(errorMsg);
          logger.error(errorMsg);
          result.success = false;
        }
      }

      if (result.success) {
        logger.info(`配置迁移完成，共执行 ${migrationPath.length} 个迁移步骤，产生 ${result.changes.length} 个变更`);
      } else {
        logger.error(`配置迁移失败，错误数: ${result.errors?.length || 0}`);
      }

      return result;

    } catch (error) {
      const errorMsg = `配置迁移过程中发生错误: ${error instanceof Error ? error.message : String(error)}`;
      result.errors?.push(errorMsg);
      result.success = false;
      logger.error(errorMsg);
      return result;
    }
  }

  /**
   * 查找迁移路径
   */
  private findMigrationPath(fromVersion: string, toVersion: string): MigrationRule[] {
    const path: MigrationRule[] = [];
    const visited = new Set<string>();
    
    if (this.findPath(fromVersion, toVersion, path, visited)) {
      return path;
    }
    
    return [];
  }

  /**
   * 递归查找迁移路径
   */
  private findPath(
    currentVersion: string, 
    targetVersion: string, 
    path: MigrationRule[], 
    visited: Set<string>
  ): boolean {
    if (currentVersion === targetVersion) {
      return true;
    }

    if (visited.has(currentVersion)) {
      return false;
    }

    visited.add(currentVersion);

    const rules = this.migrations.get(currentVersion) || [];
    
    // 按版本排序，优先选择更接近目标版本的路径
    const sortedRules = rules.sort((a, b) => {
      const distA = this.calculateVersionDistance(a.to, targetVersion);
      const distB = this.calculateVersionDistance(b.to, targetVersion);
      return distA - distB;
    });

    for (const rule of sortedRules) {
      path.push(rule);
      
      if (this.findPath(rule.to, targetVersion, path, visited)) {
        return true;
      }
      
      path.pop();
    }

    visited.delete(currentVersion);
    return false;
  }

  /**
   * 计算版本距离（简化版本，用于路径选择）
   */
  private calculateVersionDistance(version1: string, version2: string): number {
    try {
      const v1 = SemVerParser.parse(version1);
      const v2 = SemVerParser.parse(version2);
      
      return Math.abs(v1.major - v2.major) * 10000 + 
             Math.abs(v1.minor - v2.minor) * 100 + 
             Math.abs(v1.patch - v2.patch);
    } catch (error) {
      return Infinity;
    }
  }

  /**
   * 检测配置变更
   */
  private detectChanges(oldConfig: any, newConfig: any, rule: MigrationRule): ConfigChange[] {
    const changes: ConfigChange[] = [];
    
    // 这里实现一个简化的变更检测逻辑
    // 实际应用中可能需要更复杂的深度比较
    this.compareObjects('', oldConfig, newConfig, changes, rule.description);
    
    return changes;
  }

  /**
   * 递归比较对象
   */
  private compareObjects(
    basePath: string, 
    oldObj: any, 
    newObj: any, 
    changes: ConfigChange[], 
    description: string
  ): void {
    const oldKeys = Object.keys(oldObj || {});
    const newKeys = Object.keys(newObj || {});
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        // 新增
        changes.push({
          type: 'add',
          path: currentPath,
          newValue,
          description: `添加配置项: ${currentPath}`
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        // 删除
        changes.push({
          type: 'remove',
          path: currentPath,
          oldValue,
          description: `移除配置项: ${currentPath}`
        });
      } else if (oldValue !== newValue) {
        if (typeof oldValue === 'object' && typeof newValue === 'object' && 
            oldValue !== null && newValue !== null && 
            !Array.isArray(oldValue) && !Array.isArray(newValue)) {
          // 递归比较对象
          this.compareObjects(currentPath, oldValue, newValue, changes, description);
        } else {
          // 修改
          changes.push({
            type: 'modify',
            path: currentPath,
            oldValue,
            newValue,
            description: `修改配置项: ${currentPath}`
          });
        }
      }
    }
  }

  /**
   * 获取所有可用的迁移版本
   */
  getAvailableVersions(): string[] {
    const versions = new Set<string>();
    
    for (const [fromVersion, rules] of this.migrations) {
      versions.add(fromVersion);
      rules.forEach(rule => versions.add(rule.to));
    }
    
    return Array.from(versions).sort((a, b) => SemVerParser.compare(a, b));
  }

  /**
   * 检查是否支持从指定版本迁移
   */
  canMigrateFrom(version: string): boolean {
    return this.migrations.has(version);
  }

  /**
   * 获取指定版本的直接迁移目标
   */
  getDirectMigrationTargets(version: string): string[] {
    const rules = this.migrations.get(version) || [];
    return rules.map(rule => rule.to);
  }
}
