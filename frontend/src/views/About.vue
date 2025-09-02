<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-base-content mb-4">关于 MaiMai Launcher</h1>
      <p class="text-lg text-base-content/70">智能聊天机器人管理平台</p>
    </div>
    
    <!-- Logo and Version -->
    <div class="card bg-base-100 shadow-sm max-w-2xl mx-auto">
      <div class="card-body text-center">
        <div class="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
          <img 
            src="@/assets/images/maimai.png" 
            alt="MaiMai Logo" 
            class="w-20 h-20 object-cover rounded-xl"
          />
        </div>
        
        <h2 class="text-2xl font-bold mb-2">MaiMai Launcher</h2>
        <div class="flex items-center justify-center gap-2 mb-4">
          <div class="badge badge-primary">Version {{ systemInfo.version || '1.0.0' }}</div>
          <div 
            class="badge"
            :class="{
              'badge-success': isSystemHealthy,
              'badge-error': !isSystemHealthy && systemInfo.name,
              'badge-warning': !systemInfo.name
            }"
          >
            {{ getSystemStatus() }}
          </div>
        </div>
        <p class="text-base-content/70 mb-6">
          一个功能强大的聊天机器人管理平台，支持多平台接入和智能对话功能。
          通过直观的界面轻松管理您的机器人设置、监控运行状态和优化对话体验。
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div class="stat">
            <div class="stat-title">运行时间</div>
            <div class="stat-value text-primary">{{ formatUptime(systemInfo.uptime) }}</div>
            <div class="stat-desc">{{ systemInfo.uptime ? `${Math.floor(systemInfo.uptime / 3600)}小时` : '获取中...' }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">CPU 使用率</div>
            <div class="stat-value text-secondary">{{ systemInfo.system?.cpu?.usage || 0 }}%</div>
            <div class="stat-desc">
              <progress 
                class="progress progress-secondary w-full" 
                :value="systemInfo.system?.cpu?.usage || 0" 
                max="100"
              ></progress>
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">内存使用率</div>
            <div class="stat-value text-accent">{{ systemInfo.system?.memory?.usage || 0 }}%</div>
            <div class="stat-desc">
              <progress 
                class="progress progress-accent w-full" 
                :value="systemInfo.system?.memory?.usage || 0" 
                max="100"
              ></progress>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Features -->
    <div class="max-w-6xl mx-auto">
      <h3 class="text-2xl font-bold text-center mb-8">核心功能</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-primary mb-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h4 class="text-lg font-semibold mb-2">智能配置</h4>
            <p class="text-sm text-base-content/70">
              直观的设置界面，轻松配置机器人参数和行为模式
            </p>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-secondary mb-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-16.5 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
            </svg>
            <h4 class="text-lg font-semibold mb-2">多平台支持</h4>
            <p class="text-sm text-base-content/70">
              支持 QQ、微信、Telegram 等多个聊天平台
            </p>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-accent mb-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h4 class="text-lg font-semibold mb-2">实时监控</h4>
            <p class="text-sm text-base-content/70">
              实时查看日志、监控系统状态和性能指标
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Technology Stack -->
    <div class="max-w-4xl mx-auto">
      <h3 class="text-2xl font-bold text-center mb-8">系统信息</h3>
      
      <!-- 实时系统状态 -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h4 class="card-title text-lg">CPU 信息</h4>
              <div 
                class="loading loading-spinner loading-sm"
                v-if="loading"
              ></div>
            </div>
            
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/70">型号</span>
                <span class="font-mono text-sm">{{ getCpuModel() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">核心数</span>
                <span class="font-mono">{{ systemInfo.system?.cpu?.cores || 'N/A' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/70">使用率</span>
                <div class="flex items-center gap-2">
                  <progress 
                    class="progress progress-primary w-20" 
                    :value="systemInfo.system?.cpu?.usage || 0" 
                    max="100"
                  ></progress>
                  <span class="font-mono text-sm min-w-[3rem]">{{ systemInfo.system?.cpu?.usage || 0 }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h4 class="card-title text-lg">内存信息</h4>
              <button 
                class="btn btn-ghost btn-sm"
                @click="refreshSystemInfo"
                :disabled="loading"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke-width="1.5" 
                  stroke="currentColor" 
                  class="w-4 h-4"
                  :class="{ 'animate-spin': loading }"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
            
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/70">总内存</span>
                <span class="font-mono">{{ systemInfo.system?.memory?.total?.toFixed(2) || 0 }} GB</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">已使用</span>
                <span class="font-mono">{{ systemInfo.system?.memory?.used?.toFixed(2) || 0 }} GB</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/70">使用率</span>
                <div class="flex items-center gap-2">
                  <progress 
                    class="progress progress-secondary w-20" 
                    :value="systemInfo.system?.memory?.usage || 0" 
                    max="100"
                  ></progress>
                  <span class="font-mono text-sm min-w-[3rem]">{{ systemInfo.system?.memory?.usage || 0 }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="text-2xl font-bold text-center mb-8">技术栈</h3>
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div class="text-center">
              <div class="text-4xl mb-2">🎯</div>
              <div class="font-semibold">Vue 3</div>
              <div class="text-xs text-base-content/50">前端框架</div>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">📘</div>
              <div class="font-semibold">TypeScript</div>
              <div class="text-xs text-base-content/50">类型安全</div>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🎨</div>
              <div class="font-semibold">Tailwind CSS</div>
              <div class="text-xs text-base-content/50">样式框架</div>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">⚡</div>
              <div class="font-semibold">Vite</div>
              <div class="text-xs text-base-content/50">构建工具</div>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🍍</div>
              <div class="font-semibold">Pinia</div>
              <div class="text-xs text-base-content/50">状态管理</div>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🛣️</div>
              <div class="font-semibold">Vue Router</div>
              <div class="text-xs text-base-content/50">路由管理</div>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🌼</div>
              <div class="font-semibold">DaisyUI</div>
              <div class="text-xs text-base-content/50">组件库</div>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🧪</div>
              <div class="font-semibold">Vitest</div>
              <div class="text-xs text-base-content/50">单元测试</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Links and Contact -->
    <div class="max-w-2xl mx-auto text-center">
      <h3 class="text-xl font-bold mb-6">联系我们</h3>
      <div class="flex justify-center gap-6">
        <a href="#" class="btn btn-outline btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0L12 21m0 0l-8.495-4.902m0 0L12.75 3.031" />
          </svg>
          GitHub
        </a>
        <a href="#" class="btn btn-outline btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3s-4.5 4.03-4.5 9 2.015 9 4.5 9z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01M8.25 21l1.975-6.019a2.25 2.25 0 011.33-1.33L15 12.75l-3.555-1.555a2.25 2.25 0 01-1.33-1.33L8.25 3" />
          </svg>
          文档
        </a>
        <a href="#" class="btn btn-outline btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          反馈
        </a>
      </div>
      
      <div class="divider"></div>
      
      <p class="text-sm text-base-content/50">
        © 2025 MaiMai Launcher. 基于 MIT 协议开源.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 接口定义
interface SystemInfo {
  name: string
  version: string
  description: string
  environment: string
  nodeVersion: string
  platform: string
  arch: string
  startTime: string
  uptime: number
  system?: {
    hostname: string
    type: string
    release: string
    cpu: {
      model: string
      cores: number
      usage: number
    }
    memory: {
      total: number
      used: number
      free: number
      usage: number
    }
    network: {
      interfaces: number
      activeInterfaces: string[]
    }
    loadAverage: number[]
  }
}

// 响应式数据
const loading = ref(false)
const systemInfo = ref<SystemInfo>({} as SystemInfo)
const isSystemHealthy = ref(false)

// 定时器
let refreshTimer: number | null = null

// 方法
const fetchSystemInfo = async () => {
  try {
    const response = await fetch('http://localhost:7999/api/info')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const result = await response.json()
    if (result.status === 200) {
      systemInfo.value = result.data
      isSystemHealthy.value = true
    } else {
      throw new Error(result.message || '获取系统信息失败')
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
    isSystemHealthy.value = false
  }
}

const refreshSystemInfo = async () => {
  loading.value = true
  try {
    await fetchSystemInfo()
  } finally {
    loading.value = false
  }
}

const getSystemStatus = () => {
  if (!systemInfo.value.name) return '连接中...'
  return isSystemHealthy.value ? '运行正常' : '连接失败'
}

const formatUptime = (uptime: number) => {
  if (!uptime) return '未知'
  
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  
  if (days > 0) {
    return `${days}天`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${minutes}分钟`
  }
}

const getCpuModel = () => {
  if (!systemInfo.value.system?.cpu?.model) return 'N/A'
  
  const model = systemInfo.value.system.cpu.model
  // 提取CPU型号的主要部分（去掉详细规格）
  const match = model.match(/^([^@(]+)/)
  return match ? match[1].trim() : model.split(' ').slice(0, 3).join(' ')
}

// 生命周期
onMounted(async () => {
  // 初始加载数据
  await refreshSystemInfo()
  
  // 设置定时刷新 (每5秒)
  refreshTimer = window.setInterval(async () => {
    await fetchSystemInfo() // 后台刷新，不显示loading
  }, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
/* 实时数据动画 */
.stat-value {
  transition: all 0.3s ease;
}

/* 进度条动画 */
.progress {
  transition: value 0.5s ease;
  animation: progressPulse 2s ease-in-out infinite alternate;
}

@keyframes progressPulse {
  0% {
    filter: brightness(1);
  }
  100% {
    filter: brightness(1.1);
  }
}

/* 状态徽章动画 */
.badge-success {
  animation: statusPulse 2s ease-in-out infinite;
}

.badge-error {
  animation: errorBlink 1s ease-in-out infinite alternate;
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

@keyframes errorBlink {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

/* 卡片悬停效果 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 加载状态 */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 数字滚动效果 */
.font-mono {
  font-variant-numeric: tabular-nums;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .grid.md\\:grid-cols-2 {
    gap: 1rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .progress.w-20 {
    width: 3rem;
  }
}
</style>
