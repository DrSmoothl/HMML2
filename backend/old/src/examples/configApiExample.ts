/**
 * 麦麦配置API使用示例
 * 演示如何使用主程序配置和模型配置API
 */

/**
 * API响应类型定义
 */
export interface ConfigApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  time: number;
}

/**
 * 主程序配置API使用示例
 */
export class MainConfigExample {
  
  /**
   * 示例1：获取主程序配置
   */
  static async getMainConfig(): Promise<any | null> {
    try {
      const response = await fetch('http://localhost:7999/api/config/main/get');
      const result = await response.json() as ConfigApiResponse;
      
      if (result.status === 200) {
        console.log('获取主程序配置成功:');
        console.log(JSON.stringify(result.data, null, 2));
        return result.data;
      } else {
        console.error('获取主程序配置失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return null;
    }
  }

  /**
   * 示例2：更新主程序配置
   */
  static async updateMainConfig(configData: any): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:7999/api/config/main/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
      });
      
      const result = await response.json() as ConfigApiResponse;
      
      if (result.status === 200) {
        console.log('更新主程序配置成功');
        return true;
      } else {
        console.error('更新主程序配置失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return false;
    }
  }

  /**
   * 示例3：获取配置文件信息
   */
  static async getMainConfigInfo(): Promise<any | null> {
    try {
      const response = await fetch('http://localhost:7999/api/config/main/info');
      const result = await response.json() as ConfigApiResponse;
      
      if (result.status === 200) {
        console.log('主程序配置文件信息:');
        console.log(`路径: ${result.data.path}`);
        console.log(`存在: ${result.data.exists}`);
        console.log(`可读: ${result.data.readable}`);
        console.log(`可写: ${result.data.writable}`);
        console.log(`大小: ${result.data.size} 字节`);
        console.log(`最后修改: ${result.data.lastModified}`);
        return result.data;
      } else {
        console.error('获取配置文件信息失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return null;
    }
  }

  /**
   * 示例4：验证配置数据
   */
  static async validateMainConfig(configData: any): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:7999/api/config/main/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
      });
      
      const result = await response.json() as ConfigApiResponse;
      
      console.log(`验证结果: ${result.data.valid ? '通过' : '失败'}`);
      if (result.data.errors && result.data.errors.length > 0) {
        console.log('错误:', result.data.errors);
      }
      if (result.data.warnings && result.data.warnings.length > 0) {
        console.log('警告:', result.data.warnings);
      }
      
      return result.data.valid;
    } catch (error) {
      console.error('API请求失败:', error);
      return false;
    }
  }
}

/**
 * 模型配置API使用示例
 */
export class ModelConfigExample {
  
  /**
   * 示例1：获取模型配置
   */
  static async getModelConfig(): Promise<any | null> {
    try {
      const response = await fetch('http://localhost:7999/api/config/model/get');
      const result = await response.json() as ConfigApiResponse;
      
      if (result.status === 200) {
        console.log('获取模型配置成功:');
        console.log(JSON.stringify(result.data, null, 2));
        return result.data;
      } else {
        console.error('获取模型配置失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return null;
    }
  }

  /**
   * 示例2：更新模型配置
   */
  static async updateModelConfig(configData: any): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:7999/api/config/model/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
      });
      
      const result = await response.json() as ConfigApiResponse;
      
      if (result.status === 200) {
        console.log('更新模型配置成功');
        return true;
      } else {
        console.error('更新模型配置失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return false;
    }
  }

  /**
   * 示例3：获取支持的模型列表
   */
  static async getSupportedModels(): Promise<string[]> {
    try {
      const response = await fetch('http://localhost:7999/api/config/model/supported');
      const result = await response.json() as ConfigApiResponse;
      
      if (result.status === 200) {
        console.log('支持的模型列表:');
        result.data.models.forEach((model: string, index: number) => {
          console.log(`${index + 1}. ${model}`);
        });
        return result.data.models;
      } else {
        console.error('获取支持的模型列表失败:', result.message);
        return [];
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return [];
    }
  }

  /**
   * 示例4：检查当前模型配置完整性
   */
  static async checkModelConfig(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:7999/api/config/model/check');
      const result = await response.json() as ConfigApiResponse;
      
      if (result.status === 200) {
        console.log(`配置完整性检查: ${result.data.valid ? '通过' : '失败'}`);
        if (result.data.errors && result.data.errors.length > 0) {
          console.log('错误:', result.data.errors);
        }
        if (result.data.warnings && result.data.warnings.length > 0) {
          console.log('警告:', result.data.warnings);
        }
        return result.data.valid;
      } else {
        console.error('检查模型配置失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return false;
    }
  }
}

/**
 * 完整使用流程示例
 */
export class ConfigApiFullExample {
  
  /**
   * 主程序配置完整操作流程
   */
  static async mainConfigWorkflow() {
    console.log('=== 主程序配置操作流程 ===\n');
    
    // 1. 获取配置文件信息
    console.log('1. 获取配置文件信息:');
    const fileInfo = await MainConfigExample.getMainConfigInfo();
    
    if (fileInfo && fileInfo.exists) {
      // 2. 获取当前配置
      console.log('\n2. 获取当前配置:');
      const currentConfig = await MainConfigExample.getMainConfig();
      
      if (currentConfig) {
        // 3. 更新配置示例
        console.log('\n3. 更新配置:');
        const updateData = {
          // 示例更新数据
          bot: {
            name: "MaiMai Bot Updated",
            version: "2.0.0"
          }
        };
        
        // 先验证配置数据
        console.log('\n4. 验证配置数据:');
        const isValid = await MainConfigExample.validateMainConfig(updateData);
        
        if (isValid) {
          // 执行更新
          await MainConfigExample.updateMainConfig(updateData);
        }
      }
    } else {
      console.log('配置文件不存在，需要先创建');
    }
  }

  /**
   * 模型配置完整操作流程
   */
  static async modelConfigWorkflow() {
    console.log('=== 模型配置操作流程 ===\n');
    
    // 1. 获取支持的模型列表
    console.log('1. 获取支持的模型列表:');
    const supportedModels = await ModelConfigExample.getSupportedModels();
    
    // 2. 检查当前配置完整性
    console.log('\n2. 检查当前配置:');
    const isConfigValid = await ModelConfigExample.checkModelConfig();
    
    if (!isConfigValid) {
      console.log('\n3. 配置不完整，进行更新:');
      const updateData = {
        model_name: supportedModels[0] || 'gpt-3.5-turbo',
        api_key: 'your-api-key-here',
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9
      };
      
      await ModelConfigExample.updateModelConfig(updateData);
      
      // 重新检查
      console.log('\n4. 重新检查配置:');
      await ModelConfigExample.checkModelConfig();
    }
  }

  /**
   * 完整演示
   */
  static async fullDemo() {
    console.log('🤖 麦麦配置API完整演示\n');
    
    try {
      await this.mainConfigWorkflow();
      console.log('\n' + '='.repeat(50) + '\n');
      await this.modelConfigWorkflow();
    } catch (error) {
      console.error('演示过程中发生错误:', error);
    }
  }
}

// 使用示例
export default {
  MainConfigExample,
  ModelConfigExample,
  ConfigApiFullExample
};
