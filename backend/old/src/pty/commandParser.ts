/**
 * 命令行字符串解析为数组的工具函数
 * 支持引号包围的参数和转义字符
 */
export function parseCommandString(cmd: string): string[] {
  if (!cmd || typeof cmd !== 'string') {
    return [];
  }

  const QUOTES_KEY = '{quotes}';
  let start = 0;
  const len = cmd.length;
  const cmdArray: string[] = [];

  function analyze() {
    for (let index = start; index < len; index++) {
      const ch = cmd[index];
      
      if (ch === ' ') {
        findSpace(index);
        start++;
        continue;
      }
      
      if (ch === '"') {
        index = findQuotes(index);
      }
      
      if (index + 1 >= len) {
        findEnd();
        break;
      }
    }
  }

  function findEnd() {
    if (start < len) {
      cmdArray.push(cmd.slice(start));
    }
  }

  function findSpace(endPoint: number) {
    if (endPoint !== start) {
      const elem = cmd.slice(start, endPoint);
      start = endPoint;
      cmdArray.push(elem);
    }
  }

  function findQuotes(p: number) {
    for (let index = p + 1; index < len; index++) {
      const ch = cmd[index];
      if (ch === '"') {
        return index;
      }
    }
    throw new Error('命令中存在未闭合的引号');
  }

  try {
    analyze();
  } catch (error) {
    throw new Error(`命令解析失败: ${error}`);
  }

  if (cmdArray.length === 0) {
    return [];
  }

  // 处理引号包围的参数和转义字符
  return cmdArray.map(element => {
    let processed = element;
    
    // 移除外层引号
    if (processed.length >= 2 && processed[0] === '"' && processed[processed.length - 1] === '"') {
      processed = processed.slice(1, processed.length - 1);
    }
    
    // 恢复转义的引号
    while (processed.indexOf(QUOTES_KEY) !== -1) {
      processed = processed.replace(QUOTES_KEY, '"');
    }
    
    return processed;
  });
}

/**
 * 验证命令是否安全（防止命令注入）
 */
export function validateCommand(command: string): { valid: boolean; error?: string } {
  if (!command || typeof command !== 'string') {
    return { valid: false, error: '命令不能为空' };
  }

  // 检查极端危险的字符组合 (命令注入攻击)
  const dangerousPatterns = [
    /;\s*rm\s+/i,           // ; rm
    /;\s*del\s+/i,          // ; del  
    /;\s*rd\s+/i,           // ; rd
    /;\s*format\s+/i,       // ; format
    /;\s*shutdown\s+/i,     // ; shutdown
    /;\s*reboot\s+/i,       // ; reboot
    /`.*rm\s+/i,            // `rm
    /`.*del\s+/i,           // `del
    /\$\(.*rm\s+/i,         // $(rm
    /\$\(.*del\s+/i,        // $(del
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return { 
        valid: false, 
        error: '命令包含危险的操作模式' 
      };
    }
  }

  // 检查过于复杂的字符使用（可能的命令注入）
  const suspiciousChars = ['`', '$'];
  for (const char of suspiciousChars) {
    if (command.includes(char)) {
      return { 
        valid: false, 
        error: `命令包含可疑字符: ${char}` 
      };
    }
  }

  // 检查命令长度
  if (command.length > 2000) {
    return { valid: false, error: '命令长度超出限制' };
  }

  return { valid: true };
}

/**
 * 清理用户名（防止命令注入）
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }
  
  // 只保留字母、数字、下划线和连字符
  return username.replace(/[^a-zA-Z0-9_-]/g, '');
}
