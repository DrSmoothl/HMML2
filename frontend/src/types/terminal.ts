// 终端相关类型定义
export interface TerminalConfig {
  serverUrl?: string;     // 服务器地址
  port?: number;          // WebSocket端口
  password?: string;      // 临时密码
}

// PTY会话配置（基于PTY文档）
export interface PtyInstanceConfig {
  uuid?: string;              
  command: {
    startCommand: string;      // 启动命令，如 "bash" 或 "cmd"
    stopCommand?: string;      // 停止命令（默认 ^C）
    cwd: string;              // 工作目录
    ie: string;               // 输入编码（默认 utf-8）
    oe: string;               // 输出编码（默认 utf-8）
    runAs?: string;           // 运行用户（可选）
    env?: Record<string, string>; // 环境变量
  };
  terminal: {
    haveColor: boolean;       // 是否支持颜色
    pty: boolean;             // 是否为PTY模式
    ptyWindowCol: number;     // 终端列数
    ptyWindowRow: number;     // 终端行数
  };
}

// PTY会话状态
export interface PtySessionState {
  sessionId: string;
  status: 'created' | 'starting' | 'running' | 'stopped' | 'error';
  config: PtyInstanceConfig;
  observers: number;
  createdAt: string;
  startedAt?: string;
  stoppedAt?: string;
}

export interface InstanceState {
  status: number;         // 实例状态：0=停止，1=启动中，3=运行中
  nickname: string;       // 实例名称
  hasProcess: boolean;    // 是否有进程在运行
  terminalOption: {
    ptyWindowCol: number;
    ptyWindowRow: number;
    pty: boolean;
  };
}

export interface StdoutData {
  text: string;
}

// PTY输出数据
export interface PtyOutputData {
  sessionId: string;
  data: string;
}

// 实例状态常量
export const INSTANCE_STATUS = {
  STOPPED: 0,
  STARTING: 1,
  RUNNING: 3
} as const;

export type InstanceStatusType = typeof INSTANCE_STATUS[keyof typeof INSTANCE_STATUS];

// PTY WebSocket事件类型
export interface PtyWebSocketEvents {
  // 客户端发送的事件
  'pty:create-session': (data: { config: PtyInstanceConfig }, callback?: (response: any) => void) => void;
  'pty:start-session': (data: { sessionId: string }, callback?: (response: any) => void) => void;
  'pty:join-session': (data: { sessionId: string; terminalSize?: { width: number; height: number } }) => void;
  'pty:input': (data: { sessionId: string; input: string }) => void;
  'pty:resize': (data: { sessionId: string; width: number; height: number }) => void;
  'pty:leave-session': (data: { sessionId: string }) => void;
  'pty:stop-session': (data: { sessionId: string; force?: boolean }, callback?: (response: any) => void) => void;

  // 服务器发送的事件
  'pty:output': (data: PtyOutputData) => void;
  'pty:status-change': (data: { sessionId: string; status: string; details?: any }) => void;
  'pty:error': (data: { sessionId: string; error: string }) => void;
  'pty:session-stopped': (data: { sessionId: string; code?: number }) => void;
  'pty:session-destroyed': (data: { sessionId: string }) => void;
}

// 终端主题
export interface TerminalTheme {
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

// 预设终端主题
export const TERMINAL_THEMES: Record<string, TerminalTheme> = {
  default: {
    name: '默认',
    background: '#1a1b26',
    foreground: '#a9b1d6',
    cursor: '#f7768e',
    cursorAccent: '#1a1b26',
    selection: '#33467c',
    black: '#32344a',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#ad8ee6',
    cyan: '#449dab',
    white: '#787c99',
    brightBlack: '#444b6a',
    brightRed: '#ff7a93',
    brightGreen: '#b9f27c',
    brightYellow: '#ff9e64',
    brightBlue: '#7da6ff',
    brightMagenta: '#bb9af7',
    brightCyan: '#0db9d7',
    brightWhite: '#acb0d0'
  },
  dark: {
    name: '暗黑',
    background: '#000000',
    foreground: '#ffffff',
    cursor: '#ffffff',
    cursorAccent: '#000000',
    selection: '#404040',
    black: '#000000',
    red: '#cc0000',
    green: '#4e9a06',
    yellow: '#c4a000',
    blue: '#3465a4',
    magenta: '#75507b',
    cyan: '#06989a',
    white: '#d3d7cf',
    brightBlack: '#555753',
    brightRed: '#ef2929',
    brightGreen: '#8ae234',
    brightYellow: '#fce94f',
    brightBlue: '#729fcf',
    brightMagenta: '#ad7fa8',
    brightCyan: '#34e2e2',
    brightWhite: '#eeeeec'
  },
  light: {
    name: '明亮',
    background: '#ffffff',
    foreground: '#000000',
    cursor: '#000000',
    cursorAccent: '#ffffff',
    selection: '#b5d5ff',
    black: '#000000',
    red: '#cc0000',
    green: '#4e9a06',
    yellow: '#c4a000',
    blue: '#3465a4',
    magenta: '#75507b',
    cyan: '#06989a',
    white: '#d3d7cf',
    brightBlack: '#555753',
    brightRed: '#ef2929',
    brightGreen: '#8ae234',
    brightYellow: '#fce94f',
    brightBlue: '#729fcf',
    brightMagenta: '#ad7fa8',
    brightCyan: '#34e2e2',
    brightWhite: '#eeeeec'
  },
  matrix: {
    name: '黑客帝国',
    background: '#000000',
    foreground: '#00ff00',
    cursor: '#00ff00',
    cursorAccent: '#000000',
    selection: '#003300',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#0000ff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
    brightBlack: '#555555',
    brightRed: '#ff5555',
    brightGreen: '#55ff55',
    brightYellow: '#ffff55',
    brightBlue: '#5555ff',
    brightMagenta: '#ff55ff',
    brightCyan: '#55ffff',
    brightWhite: '#ffffff'
  }
};

// 快捷命令
export interface QuickCommand {
  name: string;
  command: string;
  description?: string;
  color?: string;
}

export const DEFAULT_QUICK_COMMANDS: QuickCommand[] = [
  { name: '帮助', command: 'help', description: '显示帮助信息', color: 'info' },
  { name: '状态', command: 'status', description: '查看系统状态', color: 'success' },
  { name: '重载', command: 'reload', description: '重新加载配置', color: 'warning' },
  { name: '停止', command: 'stop', description: '停止服务', color: 'error' },
  { name: '清屏', command: 'clear', description: '清空终端', color: 'ghost' },
  { name: '版本', command: 'version', description: '查看版本信息', color: 'accent' }
];
