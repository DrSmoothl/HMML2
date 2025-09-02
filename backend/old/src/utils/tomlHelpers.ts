/**
 * TOML格式化工具函数
 */

/**
 * 移除TOML字符串中数字的下划线分隔符
 * @iarna/toml库会自动为大数字添加下划线提高可读性，但有时我们需要干净的数字格式
 * 
 * @param tomlString - 包含下划线数字的TOML字符串
 * @returns 移除数字下划线后的TOML字符串
 */
export function removeNumberUnderscores(tomlString: string): string {
  let result = tomlString;
  
  // 1. 处理赋值语句中的单个数字
  // 匹配赋值语句中的数字（可能包含下划线）
  // 正则说明：
  // =\s* - 匹配等号和可选的空白字符
  // ([0-9_]+) - 捕获数字和下划线的组合
  // (?=\s*$) - 正向前瞻，确保数字后面只有空白字符直到行尾
  // gm - 全局匹配，多行模式
  result = result.replace(/=\s*([0-9_]+)(?=\s*$)/gm, (match, numberWithUnderscores) => {
    // 移除所有下划线
    const cleanNumber = numberWithUnderscores.replace(/_/g, '');
    return `= ${cleanNumber}`;
  });
  
  // 2. 处理数组中的数字
  // 匹配数组中的数字（可能包含下划线）
  // 正则说明：
  // ([0-9]+(?:_[0-9]+)+) - 捕获包含下划线的数字（至少有一个下划线）
  // (?=[,\s\]]) - 正向前瞻，确保数字后面是逗号、空白字符或右括号
  // g - 全局匹配
  result = result.replace(/([0-9]+(?:_[0-9]+)+)(?=[,\s\]])/g, (match) => {
    // 移除所有下划线
    return match.replace(/_/g, '');
  });
  
  return result;
}

/**
 * 将配置对象转换为清理过的TOML字符串
 * 
 * @param config - 要转换的配置对象
 * @param toml - TOML库实例
 * @returns 移除数字下划线的TOML字符串
 */
export function stringifyConfigToCleanToml(config: any, toml: any): string {
  const tomlString = toml.stringify(config);
  return removeNumberUnderscores(tomlString);
}
