/**
 * HMML 便捷开发工具
 * 提供快速的环境切换、版本更新和构建功能
 */

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BuildOptions {
  environment: 'development' | 'production' | 'test';
  version?: string;
  skipTests?: boolean;
  openOutput?: boolean;
}

program
  .name('hmml-dev')
  .description('HMML 便捷开发工具')
  .version('1.0.0');

// 快速环境切换和构建
program
  .command('release [version]')
  .description('🚀 快速切换到生产环境并构建发布版本')
  .option('-s, --skip-tests', '跳过测试')
  .option('-o, --open', '构建完成后打开输出目录')
  .option('--dry-run', '预览模式，不执行实际操作')
  .action(async (version: string | undefined, options: any) => {
    try {
      console.log(chalk.blue.bold('\n🚀 准备构建生产版本...\n'));
      
      await buildRelease({
        environment: 'production',
        version,
        skipTests: options.skipTests,
        openOutput: options.open
      }, options.dryRun);
      
    } catch (error) {
      console.error(chalk.red('构建失败:'), error);
      process.exit(1);
    }
  });

// 快速开发构建
program
  .command('dev [version]')
  .description('🛠️ 切换到开发环境并构建开发版本')
  .option('-s, --skip-tests', '跳过测试')
  .option('-w, --watch', '启用监视模式')
  .option('--dry-run', '预览模式，不执行实际操作')
  .action(async (version: string | undefined, options: any) => {
    try {
      console.log(chalk.blue.bold('\n🛠️ 准备构建开发版本...\n'));
      
      await buildRelease({
        environment: 'development',
        version,
        skipTests: options.skipTests
      }, options.dryRun);
      
      if (options.watch && !options.dryRun) {
        console.log(chalk.yellow('\n👀 启动监视模式...'));
        await execAsync('pnpm run dev');
      }
      
    } catch (error) {
      console.error(chalk.red('构建失败:'), error);
      process.exit(1);
    }
  });

// 快速版本更新
program
  .command('version <new-version>')
  .description('📦 更新版本号到所有相关文件')
  .option('--no-sync', '不同步到 package.json')
  .option('--config-version <version>', '同时更新配置版本')
  .option('--dry-run', '预览模式，显示将要修改的文件')
  .action(async (newVersion: string, options: any) => {
    try {
      console.log(chalk.blue.bold(`\n📦 更新版本号: ${newVersion}\n`));
      
      await updateVersion(newVersion, {
        syncPackageJson: !options.noSync,
        configVersion: options.configVersion,
        dryRun: options.dryRun
      });
      
      if (!options.dryRun) {
        console.log(chalk.green('\n✅ 版本号更新完成！'));
        console.log(chalk.yellow('💡 提示：运行 "hmml-dev release" 构建新版本'));
      }
      
    } catch (error) {
      console.error(chalk.red('版本更新失败:'), error);
      process.exit(1);
    }
  });

// 版本号增量更新
program
  .command('bump <type>')
  .description('⬆️ 增量更新版本号 (major|minor|patch)')
  .option('--config-version <version>', '同时更新配置版本')
  .option('--dry-run', '预览模式')
  .action(async (type: string, options: any) => {
    try {
      if (!['major', 'minor', 'patch'].includes(type)) {
        throw new Error('版本类型必须是 major, minor 或 patch');
      }

      console.log(chalk.blue.bold(`\n⬆️ 增量更新版本号 (${type})\n`));
      
      const newVersion = await bumpVersion(type as 'major' | 'minor' | 'patch', {
        configVersion: options.configVersion,
        dryRun: options.dryRun
      });
      
      if (!options.dryRun) {
        console.log(chalk.green(`\n✅ 版本已更新为: ${newVersion}`));
        console.log(chalk.yellow('💡 提示：运行 "hmml-dev release" 构建新版本'));
      }
      
    } catch (error) {
      console.error(chalk.red('版本更新失败:'), error);
      process.exit(1);
    }
  });

// 状态检查
program
  .command('status')
  .description('📊 显示当前项目状态')
  .action(async () => {
    try {
      await showProjectStatus();
    } catch (error) {
      console.error(chalk.red('获取状态失败:'), error);
      process.exit(1);
    }
  });

// 清理构建产物
program
  .command('clean')
  .description('🧹 清理构建产物和临时文件')
  .option('-a, --all', '清理所有文件（包括 node_modules）')
  .action(async (options: any) => {
    try {
      console.log(chalk.blue.bold('\n🧹 清理构建产物...\n'));
      await cleanProject(options.all);
      console.log(chalk.green('✅ 清理完成！'));
    } catch (error) {
      console.error(chalk.red('清理失败:'), error);
      process.exit(1);
    }
  });

/**
 * 构建发布版本
 */
async function buildRelease(options: BuildOptions, dryRun: boolean = false) {
  const steps = [
    '1️⃣ 检查项目状态',
    '2️⃣ 更新环境配置',
    '3️⃣ 同步版本信息',
    '4️⃣ 运行测试 (如果启用)',
    '5️⃣ 清理构建目录',
    '6️⃣ Webpack构建项目',
    '7️⃣ 验证构建结果'
  ];

  console.log(chalk.cyan('构建步骤:'));
  steps.forEach(step => console.log(`  ${step}`));
  console.log('');

  if (dryRun) {
    console.log(chalk.yellow('⚠️  预览模式：以下是将要执行的操作\n'));
  }

  // 步骤 1: 检查项目状态
  console.log(chalk.blue('1️⃣ 检查项目状态...'));
  const packageJson = await fs.readJSON('./package.json');
  const currentVersion = packageJson.version;
  const targetVersion = options.version || currentVersion;
  
  console.log(`  当前版本: ${currentVersion}`);
  console.log(`  目标版本: ${targetVersion}`);
  console.log(`  构建环境: ${options.environment}`);
  console.log('');

  // 步骤 2: 更新环境配置
  console.log(chalk.blue('2️⃣ 更新环境配置...'));
  if (!dryRun) {
    process.env.NODE_ENV = options.environment;
    await updateVersionFile(targetVersion, options.environment);
  }
  console.log(`  ✓ 环境设置为: ${options.environment}`);
  console.log('');

  // 步骤 3: 同步版本信息
  if (options.version && options.version !== currentVersion) {
    console.log(chalk.blue('3️⃣ 同步版本信息...'));
    if (!dryRun) {
      await updateVersion(targetVersion, { syncPackageJson: true });
    }
    console.log(`  ✓ 版本已同步: ${targetVersion}`);
    console.log('');
  }

  // 步骤 4: 运行测试
  if (!options.skipTests) {
    console.log(chalk.blue('4️⃣ 运行测试...'));
    if (!dryRun) {
      try {
        await execAsync('pnpm run test', { timeout: 30000 });
        console.log('  ✓ 测试通过');
      } catch (error) {
        console.log('  ⚠️ 测试失败或未配置测试脚本，继续构建...');
      }
    } else {
      console.log('  → 将运行: pnpm run test');
    }
    console.log('');
  }

  // 步骤 5: 清理构建目录
  console.log(chalk.blue('5️⃣ 清理构建目录...'));
  if (!dryRun) {
    await execAsync('pnpm run clean');
  } else {
    console.log('  → 将运行: pnpm run clean');
  }
  console.log('  ✓ 构建目录已清理');
  console.log('');

  // 步骤 6: 构建项目
  console.log(chalk.blue('6️⃣ 构建项目...'));
  if (!dryRun) {
    if (options.environment === 'production') {
      await execAsync('pnpm run build');
    } else {
      await execAsync('pnpm run build:dev');
    }
  } else {
    console.log('  → 将运行: pnpm run build' + (options.environment === 'production' ? '' : ':dev'));
  }
  console.log('  ✓ Webpack 编译完成');
  console.log('');

  // 步骤 7: 验证构建结果
  console.log(chalk.blue('7️⃣ 验证构建结果...'));
  if (!dryRun) {
    const distExists = await fs.pathExists('./dist/app.js');
    
    console.log(`  Webpack 输出: ${distExists ? '✓' : '❌'}`);
  }
  console.log('');

  if (dryRun) {
    console.log(chalk.yellow('⚠️  这是预览模式，未执行实际操作'));
    console.log(chalk.cyan('💡 移除 --dry-run 参数以执行实际构建'));
  } else {
    console.log(chalk.green.bold('🎉 构建完成！'));
    
    // 显示下一步提示
    console.log(chalk.yellow('\n💡 下一步操作:'));
    console.log('  • 启动应用: node dist/app.js');
    console.log('  • 生产环境启动: NODE_ENV=production node dist/app.js');
    if (options.environment === 'development') {
      console.log('  • 开发模式: pnpm run dev');
    }
  }
}

/**
 * 更新版本号
 */
async function updateVersion(newVersion: string, options: {
  syncPackageJson?: boolean;
  configVersion?: string;
  dryRun?: boolean;
} = {}) {
  const files = [];
  
  // 更新主版本文件
  const versionFilePath = './src/version.ts';
  if (await fs.pathExists(versionFilePath)) {
    const content = await fs.readFile(versionFilePath, 'utf-8');
    const updatedContent = content.replace(
      /export const HMML_VERSION = '[^']+';/,
      `export const HMML_VERSION = '${newVersion}';`
    );
    
    if (!options.dryRun) {
      await fs.writeFile(versionFilePath, updatedContent);
    }
    files.push(versionFilePath);
  }
  
  // 更新 package.json
  if (options.syncPackageJson !== false) {
    const packageJsonPath = './package.json';
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      packageJson.version = newVersion;
      
      if (!options.dryRun) {
        await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
      }
      files.push(packageJsonPath);
    }
  }
  
  // 更新配置版本（如果指定）
  if (options.configVersion) {
    const versionFilePath = './src/version.ts';
    if (await fs.pathExists(versionFilePath)) {
      const content = await fs.readFile(versionFilePath, 'utf-8');
      const updatedContent = content.replace(
        /CONFIG_VERSION: '[^']+'/,
        `CONFIG_VERSION: '${options.configVersion}'`
      );
      
      if (!options.dryRun) {
        await fs.writeFile(versionFilePath, updatedContent);
      }
    }
  }
  
  if (options.dryRun) {
    console.log(chalk.yellow('将要更新的文件:'));
    files.forEach(file => {
      console.log(`  • ${file}`);
    });
    console.log(`\n新版本号: ${newVersion}`);
    if (options.configVersion) {
      console.log(`新配置版本: ${options.configVersion}`);
    }
  } else {
    console.log(chalk.green('已更新的文件:'));
    files.forEach(file => {
      console.log(`  ✓ ${file}`);
    });
  }
}

/**
 * 增量更新版本
 */
async function bumpVersion(type: 'major' | 'minor' | 'patch', options: {
  configVersion?: string;
  dryRun?: boolean;
} = {}): Promise<string> {
  const packageJson = await fs.readJSON('./package.json');
  const currentVersion = packageJson.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  let newVersion: string;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }
  
  console.log(chalk.cyan(`${currentVersion} → ${newVersion} (${type})`));
  
  await updateVersion(newVersion, {
    syncPackageJson: true,
    configVersion: options.configVersion,
    dryRun: options.dryRun
  });
  
  return newVersion;
}

/**
 * 更新版本文件
 */
async function updateVersionFile(version: string, environment: string) {
  const versionInfo = {
    version,
    buildTime: new Date().toISOString(),
    environment,
    gitHash: await getGitHash()
  };
  
  await fs.writeJSON('./version.json', versionInfo, { spaces: 2 });
}

/**
 * 获取 Git 哈希
 */
async function getGitHash(): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('git rev-parse --short HEAD');
    return stdout.trim();
  } catch (error) {
    return undefined;
  }
}

/**
 * 显示项目状态
 */
async function showProjectStatus() {
  console.log(chalk.blue.bold('\n📊 HMML 项目状态\n'));
  
  // 版本信息
  const packageJson = await fs.readJSON('./package.json');
  console.log(chalk.cyan('🏷️ 版本信息:'));
  console.log(`  当前版本: ${packageJson.version}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
  
  // Git 信息
  try {
    const { stdout: branch } = await execAsync('git branch --show-current');
    const { stdout: hash } = await execAsync('git rev-parse --short HEAD');
    console.log(`  Git 分支: ${branch.trim()}`);
    console.log(`  Git 提交: ${hash.trim()}`);
  } catch (error) {
    console.log('  Git: 未初始化或不是 Git 仓库');
  }
  
  // 文件状态
  console.log(chalk.cyan('\n📁 文件状态:'));
  const files = [
    { path: './dist', name: 'TypeScript 输出' },
    { path: './build', name: '可执行文件' },
    { path: './node_modules', name: '依赖包' },
    { path: './version.json', name: '版本文件' }
  ];
  
  for (const file of files) {
    const exists = await fs.pathExists(file.path);
    console.log(`  ${file.name}: ${exists ? '✓' : '❌'}`);
  }
  
  // 依赖状态
  console.log(chalk.cyan('\n📦 依赖状态:'));
  const lockExists = await fs.pathExists('./pnpm-lock.yaml');
  console.log(`  pnpm-lock.yaml: ${lockExists ? '✓' : '❌'}`);
  
  try {
    const { stdout } = await execAsync('pnpm outdated --format=json');
    const outdated = JSON.parse(stdout || '{}');
    const outdatedCount = Object.keys(outdated).length;
    console.log(`  过期依赖: ${outdatedCount} 个`);
  } catch (error) {
    console.log('  过期依赖: 无法检查');
  }
  
  console.log('');
}

/**
 * 清理项目
 */
async function cleanProject(all: boolean = false) {
  const targets = [
    './dist',
    './version.json'
  ];
  
  if (all) {
    targets.push('./node_modules', './pnpm-lock.yaml');
  }
  
  for (const target of targets) {
    if (await fs.pathExists(target)) {
      await fs.remove(target);
      console.log(`  ✓ 已删除: ${target}`);
    }
  }
  
  if (all) {
    console.log(chalk.yellow('\n💡 提示：运行 "pnpm install" 重新安装依赖'));
  }
}

// 解析命令行参数
program.parse();
