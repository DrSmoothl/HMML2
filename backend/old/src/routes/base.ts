import Router from '@koa/router';
import { AppContext } from '../types';
import { createSuccessResponse } from '../middleware/protocol';
import { configManager } from '../core/config';
import * as os from 'os';
import { getVersion } from '../version';

const router = new Router();

/**
 * 健康检查接口
 */
router.get('/health', async (ctx: AppContext) => {
  const config = configManager.get();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    },
    version: config.app.version,
    service: config.app.name
  };

  ctx.body = createSuccessResponse(healthInfo);
});

/**
 * 服务信息接口
 */
router.get('/info', async (ctx: AppContext) => {
  const config = configManager.get();
  
  // 获取系统信息
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = Math.round((usedMemory / totalMemory) * 100);
  
  // 获取CPU信息
  const cpus = os.cpus();
  const cpuModel = cpus[0].model;
  const cpuCores = cpus.length;
  
  // 计算CPU使用率
  const getCpuUsage = () => {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (let cpu of cpus) {
      for (let type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return Math.max(0, Math.min(100, usage));
  };
  
  // 获取网络接口信息
  const networkInterfaces = os.networkInterfaces();
  const activeInterfaces = Object.keys(networkInterfaces).filter(name => {
    const interfaces = networkInterfaces[name];
    return interfaces && interfaces.some(iface => !iface.internal);
  });
  
  const serviceInfo = {
    name: config.app.name,
    version: getVersion(),
    description: config.app.description,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    uptime: Math.floor(process.uptime()),
    system: {
      hostname: os.hostname(),
      type: os.type(),
      release: os.release(),
      cpu: {
        model: cpuModel,
        cores: cpuCores,
        usage: getCpuUsage()
      },
      memory: {
        total: Math.round(totalMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
        used: Math.round(usedMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
        free: Math.round(freeMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
        usage: memoryUsage
      },
      network: {
        interfaces: activeInterfaces.length,
        activeInterfaces: activeInterfaces
      },
      loadAverage: os.loadavg()
    }
  };

  ctx.body = createSuccessResponse(serviceInfo);
});

/**
 * 根路径接口
 */
router.get('/', async (ctx: AppContext) => {
  const config = configManager.get();
  
  const welcomeMessage = {
    message: `欢迎使用 ${config.app.name}`,
    description: config.app.description,
    version: config.app.version,
    documentation: '/api/docs', // 预留文档地址
    health: '/api/health',
    info: '/api/info'
  };

  ctx.body = createSuccessResponse(welcomeMessage);
});

export default router;
