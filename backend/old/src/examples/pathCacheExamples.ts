/**
 * 路径缓存功能使用示例
 * 演示如何在麦麦启动器中使用路径缓存API
 */

import { pathCacheManager } from '../core/pathCacheManager';
import { logger } from '../core/logger';

/**
 * 路径缓存使用示例类
 */
export class PathCacheExamples {
  /**
   * 示例1: 启动器初始化时检查和设置路径
   */
  static async initializePaths() {
    try {
      console.log('=== 启动器初始化路径示例 ===');

      // 检查是否已有缓存的主程序路径
      const mainRoot = pathCacheManager.getMainRoot();
      if (!mainRoot) {
        console.log('未找到缓存的主程序路径，需要用户设置');
        // 用户通过界面选择路径后，调用设置API
        await pathCacheManager.setMainRoot('C:\\Games\\Maimai\\Main');
        console.log('主程序路径已设置');
      } else {
        console.log('找到缓存的主程序路径:', mainRoot);
      }

      // 获取所有适配器
      const adapters = pathCacheManager.getAllAdapters();
      console.log('当前已缓存的适配器数量:', adapters.length);
      
      if (adapters.length === 0) {
        console.log('未找到适配器，添加默认适配器...');
        await pathCacheManager.addAdapterRoot('默认适配器', 'C:\\Games\\Maimai\\Adapters\\Default');
      }

    } catch (error) {
      logger.error('路径初始化失败:', error);
    }
  }

  /**
   * 示例2: 动态管理适配器路径
   */
  static async manageAdapters() {
    try {
      console.log('=== 适配器管理示例 ===');

      // 添加多个适配器
      const adaptersToAdd = [
        { name: '音乐适配器', path: 'C:\\Games\\Maimai\\Adapters\\Music' },
        { name: '皮肤适配器', path: 'C:\\Games\\Maimai\\Adapters\\Skin' },
        { name: '特效适配器', path: 'C:\\Games\\Maimai\\Adapters\\Effects' }
      ];

      for (const adapter of adaptersToAdd) {
        try {
          await pathCacheManager.addAdapterRoot(adapter.name, adapter.path);
          console.log(`✓ 添加适配器: ${adapter.name}`);
        } catch (error) {
          if (error instanceof Error && error.message.includes('已存在')) {
            console.log(`⚠ 适配器已存在: ${adapter.name}`);
          } else {
            console.log(`✗ 添加适配器失败: ${adapter.name}`, error);
          }
        }
      }

      // 获取并显示所有适配器
      const allAdapters = pathCacheManager.getAllAdapters();
      console.log('当前所有适配器:');
      allAdapters.forEach(adapter => {
        console.log(`  - ${adapter.adapterName}: ${adapter.rootPath}`);
      });

    } catch (error) {
      logger.error('适配器管理失败:', error);
    }
  }

  /**
   * 示例3: 使用HTTP API客户端
   */
  static async httpApiExamples() {
    console.log('=== HTTP API 使用示例 ===');

    // 注意: 这些示例假设服务器正在运行在 localhost:7999

    const baseUrl = 'http://localhost:7999/api/pathCache';

    try {
      // 获取所有路径
      console.log('1. 获取所有路径');
      const response1 = await fetch(`${baseUrl}/getAllPaths`);
      const data1 = await response1.json();
      console.log('响应:', JSON.stringify(data1, null, 2));

      // 设置主程序根目录
      console.log('2. 设置主程序根目录');
      const response2 = await fetch(`${baseUrl}/setRootPath`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainRoot: 'C:\\Games\\Maimai\\Main'
        })
      });
      const data2 = await response2.json();
      console.log('响应:', JSON.stringify(data2, null, 2));

      // 添加适配器
      console.log('3. 添加适配器');
      const response3 = await fetch(`${baseUrl}/addAdapterRoot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adapterName: 'API测试适配器',
          rootPath: 'C:\\Games\\Maimai\\Adapters\\APITest'
        })
      });
      const data3 = await response3.json();
      console.log('响应:', JSON.stringify(data3, null, 2));

      // 获取缓存统计
      console.log('4. 获取缓存统计');
      const response4 = await fetch(`${baseUrl}/getStats`);
      const data4 = await response4.json();
      console.log('响应:', JSON.stringify(data4, null, 2));

    } catch (error) {
      console.error('HTTP API调用失败:', error);
    }
  }

  /**
   * 示例4: 错误处理
   */
  static async errorHandlingExamples() {
    try {
      console.log('=== 错误处理示例 ===');

      // 尝试添加无效路径的适配器
      try {
        await pathCacheManager.addAdapterRoot('无效适配器', '');
      } catch (error) {
        console.log('✓ 正确捕获空路径错误:', error instanceof Error ? error.message : error);
      }

      // 尝试添加重复的适配器
      try {
        await pathCacheManager.addAdapterRoot('测试适配器', 'C:\\Test');
        await pathCacheManager.addAdapterRoot('测试适配器', 'C:\\Test2'); // 重复名称
      } catch (error) {
        console.log('✓ 正确捕获重复适配器错误:', error instanceof Error ? error.message : error);
      }

      // 尝试移除不存在的适配器
      const removed = await pathCacheManager.removeAdapterRoot('不存在的适配器');
      console.log('移除不存在的适配器结果:', removed); // 应该返回 false

      // 尝试获取不存在的适配器
      const adapter = pathCacheManager.getAdapterRoot('不存在的适配器');
      console.log('获取不存在的适配器结果:', adapter); // 应该返回 undefined

    } catch (error) {
      logger.error('错误处理示例失败:', error);
    }
  }

  /**
   * 示例5: 完整的启动器集成流程
   */
  static async fullIntegrationExample() {
    try {
      console.log('=== 完整集成示例 ===');

      // 1. 初始化路径缓存管理器
      await pathCacheManager.initialize();
      console.log('✓ 路径缓存管理器初始化完成');

      // 2. 检查现有配置
      const stats = pathCacheManager.getCacheStats();
      console.log('当前缓存状态:', stats);

      // 3. 如果没有主程序路径，提示用户设置
      if (!stats.hasMainRoot) {
        console.log('需要设置主程序路径...');
        // 这里通常会显示文件选择对话框
        await pathCacheManager.setMainRoot('C:\\Games\\Maimai\\Main');
        console.log('✓ 主程序路径已设置');
      }

      // 4. 自动扫描适配器目录（示例）
      const possibleAdapters = [
        { name: '音乐包', path: 'C:\\Games\\Maimai\\Adapters\\Music' },
        { name: '皮肤包', path: 'C:\\Games\\Maimai\\Adapters\\Skins' },
        { name: '模组包', path: 'C:\\Games\\Maimai\\Adapters\\Mods' }
      ];

      console.log('扫描可能的适配器...');
      for (const adapter of possibleAdapters) {
        if (!pathCacheManager.isAdapterExists(adapter.name)) {
          try {
            await pathCacheManager.addAdapterRoot(adapter.name, adapter.path);
            console.log(`✓ 自动添加适配器: ${adapter.name}`);
          } catch (error) {
            console.log(`⚠ 跳过无效适配器: ${adapter.name}`);
          }
        }
      }

      // 5. 获取最终配置用于启动游戏
      const finalPaths = await pathCacheManager.getAllPaths();
      console.log('最终路径配置:');
      console.log('主程序:', finalPaths.mainRoot);
      console.log('适配器:');
      finalPaths.adapterRoots.forEach(adapter => {
        console.log(`  - ${adapter.adapterName}: ${adapter.rootPath}`);
      });

      console.log('✅ 启动器集成完成，可以启动游戏了！');

    } catch (error) {
      logger.error('完整集成示例失败:', error);
    }
  }

  /**
   * 运行所有示例
   */
  static async runAllExamples() {
    console.log('🚀 开始运行路径缓存功能示例\n');

    await this.initializePaths();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.manageAdapters();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.errorHandlingExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.fullIntegrationExample();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ 所有示例运行完成！');
    console.log('\n💡 提示: 要运行HTTP API示例，请确保服务器正在运行，然后调用 PathCacheExamples.httpApiExamples()');
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  PathCacheExamples.runAllExamples().catch(console.error);
}
