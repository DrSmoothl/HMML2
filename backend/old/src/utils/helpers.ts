import { v4 as uuidv4 } from 'uuid';

/**
 * 移除字符串末尾的指定字符
 */
export function removeTrail(str: string, char: string): string {
  return str.endsWith(char) ? str.slice(0, -1) : str;
}

/**
 * 移除字符串开头的指定字符
 */
export function removeLeading(str: string, char: string): string {
  return str.startsWith(char) ? str.slice(1) : str;
}

/**
 * 确保字符串以指定字符开头
 */
export function ensureLeading(str: string, char: string): string {
  return str.startsWith(char) ? str : char + str;
}

/**
 * 确保字符串以指定字符结尾
 */
export function ensureTrailing(str: string, char: string): string {
  return str.endsWith(char) ? str : str + char;
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * 生成短ID
 */
export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的JSON解析
 */
export function safeJSONParse<T = any>(jsonString: string, defaultValue?: T): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue ?? null;
  }
}

/**
 * 安全的JSON字符串化
 */
export function safeJSONStringify(obj: any, space?: number): string | null {
  try {
    return JSON.stringify(obj, null, space);
  } catch (error) {
    return null;
  }
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await sleep(delay * (i + 1)); // 指数退避
      }
    }
  }
  
  throw lastError!;
}

/**
 * 检查对象是否为空
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim() === '';
  return false;
}

/**
 * 获取对象的嵌套属性值
 */
export function getNestedValue(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * 设置对象的嵌套属性值
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  if (!lastKey) return;
  
  let current = obj;
  for (const key of keys) {
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  const replacements: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: (date.getMonth() + 1).toString().padStart(2, '0'),
    DD: date.getDate().toString().padStart(2, '0'),
    HH: date.getHours().toString().padStart(2, '0'),
    mm: date.getMinutes().toString().padStart(2, '0'),
    ss: date.getSeconds().toString().padStart(2, '0'),
    SSS: date.getMilliseconds().toString().padStart(3, '0')
  };
  
  let formatted = format;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    formatted = formatted.replace(new RegExp(pattern, 'g'), replacement);
  }
  
  return formatted;
}

/**
 * 验证电子邮件地址
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成随机数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 随机选择数组元素
 */
export function randomChoice<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 数组去重
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * 数组按指定键分组
 */
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 计算文件哈希（简单版本）
 */
export function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}
