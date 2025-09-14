const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 7998;
const STATIC_DIR = path.join(__dirname, 'dist');

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Get MIME type from file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Check if file exists and is within allowed directory
function isValidPath(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    const resolvedStaticDir = path.resolve(STATIC_DIR);
    return resolvedPath.startsWith(resolvedStaticDir) && fs.existsSync(resolvedPath);
  } catch (error) {
    return false;
  }
}

// Serve static files
function serveStaticFile(res, filePath) {
  const mimeType = getMimeType(filePath);
  const stream = fs.createReadStream(filePath);
  
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff'
  });
  
  stream.pipe(res);
  
  stream.on('error', (error) => {
    console.error('文件读取错误:', error);
    serve500Error(res);
  });
}

// Serve 404 error
function serve404Error(res) {
  const indexPath = path.join(STATIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveStaticFile(res, indexPath);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>404 - 页面未找到</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>404 - 页面未找到</h1>
        <p>请求的资源不存在。</p>
      </body>
      </html>
    `);
  }
}

// Serve 500 error
function serve500Error(res) {
  res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>500 - 服务器错误</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1>500 - 服务器内部错误</h1>
      <p>服务器处理请求时发生错误。</p>
    </body>
    </html>
  `);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  try {
    // Parse URL and remove query parameters
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const urlPath = url.pathname;
    
    // Security: prevent path traversal
    if (urlPath.includes('..') || urlPath.includes('\0')) {
      serve404Error(res);
      return;
    }
    
    let filePath;
    
    if (urlPath === '/') {
      // Serve index.html for root
      filePath = path.join(STATIC_DIR, 'index.html');
    } else {
      // Serve requested file
      filePath = path.join(STATIC_DIR, urlPath);
    }
    
    if (isValidPath(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        serveStaticFile(res, filePath);
      } else {
        serve404Error(res);
      }
    } else {
      // For SPA routing, serve index.html for non-existing routes
      serve404Error(res);
    }
    
  } catch (error) {
    console.error('请求处理错误:', error);
    serve500Error(res);
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请检查是否有其他程序正在使用此端口。`);
  } else {
    console.error('服务器错误:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭。');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭。');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n✅ HMML 前端服务器已启动`);
  console.log(`📁 静态文件目录: ${STATIC_DIR}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`⏹  按 Ctrl+C 停止服务器\n`);
  
  // Check if dist directory exists
  if (!fs.existsSync(STATIC_DIR)) {
    console.warn(`⚠️  警告: 静态文件目录不存在: ${STATIC_DIR}`);
    console.log(`请先运行 'pnpm run build' 构建项目。`);
  }
});
