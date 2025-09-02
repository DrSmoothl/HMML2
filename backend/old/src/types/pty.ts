// PTY相关类型定义
export interface IPtyProcess {
  pid: number | string;
  kill: (signal?: any) => boolean;
  destroy: () => Promise<void>;
  write: (data: string) => boolean;
  resize: (width: number, height: number) => void;
  forceKill: () => boolean;
  isAlive: () => boolean;
}

// PTY子进程配置
export interface IPtySubProcessConfig {
  pid: number;
}

// PTY消息类型
export enum PtyMessageType {
  RESIZE = 0x04
}

// 终端配置
export interface ITerminalConfig {
  haveColor: boolean;
  pty: boolean;
  ptyWindowCol: number;
  ptyWindowRow: number;
}

// 命令配置
export interface ICommandConfig {
  startCommand: string;
  stopCommand: string;
  cwd: string;
  ie: string; // 输入编码
  oe: string; // 输出编码
  runAs?: string;
  env?: Record<string, string>;
}

// PTY实例配置
export interface IPtyInstanceConfig {
  uuid?: string;
  command: ICommandConfig;
  terminal: ITerminalConfig;
}

// WebSocket观察者信息
export interface IWatcherInfo {
  socketId: string;
  terminalSize: {
    width: number;
    height: number;
  };
  joinTime?: number;
}

// WebSocket事件常量
export const PtyWebSocketEvents = {
  // 会话管理
  CREATE_SESSION: 'pty:create-session',
  START_SESSION: 'pty:start-session',
  STOP_SESSION: 'pty:stop-session',
  JOIN_SESSION: 'pty:join-session',
  LEAVE_SESSION: 'pty:leave-session',
  
  // 输入输出
  INPUT: 'pty:input',
  OUTPUT: 'pty:output',
  
  // 终端控制
  RESIZE: 'pty:resize',
  
  // 状态事件
  STATUS_CHANGE: 'pty:status-change',
  GET_SESSION_STATUS: 'pty:get-session-status',
  
  // 错误和停止
  ERROR: 'pty:error',
  SESSION_STOPPED: 'pty:session-stopped',
  SESSION_DESTROYED: 'pty:session-destroyed'
} as const;

// PTY会话状态
export enum PtySessionStatus {
  STOPPED = 0,
  STARTING = 1,
  RUNNING = 2,
  STOPPING = 3,
  ERROR = 4
}

// PTY会话
export interface IPtySession {
  uuid: string;
  status: PtySessionStatus;
  config: IPtyInstanceConfig;
  process?: IPtyProcess;
  watchers: Map<string, IWatcherInfo>;
  startTime?: number;
  endTime?: number;
  startCount: number;
}

// WebSocket事件类型
export interface IPtyWebSocketEvents {
  // 客户端发送的事件
  'pty:connect': (data: { sessionId: string; terminalSize?: { width: number; height: number } }) => void;
  'pty:input': (data: { sessionId: string; input: string }) => void;
  'pty:resize': (data: { sessionId: string; width: number; height: number }) => void;
  'pty:disconnect': (data: { sessionId: string }) => void;
  
  // 服务器发送的事件
  'pty:output': (data: { sessionId: string; output: string }) => void;
  'pty:status': (data: { sessionId: string; status: PtySessionStatus }) => void;
  'pty:error': (data: { sessionId: string; error: string }) => void;
}
