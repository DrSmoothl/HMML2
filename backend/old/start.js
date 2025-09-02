#!/usr/bin/env node
/**
 * HMML (Hello MaiMai Launcher) 生产环境启动脚本
 * 设置环境变量并启动应用
 */

// 设置生产环境
process.env.NODE_ENV = 'production';

// 启动应用
require('./dist/app.js');
