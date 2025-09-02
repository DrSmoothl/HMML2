/**
 * PersonInfo表操作示例
 * 展示如何使用PersonInfo相关的API和服务
 */

import { PersonInfoService } from '../services/personInfoService';
import { 
  PersonInfoInsertData, 
  PersonInfoUpdateData, 
  PersonInfoPaginationParams,
  PersonInfoFilterOptions,
  Platform 
} from '../types/personInfo';
import { logger } from '../core/logger';

export class PersonInfoExamples {
  
  /**
   * 示例1：创建PersonInfo记录
   */
  static async createPersonInfoExample() {
    console.log('\n=== 创建PersonInfo记录示例 ===');
    
    try {
      const personData: PersonInfoInsertData = {
        person_id: 'example_person_001',
        person_name: '示例用户',
        platform: Platform.QQ,
        user_id: 'qq_123456789',
        nickname: '小示例',
        name_reason: '这是一个API使用示例',
        points: JSON.stringify([
          '积极配合测试',
          '反馈及时',
          '问题描述清晰'
        ]),
        is_known: 1,
        attitude_to_me: 'positive',
        attitude_to_me_confidence: 0.8,
        friendly_value: 0.75,
        friendly_value_confidence: 0.9,
        rudeness: 'low',
        rudeness_confidence: 0.6,
        neuroticism: 'moderate',
        neuroticism_confidence: 0.5,
        conscientiousness: 'high',
        conscientiousness_confidence: 0.8,
        likeness: 'high',
        likeness_confidence: 0.7
      };
      
      const insertId = await PersonInfoService.insertPersonInfo(personData);
      console.log(`✅ 成功创建PersonInfo记录，ID: ${insertId}`);
      
      return insertId;
    } catch (error) {
      console.error('❌ 创建PersonInfo记录失败:', error);
      throw error;
    }
  }

  /**
   * 示例2：分页查询PersonInfo
   */
  static async queryPersonInfoExample() {
    console.log('\n=== 分页查询PersonInfo示例 ===');
    
    try {
      const params: PersonInfoPaginationParams = {
        page: 1,
        pageSize: 10,
        orderBy: 'last_know',
        orderDir: 'DESC',
        filter: {
          platform: Platform.QQ,
          minFriendlyValue: 0.6
        }
      };
      
      const result = await PersonInfoService.getPersonInfos(params);
      console.log(`✅ 查询成功，共找到 ${result.total} 条记录`);
      console.log(`📄 当前页: ${result.currentPage}/${result.totalPages}`);
      console.log(`📝 记录数量: ${result.items.length}`);
      
      // 显示前3条记录的基本信息
      result.items.slice(0, 3).forEach((item, index) => {
        console.log(`📋 记录${index + 1}: ${item.person_name} (${item.nickname}) - 友好度: ${item.friendly_value}`);
      });
      
      return result;
    } catch (error) {
      console.error('❌ 查询PersonInfo失败:', error);
      throw error;
    }
  }

  /**
   * 示例3：根据ID查询单个PersonInfo
   */
  static async getPersonInfoByIdExample(id: number) {
    console.log(`\n=== 根据ID查询PersonInfo示例 (ID: ${id}) ===`);
    
    try {
      const result = await PersonInfoService.getPersonInfoById(id);
      
      if (result) {
        console.log('✅ 查询成功:');
        console.log(`👤 人物: ${result.person_name} (${result.person_id})`);
        console.log(`🏷️  昵称: ${result.nickname}`);
        console.log(`📱 平台: ${result.platform} - 用户: ${result.user_id}`);
        console.log(`🤝 是否认识: ${result.is_known ? '是' : '否'}`);
        console.log(`💭 认知点: ${result.points}`);
        console.log(`😊 对我态度: ${result.attitude_to_me} (置信度: ${result.attitude_to_me_confidence})`);
        console.log(`� 友好度: ${result.friendly_value} (置信度: ${result.friendly_value_confidence})`);
        console.log(`📊 认知次数: ${result.know_times}`);
        console.log(`📅 认识时间: ${new Date(result.know_since * 1000).toLocaleString()}`);
        console.log(`🕒 最后认知: ${new Date(result.last_know * 1000).toLocaleString()}`);
      } else {
        console.log(`❌ 未找到ID为${id}的PersonInfo记录`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 查询PersonInfo失败:', error);
      throw error;
    }
  }

  /**
   * 示例4：更新PersonInfo
   */
  static async updatePersonInfoExample(id: number) {
    console.log(`\n=== 更新PersonInfo示例 (ID: ${id}) ===`);
    
    try {
      // 先查询当前记录
      const current = await PersonInfoService.getPersonInfoById(id);
      if (!current) {
        throw new Error(`未找到ID为${id}的记录`);
      }
      
      console.log(`📋 更新前: ${current.person_name} - 友好度: ${current.friendly_value}`);
      
      const updateData: PersonInfoUpdateData = {
        id,
        points: `${current.points}\n\n[更新] ${new Date().toLocaleString()}: 通过API示例更新`,
        friendly_value: Math.min(1, current.friendly_value + 0.05), // 提升0.05友好度
        know_times: current.know_times + 1
      };
      
      await PersonInfoService.updatePersonInfo(updateData);
      console.log('✅ 更新成功');
      
      // 查询更新后的记录
      const updated = await PersonInfoService.getPersonInfoById(id);
      if (updated) {
        console.log(`📋 更新后: ${updated.person_name} - 友好度: ${updated.friendly_value}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ 更新PersonInfo失败:', error);
      throw error;
    }
  }

  /**
   * 示例5：根据person_id查询
   */
  static async getByPersonIdExample(personId: string) {
    console.log(`\n=== 根据person_id查询示例 (${personId}) ===`);
    
    try {
      const results = await PersonInfoService.getPersonInfoByPersonId(personId);
      console.log(`✅ 查询成功，找到 ${results.length} 条记录`);
      
      results.forEach((record, index) => {
        console.log(`📋 记录${index + 1}: ${record.platform} - ${record.user_id} (友好度: ${record.friendly_value})`);
      });
      
      return results;
    } catch (error) {
      console.error('❌ 根据person_id查询失败:', error);
      throw error;
    }
  }

  /**
   * 示例6：根据平台和用户ID查询
   */
  static async getByPlatformUserExample(platform: string, userId: string) {
    console.log(`\n=== 根据平台和用户ID查询示例 (${platform} - ${userId}) ===`);
    
    try {
      const results = await PersonInfoService.getPersonInfoByPlatformUser(platform, userId);
      console.log(`✅ 查询成功，找到 ${results.length} 条记录`);
      
      results.forEach((record, index) => {
        console.log(`📋 记录${index + 1}: ${record.person_name} (${record.person_id}) - 友好度: ${record.friendly_value}`);
      });
      
      return results;
    } catch (error) {
      console.error('❌ 根据平台和用户ID查询失败:', error);
      throw error;
    }
  }

  /**
   * 示例7：搜索PersonInfo
   */
  static async searchPersonInfoExample(keyword: string) {
    console.log(`\n=== 搜索PersonInfo示例 (关键字: "${keyword}") ===`);
    
    try {
      const results = await PersonInfoService.searchPersonInfos(keyword, 10);
      console.log(`✅ 搜索成功，找到 ${results.length} 条匹配记录`);
      
      results.forEach((record, index) => {
        console.log(`🔍 匹配${index + 1}: ${record.person_name} (${record.nickname}) - 对我态度: ${record.attitude_to_me}`);
      });
      
      return results;
    } catch (error) {
      console.error('❌ 搜索PersonInfo失败:', error);
      throw error;
    }
  }

  /**
   * 示例8：获取统计信息
   */
  static async getStatsExample() {
    console.log('\n=== 获取PersonInfo统计信息示例 ===');
    
    try {
      const stats = await PersonInfoService.getPersonInfoStats();
      console.log('✅ 统计信息获取成功:');
      console.log(`📊 总记录数: ${stats.total}`);
      console.log(`🤝 已认识: ${stats.totalKnown}`);
      console.log(`❓ 未认识: ${stats.totalUnknown}`);
      console.log(`📱 平台分布:`);
      Object.entries(stats.byPlatform).forEach(([platform, count]) => {
        console.log(`   ${platform}: ${count}条`);
      });
      console.log(`� 友好度分布:`);
      Object.entries(stats.byFriendlyValue).forEach(([range, count]) => {
        console.log(`   ${range}: ${count}条`);
      });
      console.log(`📈 平均认知次数: ${stats.avgKnowTimes}`);
      console.log(`💯 平均友好度: ${stats.avgFriendlyValue}`);
      console.log(`🔥 总认知次数: ${stats.totalKnowTimes}`);
      console.log(`⚡ 近期活跃: ${stats.recentActive}条`);
      console.log(`🏆 认知次数最高:`);
      stats.topPersons.slice(0, 3).forEach((person, index) => {
        console.log(`   TOP${index + 1}: ${person.person_name} (${person.know_times}次)`);
      });
      
      return stats;
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 示例9：复杂过滤查询
   */
  static async complexFilterExample() {
    console.log('\n=== 复杂过滤查询示例 ===');
    
    try {
      const filter: PersonInfoFilterOptions = {
        platform: Platform.QQ,
        minFriendlyValue: 0.7,
        maxFriendlyValue: 0.95,
        minKnowTimes: 5
      };
      
      const params: PersonInfoPaginationParams = {
        page: 1,
        pageSize: 5,
        orderBy: 'friendly_value',
        orderDir: 'DESC',
        filter
      };
      
      const result = await PersonInfoService.getPersonInfos(params);
      console.log(`✅ 复杂查询成功:`);
      console.log(`🔍 查询条件: QQ平台, 友好度0.7-0.95, 认知次数≥5`);
      console.log(`📊 找到 ${result.total} 条符合条件的记录`);
      
      result.items.forEach((item, index) => {
        console.log(`📋 ${index + 1}. ${item.person_name} - 友好度:${item.friendly_value} 认知:${item.know_times}次`);
      });
      
      return result;
    } catch (error) {
      console.error('❌ 复杂过滤查询失败:', error);
      throw error;
    }
  }

  /**
   * 运行所有示例
   */
  static async runAllExamples() {
    console.log('🚀 开始运行PersonInfo API示例...\n');
    
    try {
      // 1. 创建测试记录
      const newId = await this.createPersonInfoExample();
      
      // 2. 分页查询
      await this.queryPersonInfoExample();
      
      // 3. 根据ID查询
      await this.getPersonInfoByIdExample(newId);
      
      // 4. 更新记录
      await this.updatePersonInfoExample(newId);
      
      // 5. 根据person_id查询
      await this.getByPersonIdExample('example_person_001');
      
      // 6. 根据平台和用户查询
      await this.getByPlatformUserExample(Platform.QQ, 'qq_123456789');
      
      // 7. 搜索功能
      await this.searchPersonInfoExample('示例');
      
      // 8. 获取统计信息
      await this.getStatsExample();
      
      // 9. 复杂过滤查询
      await this.complexFilterExample();
      
      console.log('\n🎉 所有PersonInfo API示例运行完成！');
      
    } catch (error) {
      console.error('\n💥 示例运行过程中出错:', error);
      logger.error('PersonInfo示例运行失败:', error);
    }
  }
}

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
  PersonInfoExamples.runAllExamples()
    .then(() => {
      console.log('示例程序正常结束');
      process.exit(0);
    })
    .catch((error) => {
      console.error('示例程序异常结束:', error);
      process.exit(1);
    });
}
