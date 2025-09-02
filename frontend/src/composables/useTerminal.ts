import { ref, onUnmounted, nextTick } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

export interface TerminalConfig {
  host?: string;
  port?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

const DEFAULT_CONFIG: TerminalConfig = {
  host: 'localhost',
  port: 7999
};

export const useTerminal = () => {
  // 响应式状态
  const isConnect = ref(false);
  const isConnecting = ref(false);
  const logs = ref<LogEntry[]>([]);
  const sessionId = ref<string>('');
  const terminal = ref<Terminal | null>(null);
  const terminalContainer = ref<HTMLDivElement | null>(null);
  const currentConfig = ref<TerminalConfig>({ ...DEFAULT_CONFIG });

  // Socket和插件
  let socket: Socket | null = null;
  let fitAddon: FitAddon | null = null;

  // 日志记录
  const addLog = (level: LogEntry['level'], message: string) => {
    logs.value.push({
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    });
  };

  // 清除日志
  const clearLogs = () => {
    logs.value = [];
  };

  // 初始化终端
  const initTerminal = () => {
    if (terminal.value) return terminal.value;

    try {
      terminal.value = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        allowTransparency: false,
        convertEol: true,
        scrollback: 1000,
        theme: {
          background: '#1a1a1a',
          foreground: '#ffffff',
          cursor: '#ffffff',
          selectionBackground: '#30539c'
        }
      });

      fitAddon = new FitAddon();
      terminal.value.loadAddon(fitAddon);

      return terminal.value;
    } catch (error) {
      console.error('终端初始化失败:', error);
      throw error;
    }
  };

  // 调整终端大小
  const resizeTerminal = () => {
    if (fitAddon && terminal.value) {
      // 不要清空屏幕，直接调整大小
      fitAddon.fit();
      
      // 通知后端终端大小变化
      if (socket && isConnect.value && sessionId.value) {
        const { cols, rows } = terminal.value;
        socket.emit('pty:resize', {
          sessionId: sessionId.value,
          width: cols,
          height: rows
        });
      }
    }
  };

  // 确保终端DOM挂载
  const ensureTerminalMounted = async () => {
    if (!terminal.value || !terminalContainer.value) return;
    
    // 检查终端是否已经挂载到DOM
    const terminalElement = terminalContainer.value.querySelector('.xterm');
    if (!terminalElement) {
      try {
        // 清理容器并重新挂载
        terminalContainer.value.innerHTML = '';
        terminal.value.open(terminalContainer.value);
        
        // 等待DOM更新后调整大小
        await nextTick();
        
        if (fitAddon) {
          fitAddon.fit();
        }
        
        // 添加resize监听器
        const resizeObserver = new ResizeObserver(() => {
          // 延迟执行resize以避免频繁调用
          setTimeout(() => {
            resizeTerminal();
          }, 100);
        });
        resizeObserver.observe(terminalContainer.value);
        
        console.log('终端重新挂载到DOM');
      } catch (error) {
        console.error('重新挂载终端失败:', error);
      }
    }
  };

  // 终端写入
  const terminalWrite = (data: string) => {
    if (terminal.value) {
      terminal.value.write(data);
    }
  };

  // 清空终端
  const terminalClear = () => {
    if (terminal.value) {
      terminal.value.clear();
    }
  };

  // 聚焦终端
  const terminalFocus = () => {
    if (terminal.value) {
      terminal.value.focus();
    }
  };

  // 连接PTY服务器
  const connectPtyServer = (config: TerminalConfig = {}) => {
    return new Promise<void>((resolve, reject) => {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };
      currentConfig.value = finalConfig;
      
      const serverUrl = `http://${finalConfig.host}:${finalConfig.port}`;
      
      addLog('info', `正在连接到PTY服务器: ${serverUrl}`);
      
      if (socket) {
        socket.disconnect();
      }

      socket = io(serverUrl, {
        transports: ['websocket'],
        timeout: 10000
      });

      socket.on('connect', () => {
        isConnect.value = true;
        isConnecting.value = false;
        addLog('info', `已连接到PTY服务器: ${serverUrl}`);
        console.log('Socket.IO connected:', socket?.id);
        resolve();
      });

      socket.on('disconnect', () => {
        isConnect.value = false;
        isConnecting.value = false;
        addLog('warning', '与PTY服务器断开连接');
        console.log('Socket.IO disconnected');
      });

      socket.on('connect_error', (error) => {
        isConnect.value = false;
        isConnecting.value = false;
        const errorMsg = `连接PTY服务器失败: ${error.message}`;
        addLog('error', errorMsg);
        console.error('Socket.IO connect_error:', error);
        reject(new Error(errorMsg));
      });

      socket.on('pty:output', (data) => {
        console.log('Received pty:output:', data);
        console.log('Data content:', data.data);
        console.log('Data length:', data.data ? data.data.length : 'undefined');
        
        if (terminal.value && data.data) {
          terminal.value.write(data.data);
        } else {
          console.warn('Terminal not available or data is empty', { 
            hasTerminal: !!terminal.value, 
            hasData: !!data.data 
          });
        }
      });

      socket.on('pty:error', (error) => {
        // 过滤停止会话时的正常错误
        if (error.error && (
          error.error.includes('EPIPE') || 
          error.error.includes('broken pipe') ||
          error.error.includes('会话可能已停止')
        )) {
          console.log('PTY session stopped normally:', error);
          return;
        }
        
        addLog('error', `PTY错误: ${error.message || error.error || error}`);
        console.error('PTY error:', error);
      });

      isConnecting.value = true;
    });
  };

  // 获取MaiMai根目录
  const getMaimaiRoot = async (): Promise<string> => {
    try {
      const config = currentConfig.value;
      const response = await fetch(`http://${config.host}:${config.port}/api/pathCache/getMainRoot`);
      const data = await response.json();
      
      if (data.status === 200 && data.data && data.data.mainRoot) {
        const rootPath = data.data.mainRoot;
        addLog('info', `获取到MaiMai根目录: ${rootPath}`);
        return rootPath;
      }
      
      throw new Error('无法获取MaiMai根目录');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取MaiMai根目录失败';
      addLog('error', errorMsg);
      throw error;
    }
  };

  // 创建PTY会话
  const createPtySession = async (customStartCommand?: string) => {
    if (!socket || !isConnect.value) {
      throw new Error('未连接到PTY服务器');
    }

    try {
      addLog('info', '开始创建PTY会话...');
      
      // 获取MaiMai根目录作为工作目录
      const workingDir = await getMaimaiRoot();
      
      // 获取当前终端的实际尺寸
      const cols = terminal.value?.cols || 80;
      const rows = terminal.value?.rows || 24;
      
      const sessionConfig = {
        command: {
          startCommand: customStartCommand || 'cmd.exe',
          stopCommand: '^C',
          cwd: workingDir,
          ie: 'utf-8',
          oe: 'utf-8',
          env: {}
        },
        terminal: {
          haveColor: true,
          pty: true,
          ptyWindowCol: cols,
          ptyWindowRow: rows
        }
      };

      addLog('info', `会话配置: startCommand=${sessionConfig.command.startCommand}, cwd=${sessionConfig.command.cwd}`);

      // 创建会话
      const createResult = await new Promise<any>((resolve, reject) => {
        console.log('Emitting pty:create...');
        
        // 添加超时
        const timeout = setTimeout(() => {
          reject(new Error('创建PTY会话超时'));
        }, 5000);
        
        socket!.emit('pty:create-session', sessionConfig, (response: any) => {
          clearTimeout(timeout);
          console.log('pty:create-session response:', response);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '创建PTY会话失败'));
          }
        });
      });

      if (!createResult.sessionId) {
        throw new Error('未返回会话ID');
      }

      sessionId.value = createResult.sessionId;
      addLog('info', `PTY会话已创建: ${sessionId.value}`);

      // 启动会话
      console.log('Starting PTY session with command:', customStartCommand);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('启动PTY会话超时'));
        }, 5000);
        
        socket!.emit('pty:start-session', { 
          sessionId: sessionId.value
        }, (response: any) => {
          clearTimeout(timeout);
          console.log('pty:start-session response:', response);
          if (response.success) {
            addLog('info', `PTY会话已启动${customStartCommand ? ': ' + customStartCommand : ''}`);
            resolve();
          } else {
            reject(new Error(response.error || '启动PTY会话失败'));
          }
        });
      });

      // 加入会话
      console.log('Joining PTY session...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('加入PTY会话超时'));
        }, 5000);
        
        // 获取当前终端大小
        const terminalSize = terminal.value ? {
          width: terminal.value.cols,
          height: terminal.value.rows
        } : { width: 80, height: 24 };
        
        socket!.emit('pty:join-session', { 
          sessionId: sessionId.value,
          terminalSize
        }, (response: any) => {
          clearTimeout(timeout);
          console.log('pty:join-session response:', response);
          if (response.success) {
            addLog('info', 'PTY会话已就绪');
            resolve();
          } else {
            reject(new Error(response.error || '加入PTY会话失败'));
          }
        });
      });

      // 设置终端监听输入
      if (terminal.value) {
        // 移除旧的监听器，避免重复绑定
        terminal.value.onData((data: string) => {
          if (socket && sessionId.value) {
            socket.emit('pty:input', { 
              sessionId: sessionId.value, 
              input: data 
            });
          }
        });
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '创建PTY会话失败';
      addLog('error', errorMsg);
      throw error;
    }
  };

  // 重连现有会话（用于界面切换后恢复）
  const rejoinSession = async (existingSessionId?: string) => {
    if (!socket || !isConnect.value) {
      throw new Error('未连接到PTY服务器');
    }

    const targetSessionId = existingSessionId || sessionId.value;
    if (!targetSessionId) {
      throw new Error('没有可重连的会话');
    }

    try {
      addLog('info', `重新加入PTY会话: ${targetSessionId}`);
      
      // 获取会话状态
      const statusResult = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('获取会话状态超时'));
        }, 3000);
        
        socket!.emit('pty:get-session-status', { 
          sessionId: targetSessionId 
        }, (response: any) => {
          clearTimeout(timeout);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '获取会话状态失败'));
          }
        });
      });

      if (!statusResult.session) {
        throw new Error('会话不存在或已过期');
      }

      sessionId.value = targetSessionId;
      
      // 重新加入会话
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('重新加入会话超时'));
        }, 5000);
        
        const terminalSize = terminal.value ? {
          width: terminal.value.cols,
          height: terminal.value.rows
        } : { width: 80, height: 24 };
        
        socket!.emit('pty:join-session', { 
          sessionId: targetSessionId,
          terminalSize
        }, (response: any) => {
          clearTimeout(timeout);
          if (response.success) {
            addLog('info', '成功重新加入PTY会话');
            resolve();
          } else {
            reject(new Error(response.error || '重新加入会话失败'));
          }
        });
      });

      // 重新设置输入监听
      if (terminal.value) {
        terminal.value.onData((data: string) => {
          if (socket && sessionId.value) {
            socket.emit('pty:input', { 
              sessionId: sessionId.value, 
              input: data 
            });
          }
        });
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '重连会话失败';
      addLog('error', errorMsg);
      throw error;
    }
  };

  // 发送命令
  const sendCommand = (command: string) => {
    if (socket && isConnect.value && sessionId.value) {
      socket.emit('pty:input', { 
        sessionId: sessionId.value, 
        input: command + '\n' 
      });
    }
  };

  // 停止会话
  const stopSession = async (force: boolean = false) => {
    if (!socket || !isConnect.value || !sessionId.value) {
      throw new Error('没有活跃的会话可停止');
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('停止会话超时'));
      }, 10000);
      
      socket!.emit('pty:stop-session', { 
        sessionId: sessionId.value,
        force 
      }, (response: any) => {
        clearTimeout(timeout);
        console.log('pty:stop-session response:', response);
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || '停止会话失败'));
        }
      });
    });
  };

  // 执行连接和初始化
  const execute = async (config: TerminalConfig = {}) => {
    try {
      isConnecting.value = true;
      
      // 初始化终端（如果还没有初始化）
      if (!terminal.value) {
        initTerminal();
      }
      
      // 确保终端挂载到DOM
      await ensureTerminalMounted();
      
      // 如果还没有连接，连接到PTY服务器
      if (!isConnect.value) {
        await connectPtyServer(config);
      }
      
    } catch (error) {
      isConnecting.value = false;
      throw error;
    }
  };

  // 使用自定义命令启动新会话
  const executeWithCommand = async (command: string, config: TerminalConfig = {}) => {
    try {
      // 如果已经连接但没有活跃会话，直接创建新会话
      if (isConnect.value && socket && !sessionId.value) {
        await createPtySession(command);
        return;
      }
      
      // 如果已经有活跃会话，先停止它
      if (sessionId.value && socket && isConnect.value) {
        try {
          await stopSession(true);
          // 等待停止完成
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn('停止现有会话失败:', error);
        }
      }
      
      // 如果没有连接，先连接
      if (!isConnect.value) {
        await execute(config);
      }
      
      // 等待连接建立并创建会话
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('连接超时'));
        }, 10000);
        
        const checkConnection = () => {
          if (isConnect.value) {
            clearTimeout(timeout);
            // 连接建立后，创建带自定义命令的会话
            createPtySession(command).then(() => {
              resolve();
            }).catch(reject);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        
        checkConnection();
      });
    } catch (error) {
      console.error('executeWithCommand失败:', error);
      throw error;
    }
  };

  // 断开连接
  const disconnect = () => {
    try {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      sessionId.value = '';
      isConnect.value = false;
      isConnecting.value = false;
      addLog('info', '已断开PTY连接');
    } catch (error) {
      console.error('断开连接时发生错误:', error);
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect();
    if (terminal.value) {
      try {
        // 安全地释放终端资源
        terminal.value.dispose();
      } catch (error) {
        // 忽略dispose错误，通常是因为插件已经被释放了
        console.debug('Terminal dispose error (ignored):', error);
      }
      terminal.value = null;
    }
    // 重置fitAddon
    fitAddon = null;
  });

  return {
    // 响应式数据
    isConnect,
    isConnecting,
    logs,
    sessionId,
    terminal,
    terminalContainer,
    currentConfig,
    
    // 终端管理方法
    execute,
    executeWithCommand,
    createPtySession,
    rejoinSession,
    sendCommand,
    stopSession,
    disconnect,
    
    // 工具方法
    clearLogs,
    terminalWrite,
    terminalClear,
    terminalFocus
  };
};
