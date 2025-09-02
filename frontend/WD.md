# MCSM 仿真终端PTY实现详细技术文档

## 概述

MCSM（MCSManager）是一个Minecraft服务器管理系统，其中包含了一个基于Go语言编写的PTY（伪终端）程序实现的仿真终端功能。本文档详细描述了从前端到后端，再到PTY程序的完整通信和调用流程。

## 目录

1. [整体架构](#整体架构)
2. [后端PTY实现](#后端pty实现)
3. [前端实现](#前端实现)
4. [WebSocket通信协议](#websocket通信协议)
5. [数据流转机制](#数据流转机制)
6. [完整调用流程](#完整调用流程)

## 整体架构

```
前端(Vue.js) <--WebSocket--> 后端(Node.js) <--Named Pipe/FIFO--> PTY程序(Go)
                                    |                                    |
                                    |                                    v
                                    |                              目标进程(Minecraft等)
                                    v
                               进程管理/监控
```

### 核心组件

1. **前端终端组件**：基于Vue.js的终端UI，处理用户输入和显示输出
2. **后端WebSocket服务**：Node.js服务，处理前端连接和PTY进程管理
3. **PTY适配器**：GoPtyProcessAdapter类，封装PTY进程通信
4. **Go PTY程序**：独立的Go程序，提供真正的伪终端功能

---

## 后端PTY实现（单实例版本）

### 1. 基础类型定义和接口

#### 1.1 进程接口定义
```typescript
// 进程接口 - 定义所有进程适配器必须实现的方法
export interface IInstanceProcess extends EventEmitter {
  pid?: number | string;  // 进程ID
  kill: (signal?: any) => any;  // 终止进程
  destroy: () => void;    // 销毁进程和清理资源
  write: (data?: any) => any;  // 向进程写入数据
}
```

#### 1.2 基础命令类
```typescript
// 命令基类 - 所有实例命令的基础类
export default class InstanceCommand {
  constructor(public info?: string) {}
  
  // 执行命令的抽象方法
  async exec(instance: any): Promise<any> {}
  
  // 停止命令执行
  async stop(instance: any) {}
}
```

#### 1.3 启动命令抽象类
```typescript
export class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export default abstract class AbsStartCommand extends InstanceCommand {
  private async sleep() {
    return new Promise((ok) => {
      setTimeout(ok, 2000);  // 等待2秒避免死循环启动
    });
  }

  async exec(instance: any) {
    // 检查实例状态
    if (instance.status() !== 0) { // 0 = STATUS_STOP
      throw new StartupError("Instance is not stopped");
    }

    try {
      instance.setLock(true);
      instance.status(1); // 1 = STATUS_STARTING
      instance.startCount++;
      instance.startTimestamp = Date.now();

      // 检查实例到期时间
      if (instance.config.endTime && instance.config.endTime <= instance.startTimestamp) {
        throw new Error("Instance has expired");
      }

      instance.print("\n\n");
      instance.println("INFO", "Starting instance...");

      // 防止死循环启动
      await this.sleep();

      return await this.createProcess(instance);
    } catch (error: any) {
      try {
        await instance.execPreset("kill");
      } catch (ignore) {}
      instance.releaseResources();
      instance.status(0); // STATUS_STOP
      instance.failure(error);
    } finally {
      instance.setLock(false);
    }
  }

  // 子类必须实现的进程创建方法
  protected abstract createProcess(instance: any): Promise<void>;
}
```

### 2. 命令行解析工具

```typescript
// 命令行字符串解析为数组的工具函数
export function commandStringToArray(cmd: string) {
  const QUOTES_KEY = "{quotes}";
  let start = 0;
  let len = cmd.length;
  const cmdArray: string[] = [];
  
  function _analyze() {
    for (let index = start; index < len; index++) {
      const ch = cmd[index];
      if (ch === " ") {
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
    return cmdArray.push(cmd.slice(start));
  }

  function findSpace(endPoint: number) {
    if (endPoint != start) {
      const elem = cmd.slice(start, endPoint);
      start = endPoint;
      return cmdArray.push(elem);
    }
  }

  function findQuotes(p: number) {
    for (let index = p + 1; index < len; index++) {
      const ch = cmd[index];
      if (ch === '"') return index;
    }
    throw new Error("Unclosed quotes in command");
  }

  _analyze();

  if (cmdArray.length == 0) {
    return [];
  }

  // 处理引号包围的参数
  for (const index in cmdArray) {
    const element = cmdArray[index];
    if (element[0] === '"' && element[element.length - 1] === '"') {
      cmdArray[index] = element.slice(1, element.length - 1);
    }
    while (cmdArray[index].indexOf(QUOTES_KEY) != -1) {
      cmdArray[index] = cmdArray[index].replace(QUOTES_KEY, '"');
    }
  }

  return cmdArray;
}
```

### 3. 系统用户工具

```typescript
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

// Linux系统用户ID获取
export async function getLinuxSystemId(username: string): Promise<{ uid: number; gid: number }> {
  // 验证用户名
  if (!username || typeof username !== "string" || username.trim() === "") {
    throw new Error('"Run As User" Error: Username must be a non-empty string');
  }

  // 清理用户名，防止命令注入
  const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, "");
  if (sanitizedUsername !== username) {
    throw new Error('"Run As User" Error: Username contains unsafe characters');
  }

  try {
    // 并行执行id命令获取UID和GID
    const [uidResult, gidResult] = await Promise.all([
      execAsync(`id -u ${sanitizedUsername}`, { timeout: 5000 }),
      execAsync(`id -g ${sanitizedUsername}`, { timeout: 5000 })
    ]);

    // 检查错误
    if (uidResult.stderr || gidResult.stderr) {
      throw new Error(`Command error: ${uidResult.stderr || gidResult.stderr}`);
    }

    // 解析UID和GID
    const uid = parseInt(uidResult.stdout.trim());
    const gid = parseInt(gidResult.stdout.trim());

    if (isNaN(uid) || isNaN(gid)) {
      throw new Error("Failed to parse UID or GID: Invalid output from id command");
    }

    return { uid, gid };
  } catch (error: any) {
    throw new Error(`Unable to retrieve UID/GID for user "${sanitizedUsername}": ${error.message}`);
  }
}

// 获取运行用户参数（单实例简化版）
export async function getRunAsUserParams(config: any) {
  let uid: number | undefined = undefined;
  let gid: number | undefined = undefined;
  let isEnableRunAs = false;
  const name = config.runAs;
  
  if (name && String(name).trim() && process.platform !== "win32") {
    const result = await getLinuxSystemId(name);
    uid = result.uid;
    gid = result.gid;
    isEnableRunAs = true;
  }
  
  return { uid, gid, isEnableRunAs, runAsName: name };
}
```

### 4. 常量定义和PTY路径配置（简化版）

```typescript
import { existsSync } from "fs";
import os from "os";
import path from "path";

// 根据操作系统和架构生成PTY程序名称
const SYS_INFO = `${os.platform()}_${os.arch()}${os.platform() === "win32" ? ".exe" : ""}`;
const ptyName = `pty_${SYS_INFO}`;

// PTY程序路径（相对于当前工作目录的lib文件夹）
const PTY_PATH = path.normalize(path.join(process.cwd(), "lib", ptyName));

// 文件名黑名单
const FILENAME_BLACKLIST = ["\\", "/", ".", "'", '"', "?", "*", "<", ">"];

// 系统类型
const SYSTEM_TYPE = os.platform();

export {
  PTY_PATH,
  FILENAME_BLACKLIST,
  SYSTEM_TYPE
};
```

### 5. 单实例配置类

```typescript
import os from "os";

// 单实例配置类（简化版）
export default class InstanceConfig {
  public nickname = "PTY Instance";           // 实例名称
  public startCommand = "";                   // 启动命令
  public stopCommand = "^C";                  // 停止命令
  public cwd = ".";                          // 工作目录
  public ie = "utf-8";                       // 输入编码
  public oe = "utf-8";                       // 输出编码
  public createDatetime = Date.now();        // 创建时间
  public lastDatetime = Date.now();          // 最后访问时间
  public fileCode: string = "utf-8";         // 文件编码
  public processType: "general" = "general"; // 进程类型（固定为general）
  public runAs: string = "";                 // 运行用户
  public crlf = os.platform() === "win32" ? 2 : 1; // 换行符类型
  public endTime: number = 0;                // 到期时间

  // 终端选项
  public terminalOption = {
    haveColor: false,    // 是否支持颜色
    pty: true,          // 启用PTY模式
    ptyWindowCol: 164,  // PTY窗口列数
    ptyWindowRow: 40    // PTY窗口行数
  };

  // 事件任务配置
  public eventTask = {
    autoStart: false,   // 自动启动
    autoRestart: false, // 自动重启
    ignore: false       // 忽略错误
  };

  // 生成环境变量
  public generateEnv(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      // 可以在这里添加自定义环境变量
    };
  }

  // 获取绝对工作路径
  public absoluteCwdPath(): string {
    if (path.isAbsolute(this.cwd)) {
      return this.cwd;
    }
    return path.resolve(process.cwd(), this.cwd);
  }

  // 检查工作目录是否存在
  public hasCwdPath(): boolean {
    return this.cwd && this.cwd.trim() !== "";
  }
}
```
### 6. PTY进程适配器（单实例简化版）

这是核心的PTY进程封装类：

```typescript
import os from "os";
import fs from "fs-extra";
import path from "path";
import readline from "readline";
import EventEmitter from "events";
import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Writable } from "stream";
import { v4 } from "uuid";

// PTY子进程配置接口
interface IPtySubProcessCfg {
  pid: number;  // 实际运行的目标进程PID
}

// PTY消息类型定义
const GO_PTY_MSG_TYPE = {
  RESIZE: 0x04  // 调整终端大小的消息类型
};

// 简单的进程终止函数
function killProcess(pid: number | string, process: ChildProcess, signal?: any): boolean {
  try {
    if (typeof pid === "number" && pid > 0) {
      process.kill(signal || "SIGTERM");
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// PTY进程适配器类（单实例版本）
export class GoPtyProcessAdapter extends EventEmitter {
  private pipeClient?: Writable;  // 命名管道客户端

  constructor(
    private readonly process: ChildProcess,  // PTY子进程
    public readonly pid: number,            // 实际进程PID
    public readonly pipeName: string        // 命名管道名称
  ) {
    super();
    
    // 监听PTY进程的标准输出和错误输出
    process.stdout?.on("data", (text) => this.emit("data", text));
    process.stderr?.on("data", (text) => this.emit("data", text));
    process.on("exit", (code) => this.emit("exit", code));
    
    // 初始化命名管道连接
    this.initNamedPipe();
  }

  // 初始化命名管道连接
  private async initNamedPipe() {
    try {
      const fd = await fs.open(this.pipeName, "w");
      const writePipe = fs.createWriteStream("", { fd });
      
      writePipe.on("close", () => {
        console.log("Named pipe closed");
      });
      writePipe.on("end", () => {
        console.log("Named pipe ended");
      });
      writePipe.on("error", (err) => {
        console.error("Pipe error:", this.pipeName, err);
      });
      
      this.pipeClient = writePipe;
    } catch (error) {
      throw new Error(`Failed to initialize named pipe: ${error}`);
    }
  }

  // 调整终端大小
  public resize(w: number, h: number) {
    const MAX_W = 900;
    if (w > MAX_W) w = MAX_W;
    if (h > MAX_W) h = MAX_W;
    
    // 构造调整大小的消息
    const resizeStruct = JSON.stringify({ 
      width: Number(w), 
      height: Number(h) 
    });
    
    const len = resizeStruct.length;
    const lenBuff = Buffer.alloc(2);
    lenBuff.writeInt16BE(len, 0);
    
    // 消息格式: [消息类型][长度][JSON数据]
    const buf = Buffer.from([
      GO_PTY_MSG_TYPE.RESIZE, 
      ...lenBuff, 
      ...Buffer.from(resizeStruct)
    ]);
    
    this.writeToNamedPipe(buf);
  }

  // 向命名管道写入数据
  public writeToNamedPipe(data: Buffer) {
    if (this.pipeClient) {
      this.pipeClient.write(data);
    }
  }

  // 向PTY进程写入数据（用户输入）
  public write(data?: string) {
    return this.process.stdin?.write(data);
  }

  // 终止进程
  public kill(s?: any) {
    return killProcess(this.pid, this.process, s);
  }

  // 清理资源
  public async destroy() {
    // 移除所有事件监听器
    for (const n of this.eventNames()) {
      this.removeAllListeners(n);
    }
    
    if (this.process.stdout) {
      for (const eventName of this.process.stdout.eventNames()) {
        this.process.stdout.removeAllListeners(eventName);
      }
    }
        
    if (this.process.stderr) {
      for (const eventName of this.process.stderr.eventNames()) {
        this.process.stderr.removeAllListeners(eventName);
      }
    }
        
    if (this.process) {
      for (const eventName of this.process.eventNames()) {
        this.process.removeAllListeners(eventName);
      }
    }
        
    if (this.pipeClient) {
      for (const eventName of this.pipeClient.eventNames()) {
        this.pipeClient.removeAllListeners(eventName);
      }
    }

    // 关闭管道和进程
    this.pipeClient?.destroy();
    this.process?.stdout?.destroy();
    this.process?.stderr?.destroy();
    
    if (this.process?.exitCode === null) {
      this.process.kill("SIGTERM");
      this.process.kill("SIGKILL");
    }
    
    // 删除命名管道文件
    fs.remove(this.pipeName, (err) => {
      if (err) console.error("Failed to remove pipe file:", err);
    });
  }
}

// PTY启动命令实现（单实例版本）
export default class PtyStartCommand extends AbsStartCommand {
  
  // 读取PTY子进程配置信息
  readPtySubProcessConfig(subProcess: ChildProcessWithoutNullStreams): Promise<IPtySubProcessCfg> {
    return new Promise((resolve) => {
      const errConfig = { pid: 0 };
      
      // 创建readline接口来读取PTY程序的输出
      const rl = readline.createInterface({
        input: subProcess.stdout,
        crlfDelay: Infinity
      });
      
      rl.on("line", (line = "") => {
        try {
          rl.removeAllListeners();
          // PTY程序启动后会输出一行JSON，包含实际进程的PID
          const cfg = JSON.parse(line) as IPtySubProcessCfg;
          if (cfg.pid == null) throw new Error("Invalid PID");
          resolve(cfg);
        } catch (error: any) {
          resolve(errConfig);
        }
      });
      
      // 3秒超时
      setTimeout(() => {
        resolve(errConfig);
      }, 3000);
    });
  }

  async createProcess(instance: any) {
    // 验证启动条件
    if (
      !instance.config.startCommand ||
      !instance.config.hasCwdPath() ||
      !instance.config.ie ||
      !instance.config.oe
    ) {
      throw new Error("Invalid instance configuration for PTY");
    }

    // 创建工作目录
    const workDir = instance.config.absoluteCwdPath();
    if (!fs.existsSync(workDir)) {
      fs.mkdirpSync(workDir);
    }
      
    if (!path.isAbsolute(path.normalize(workDir))) {
      throw new Error("Working directory must be absolute path");
    }

    // 检查PTY程序是否存在
    console.log("Starting PTY process...");
    let checkPtyEnv = true;

    if (!fs.existsSync(PTY_PATH)) {
      console.error("PTY program not found:", PTY_PATH);
      checkPtyEnv = false;
    }

    // 如果PTY环境检查失败，抛出错误
    if (checkPtyEnv === false) {
      throw new Error("PTY program not found, cannot start in PTY mode");
    }

    // 设置启动状态
    instance.status = 1; // STATUS_STARTING
    instance.startCount = (instance.startCount || 0) + 1;

    // 解析启动命令
    let commandList: string[] = [];
    if (os.platform() === "win32") {
      // Windows: 直接使用命令
      commandList = [instance.config.startCommand];
    } else {
      // Linux/Mac: 解析命令行参数
      commandList = commandStringToArray(instance.config.startCommand);
    }

    if (commandList.length === 0) {
      throw new Error("Empty command");
    }

    // 生成唯一的管道名称
    const pipeId = v4();
    const pipeLinuxDir = "/tmp/mcsmanager-instance-pipe";
    if (!fs.existsSync(pipeLinuxDir)) fs.mkdirsSync(pipeLinuxDir);
    
    let pipeName = `${pipeLinuxDir}/pipe-${pipeId}`;
    if (os.platform() === "win32") {
      pipeName = `\\\\.\\pipe\\mcsmanager-${pipeId}`;
    }

    // 获取运行用户配置
    const runAsConfig = await getRunAsUserParams(instance.config);

    // 准备PTY程序参数
    const ptyParameter = [
      "-size",    // 终端大小参数
      `${instance.config.terminalOption.ptyWindowCol},${instance.config.terminalOption.ptyWindowRow}`,
      "-coder",   // 字符编码
      instance.config.oe,
      "-dir",     // 工作目录
      workDir,
      "-fifo",    // 命名管道路径
      pipeName,
      "-cmd",     // 要执行的命令
      JSON.stringify(commandList)
    ];

    // 记录启动信息
    console.log("----------------");
    console.log("PTY Start Request");
    console.log(`Start Command: ${commandList.join(" ")}`);
    console.log(`PTY Path: ${PTY_PATH}`);
    console.log(`PTY Parameters: ${ptyParameter.join(" ")}`);
    console.log(`PTY CWD: ${workDir}`);
    console.log(`Run As User: ${runAsConfig.runAsName}`);
    console.log("----------------");

    if (runAsConfig.isEnableRunAs) {
      console.log(`Running as user: ${runAsConfig.runAsName}`);
    }

    // 创建PTY子进程
    const subProcess = spawn(PTY_PATH, ptyParameter, {
      ...runAsConfig,
      cwd: path.dirname(PTY_PATH),
      stdio: "pipe",
      windowsHide: true,
      env: instance.config.generateEnv(),
      detached: false  // 不分离子进程，确保父进程退出时子进程也会退出
    });

    // 检查PTY子进程创建结果
    if (!subProcess || !subProcess.pid) {
      console.error("Failed to create PTY process");
      throw new Error("PTY process creation failed");
    }

    // 创建进程适配器
    const ptySubProcessCfg = await this.readPtySubProcessConfig(subProcess);
    const processAdapter = new GoPtyProcessAdapter(subProcess, ptySubProcessCfg.pid, pipeName);

    // 验证进程状态
    if (subProcess.exitCode !== null || processAdapter.pid == null || processAdapter.pid === 0) {
      console.error("PTY process failed to start properly");
      throw new Error("PTY process startup validation failed");
    }

    // 设置进程适配器
    instance.process = processAdapter;
    instance.status = 3; // STATUS_RUNNING

    // 触发启动成功事件
    instance.emit("started", processAdapter);

    console.log(`PTY process started successfully. PID: ${ptySubProcessCfg.pid}`);
    console.log("Emulated Terminal Started");
    console.log("Process is running in PTY mode");
  }
}
```

### 3. PTY进程适配器 (GoPtyProcessAdapter)

这是核心的PTY进程封装类，位于`daemon/src/entity/commands/pty/pty_start.ts`：

```typescript
import { $t } from "../../../i18n";
import os from "os";
import Instance from "../../instance/instance";
import logger from "../../../service/log";
import fs from "fs-extra";
import path from "path";
import readline from "readline";
import EventEmitter from "events";
import { IInstanceProcess } from "../../instance/interface";
import { ChildProcess, spawn } from "child_process";
import { commandStringToArray } from "../base/command_parser";
import { killProcess } from "mcsmanager-common";
import { PTY_PATH } from "../../../const";
import { Writable } from "stream";
import { v4 } from "uuid";
import { getRunAsUserParams } from "../../../tools/system_user";

// PTY消息类型定义
const GO_PTY_MSG_TYPE = {
  RESIZE: 0x04  // 调整终端大小的消息类型
};

// PTY进程适配器类
export class GoPtyProcessAdapter extends EventEmitter implements IInstanceProcess {
  private pipeClient?: Writable;  // 命名管道客户端

  constructor(
    private readonly process: ChildProcess,  // PTY子进程
    public readonly pid: number,            // 实际进程PID
    public readonly pipeName: string        // 命名管道名称
  ) {
    super();
    
    // 监听PTY进程的标准输出和错误输出
    process.stdout?.on("data", (text) => this.emit("data", text));
    process.stderr?.on("data", (text) => this.emit("data", text));
    process.on("exit", (code) => this.emit("exit", code));
    
    // 初始化命名管道连接
    this.initNamedPipe();
  }

  // 初始化命名管道连接
  private async initNamedPipe() {
    try {
      const fd = await fs.open(this.pipeName, "w");
      const writePipe = fs.createWriteStream("", { fd });
      
      writePipe.on("close", () => {});
      writePipe.on("end", () => {});
      writePipe.on("error", (err) => {
        logger.error("Pipe error:", this.pipeName, err);
      });
      
      this.pipeClient = writePipe;
    } catch (error) {
      throw new Error(`Failed to initialize named pipe: ${error}`);
    }
  }

  // 调整终端大小
  public resize(w: number, h: number) {
    const MAX_W = 900;
    if (w > MAX_W) w = MAX_W;
    if (h > MAX_W) h = MAX_W;
    
    // 构造调整大小的消息
    const resizeStruct = JSON.stringify({ 
      width: Number(w), 
      height: Number(h) 
    });
    
    const len = resizeStruct.length;
    const lenBuff = Buffer.alloc(2);
    lenBuff.writeInt16BE(len, 0);
    
    // 消息格式: [消息类型][长度][JSON数据]
    const buf = Buffer.from([
      GO_PTY_MSG_TYPE.RESIZE, 
      ...lenBuff, 
      ...Buffer.from(resizeStruct)
    ]);
    
    this.writeToNamedPipe(buf);
  }

  // 向命名管道写入数据
  public writeToNamedPipe(data: Buffer) {
    this.pipeClient?.write(data);
  }

  // 向PTY进程写入数据（用户输入）
  public write(data?: string) {
    return this.process.stdin?.write(data);
  }

  // 终止进程
  public kill(s?: any) {
    return killProcess(this.pid, this.process, s);
  }

  // 清理资源
  public async destroy() {
    // 移除所有事件监听器
    for (const n of this.eventNames()) this.removeAllListeners(n);
    
    if (this.process.stdout)
      for (const eventName of this.process.stdout.eventNames())
        this.process.stdout.removeAllListeners(eventName);
        
    if (this.process.stderr)
      for (const eventName of this.process.stderr.eventNames())
        this.process.stderr.removeAllListeners(eventName);
        
    if (this.process)
      for (const eventName of this.process.eventNames())
        this.process.stdout?.removeAllListeners(eventName);
        
    if (this.pipeClient)
      for (const eventName of this.pipeClient.eventNames())
        this.pipeClient.removeAllListeners(eventName);

    // 关闭管道和进程
    this.pipeClient?.destroy();
    this.process?.stdout?.destroy();
    this.process?.stderr?.destroy();
    
    if (this.process?.exitCode === null) {
      this.process.kill("SIGTERM");
      this.process.kill("SIGKILL");
    }
    
    // 删除命名管道文件
    fs.remove(this.pipeName, (err) => {});
  }
}
```

### 4. PTY启动命令实现

继续在同一文件中，`PtyStartCommand`类负责启动PTY进程：

```typescript
// PTY子进程配置接口
interface IPtySubProcessCfg {
  pid: number;  // 实际运行的目标进程PID
}

// 启动错误异常类
class StartupError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export default class PtyStartCommand extends AbsStartCommand {
  
  // 读取PTY子进程配置信息
  readPtySubProcessConfig(subProcess: ChildProcessWithoutNullStreams): Promise<IPtySubProcessCfg> {
    return new Promise((resolve, reject) => {
      const errConfig = { pid: 0 };
      
      // 创建readline接口来读取PTY程序的输出
      const rl = readline.createInterface({
        input: subProcess.stdout,
        crlfDelay: Infinity
      });
      
      rl.on("line", (line = "") => {
        try {
          rl.removeAllListeners();
          // PTY程序启动后会输出一行JSON，包含实际进程的PID
          const cfg = JSON.parse(line) as IPtySubProcessCfg;
          if (cfg.pid == null) throw new Error("Invalid PID");
          resolve(cfg);
        } catch (error: any) {
          resolve(errConfig);
        }
      });
      
      // 3秒超时
      setTimeout(() => {
        resolve(errConfig);
      }, 3000);
    });
  }

  async createProcess(instance: Instance) {
    // 验证启动条件
    if (
      !instance.config.startCommand ||
      !instance.hasCwdPath() ||
      !instance.config.ie ||
      !instance.config.oe
    )
      throw new StartupError("Invalid instance configuration for PTY");

    // 创建工作目录
    if (!fs.existsSync(instance.absoluteCwdPath())) 
      fs.mkdirpSync(instance.absoluteCwdPath());
      
    if (!path.isAbsolute(path.normalize(instance.absoluteCwdPath())))
      throw new StartupError("Working directory must be absolute path");

    // 检查PTY程序是否存在
    logger.info("Starting PTY process...");
    let checkPtyEnv = true;

    if (!fs.existsSync(PTY_PATH)) {
      instance.println("ERROR", "PTY program not found");
      checkPtyEnv = false;
    }

    // 如果PTY环境检查失败，降级到普通模式
    if (checkPtyEnv === false) {
      instance.config.terminalOption.pty = false;
      await instance.forceExec(new FunctionDispatcher());
      await instance.execPreset("start");
      return;
    }

    // 设置启动状态
    instance.status(Instance.STATUS_STARTING);
    instance.startCount++;

    // 解析启动命令
    let commandList: string[] = [];
    if (os.platform() === "win32") {
      // Windows: 直接使用命令
      commandList = [instance.config.startCommand];
    } else {
      // Linux/Mac: 解析命令行参数
      commandList = commandStringToArray(instance.config.startCommand);
    }

    if (commandList.length === 0)
      return instance.failure(new StartupError("Empty command"));

    // 生成唯一的管道名称
    const pipeId = v4();
    const pipeLinuxDir = "/tmp/mcsmanager-instance-pipe";
    if (!fs.existsSync(pipeLinuxDir)) fs.mkdirsSync(pipeLinuxDir);
    
    let pipeName = `${pipeLinuxDir}/pipe-${pipeId}`;
    if (os.platform() === "win32") {
      pipeName = `\\\\.\\pipe\\mcsmanager-${pipeId}`;
    }

    // 获取运行用户配置
    const runAsConfig = await getRunAsUserParams(instance);

    // 准备PTY程序参数
    const ptyParameter = [
      "-size",    // 终端大小参数
      `${instance.config.terminalOption.ptyWindowCol},${instance.config.terminalOption.ptyWindowRow}`,
      "-coder",   // 字符编码
      instance.config.oe,
      "-dir",     // 工作目录
      instance.absoluteCwdPath(),
      "-fifo",    // 命名管道路径
      pipeName,
      "-cmd",     // 要执行的命令
      JSON.stringify(commandList)
    ];

    // 记录启动信息
    logger.info("----------------");
    logger.info("PTY Start Request");
    logger.info(`Instance UUID: ${instance.instanceUuid}`);
    logger.info(`Start Command: ${commandList.join(" ")}`);
    logger.info(`PTY Path: ${PTY_PATH}`);
    logger.info(`PTY Parameters: ${ptyParameter.join(" ")}`);
    logger.info(`PTY CWD: ${instance.absoluteCwdPath()}`);
    logger.info(`Run As User: ${runAsConfig.runAsName}`);
    logger.info("----------------");

    if (runAsConfig.isEnableRunAs) {
      instance.println("INFO", `Running as user: ${runAsConfig.runAsName}`);
    }

    // 创建PTY子进程
    const subProcess = spawn(PTY_PATH, ptyParameter, {
      ...runAsConfig,
      cwd: path.dirname(PTY_PATH),
      stdio: "pipe",
      windowsHide: true,
      env: instance.generateEnv(),
      detached: false  // 不分离子进程，确保父进程退出时子进程也会退出
    });

    // 检查PTY子进程创建结果
    if (!subProcess || !subProcess.pid) {
      instance.println("ERROR", `Failed to create PTY process`);
      throw new StartupError("PTY process creation failed");
    }

    // 创建进程适配器
    const ptySubProcessCfg = await this.readPtySubProcessConfig(subProcess);
    const processAdapter = new GoPtyProcessAdapter(subProcess, ptySubProcessCfg.pid, pipeName);

    // 验证进程状态
    if (subProcess.exitCode !== null || processAdapter.pid == null || processAdapter.pid === 0) {
      instance.println("ERROR", "PTY process failed to start properly");
      throw new StartupError("PTY process startup validation failed");
    }

    // 触发实例启动事件
    instance.started(processAdapter);

    logger.info(`PTY process started successfully. Instance: ${instance.instanceUuid}, PID: ${ptySubProcessCfg.pid}`);
    instance.println("INFO", "Emulated Terminal Started");
    instance.println("INFO", "Process is running in PTY mode");
  }
}
```

### 5. PTY调整大小命令

在`daemon/src/entity/commands/pty/pty_resize.ts`中实现终端大小调整：

```typescript
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import { GoPtyProcessAdapter } from "./pty_start";

export default class PtyResizeCommand extends InstanceCommand {
  constructor() {
    super("ResizeTTY");
  }

  async exec(instance: Instance): Promise<any> {
    // 获取PTY进程适配器
    const pty = instance.process as Partial<GoPtyProcessAdapter>;
    
    // 如果适配器支持resize方法
    if (typeof pty?.resize === "function") {
      // 计算所有观察者的最小终端大小
      const { w, h } = instance.computeTerminalSize();
      // 调用resize方法
      pty?.resize(w, h);
    }
  }
}
```

### 6. 命令调度器 (FunctionDispatcher)

在`daemon/src/entity/commands/dispatcher.ts`中，根据实例配置选择使用PTY模式：

```typescript
import Instance from "../instance/instance";
import InstanceCommand from "./base/command";
import GeneralStartCommand from "./general/general_start";
import GeneralStopCommand from "./general/general_stop";
import GeneralKillCommand from "./general/general_kill";
import GeneralSendCommand from "./general/general_command";
import GeneralRestartCommand from "./general/general_restart";
import GeneralUpdateCommand from "./general/general_update";
import GeneralInstallCommand from "./general/general_install";
import PtyStartCommand from "./pty/pty_start";
import PtyResizeCommand from "./pty/pty_resize";
import DockerStartCommand from "./docker/docker_start";
import DockerResizeCommand from "./docker/docker_pty_resize";
import RconCommand from "./steam/rcon_command";
import NullCommand from "./nullfunc";

// 预设命令类型定义
export type IPresetCommand =
  | "start"
  | "stop"
  | "restart"
  | "kill"
  | "update"
  | "refreshPlayers"
  | "command"
  | "resize"
  | "install";

// 实例功能调度器
export default class FunctionDispatcher extends InstanceCommand {
  constructor() {
    super("FunctionDispatcher");
  }

  async exec(instance: Instance) {
    // 初始化所有模块
    instance.lifeCycleTaskManager.clearLifeCycleTask();
    instance.clearPreset();

    // 实例必须挂载的基础功能
    instance.setPreset("command", new GeneralSendCommand());
    instance.setPreset("stop", new GeneralStopCommand());
    instance.setPreset("kill", new GeneralKillCommand());
    instance.setPreset("restart", new GeneralRestartCommand());
    instance.setPreset("update", new GeneralUpdateCommand());
    instance.setPreset("refreshPlayers", new NullCommand());
    instance.setPreset("install", new GeneralInstallCommand());

    // 根据实例启动类型预设基本操作模式
    if (!instance.config.processType || instance.config.processType === "general") {
      instance.setPreset("start", new GeneralStartCommand());
    }

    // *** 关键部分：启用仿真终端模式 ***
    if (instance.config.terminalOption.pty && instance.config.processType === "general") {
      // 替换start命令为PTY启动命令
      instance.setPreset("start", new PtyStartCommand());
      // 添加resize命令支持
      instance.setPreset("resize", new PtyResizeCommand());
    }

    // Docker PTY模式
    if (instance.config.processType === "docker") {
      instance.setPreset("start", new DockerStartCommand());
      instance.setPreset("resize", new DockerResizeCommand());
    }

    // 其他功能...
    if (instance.config.enableRcon) {
      instance.setPreset("command", new RconCommand());
    }
  }
}
```

### 7. 实例中的终端大小计算

在`daemon/src/entity/instance/instance.ts`中，计算所有连接客户端的最小终端大小：

```typescript
export default class Instance extends EventEmitter {
  // WebSocket观察者映射，存储每个连接的终端大小
  public watchers: Map<string, IWatcherInfo> = new Map();

  // 计算终端大小（取所有观察者的最小值）
  computeTerminalSize() {
    let minW = this.config.terminalOption.ptyWindowCol;  // 默认列数
    let minH = this.config.terminalOption.ptyWindowRow;  // 默认行数
    
    // 遍历所有观察者，找到最小的终端大小
    for (const iterator of this.watchers.values()) {
      const { w, h } = iterator.terminalSize;
      if (w && h) {
        if (w < minW) minW = w;
        if (h < minH) minH = h;
      }
    }
    
    return {
      w: minW,
      h: minH
    };
  }
}

// 观察者信息接口
interface IWatcherInfo {
  terminalSize: {
    w: number;
    h: number;
  };
}
```

---

## WebSocket通信协议（单实例版本）

### 1. WebSocket路由处理（简化版）

```typescript
import EventEmitter from "events";
import { Server } from "socket.io";
import { createServer } from "http";

// 单实例终端状态
interface TerminalState {
  process?: any;           // PTY进程适配器
  status: number;         // 实例状态 0=停止 1=启动中 3=运行中
  config: InstanceConfig; // 实例配置
  watchers: Map<string, { terminalSize: { w: number; h: number } }>; // 观察者列表
}

// 全局终端状态
let terminalState: TerminalState = {
  status: 0,
  config: new InstanceConfig(),
  watchers: new Map()
};

// Socket.io服务器设置
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 临时密码存储（简单版本）
const tempPasswords = new Map<string, { expiry: number }>();

// 生成临时密码
export function generateTempPassword(): string {
  const password = Math.random().toString(36).substring(2, 15);
  const expiry = Date.now() + 5 * 60 * 1000; // 5分钟过期
  tempPasswords.set(password, { expiry });
  return password;
}

// 验证临时密码
function verifyTempPassword(password: string): boolean {
  const entry = tempPasswords.get(password);
  if (!entry || entry.expiry < Date.now()) {
    tempPasswords.delete(password);
    return false;
  }
  return true;
}

// Socket.io连接处理
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  let authenticated = false;

  // *** 1. 认证路由 ***
  socket.on("stream/auth", (data) => {
    try {
      const password = data.data?.password;
      
      if (!password || !verifyTempPassword(password)) {
        socket.emit("stream/auth", { data: false, error: "Invalid password" });
        return;
      }

      // 认证成功
      authenticated = true;
      
      // 如果有进程在运行，开始转发输出
      if (terminalState.process) {
        terminalState.process.on("data", (text: string) => {
          socket.emit("instance/stdout", { data: { text } });
        });

        terminalState.process.on("exit", (code: number) => {
          socket.emit("instance/stopped", { code });
          terminalState.status = 0;
        });
      }

      socket.emit("stream/auth", { data: true });
    } catch (error: any) {
      socket.emit("stream/auth", { data: false, error: error.message });
    }
  });

  // 认证检查中间件
  const requireAuth = (callback: Function) => {
    return (...args: any[]) => {
      if (!authenticated) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }
      callback(...args);
    };
  };

  // *** 2. 获取实例详情 ***
  socket.on("stream/detail", requireAuth(() => {
    socket.emit("stream/detail", {
      data: {
        status: terminalState.status,
        config: terminalState.config,
        watcher: terminalState.watchers.size,
        process: !!terminalState.process
      }
    });
  }));

  // *** 3. 执行命令（行交互模式） ***
  socket.on("stream/input", requireAuth((data) => {
    try {
      const command = data.data?.command;
      if (!command || !terminalState.process) return;
      
      // 发送命令到PTY进程（添加换行符）
      terminalState.process.write(command + "\n");
    } catch (error: any) {
      console.error("Error sending command:", error);
    }
  }));

  // *** 4. 处理终端输入（原始输入模式） ***
  socket.on("stream/write", requireAuth((data) => {
    try {
      const input = data.data?.input;
      if (!input || !terminalState.process) return;
      
      // 直接发送原始输入到PTY进程
      terminalState.process.write(input);
    } catch (error: any) {
      console.error("Error writing to process:", error);
    }
  }));

  // *** 5. 处理终端调整大小 ***
  socket.on("stream/resize", requireAuth((data) => {
    try {
      const w = Number(data.data?.w) || 0;
      const h = Number(data.data?.h) || 0;
      
      if (w <= 0 || h <= 0) return;

      // 更新这个Socket连接的终端大小信息
      terminalState.watchers.set(socket.id, {
        terminalSize: { w, h }
      });

      // 计算所有观察者的最小终端大小
      const minSize = computeTerminalSize();
      
      // 调整PTY进程的终端大小
      if (terminalState.process && typeof terminalState.process.resize === "function") {
        terminalState.process.resize(minSize.w, minSize.h);
      }
    } catch (error: any) {
      console.error("Error resizing terminal:", error);
    }
  }));

  // *** 6. 断开连接处理 ***
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    
    // 从观察者列表中移除
    terminalState.watchers.delete(socket.id);
    
    // 如果没有观察者了，可以考虑停止进程（可选）
    if (terminalState.watchers.size === 0) {
      console.log("No more watchers, process continues running");
    }
  });
});

// 计算终端大小（取所有观察者的最小值）
function computeTerminalSize() {
  let minW = terminalState.config.terminalOption.ptyWindowCol;
  let minH = terminalState.config.terminalOption.ptyWindowRow;
  
  for (const watcher of terminalState.watchers.values()) {
    const { w, h } = watcher.terminalSize;
    if (w && h) {
      if (w < minW) minW = w;
      if (h < minH) minH = h;
    }
  }
  
  return { w: minW, h: minH };
}

// 启动WebSocket服务器
export function startWebSocketServer(port: number = 24445) {
  httpServer.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`);
  });
  
  return { io, httpServer };
}
```

### 2. 单实例管理类

```typescript
import { EventEmitter } from "events";

// 单实例管理类
export class SingleInstanceManager extends EventEmitter {
  private instance: TerminalState;
  
  constructor() {
    super();
    this.instance = {
      status: 0,
      config: new InstanceConfig(),
      watchers: new Map()
    };
  }

  // 获取实例状态
  getInstanceState(): TerminalState {
    return this.instance;
  }

  // 启动实例
  async startInstance(): Promise<void> {
    if (this.instance.status !== 0) {
      throw new Error("Instance is not stopped");
    }

    try {
      // 使用PTY启动命令
      const startCommand = new PtyStartCommand();
      await startCommand.exec(this);

      // 启动成功后的处理
      this.instance.status = 3; // STATUS_RUNNING
      this.emit("started");
      
    } catch (error) {
      this.instance.status = 0; // STATUS_STOP
      this.emit("error", error);
      throw error;
    }
  }

  // 停止实例
  async stopInstance(): Promise<void> {
    if (this.instance.process) {
      try {
        // 发送停止信号
        this.instance.process.write("\x03"); // Ctrl+C
        
        // 等待进程退出
        setTimeout(() => {
          if (this.instance.process) {
            this.instance.process.kill("SIGTERM");
          }
        }, 5000);
        
      } catch (error) {
        console.error("Error stopping instance:", error);
      }
    }
    
    this.instance.status = 0;
    this.instance.process = undefined;
    this.emit("stopped");
  }

  // 发送命令到实例
  sendCommand(command: string): void {
    if (this.instance.process) {
      this.instance.process.write(command + "\n");
    }
  }

  // 调整终端大小
  resizeTerminal(w: number, h: number): void {
    if (this.instance.process && typeof this.instance.process.resize === "function") {
      this.instance.process.resize(w, h);
    }
  }

  // 实现启动命令所需的方法
  get config() {
    return this.instance.config;
  }

  get process() {
    return this.instance.process;
  }

  set process(proc: any) {
    this.instance.process = proc;
  }

  status(newStatus?: number) {
    if (newStatus !== undefined) {
      this.instance.status = newStatus;
    }
    return this.instance.status;
  }

  setLock(locked: boolean) {
    // 简化版本，不实现锁机制
  }

  print(text: string) {
    console.log(text);
  }

  println(level: string, text: string) {
    console.log(`[${level}] ${text}`);
  }

  failure(error: Error) {
    console.error("Instance failure:", error);
    this.emit("error", error);
  }

  releaseResources() {
    if (this.instance.process) {
      this.instance.process.destroy();
    }
  }
}

### 3. WebSocket消息协议格式（单实例版本）

#### 3.1 认证消息
```json
// 客户端发送认证请求
{
  "event": "stream/auth",
  "data": {
    "password": "临时密码字符串"
  }
}

// 服务端认证成功响应
{
  "event": "stream/auth",
  "data": true
}

// 服务端认证失败响应
{
  "event": "stream/auth", 
  "data": false,
  "error": "Invalid password"
}
```

#### 3.2 终端输入消息
```json
// 命令行输入（会自动添加换行符）
{
  "event": "stream/input", 
  "data": {
    "command": "ls -la"
  }
}

// 原始终端输入（PTY模式，不添加换行符）
{
  "event": "stream/write",
  "data": {
    "input": "字符数据或按键序列"
  }
}
```

#### 3.3 终端大小调整消息
```json
// 客户端发送大小调整请求
{
  "event": "stream/resize",
  "data": {
    "w": 80,    // 终端宽度（列数）
    "h": 24     // 终端高度（行数）
  }
}
```

#### 3.4 获取实例状态
```json
// 客户端请求实例详情
{
  "event": "stream/detail"
}

// 服务端返回实例详情
{
  "event": "stream/detail",
  "data": {
    "status": 3,                    // 实例状态：0=停止，1=启动中，3=运行中
    "config": {                     // 实例配置
      "nickname": "PTY Instance",
      "startCommand": "java -jar server.jar",
      "terminalOption": {
        "pty": true,
        "ptyWindowCol": 80,
        "ptyWindowRow": 24
      }
    },
    "watcher": 1,                   // 当前观察者数量
    "process": true                 // 是否有进程在运行
  }
}
```

#### 3.5 服务端推送消息
```json
// 终端输出数据
{
  "event": "instance/stdout",
  "data": {
    "text": "服务器输出文本内容\n"
  }
}

// 实例停止通知
{
  "event": "instance/stopped",
  "code": 0
}

// 错误消息
{
  "event": "error",
  "message": "错误描述"
}
```

### 4. HTTP API接口（获取终端连接信息）

```typescript
import express from "express";

const app = express();

// 获取终端流通道信息的API
app.post("/api/instance/terminal", (req, res) => {
  try {
    // 生成临时密码
    const password = generateTempPassword();
    
    // 返回WebSocket连接信息
    res.json({
      success: true,
      data: {
        addr: `ws://localhost:24445`,  // WebSocket服务器地址
        password: password,            // 临时认证密码
        prefix: ""                     // 路径前缀（可选）
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动HTTP服务器
app.listen(23333, () => {
  console.log("HTTP API server listening on port 23333");
});
```

### 5. 完整的单实例启动流程

```typescript
// 主启动文件 - app.ts
import { startWebSocketServer } from "./websocket-server";
import { SingleInstanceManager } from "./instance-manager";

async function main() {
  // 1. 启动WebSocket服务器
  const { io, httpServer } = startWebSocketServer(24445);
  
  // 2. 创建单实例管理器
  const instanceManager = new SingleInstanceManager();
  
  // 3. 配置实例
  instanceManager.config.startCommand = "node server.js"; // 您的启动命令
  instanceManager.config.cwd = "./workspace";             // 工作目录
  instanceManager.config.terminalOption.pty = true;       // 启用PTY模式
  
  // 4. 监听实例事件
  instanceManager.on("started", () => {
    console.log("Instance started successfully");
  });
  
  instanceManager.on("stopped", () => {
    console.log("Instance stopped");
  });
  
  instanceManager.on("error", (error) => {
    console.error("Instance error:", error);
  });
  
  // 5. 启动HTTP API服务器
  const express = require("express");
  const apiApp = express();
  
  apiApp.use(express.json());
  
  // 获取终端连接信息
  apiApp.post("/api/instance/terminal", (req, res) => {
    const password = generateTempPassword();
    res.json({
      success: true,
      data: {
        addr: "ws://localhost:24445",
        password: password,
        prefix: ""
      }
    });
  });
  
  // 启动/停止实例的API
  apiApp.post("/api/instance/start", async (req, res) => {
    try {
      await instanceManager.startInstance();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  apiApp.post("/api/instance/stop", async (req, res) => {
    try {
      await instanceManager.stopInstance();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  apiApp.listen(23333, () => {
    console.log("HTTP API server listening on port 23333");
  });
  
  console.log("PTY Terminal Server started");
  console.log("WebSocket: ws://localhost:24445");
  console.log("HTTP API: http://localhost:23333");
}

// 启动服务
main().catch(console.error);
```

### 3. WebSocket消息协议格式

#### 3.1 认证消息
```json
// 客户端发送
{
  "event": "stream/auth",
  "data": {
    "password": "临时任务密码"
  }
}

// 服务端响应
{
  "status": "success",
  "data": true
}
```

#### 3.2 终端输入消息
```json
// 普通命令输入
{
  "event": "stream/input", 
  "data": {
    "command": "ls -la\n"
  }
}

// 原始终端输入（PTY模式）
{
  "event": "stream/write",
  "data": {
    "input": "字符数据或按键序列"
  }
}
```

#### 3.3 终端大小调整消息
```json
{
  "event": "stream/resize",
  "data": {
    "w": 80,    // 列数
    "h": 24     // 行数
  }
}
```

#### 3.4 实例详情查询
```json
// 客户端发送
{
  "event": "stream/detail"
}

// 服务端响应
{
  "status": "success", 
  "data": {
    "instanceUuid": "实例ID",
    "started": 1,
    "status": 3,
    "config": { /* 实例配置 */ },
    "info": { /* 实例信息 */ },
    "watcher": 2  // 观察者数量
  }
}
```

---

## 前端实现（单实例简化版本）

### 1. 前端终端架构

前端终端实现基于以下核心技术：
- **Vue.js 3 + Composition API**：组件框架
- **xterm.js**：浏览器终端模拟器
- **Socket.io-client**：WebSocket通信
- **TypeScript**：类型安全

### 2. 核心Hooks - useTerminal（简化版本）

单实例版本的终端Hook，移除了多实例管理的复杂性：

```typescript
// useTerminal.ts - 终端交互Hook（单实例版本）
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { CanvasAddon } from "@xterm/addon-canvas"; 
import { WebglAddon } from "@xterm/addon-webgl";
import EventEmitter from "eventemitter3";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { computed, onMounted, onUnmounted, ref } from "vue";

// 终端参数接口（简化版本）
export interface UseTerminalParams {
  serverUrl?: string;     // 服务器地址，默认为localhost
  port?: number;          // WebSocket端口，默认为24445
}

// 实例状态接口（简化版本）
export interface InstanceState {
  status: number;         // 实例状态：0=停止，1=启动中，3=运行中
  nickname: string;       // 实例名称
  hasProcess: boolean;    // 是否有进程在运行
  terminalOption: {
    pty: boolean;         // 是否启用PTY模式
    haveColor: boolean;   // 是否支持颜色输出
  };
}

// 标准输出数据接口
export interface StdoutData {
  text: string;
}

// 实例状态常量
export const INSTANCE_STATUS = {
  STOPPED: 0,
  STARTING: 1,
  RUNNING: 3
} as const;

export function useTerminal() {
  const events = new EventEmitter();              // 事件发射器
  let socket: Socket | undefined;                 // WebSocket连接
  const state = ref<InstanceState>();             // 实例状态
  const isReady = ref<boolean>(false);            // 是否就绪
  const terminal = ref<Terminal>();               // xterm终端实例
  const isConnect = ref<boolean>(false);          // 连接状态
  const socketAddress = ref("");                  // Socket地址

  let fitAddonTask: NodeJS.Timer;                 // 自适应大小任务
  let cachedSize = { w: 160, h: 40 };            // 缓存的终端大小

  // *** 1. 执行连接 - 简化版本 ***
  const execute = async (config: UseTerminalParams = {}) => {
    isReady.value = false;
    
    // 使用默认配置或用户提供的配置
    const serverUrl = config.serverUrl || 'localhost';
    const port = config.port || 24445;
    
    // 先通过HTTP API获取终端连接信息
    try {
      const response = await fetch(`http://${serverUrl}:23333/api/instance/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get terminal info');
      }
      
      const { addr, password } = result.data;
      socketAddress.value = addr;
      
      // 创建Socket.io连接
      socket = io(addr, {
        path: "/socket.io",
        multiplex: false,
        reconnectionDelayMax: 1000 * 10,
        timeout: 1000 * 30,
        reconnection: true,
        reconnectionAttempts: 3,
        rejectUnauthorized: false
      });

      // *** 2. WebSocket事件处理 ***
      
      // 连接成功
      socket.on("connect", () => {
        console.log("[Socket.io] connect:", addr);
        // 发送认证信息
        socket?.emit("stream/auth", {
          password: password
        });
        isConnect.value = true;
      });

      // 连接错误
      socket.on("connect_error", (error) => {
        console.error("[Socket.io] Connect error: ", addr, error);
        isConnect.value = false;
        events.emit("error", error);
      });

      // 实例状态变化事件
      socket.on("instance/stopped", (code) => {
        console.log("Instance stopped with code:", code);
        events.emit("stopped", code);
      });

      // 认证响应
      socket.on("stream/auth", (data) => {
        if (data === true) {
          // 认证成功，请求实例详情
          socket?.emit("stream/detail");
          events.emit("connect");
          isReady.value = true;
        } else {
          events.emit("error", new Error("Authentication failed!"));
        }
      });

      // 重连处理
      socket.on("reconnect", () => {
        console.warn("[Socket.io] reconnect:", addr);
        isConnect.value = true;
        socket?.emit("stream/auth", {
          password: password
        });
      });

      // 断连处理
      socket.on("disconnect", () => {
        console.warn("[Socket.io] disconnect:", addr);
        isConnect.value = false;
        events.emit("disconnect");
      });

      // *** 3. 核心数据流事件 ***
      
      // 接收终端输出
      socket.on("instance/stdout", (packet) => {
        events.emit("stdout", packet?.data || packet);
      });
      
      // 接收实例详情
      socket.on("stream/detail", (packet) => {
        const instanceData = packet?.data || packet;
        if (instanceData) {
          state.value = {
            status: instanceData.status || INSTANCE_STATUS.STOPPED,
            nickname: instanceData.config?.nickname || "PTY Terminal",
            hasProcess: instanceData.process || false,
            terminalOption: {
              pty: instanceData.config?.terminalOption?.pty || true,
              haveColor: instanceData.config?.terminalOption?.haveColor !== false
            }
          };
          events.emit("detail", state.value);
        }
      });

      // 错误处理
      socket.on("error", (error) => {
        console.error("Socket error:", error);
        events.emit("error", error);
      });

      socket.connect();
      return socket;
      
    } catch (error) {
      console.error("Failed to setup terminal connection:", error);
      events.emit("error", error);
      throw error;
    }
  };

  // *** 4. 终端大小调整 ***
  const refreshWindowSize = (w: number, h: number) => {
    cachedSize = { w, h };
    // 发送resize事件到后端
    socket?.emit("stream/resize", {
      w: w,
      h: h
    });
  };

  // *** 5. 初始化终端窗口 ***
  const initTerminalWindow = (element: HTMLElement) => {
    // 移动端触摸事件处理
    const touchHandler = (e: TouchEvent) => {
      e.stopPropagation();
    };
    
    element.addEventListener("touchstart", touchHandler, true);
    element.addEventListener("touchmove", touchHandler, true);
    element.addEventListener("touchend", touchHandler, true);
    element.addEventListener("touchcancel", touchHandler, true);

    // 创建xterm终端实例
    const term = new Terminal({
      convertEol: true,         // 自动转换行尾符
      disableStdin: false,      // 启用标准输入
      cursorStyle: "underline", // 光标样式
      cursorBlink: true,        // 光标闪烁
      fontSize: 14,             // 字体大小
      theme: {
        background: "#1e1e1e"   // 背景颜色
      },
      allowProposedApi: true,
      allowTransparency: true
    });

    // 加载自适应大小插件
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 检查WebGL支持并加载对应的渲染插件
    try {
      const webGL2 = document.createElement("canvas").getContext("webgl2");
      if (webGL2) {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss((_) => {
          webglAddon.dispose();
        });
        term.loadAddon(webglAddon);
      } else {
        const canvasAddon = new CanvasAddon();
        term.loadAddon(canvasAddon);
      }
    } catch (error) {
      console.warn("Failed to load terminal addon:", error);
      // 降级到基本渲染
    }

    // 打开终端
    term.open(element);

    // *** 6. 自动调整终端大小 ***
    fitAddon.fit();
    refreshWindowSize(term.cols, term.rows);
    
    // 每2秒检查并调整终端大小
    fitAddonTask = setInterval(() => {
      fitAddon.fit();
      refreshWindowSize(term.cols, term.rows);
    }, 2000);

    // *** 7. 处理用户输入 ***
    let lastCtrlCTime = 0;
    const ctrlCTimeThreshold = 500;

    // 发送输入数据到后端
    function sendInput(data: string) {
      socket?.emit("stream/write", {
        input: data
      });
    }

    // 监听终端数据输入
    term.onData((data) => {
      // 如果实例已停止，则不发送输入
      if (state.value?.status === INSTANCE_STATUS.STOPPED) {
        return;
      }

      // 特殊处理Ctrl+C（\x03），防止误操作
      if (data !== "\x03") {
        lastCtrlCTime = 0;
        return sendInput(data);
      }

      const now = Date.now();
      if (now - lastCtrlCTime < ctrlCTimeThreshold) {
        term.write("\r\n" + "Sending interrupt signal..." + "\r\n");
        sendInput(data);
        lastCtrlCTime = 0;
      } else {
        lastCtrlCTime = now;
        term.write("\r\n" + "Press Ctrl+C again to send interrupt signal");
      }
    });

    terminal.value = term;
    return term;
  };

  // *** 8. 颜色编码转换工具（内置实现） ***
  const encodeConsoleColor = (text: string): string => {
    // Minecraft风格颜色代码转ANSI
    return text
      .replace(/§0/g, '\x1b[30m')  // 黑色
      .replace(/§1/g, '\x1b[34m')  // 深蓝
      .replace(/§2/g, '\x1b[32m')  // 深绿
      .replace(/§3/g, '\x1b[36m')  // 深青
      .replace(/§4/g, '\x1b[31m')  // 深红
      .replace(/§5/g, '\x1b[35m')  // 深紫
      .replace(/§6/g, '\x1b[33m')  // 金色
      .replace(/§7/g, '\x1b[37m')  // 灰色
      .replace(/§8/g, '\x1b[90m')  // 深灰
      .replace(/§9/g, '\x1b[94m')  // 蓝色
      .replace(/§a/g, '\x1b[92m')  // 绿色
      .replace(/§b/g, '\x1b[96m')  // 青色
      .replace(/§c/g, '\x1b[91m')  // 红色
      .replace(/§d/g, '\x1b[95m')  // 品红
      .replace(/§e/g, '\x1b[93m')  // 黄色
      .replace(/§f/g, '\x1b[97m')  // 白色
      .replace(/§r/g, '\x1b[0m');  // 重置
  };

  // *** 9. 处理终端输出 ***
  events.on("stdout", (v: StdoutData) => {
    if (state.value?.terminalOption?.haveColor) {
      // 如果支持颜色，则进行颜色编码转换
      terminal.value?.write(encodeConsoleColor(v.text));
    } else {
      // 纯文本输出
      terminal.value?.write(v.text);
    }
  });

  // *** 10. 发送命令 ***
  const sendCommand = (command: string) => {
    if (!socket?.connected) throw new Error("Socket not connected");
    socket.emit("stream/input", {
      command: command
    });
  };

  // *** 11. 生命周期管理 ***
  let statusQueryTask: NodeJS.Timeout;
  
  onMounted(() => {
    // 定期查询实例状态（降低频率以减少负载）
    statusQueryTask = setInterval(() => {
      if (socket?.connected) socket?.emit("stream/detail");
    }, 3000);
  });

  onUnmounted(() => {
    // 清理资源
    clearInterval(fitAddonTask);
    clearInterval(statusQueryTask);
    events.removeAllListeners();
    socket?.disconnect();
    socket?.removeAllListeners();
  });

  // 计算属性
  const isStopped = computed(() => state?.value?.status === INSTANCE_STATUS.STOPPED);
  const isRunning = computed(() => state?.value?.status === INSTANCE_STATUS.RUNNING);
  const isStarting = computed(() => state?.value?.status === INSTANCE_STATUS.STARTING);

  return {
    events,
    state,
    isRunning,
    isStarting,
    isStopped,
    terminal,
    socketAddress,
    isConnect,
    isReady,
    execute,
    initTerminalWindow,
    sendCommand,
    encodeConsoleColor
  };
}
import { removeTrail } from "@/tools/string";
import type { InstanceDetail } from "@/types";
import { INSTANCE_STATUS_CODE } from "@/types/const";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import EventEmitter from "eventemitter3";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { computed, onMounted, onUnmounted, ref } from "vue";

// 终端参数接口
export interface UseTerminalParams {
  instanceId: string;  // 实例ID
  daemonId: string;    // 守护进程ID
}

// 标准输出数据接口
export interface StdoutData {
  instanceUuid: string;
  text: string;
}

export function useTerminal() {
  const events = new EventEmitter();              // 事件发射器
  let socket: Socket | undefined;                 // WebSocket连接
  const state = ref<InstanceDetail>();            // 实例状态
  const isReady = ref<boolean>(false);            // 是否就绪
  const terminal = ref<Terminal>();               // xterm终端实例
  const isConnect = ref<boolean>(false);          // 连接状态
  const socketAddress = ref("");                  // Socket地址

  let fitAddonTask: NodeJS.Timer;                 // 自适应大小任务
  let cachedSize = { w: 160, h: 40 };            // 缓存的终端大小

  // *** 1. 执行连接 - 核心方法 ***
  const execute = async (config: UseTerminalParams) => {
    isReady.value = false;
    
    // 通过API获取终端流通道信息
    const res = await setUpTerminalStreamChannel().execute({
      params: {
        daemonId: config.daemonId,
        uuid: config.instanceId
      }
    });
    
    const remoteInfo = res.value;
    if (!remoteInfo) throw new Error("Failed to get stream channel info");

    // 解析WebSocket地址
    const addr = parseForwardAddress(remoteInfo?.addr, "ws");
    socketAddress.value = addr;
    const password = remoteInfo.password;

    // 创建Socket.io连接
    socket = io(addr, {
      path: (!!remoteInfo.prefix ? removeTrail(remoteInfo.prefix, "/") : "") + "/socket.io",
      multiplex: false,
      reconnectionDelayMax: 1000 * 10,
      timeout: 1000 * 30,
      reconnection: true,
      reconnectionAttempts: 3,
      rejectUnauthorized: false
    });

    // *** 2. WebSocket事件处理 ***
    
    // 连接成功
    socket.on("connect", () => {
      console.log("[Socket.io] connect:", addr);
      // 发送认证信息
      socket?.emit("stream/auth", {
        data: { password }
      });
      isConnect.value = true;
    });

    // 连接错误
    socket.on("connect_error", (error) => {
      console.error("[Socket.io] Connect error: ", addr, error);
      isConnect.value = false;
      events.emit("error", error);
    });

    // 实例状态变化事件
    socket.on("instance/stopped", () => {
      events.emit("stopped");
    });

    socket.on("instance/opened", () => {
      events.emit("opened");
    });

    // 认证响应
    socket.on("stream/auth", (packet) => {
      const data = packet.data;
      if (data === true) {
        // 认证成功，请求实例详情
        socket?.emit("stream/detail", {});
        events.emit("connect");
        isReady.value = true;
      } else {
        events.emit("error", new Error("Stream/auth error!"));
      }
    });

    // 重连处理
    socket.on("reconnect", () => {
      console.warn("[Socket.io] reconnect:", addr);
      isConnect.value = true;
      socket?.emit("stream/auth", {
        data: { password }
      });
    });

    // 断连处理
    socket.on("disconnect", () => {
      console.warn("[Socket.io] disconnect:", addr);
      isConnect.value = false;
      events.emit("disconnect");
    });

    // *** 3. 核心数据流事件 ***
    
    // 接收终端输出
    socket.on("instance/stdout", (packet) => {
      events.emit("stdout", packet?.data);
    });
    
    // 接收实例详情
    socket.on("stream/detail", (packet) => {
      const v = packet?.data as InstanceDetail | undefined;
      state.value = v;
      events.emit("detail", v);
    });

    socket.connect();
    return socket;
  };

  // *** 4. 终端大小调整 - 关键功能 ***
  const refreshWindowSize = (w: number, h: number) => {
    cachedSize = { w, h };
    // 发送resize事件到后端
    socket?.emit("stream/resize", {
      data: cachedSize
    });
  };

  // *** 5. 初始化终端窗口 ***
  const initTerminalWindow = (element: HTMLElement) => {
    // 移动端触摸事件处理
    element.addEventListener("touchstart", touchHandler, true);
    element.addEventListener("touchmove", touchHandler, true);
    element.addEventListener("touchend", touchHandler, true);
    element.addEventListener("touchcancel", touchHandler, true);

    // 创建xterm终端实例
    const term = new Terminal({
      convertEol: true,         // 自动转换行尾符
      disableStdin: false,      // 启用标准输入
      cursorStyle: "underline", // 光标样式
      cursorBlink: true,        // 光标闪烁
      fontSize: 14,             // 字体大小
      theme: {
        background: "#1e1e1e"   // 背景颜色
      },
      allowProposedApi: true,
      allowTransparency: true
    });

    // 加载自适应大小插件
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 检查WebGL支持并加载对应的渲染插件
    const webGL2 = document.createElement("canvas").getContext("webgl2");
    if (webGL2) {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss((_) => {
        webglAddon.dispose();
      });
      term.loadAddon(webglAddon);
    } else {
      const canvasAddon = new CanvasAddon();
      term.loadAddon(canvasAddon);
    }

    // 打开终端
    term.open(element);

    // *** 6. 自动调整终端大小 ***
    fitAddon.fit();
    refreshWindowSize(term.cols - 1, term.rows - 1);
    
    // 每2秒检查并调整终端大小
    fitAddonTask = setInterval(() => {
      fitAddon.fit();
      refreshWindowSize(term.cols - 1, term.rows - 1);
    }, 2000);

    // *** 7. 处理用户输入 ***
    let lastCtrlCTime = 0;
    const ctrlCTimeThreshold = 500;

    // 发送输入数据到后端
    function sendInput(data: string) {
      socket?.emit("stream/write", {
        data: { input: data }
      });
    }

    // 监听终端数据输入
    term.onData((data) => {
      // 如果PTY终端被禁用或实例已停止，则不发送输入
      if (
        state.value?.config.terminalOption?.pty === false ||
        state.value?.status === INSTANCE_STATUS_CODE.STOPPED
      ) {
        return;
      }

      // 特殊处理Ctrl+C（\x03），防止误操作
      if (data !== "\x03") {
        lastCtrlCTime = 0;
        return sendInput(data);
      }

      const now = Date.now();
      if (now - lastCtrlCTime < ctrlCTimeThreshold) {
        term.write("\r\n" + "Sending interrupt signal..." + "\r\n");
        sendInput(data);
        lastCtrlCTime = 0;
      } else {
        lastCtrlCTime = now;
        term.write("\r\n" + "Press Ctrl+C again to send interrupt signal");
      }
    });

    terminal.value = term;
    return term;
  };

  // *** 8. 处理终端输出 ***
  events.on("stdout", (v: StdoutData) => {
    if (state.value?.config?.terminalOption?.haveColor) {
      // 如果支持颜色，则进行颜色编码转换
      terminal.value?.write(encodeConsoleColor(v.text));
    } else {
      // 纯文本输出
      terminal.value?.write(v.text);
    }
  });

  // *** 9. 发送命令 ***
  const sendCommand = (command: string) => {
    if (!socket?.connected) throw new Error("Socket not connected");
    socket.emit("stream/input", {
      data: { command }
    });
  };

  // *** 10. 生命周期管理 ***
  let statusQueryTask: NodeJS.Timeout;
  
  onMounted(() => {
    // 定期查询实例状态
    statusQueryTask = setInterval(() => {
      if (socket?.connected) socket?.emit("stream/detail", {});
    }, 1000);
  });

  onUnmounted(() => {
    // 清理资源
    clearInterval(fitAddonTask);
    clearInterval(statusQueryTask);
    events.removeAllListeners();
    socket?.disconnect();
    socket?.removeAllListeners();
  });

  // 计算属性
  const isStopped = computed(() => state?.value?.status === INSTANCE_STATUS_CODE.STOPPED);
  const isRunning = computed(() => state?.value?.status === INSTANCE_STATUS_CODE.RUNNING);
  const isBusy = computed(() => state?.value?.status === INSTANCE_STATUS_CODE.BUSY);
  const isGlobalTerminal = computed(() => {
    return state.value?.config.nickname === "全局终端";
  });

  return {
    events,
    state,
    isRunning,
    isBusy,
    isStopped,
    terminal,
    socketAddress,
    isConnect,
    isGlobalTerminal,
    execute,
    initTerminalWindow,
    sendCommand
  };
}
```

### 3. 终端核心组件（单实例简化版本）

单实例版本的终端UI组件，移除了实例ID和守护进程ID的复杂性：

```vue
<!-- TerminalCore.vue - 单实例终端组件 -->
<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { useTerminal } from "./hooks/useTerminal";
import type { Terminal } from "@xterm/xterm";

// 组件Props定义（简化版本）
interface Props {
  height?: string;        // 终端高度，默认400px
  serverUrl?: string;     // 服务器地址，默认localhost  
  port?: number;          // WebSocket端口，默认24445
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  serverUrl: 'localhost',
  port: 24445
});

// 命令历史状态
const commandHistory = reactive({
  commands: [] as string[],
  currentIndex: -1,
  inputValue: ''
});

// 使用终端Hook
const { 
  execute, 
  initTerminalWindow, 
  sendCommand, 
  state, 
  events, 
  isConnect, 
  socketAddress,
  isReady,
  isRunning,
  isStopped
} = useTerminal();

// 响应式状态
const socketError = ref<Error>();
const isLoading = ref(false);
const terminalContainer = ref<HTMLElement>();
let terminal: Terminal | undefined;

// *** 1. 终端连接管理 ***
const connectTerminal = async () => {
  try {
    isLoading.value = true;
    socketError.value = undefined;
    
    // 执行连接
    await execute({
      serverUrl: props.serverUrl,
      port: props.port
    });
    
  } catch (error) {
    console.error("Failed to connect terminal:", error);
    socketError.value = error as Error;
  } finally {
    isLoading.value = false;
  }
};

// *** 2. 命令历史管理 ***
const addToHistory = (command: string) => {
  if (command.trim() && !commandHistory.commands.includes(command)) {
    commandHistory.commands.unshift(command);
    if (commandHistory.commands.length > 50) {
      commandHistory.commands.pop();
    }
  }
  commandHistory.currentIndex = -1;
  commandHistory.inputValue = '';
};

const navigateHistory = (direction: 'up' | 'down') => {
  if (commandHistory.commands.length === 0) return;
  
  if (direction === 'up') {
    commandHistory.currentIndex = Math.min(
      commandHistory.currentIndex + 1, 
      commandHistory.commands.length - 1
    );
  } else {
    commandHistory.currentIndex = Math.max(commandHistory.currentIndex - 1, -1);
  }
  
  commandHistory.inputValue = commandHistory.currentIndex >= 0 
    ? commandHistory.commands[commandHistory.currentIndex] 
    : '';
};

// *** 3. 命令发送 ***
const handleSendCommand = (command?: string) => {
  const finalCommand = command || commandHistory.inputValue;
  if (!finalCommand.trim()) return;
  
  try {
    sendCommand(finalCommand);
    addToHistory(finalCommand);
  } catch (error) {
    console.error("Failed to send command:", error);
    // 可以在这里显示错误提示
  }
};

// *** 4. 键盘事件处理 ***
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      handleSendCommand();
      break;
    case 'ArrowUp':
      event.preventDefault();
      navigateHistory('up');
      break;
    case 'ArrowDown':
      event.preventDefault();
      navigateHistory('down');
      break;
  }
};

// *** 5. 事件监听 ***
const setupEventListeners = () => {
  // 连接成功事件
  events.on('connect', () => {
    console.log('Terminal connected successfully');
  });
  
  // 连接错误事件
  events.on('error', (error: Error) => {
    console.error('Terminal error:', error);
    socketError.value = error;
  });
  
  // 实例停止事件
  events.on('stopped', (code: number) => {
    console.log('Instance stopped with code:', code);
  });
  
  // 断连事件
  events.on('disconnect', () => {
    console.warn('Terminal disconnected');
  });
};

// *** 6. 组件生命周期 ***
onMounted(async () => {
  // 设置事件监听
  setupEventListeners();
  
  // 初始化终端窗口
  if (terminalContainer.value) {
    terminal = initTerminalWindow(terminalContainer.value);
  }
  
  // 自动连接
  await connectTerminal();
});
</script>

<template>
  <div class="terminal-container">
    <!-- 终端状态栏 -->
    <div class="terminal-header">
      <div class="status-info">
        <span class="status-dot" :class="{ 
          'connected': isConnect, 
          'disconnected': !isConnect 
        }"></span>
        <span>{{ isConnect ? '已连接' : '未连接' }}</span>
        <span v-if="socketAddress" class="socket-address">{{ socketAddress }}</span>
      </div>
      
      <div class="controls">
        <button 
          @click="connectTerminal" 
          :disabled="isLoading"
          class="connect-btn"
        >
          {{ isLoading ? '连接中...' : '重新连接' }}
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="socketError" class="error-message">
      <span>连接错误: {{ socketError.message }}</span>
    </div>

    <!-- 终端窗口 -->
    <div 
      ref="terminalContainer"
      class="terminal-window"
      :style="{ height: props.height }"
    ></div>

    <!-- 命令输入区 -->
    <div class="command-input-area">
      <div class="input-wrapper">
        <span class="prompt">$</span>
        <input
          v-model="commandHistory.inputValue"
          @keydown="handleKeyDown"
          :disabled="!isConnect || isStopped"
          placeholder="输入命令后按回车发送..."
          class="command-input"
        />
        <button 
          @click="handleSendCommand()"
          :disabled="!isConnect || !commandHistory.inputValue.trim()"
          class="send-btn"
        >
          发送
        </button>
      </div>
      
      <!-- 实例状态指示 -->
      <div class="instance-status">
        <span v-if="isRunning" class="status-running">● 运行中</span>
        <span v-else-if="isStopped" class="status-stopped">● 已停止</span>
        <span v-else class="status-unknown">● 未知状态</span>
      </div>
    </div>

    <!-- 命令历史（可选显示） -->
    <div v-if="commandHistory.commands.length > 0" class="command-history">
      <details>
        <summary>命令历史 ({{ commandHistory.commands.length }})</summary>
        <ul>
          <li 
            v-for="(cmd, index) in commandHistory.commands.slice(0, 10)" 
            :key="index"
            @click="commandHistory.inputValue = cmd"
            class="history-item"
          >
            {{ cmd }}
          </li>
        </ul>
      </details>
    </div>
  </div>
</template>

<style scoped>
.terminal-container {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ccc;
}

.status-dot.connected {
  background-color: #52c41a;
}

.status-dot.disconnected {
  background-color: #ff4d4f;
}

.socket-address {
  color: #666;
  font-family: monospace;
}

.connect-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 2px;
  background: white;
  cursor: pointer;
}

.connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 8px 12px;
  background-color: #fff2f0;
  border-bottom: 1px solid #ffccc7;
  color: #ff4d4f;
  font-size: 12px;
}

.terminal-window {
  background-color: #1e1e1e;
  overflow: hidden;
}

.command-input-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #fafafa;
  border-top: 1px solid #ddd;
}

.input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
}

.prompt {
  font-family: monospace;
  color: #666;
  font-weight: bold;
}

.command-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 2px;
  font-family: monospace;
}

.send-btn {
  padding: 4px 12px;
  border: 1px solid #1890ff;
  border-radius: 2px;
  background: #1890ff;
  color: white;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.instance-status {
  font-size: 12px;
  margin-left: 12px;
}

.status-running {
  color: #52c41a;
}

.status-stopped {
  color: #ff4d4f;
}

.status-unknown {
  color: #faad14;
}

.command-history {
  border-top: 1px solid #ddd;
  background-color: #fafafa;
}

.command-history summary {
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
}

.command-history ul {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 120px;
  overflow-y: auto;
}

.history-item {
  padding: 2px 12px;
  font-family: monospace;
  font-size: 11px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.history-item:hover {
  background-color: #e6f7ff;
}
</style>
```

### 4. 应用入口组件（单实例版本）

创建一个简单的应用入口，展示如何使用终端组件：

```vue
<!-- App.vue - 应用入口 -->
<script setup lang="ts">
import { ref } from 'vue';
import TerminalCore from './components/TerminalCore.vue';

// 应用配置
const config = ref({
  serverUrl: 'localhost',   // 可以配置为您的服务器地址
  port: 24445,             // WebSocket端口
  height: '500px'          // 终端高度
});

const showSettings = ref(false);
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>PTY 终端 - 单实例版本</h1>
      <button 
        @click="showSettings = !showSettings"
        class="settings-btn"
      >
        设置
      </button>
    </header>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <div class="setting-item">
        <label>服务器地址:</label>
        <input v-model="config.serverUrl" placeholder="localhost" />
      </div>
      <div class="setting-item">
        <label>WebSocket端口:</label>
        <input v-model.number="config.port" type="number" placeholder="24445" />
      </div>
      <div class="setting-item">
        <label>终端高度:</label>
        <input v-model="config.height" placeholder="500px" />
      </div>
    </div>

    <!-- 终端组件 -->
    <main class="app-main">
      <TerminalCore
        :server-url="config.serverUrl"
        :port="config.port"
        :height="config.height"
      />
    </main>

    <footer class="app-footer">
      <p>PTY Terminal - 支持真实终端交互的Web终端</p>
    </footer>
  </div>
</template>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.app-header h1 {
  margin: 0;
  color: #333;
}

.settings-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.settings-panel {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  width: 120px;
  font-weight: 500;
}

.setting-item input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 2px;
}

.app-main {
  margin-bottom: 20px;
}

.app-footer {
  text-align: center;
  color: #666;
  font-size: 12px;
  border-top: 1px solid #eee;
  padding-top: 10px;
}
</style>
```

### 5. 完整的单实例前端启动配置

```typescript
// main.ts - Vue应用启动文件
import { createApp } from 'vue';
import App from './App.vue';

// 创建Vue应用
const app = createApp(App);

// 挂载到DOM
app.mount('#app');
```

```html
<!-- index.html - HTML入口文件 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PTY Terminal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f0f2f5;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 6. 依赖包配置

```json
{
  "name": "pty-terminal-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "@xterm/xterm": "^5.3.0",
    "@xterm/addon-fit": "^0.8.0",
    "@xterm/addon-canvas": "^0.5.0",
    "@xterm/addon-webgl": "^0.16.0",
    "socket.io-client": "^4.7.0",
    "eventemitter3": "^5.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.4.0",
    "typescript": "^5.2.0",
    "vue-tsc": "^1.8.0",
    "vite": "^4.5.0"
  }
}
```

### 7. Vite构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

---

## 使用说明

### 1. 后端启动
```bash
# 安装依赖
npm install

# 启动单实例PTY服务器
node app.js
```

### 2. 前端启动
```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建生产版本
npm run build
```

### 3. 访问终端
- 后端WebSocket服务器：`ws://localhost:24445`
- 后端HTTP API：`http://localhost:23333`
- 前端开发服务器：`http://localhost:3000`

### 4. 功能特点
- **实时终端交互**：支持PTY模式的真实终端体验
- **命令历史**：自动保存和回溯命令历史
- **终端大小调整**：自动适应浏览器窗口大小
- **颜色支持**：支持ANSI颜色代码显示
- **错误处理**：完善的连接错误和重连机制

---
        <div
          v-if="!containerState.isDesignMode"
          :id="terminalDomId"
          :style="{ height: props.height }"
        ></div>
        <!-- 设计模式提示 -->
        <div v-else :style="{ height: props.height }">
          <p class="terminal-design-tip">Terminal preview in design mode</p>
        </div>
      </div>
    </div>
    
    <!-- 命令输入区域 -->
    <div class="command-input">
      <!-- 历史命令提示 -->
      <div v-show="focusHistoryList" class="history">
        <li v-for="(item, key) in history" :key="item">
          <a-tag
            :color="key !== selectLocation ? 'blue' : '#108ee9'"
            @click="handleClickHistoryItem(item)"
          >
            {{ item.length > 14 ? item.slice(0, 14) + "..." : item }}
          </a-tag>
        </li>
      </div>
      
      <!-- 命令输入框 -->
      <a-input
        ref="inputRef"
        v-model:value="commandInputValue"
        placeholder="Enter command here..."
        autofocus
        :disabled="containerState.isDesignMode || !isConnect"
        @press-enter="handleSendCommand"
        @keydown="handleHistorySelect"
      >
        <template #prefix>
          <CodeOutlined style="font-size: 18px" />
        </template>
      </a-input>
    </div>

    <!-- 错误对话框 -->
    <div v-if="socketError" class="error-card">
      <div class="error-card-container">
        <a-typography-title :level="5">Connection Error</a-typography-title>
        <a-typography-paragraph>
          Failed to connect to: {{ socketAddress }}
        </a-typography-paragraph>
        <a-typography-title :level="5">Error Details</a-typography-title>
        <a-typography-paragraph>
          <pre style="font-size: 12px"><code>{{ socketError?.message || "" }}</code></pre>
        </a-typography-paragraph>
        <a-typography-title :level="5">Possible Solutions</a-typography-title>
        <a-typography-paragraph>
          <ul>
            <li>Check network connectivity</li>
            <li>Verify daemon service is running</li>
            <li>Check firewall and proxy settings</li>
          </ul>
          <div class="flex flex-center">
            <a-typography-link @click="refreshPage">
              Refresh Page
            </a-typography-link>
          </div>
        </a-typography-paragraph>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.console-wrapper {
  position: relative;

  .terminal-loading {
    z-index: 12;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .terminal-button-group {
    z-index: 11;
    margin-right: 20px;
    padding-bottom: 50px;
    padding-left: 50px;
    border-radius: 6px;
    color: #fff;

    &:hover {
      ul {
        transition: all 1s;
        opacity: 0.8;
      }
    }

    ul {
      display: flex;
      opacity: 0;

      li {
        cursor: pointer;
        list-style: none;
        padding: 5px;
        margin-left: 5px;
        border-radius: 6px;
        font-size: 20px;

        &:hover {
          background-color: #3e3e3e;
        }
      }
    }
  }

  .terminal-wrapper {
    border: 1px solid var(--card-border-color);
    position: relative;
    overflow: hidden;
    height: 100%;
    background-color: #1e1e1e;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;

    .terminal-container {
      height: 100%;
    }
  }

  .command-input {
    position: relative;

    .history {
      display: flex;
      max-width: 100%;
      overflow: scroll;
      z-index: 10;
      position: absolute;
      top: -35px;
      left: 0;

      li {
        list-style: none;
        span {
          padding: 3px 20px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }
      }

      &::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
      }
    }
  }

  .terminal-design-tip {
    color: rgba(255, 255, 255, 0.584);
  }
}

.error-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  z-index: 10;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  .error-card-container {
    overflow: hidden;
    max-width: 440px;
    border: 1px solid var(--color-gray-6) !important;
    background-color: var(--color-gray-1);
    border-radius: 4px;
    padding: 12px;
    box-shadow: 0px 0px 2px var(--color-gray-7);
  }

  @media (max-width: 992px) {
    .error-card-container {
      max-width: 90vw !important;
    }
  }
}
</style>
```

### 4. 终端颜色编码处理

MCSM支持Minecraft风格的颜色代码，在`useTerminal.ts`中实现了颜色编码转换：

```typescript
// 终端颜色常量定义
export const TERM_COLOR = {
  TERM_RESET: "\x1B[0m",
  TERM_TEXT_BLACK: "\x1B[0;30m",        // 黑色 §0
  TERM_TEXT_DARK_BLUE: "\x1B[0;34m",    // 深蓝 §1
  TERM_TEXT_DARK_GREEN: "\x1B[0;32m",   // 深绿 §2
  TERM_TEXT_DARK_AQUA: "\x1B[0;36m",    // 深青 §3
  TERM_TEXT_DARK_RED: "\x1B[0;31m",     // 深红 §4
  TERM_TEXT_DARK_PURPLE: "\x1B[0;35m",  // 深紫 §5
  TERM_TEXT_GOLD: "\x1B[0;33m",         // 金色 §6
  TERM_TEXT_GRAY: "\x1B[0;37m",         // 灰色 §7
  TERM_TEXT_DARK_GRAY: "\x1B[0;30;1m",  // 深灰 §8
  TERM_TEXT_BLUE: "\x1B[0;34;1m",       // 蓝色 §9
  TERM_TEXT_GREEN: "\x1B[0;32;1m",      // 绿色 §a
  TERM_TEXT_AQUA: "\x1B[0;36;1m",       // 青色 §b
  TERM_TEXT_RED: "\x1B[0;31;1m",        // 红色 §c
  TERM_TEXT_LIGHT_PURPLE: "\x1B[0;35;1m", // 亮紫 §d
  TERM_TEXT_YELLOW: "\x1B[0;33;1m",     // 黄色 §e
  TERM_TEXT_WHITE: "\x1B[0;37;1m",      // 白色 §f
  TERM_TEXT_OBFUSCATED: "\x1B[5m",      // 混淆 §k
  TERM_TEXT_BOLD: "\x1B[21m",           // 粗体 §l
  TERM_TEXT_STRIKETHROUGH: "\x1B[9m",   // 删除线 §m
  TERM_TEXT_UNDERLINE: "\x1B[4m",       // 下划线 §n
  TERM_TEXT_ITALIC: "\x1B[3m",          // 斜体 §o
  TERM_TEXT_B: "\x1B[1m"
};

// 颜色编码转换函数
export function encodeConsoleColor(text: string) {
  // 预处理ANSI转义序列
  text = text.replace(/(\x1B[^m]*m)/gm, "$1;");
  
  // 高亮特殊内容
  text = text.replace(/ \[([A-Za-z0-9 _\-\\.]+)]/gim, " [§3$1§r]");
  text = text.replace(/^\[([A-Za-z0-9 _\-\\.]+)]/gim, "[§3$1§r]");
  text = text.replace(/((["'])(.*?)\1)/gm, "§e$1§r");
  text = text.replace(/([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})/gim, "§6$1§r");
  text = text.replace(/([0-9]{2,4}[\/\-][0-9]{2,4}[\/\-][0-9]{2,4})/gim, "§6$1§r");
  
  text = text.replace(/(\x1B[^m]*m);/gm, "$1");

  // 转换Minecraft风格颜色代码（§）
  text = text.replace(/§0/gim, TERM_COLOR.TERM_TEXT_BLACK);
  text = text.replace(/§1/gim, TERM_COLOR.TERM_TEXT_DARK_BLUE);
  text = text.replace(/§2/gim, TERM_COLOR.TERM_TEXT_DARK_GREEN);
  text = text.replace(/§3/gim, TERM_COLOR.TERM_TEXT_DARK_AQUA);
  text = text.replace(/§4/gim, TERM_COLOR.TERM_TEXT_DARK_RED);
  text = text.replace(/§5/gim, TERM_COLOR.TERM_TEXT_DARK_PURPLE);
  text = text.replace(/§6/gim, TERM_COLOR.TERM_TEXT_GOLD);
  text = text.replace(/§7/gim, TERM_COLOR.TERM_TEXT_GRAY);
  text = text.replace(/§8/gim, TERM_COLOR.TERM_TEXT_DARK_GRAY);
  text = text.replace(/§9/gim, TERM_COLOR.TERM_TEXT_BLUE);
  text = text.replace(/§a/gim, TERM_COLOR.TERM_TEXT_GREEN);
  text = text.replace(/§b/gim, TERM_COLOR.TERM_TEXT_AQUA);
  text = text.replace(/§c/gim, TERM_COLOR.TERM_TEXT_RED);
  text = text.replace(/§d/gim, TERM_COLOR.TERM_TEXT_LIGHT_PURPLE);
  text = text.replace(/§e/gim, TERM_COLOR.TERM_TEXT_YELLOW);
  text = text.replace(/§f/gim, TERM_COLOR.TERM_TEXT_WHITE);
  text = text.replace(/§k/gim, TERM_COLOR.TERM_TEXT_OBFUSCATED);
  text = text.replace(/§l/gim, TERM_COLOR.TERM_TEXT_BOLD);
  text = text.replace(/§m/gim, TERM_COLOR.TERM_TEXT_STRIKETHROUGH);
  text = text.replace(/§n/gim, TERM_COLOR.TERM_TEXT_UNDERLINE);
  text = text.replace(/§o/gim, TERM_COLOR.TERM_TEXT_ITALIC);
  text = text.replace(/§r/gim, TERM_COLOR.TERM_RESET);

  // 转换Bukkit风格颜色代码（&）
  text = text.replace(/&0/gim, TERM_COLOR.TERM_TEXT_BLACK);
  text = text.replace(/&1/gim, TERM_COLOR.TERM_TEXT_DARK_BLUE);
  text = text.replace(/&2/gim, TERM_COLOR.TERM_TEXT_DARK_GREEN);
  // ... 其他&颜色代码类似转换

  // 特殊关键词高亮
  const RegExpStringArr = [
    //蓝色
    ["\\d{1,3}%", "true", "false"],
    //绿色
    ["information", "info", "\\(", "\\)", "\\{", "\\}", '\\"', "&lt;", "&gt;", "-->", "->", ">>>"],
    //红色
    ["Error", "Caused by", "panic"],
    //黄色
    ["WARNING", "Warn"]
  ];
  
  for (const k in RegExpStringArr) {
    for (const y in RegExpStringArr[k]) {
      const reg = new RegExp("(" + RegExpStringArr[k][y].replace(/ /gim, "&nbsp;") + ")", "igm");
      if (k === "0") // 蓝色
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_BLUE + "$1" + TERM_COLOR.TERM_RESET);
      if (k === "1") // 绿色
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_DARK_GREEN + "$1" + TERM_COLOR.TERM_RESET);
      if (k === "2") // 红色
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_RED + "$1" + TERM_COLOR.TERM_RESET);
      if (k === "3") // 黄色
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_GOLD + "$1" + TERM_COLOR.TERM_RESET);
    }
  }
  
  // 行尾符号替换
  text = text.replace(/\r\n/gm, TERM_COLOR.TERM_RESET + "\r\n");
  return text;
}
```

---

## 完整调用流程

### 1. 流程概览图

```
用户操作 → 前端组件 → WebSocket → 后端路由 → PTY适配器 → Go PTY程序 → 目标进程
    ↑                                                                              ↓
输出显示 ← 颜色编码 ← 数据转发 ← 实例管理 ← PTY适配器 ← Go PTY程序 ← 目标进程输出
```

### 2. 详细调用流程

#### 2.1 初始化阶段

1. **前端组件挂载**
   ```typescript
   onMounted(async () => {
     // 1. 获取终端流通道
     await execute({ instanceId, daemonId });
     // 2. 初始化终端UI
     term = await initTerminal();
   });
   ```

2. **建立WebSocket连接**
   ```typescript
   // 获取连接信息
   const res = await setUpTerminalStreamChannel().execute({
     params: { daemonId, uuid: instanceId }
   });
   
   // 创建Socket连接
   socket = io(addr, { /* 配置选项 */ });
   
   // 发送认证
   socket.emit("stream/auth", { data: { password } });
   ```

3. **后端认证处理**
   ```typescript
   routerApp.on("stream/auth", (ctx, data) => {
     const mission = missionPassport.getMission(password, "stream_channel");
     const instance = InstanceSubsystem.getInstance(mission.parameter.instanceUuid);
     
     // 开始转发输出流数据到这个Socket
     InstanceSubsystem.forward(instance.instanceUuid, ctx.socket);
     
     protocol.response(ctx, true);
   });
   ```

#### 2.2 PTY启动阶段

4. **实例启动时PTY进程创建**
   ```typescript
   // 在dispatcher中根据配置选择PTY模式
   if (instance.config.terminalOption.pty && instance.config.processType === "general") {
     instance.setPreset("start", new PtyStartCommand());
   }
   
   // PTY启动命令执行
   const subProcess = spawn(PTY_PATH, ptyParameter, {
     cwd: path.dirname(PTY_PATH),
     stdio: "pipe",
     env: instance.generateEnv(),
     detached: false
   });
   
   // 创建进程适配器
   const processAdapter = new GoPtyProcessAdapter(subProcess, ptySubProcessCfg.pid, pipeName);
   ```

#### 2.3 数据流转阶段

5. **用户输入处理**
   ```typescript
   // 前端：xterm监听用户输入
   term.onData((data) => {
     socket?.emit("stream/write", {
       data: { input: data }
     });
   });
   
   // 后端：处理终端输入
   routerApp.on("stream/write", async (ctx, data) => {
     const instance = InstanceSubsystem.getInstance(instanceUuid);
     if (instance?.process) {
       instance.process.write(buf); // 写入PTY进程
     }
   });
   ```

6. **输出数据处理**
   ```typescript
   // PTY适配器：监听进程输出
   process.stdout?.on("data", (text) => this.emit("data", text));
   
   // 实例：转发输出到所有观察者
   InstanceSubsystem.forEachForward(instanceUuid, (socket) => {
     socket.emit("instance/stdout", { data: { text } });
   });
   
   // 前端：接收并显示输出
   socket.on("instance/stdout", (packet) => {
     const text = encodeConsoleColor(packet.data.text);
     terminal.value?.write(text);
   });
   ```

#### 2.4 终端大小调整阶段

7. **终端大小自动调整**
   ```typescript
   // 前端：定期检测并发送终端大小
   setInterval(() => {
     fitAddon.fit();
     socket?.emit("stream/resize", {
       data: { w: term.cols - 1, h: term.rows - 1 }
     });
   }, 2000);
   
   // 后端：更新观察者信息并执行resize
   routerApp.on("stream/resize", async (ctx, data) => {
     instance?.watchers.set(ctx.socket.id, {
       terminalSize: { w: Number(data.w), h: Number(data.h) }
     });
     await instance.execPreset("resize");
   });
   
   // PTY适配器：发送resize消息到Go程序
   public resize(w: number, h: number) {
     const resizeStruct = JSON.stringify({ width: w, height: h });
     const buf = Buffer.from([GO_PTY_MSG_TYPE.RESIZE, ...lenBuff, ...Buffer.from(resizeStruct)]);
     this.writeToNamedPipe(buf);
   }
   ```

### 3. 关键数据结构

#### 3.1 PTY启动参数
```bash
./pty_win32_x64.exe -size "164,40" -coder "utf-8" -dir "C:\server" -fifo "\\.\pipe\mcsmanager-uuid" -cmd "[\"java -jar server.jar\"]"
```

#### 3.2 WebSocket消息格式
```json
// 认证
{"event": "stream/auth", "data": {"password": "temp_password"}}

// 输入
{"event": "stream/write", "data": {"input": "help\n"}}

// 调整大小
{"event": "stream/resize", "data": {"w": 80, "h": 24}}

// 输出
{"event": "instance/stdout", "data": {"text": "Server started\n"}}
```

#### 3.3 命名管道通信协议
```
[消息类型:1字节][长度:2字节][JSON数据:N字节]
```

- 消息类型：0x04（RESIZE）
- 长度：JSON数据的字节长度（大端序）
- JSON数据：{"width": 80, "height": 24}

这套完整的PTY实现提供了：
- 真正的伪终端功能
- 实时双向通信
- 自动终端大小调整
- 多用户同时观看
- 颜色支持
- 错误处理和重连机制

通过Go程序提供底层PTY功能，Node.js处理业务逻辑，前端提供用户界面，三者协同工作实现了功能完整的Web终端系统。

---

## 实现要点总结

### 1. 关键技术选择

#### 后端技术栈
- **Node.js + TypeScript**：主要业务逻辑
- **Socket.io**：实时WebSocket通信
- **child_process.spawn()**：进程管理
- **命名管道/FIFO**：与Go程序通信

#### 前端技术栈
- **Vue.js 3 + Composition API**：响应式UI框架
- **xterm.js**：浏览器终端模拟器
- **Socket.io-client**：WebSocket客户端
- **FitAddon**：终端自适应大小

#### 核心程序
- **Go PTY程序**：提供真正的伪终端功能

### 2. 架构设计原则

#### 分层架构
```
表现层（前端）：Vue组件 + xterm.js
业务层（后端）：Node.js路由 + 实例管理
适配层（后端）：PTY进程适配器
系统层（Go程序）：PTY伪终端实现
```

#### 职责分离
- **前端**：负责用户交互、显示输出、处理输入
- **后端**：负责会话管理、权限控制、数据转发
- **PTY适配器**：负责进程通信、协议转换
- **Go程序**：负责真正的PTY功能实现

### 3. 通信机制设计

#### 多层通信
1. **前端 ↔ 后端**：WebSocket (Socket.io)
2. **后端 ↔ PTY适配器**：EventEmitter
3. **PTY适配器 ↔ Go程序**：stdin/stdout + 命名管道
4. **Go程序 ↔ 目标进程**：PTY设备

#### 数据流向
```
用户输入 → xterm → WebSocket → 后端路由 → PTY适配器 → Go程序 → 目标进程
目标进程输出 → Go程序 → PTY适配器 → 实例管理 → WebSocket → xterm → 用户界面
```

### 4. 核心功能实现

#### 终端大小调整机制
1. **前端检测**：FitAddon每2秒检测容器大小变化
2. **尺寸计算**：计算所有连接客户端的最小尺寸
3. **消息传递**：通过WebSocket和命名管道传递到Go程序
4. **PTY调整**：Go程序调用系统API调整PTY大小

#### 多用户支持
1. **观察者模式**：每个WebSocket连接作为观察者
2. **数据广播**：输出数据广播给所有观察者
3. **权限控制**：通过临时密码认证机制

#### 错误处理
1. **连接恢复**：WebSocket自动重连机制
2. **进程监控**：监控PTY进程状态
3. **资源清理**：组件卸载时清理所有资源

### 5. 性能优化

#### 前端优化
- **Canvas/WebGL渲染**：使用硬件加速渲染终端
- **事件防抖**：终端大小调整防抖处理
- **内存管理**：及时清理事件监听器和定时器

#### 后端优化
- **流式处理**：数据流式处理，避免内存积累
- **连接池管理**：合理管理WebSocket连接
- **进程监控**：监控PTY进程资源使用

### 6. 安全考虑

#### 认证机制
- **临时密码**：每次连接生成临时认证密码
- **会话验证**：验证WebSocket会话有效性
- **权限检查**：检查用户操作权限

#### 资源隔离
- **进程隔离**：每个实例独立的PTY进程
- **用户隔离**：支持以指定用户运行进程
- **资源限制**：限制进程资源使用

### 7. 扩展性设计

#### 插件化架构
- **命令调度器**：可扩展的命令预设系统
- **适配器模式**：支持不同类型的进程适配器
- **事件驱动**：基于事件的松耦合设计

#### 配置化
- **实例配置**：灵活的实例配置系统
- **终端选项**：可配置的终端选项
- **环境变量**：支持自定义环境变量

### 8. 部署和维护

#### 依赖管理
- **二进制文件**：PTY程序需要下载对应平台版本
- **库依赖**：明确的npm包依赖管理
- **环境要求**：明确的运行环境要求

#### 监控和日志
- **连接状态监控**：实时监控WebSocket连接状态
- **进程状态监控**：监控PTY进程运行状态
- **日志记录**：完整的操作日志记录

这套PTY实现方案具有：
- **功能完整性**：支持真正的PTY功能
- **架构清晰性**：分层清晰，职责明确
- **可扩展性**：易于扩展和维护
- **性能优秀**：支持多用户并发使用
- **用户友好**：提供良好的用户体验

可以作为Web终端实现的参考方案，适用于各种需要Web终端功能的应用场景。

## 实现总结

这个单实例版本的PTY终端系统具有以下特点：

1. **简化的架构**：
   - 移除了多实例管理的复杂性
   - 专注于单一实例的终端交互
   - 减少了代码复杂度和维护成本

2. **完整的功能**：
   - 支持PTY模式的真实终端体验
   - WebSocket实时通信
   - 终端大小调整
   - 命令输入和输出处理

3. **技术栈**：
   - **后端**：Node.js + Socket.io + Go PTY程序
   - **前端**：Vue.js 3 + xterm.js + Socket.io客户端
   - **通信协议**：WebSocket + JSON消息格式

4. **部署简单**：
   - 启动一个HTTP服务器用于API
   - 启动一个WebSocket服务器用于终端通信
   - 自动处理PTY程序的生命周期

这个实现可以作为任何需要Web终端功能的应用的基础，只需要根据具体需求调整启动命令和工作目录即可。

5. **无外部依赖**：
   - 所有本地文件引用都已内置或移除
   - 可以独立部署，不依赖原MCSM系统
   - 代码完整，可直接复制使用

这个实现可以作为任何需要Web终端功能的应用的基础，只需要根据具体需求调整启动命令和工作目录即可。适合用于服务器管理、开发环境、教育平台等需要Web终端交互的场景。
