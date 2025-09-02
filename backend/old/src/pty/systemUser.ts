import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../core/logger';
import { sanitizeUsername } from './commandParser';

const execAsync = promisify(exec);

// 系统用户ID信息
export interface ISystemUserInfo {
  uid: number;
  gid: number;
}

// 运行用户参数
export interface IRunAsUserParams {
  uid?: number;
  gid?: number;
  isEnableRunAs: boolean;
  runAsName?: string;
}

/**
 * 获取Linux系统用户的UID和GID
 */
export async function getLinuxSystemId(username: string): Promise<ISystemUserInfo> {
  // 验证和清理用户名
  if (!username || typeof username !== 'string' || username.trim() === '') {
    throw new Error('用户名不能为空');
  }

  const sanitizedUsername = sanitizeUsername(username);
  if (sanitizedUsername !== username) {
    throw new Error('用户名包含不安全字符');
  }

  if (sanitizedUsername.length === 0) {
    throw new Error('用户名无效');
  }

  try {
    logger.debug(`获取用户 ${sanitizedUsername} 的系统ID`);

    // 并行执行id命令获取UID和GID
    const [uidResult, gidResult] = await Promise.all([
      execAsync(`id -u ${sanitizedUsername}`, { timeout: 5000 }),
      execAsync(`id -g ${sanitizedUsername}`, { timeout: 5000 })
    ]);

    // 检查命令执行错误
    if (uidResult.stderr || gidResult.stderr) {
      const errorMsg = uidResult.stderr || gidResult.stderr;
      throw new Error(`系统命令执行失败: ${errorMsg}`);
    }

    // 解析UID和GID
    const uid = parseInt(uidResult.stdout.trim(), 10);
    const gid = parseInt(gidResult.stdout.trim(), 10);

    if (isNaN(uid) || isNaN(gid)) {
      throw new Error('无法解析UID或GID: id命令返回无效输出');
    }

    if (uid < 0 || gid < 0) {
      throw new Error('UID或GID无效: 不能为负数');
    }

    logger.debug(`用户 ${sanitizedUsername} 的系统ID: UID=${uid}, GID=${gid}`);
    return { uid, gid };

  } catch (error: any) {
    const errorMsg = `无法获取用户 "${sanitizedUsername}" 的UID/GID: ${error.message}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * 获取运行用户参数
 */
export async function getRunAsUserParams(runAsUser?: string): Promise<IRunAsUserParams> {
  let uid: number | undefined = undefined;
  let gid: number | undefined = undefined;
  let isEnableRunAs = false;
  
  // 只在非Windows系统且指定了用户名时才启用
  if (runAsUser && 
      typeof runAsUser === 'string' && 
      runAsUser.trim() !== '' && 
      process.platform !== 'win32') {
    
    try {
      const userInfo = await getLinuxSystemId(runAsUser.trim());
      uid = userInfo.uid;
      gid = userInfo.gid;
      isEnableRunAs = true;
      
      logger.info(`启用运行用户模式: ${runAsUser} (UID=${uid}, GID=${gid})`);
    } catch (error) {
      logger.warn(`获取运行用户参数失败，将以当前用户运行: ${error}`);
      // 不抛出错误，降级到当前用户运行
    }
  }
  
  return {
    uid,
    gid,
    isEnableRunAs,
    runAsName: isEnableRunAs ? runAsUser : undefined
  };
}

/**
 * 验证用户是否存在
 */
export async function validateUser(username: string): Promise<boolean> {
  try {
    await getLinuxSystemId(username);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取当前用户信息
 */
export function getCurrentUserInfo(): { uid: number; gid: number; username: string } {
  const uid = process.getuid ? process.getuid() : 0;
  const gid = process.getgid ? process.getgid() : 0;
  const username = process.env.USER || process.env.USERNAME || 'unknown';
  
  return { uid, gid, username };
}
