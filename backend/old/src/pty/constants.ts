import os from 'os';
import path from 'path';
import { FileManager } from '../core/fileManager';

// 根据操作系统和架构生成PTY程序名称
const SYSTEM_INFO = `${os.platform()}_${os.arch()}${os.platform() === 'win32' ? '.exe' : ''}`;
const PTY_FILENAME = `pty_${SYSTEM_INFO}`;

// PTY程序路径（相对于项目根目录的lib文件夹）
export const PTY_PATH = path.normalize(path.join(process.cwd(), 'lib', PTY_FILENAME));

// PTY相关常量
export const PTY_CONSTANTS = {
  // 最大终端尺寸限制
  MAX_TERMINAL_WIDTH: 900,
  MAX_TERMINAL_HEIGHT: 900,
  
  // 默认终端尺寸
  DEFAULT_TERMINAL_WIDTH: 164,
  DEFAULT_TERMINAL_HEIGHT: 40,
  
  // 命名管道相关
  PIPE_PREFIX_LINUX: '/tmp/hmml-pty-pipe',
  PIPE_PREFIX_WINDOWS: '\\\\.\\pipe\\hmml-pty',
  
  // 超时设置
  PTY_STARTUP_TIMEOUT: 10000, // 10秒
  PTY_CONFIG_READ_TIMEOUT: 3000, // 3秒
  
  // 消息类型
  MESSAGE_TYPES: {
    RESIZE: 0x04
  }
} as const;

// 文件名黑名单
export const FILENAME_BLACKLIST = ['\\', '/', '.', "'", '"', '?', '*', '<', '>'];

// 检查PTY程序是否存在
export async function checkPtyEnvironment(): Promise<{ exists: boolean; path: string; error?: string }> {
  try {
    const exists = await FileManager.exists(PTY_PATH);
    
    if (!exists) {
      return {
        exists: false,
        path: PTY_PATH,
        error: `PTY程序不存在: ${PTY_PATH}`
      };
    }

    // 检查文件是否可执行（Unix系统）
    if (os.platform() !== 'win32') {
      const stats = await FileManager.getStats(PTY_PATH);
      if (stats && (stats.mode & 0o111) === 0) {
        return {
          exists: false,
          path: PTY_PATH,
          error: `PTY程序无执行权限: ${PTY_PATH}`
        };
      }
    }

    return {
      exists: true,
      path: PTY_PATH
    };
  } catch (error) {
    return {
      exists: false,
      path: PTY_PATH,
      error: `检查PTY环境失败: ${error}`
    };
  }
}

// 生成唯一管道名称
export function generatePipeName(sessionId: string): string {
  if (os.platform() === 'win32') {
    return `${PTY_CONSTANTS.PIPE_PREFIX_WINDOWS}-${sessionId}`;
  } else {
    return `${PTY_CONSTANTS.PIPE_PREFIX_LINUX}/pipe-${sessionId}`;
  }
}
