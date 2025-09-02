#!/usr/bin/env node
/**
 * HMML (Hello MaiMai Launcher) 开发环境启动脚本
 * 设置环境变量并启动应用
 */

// 设置开发环境
process.env.NODE_ENV = 'development';

// 启动应用
require('./dist/app.js');
