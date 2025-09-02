/**
 * HMML 版本管理 CLI 工具
 */

import { program } from 'commander';
import chalk from 'chalk';
import { appVersionManager, configVersionManager, generateVersionBanner, getSystemVersionInfo } from '../core/version';

program
  .name('hmml-version')
  .description('HMML 版本管理工具')
  .version('1.0.0');

// 显示版本信息
program
  .command('info')
  .description('显示系统版本信息')
  .action(async () => {
    try {
      await appVersionManager.initialize();
      const banner = generateVersionBanner();
      const systemInfo = getSystemVersionInfo();

      console.log(chalk.blue.bold('\n📦 HMML 版本信息\n'));
      banner.forEach((line: string) => console.log(`  ${line}`));
      
      console.log(chalk.blue('\n🔧 系统详情:'));
      console.log(`  兼容性: ${systemInfo.compatibility.isSupported ? chalk.green('✓') : chalk.red('✗')} ${systemInfo.compatibility.message || ''}`);
      
      if (systemInfo.application) {
        console.log(`  运行环境: ${systemInfo.application.environment}`);
        if (systemInfo.application.gitHash) {
          console.log(`  Git 提交: ${systemInfo.application.gitHash}`);
        }
      }
      console.log('');
    } catch (error) {
      console.error(chalk.red('获取版本信息失败:'), error);
      process.exit(1);
    }
  });

// 更新应用版本
program
  .command('update-app')
  .description('更新应用版本')
  .argument('<version>', '新版本号 (语义化版本格式)')
  .option('-b, --build-time <time>', '构建时间 (ISO 8601 格式)')
  .option('-g, --git-hash <hash>', 'Git 提交哈希')
  .option('-e, --environment <env>', '运行环境 (development|production|test)', 'development')
  .action(async (version: string, options: any) => {
    try {
      await appVersionManager.initialize();
      
      await appVersionManager.updateVersion(version, {
        buildTime: options.buildTime,
        gitHash: options.gitHash,
        environment: options.environment
      });
      
      console.log(chalk.green(`✅ 应用版本已更新为: ${version}`));
    } catch (error) {
      console.error(chalk.red('更新应用版本失败:'), error);
      process.exit(1);
    }
  });

// 增量更新版本
program
  .command('bump')
  .description('增量更新应用版本')
  .argument('<type>', '版本类型 (major|minor|patch)')
  .action(async (type: string) => {
    try {
      if (!['major', 'minor', 'patch'].includes(type)) {
        throw new Error('版本类型必须是 major, minor 或 patch');
      }

      await appVersionManager.initialize();
      const newVersion = await appVersionManager.incrementVersion(type as 'major' | 'minor' | 'patch');
      
      console.log(chalk.green(`✅ 版本已增量更新为: ${newVersion}`));
    } catch (error) {
      console.error(chalk.red('增量更新版本失败:'), error);
      process.exit(1);
    }
  });

// 检查配置迁移
program
  .command('check-config')
  .description('检查配置文件版本和迁移需求')
  .option('-p, --path <path>', '配置文件路径', './config/server.json')
  .action(async (options: any) => {
    try {
      const supportedVersions = configVersionManager.getSupportedVersions();
      const currentVersion = configVersionManager.getCurrentConfigVersion();
      
      console.log(chalk.blue('\n🔧 配置版本信息:\n'));
      console.log(`  当前支持的配置版本: ${currentVersion}`);
      console.log(`  支持的迁移版本: ${supportedVersions.join(', ')}`);
      
      // 这里可以添加更多配置检查逻辑
      console.log('');
    } catch (error) {
      console.error(chalk.red('检查配置失败:'), error);
      process.exit(1);
    }
  });

// 强制迁移配置
program
  .command('migrate-config')
  .description('强制迁移配置文件')
  .argument('<from-version>', '源版本号')
  .argument('[to-version]', '目标版本号（默认为当前版本）')
  .option('-p, --path <path>', '配置文件路径', './config/server.json')
  .option('--dry-run', '只显示迁移计划，不执行实际迁移')
  .action(async (fromVersion: string, toVersion: string, options: any) => {
    try {
      const fs = await import('fs-extra');
      
      if (!await fs.pathExists(options.path)) {
        throw new Error(`配置文件不存在: ${options.path}`);
      }
      
      const config = await fs.readJSON(options.path);
      const targetVersion = toVersion || configVersionManager.getCurrentConfigVersion();
      
      console.log(chalk.blue(`\n🔄 配置迁移: ${fromVersion} -> ${targetVersion}\n`));
      
      if (options.dryRun) {
        console.log(chalk.yellow('⚠️  这是预演模式，不会实际修改配置文件'));
      }
      
      const result = await configVersionManager.forceMigrateConfig(config, fromVersion, targetVersion);
      
      if (result.success) {
        console.log(chalk.green(`✅ 迁移成功！共 ${result.changes.length} 个变更：\n`));
        
        result.changes.forEach(change => {
          const icon = change.type === 'add' ? '➕' : change.type === 'remove' ? '➖' : '🔄';
          console.log(`  ${icon} ${change.description}`);
          if (change.oldValue !== undefined) {
            console.log(chalk.gray(`    旧值: ${JSON.stringify(change.oldValue)}`));
          }
          if (change.newValue !== undefined) {
            console.log(chalk.gray(`    新值: ${JSON.stringify(change.newValue)}`));
          }
        });
        
        if (!options.dryRun) {
          // 这里可以选择保存迁移后的配置
          console.log(chalk.yellow('\n⚠️  请注意：实际迁移功能需要在应用运行时进行'));
        }
      } else {
        console.log(chalk.red('❌ 迁移失败：'));
        result.errors?.forEach(error => console.log(`  ${error}`));
        process.exit(1);
      }
      
      console.log('');
    } catch (error) {
      console.error(chalk.red('配置迁移失败:'), error);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse();
