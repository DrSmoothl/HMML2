const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/app.ts',
    target: 'node',
    mode: isProduction ? 'production' : 'development',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'app.js',
      clean: true,
      libraryTarget: 'commonjs2',
    },
    
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@middleware': path.resolve(__dirname, 'src/middleware'),
        '@routes': path.resolve(__dirname, 'src/routes'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@pty': path.resolve(__dirname, 'src/pty'),
        '@tools': path.resolve(__dirname, 'src/tools'),
        '@examples': path.resolve(__dirname, 'src/examples'),
      }
    },
    
    externals: [
      // 排除node_modules中的模块
      nodeExternals({
        // 但是包含需要打包的模块
        allowlist: [
          // 如果有特定模块需要打包，在这里添加
        ]
      }),
      // 排除原生模块
      {
        'better-sqlite3': 'commonjs2 better-sqlite3',
        'fsevents': 'commonjs2 fsevents',
      }
    ],
    
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json',
              transpileOnly: false,
              compilerOptions: {
                noEmit: false
              }
            }
          },
          exclude: /node_modules/,
        },
        // 处理JSON文件
        {
          test: /\.json$/,
          type: 'json'
        }
      ],
    },
    
    plugins: [
      // 定义环境变量
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.WEBPACK_BUILD': JSON.stringify(true),
      }),
      
      // 忽略动态require警告
      new webpack.ContextReplacementPlugin(
        /express\/lib/,
        path.resolve(__dirname, 'src')
      ),
      
      // 添加banner信息
      new webpack.BannerPlugin({
        banner: `#!/usr/bin/env node
/**
 * HMML (Hello MaiMai Launcher) Backend Service
 * Built with webpack at ${new Date().toISOString()}
 * Environment: ${isProduction ? 'production' : 'development'}
 */`,
        raw: true
      })
    ],
    
    // 优化配置
    optimization: {
      minimize: isProduction,
      nodeEnv: isProduction ? 'production' : 'development',
    },
    
    // 开发工具
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    
    // Node.js特定配置
    node: {
      __dirname: false,
      __filename: false,
    },
    
    // 性能配置
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    
    // 统计信息配置
    stats: {
      colors: true,
      modules: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false
    }
  };
};
