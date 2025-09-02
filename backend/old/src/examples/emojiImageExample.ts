/**
 * API接口类型定义（用于TypeScript类型检查）
 */
export interface EmojiImageApiResponse {
  status: number;
  message: string;
  data: {
    imageb64: string;
  };
  time: number;
}

/**
 * Emoji图片获取功能使用示例
 * 演示如何使用新的getSingleEmojiImage API
 */
export class EmojiImageExample {
  
  /**
   * 示例1：通过API获取emoji图片
   */
  static async getEmojiImageExample() {
    try {
      const emojiId = 1; // 要获取的emoji ID
      
      // 发起API请求
      const response = await fetch(`http://localhost:7999/api/database/emoji/getSingleEmojiImage?id=${emojiId}`);
      const result = await response.json() as EmojiImageApiResponse;
      
      if (result.status === 200) {
        const base64Image = result.data.imageb64;
        console.log('获取emoji图片成功');
        console.log('Base64长度:', base64Image.length);
        console.log('Base64前50个字符:', base64Image.substring(0, 50));
        
        // 可以用于HTML img标签
        const dataUrl = `data:image/png;base64,${base64Image}`;
        console.log('完整的Data URL前100个字符:', dataUrl.substring(0, 100));
        
        return base64Image;
      } else {
        console.error('获取emoji图片失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      return null;
    }
  }
  
  /**
   * 示例2：批量获取多个emoji图片
   */
  static async getBatchEmojiImages(emojiIds: number[]) {
    const results: { id: number; base64?: string; error?: string }[] = [];
    
    for (const id of emojiIds) {
      try {
        const response = await fetch(`http://localhost:7999/api/database/emoji/getSingleEmojiImage?id=${id}`);
        const result = await response.json() as EmojiImageApiResponse;
        
        if (result.status === 200) {
          results.push({
            id,
            base64: result.data.imageb64
          });
        } else {
          results.push({
            id,
            error: result.message
          });
        }
      } catch (error) {
        results.push({
          id,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }
    
    return results;
  }
  
  /**
   * 示例3：将Base64图片保存到本地文件
   */
  static async saveBase64ToFile(base64: string, outputPath: string, format: string = 'png') {
    try {
      const fs = require('fs');
      const buffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      console.log(`图片已保存到: ${outputPath}`);
      return true;
    } catch (error) {
      console.error('保存图片失败:', error);
      return false;
    }
  }
  
  /**
   * 完整使用流程示例
   */
  static async fullExample() {
    console.log('=== Emoji图片获取完整示例 ===');
    
    // 1. 获取单个emoji图片
    console.log('\n1. 获取单个emoji图片:');
    const base64 = await this.getEmojiImageExample();
    
    if (base64) {
      // 2. 保存到本地文件
      console.log('\n2. 保存图片到本地:');
      await this.saveBase64ToFile(base64, './emoji_1.png');
      
      // 3. 批量获取示例
      console.log('\n3. 批量获取emoji图片:');
      const batchResults = await this.getBatchEmojiImages([1, 2, 3]);
      console.log('批量获取结果:', batchResults.map(r => ({
        id: r.id,
        success: !!r.base64,
        error: r.error
      })));
    }
  }
}

/**
 * API接口类型定义（用于TypeScript类型检查）
 */
export interface EmojiImageApiResponse {
  status: number;
  message: string;
  data: {
    imageb64: string;
  };
  time: number;
}

/**
 * 错误处理示例
 */
export class EmojiImageErrorHandling {
  
  static async handleApiErrors(emojiId: number) {
    try {
      const response = await fetch(`http://localhost:7999/api/database/emoji/getSingleEmojiImage?id=${emojiId}`);
      const result = await response.json() as EmojiImageApiResponse;
      
      switch (result.status) {
        case 200:
          console.log('成功获取emoji图片');
          return result.data.imageb64;
          
        case 400:
          console.error('参数错误:', result.message);
          // 处理参数错误
          break;
          
        case 404:
          console.error('资源不存在:', result.message);
          // 处理记录或文件不存在
          break;
          
        case 500:
          console.error('服务器错误:', result.message);
          // 处理服务器内部错误
          break;
          
        default:
          console.error('未知错误:', result.message);
      }
      
      return null;
    } catch (error) {
      console.error('网络请求失败:', error);
      return null;
    }
  }
}

// 导出主要功能
export { EmojiImageExample as default };
