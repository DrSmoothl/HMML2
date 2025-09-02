<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200/50 to-base-300/30">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <!-- 欢迎标题区域 -->
      <div class="text-center mb-12">
        <div class="avatar mb-6">
          <div class="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center overflow-hidden">
            <img 
              src="@/assets/images/maimai.png" 
              alt="MaiMai Logo" 
              class="w-20 h-20 object-cover rounded-full"
            />
          </div>
        </div>
        <h1 class="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          MaiMai Launcher
        </h1>
        <p class="text-xl text-base-content/70 max-w-2xl mx-auto">
          麦麦启动器管理面板，为您提供优雅的机器人管理体验
        </p>
      </div>

      <!-- 后端服务状态 -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- 健康状态卡片 -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title flex items-center gap-2">
                <Icon icon="mdi:heart-pulse" class="text-success" />
                服务状态
              </h2>
              <div 
                class="badge"
                :class="{
                  'badge-success': healthData.status === 'healthy',
                  'badge-error': healthData.status === 'error',
                  'badge-warning': !healthData.status
                }"
              >
                {{ getHealthStatusText() }}
              </div>
            </div>
            
            <div class="space-y-3" v-if="healthData.status">
              <div class="flex justify-between">
                <span class="text-base-content/70">运行时间</span>
                <span class="font-mono">{{ formatUptime(healthData.uptime) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">内存使用</span>
                <span class="font-mono">{{ healthData.memory?.used || 0 }}MB / {{ healthData.memory?.total || 0 }}MB</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">版本</span>
                <span class="font-mono">{{ healthData.version || 'N/A' }}</span>
              </div>
            </div>
            
            <div v-else class="text-center py-4 text-base-content/50">
              <Icon icon="mdi:loading" class="text-2xl animate-spin mb-2" />
              <p>正在获取服务状态...</p>
            </div>
          </div>
        </div>

        <!-- 系统信息卡片 -->
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title flex items-center gap-2">
                <Icon icon="mdi:monitor" class="text-info" />
                系统信息
              </h2>
              <button 
                class="btn btn-ghost btn-sm"
                @click="refreshSystemInfo"
                :disabled="loading"
              >
                <Icon 
                  icon="mdi:refresh" 
                  :class="{ 'animate-spin': loading }"
                />
              </button>
            </div>
            
            <div class="space-y-3" v-if="systemInfo.system">
              <div class="flex justify-between">
                <span class="text-base-content/70">CPU</span>
                <span class="font-mono text-sm">{{ systemInfo.system.cpu?.model?.split(' ')[0] || 'N/A' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/70">CPU 使用率</span>
                <div class="flex items-center gap-2">
                  <progress 
                    class="progress progress-primary w-16" 
                    :value="systemInfo.system.cpu?.usage || 0" 
                    max="100"
                  ></progress>
                  <span class="font-mono text-sm">{{ systemInfo.system.cpu?.usage || 0 }}%</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/70">内存使用率</span>
                <div class="flex items-center gap-2">
                  <progress 
                    class="progress progress-secondary w-16" 
                    :value="systemInfo.system.memory?.usage || 0" 
                    max="100"
                  ></progress>
                  <span class="font-mono text-sm">{{ systemInfo.system.memory?.usage || 0 }}%</span>
                </div>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">平台</span>
                <span class="font-mono">{{ systemInfo.platform }} {{ systemInfo.arch }}</span>
              </div>
            </div>
            
            <div v-else class="text-center py-4 text-base-content/50">
              <Icon icon="mdi:loading" class="text-2xl animate-spin mb-2" />
              <p>正在获取系统信息...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能入口 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-6 flex items-center gap-2">
            <Icon icon="mdi:view-dashboard" class="text-primary" />
            功能入口
          </h2>
          
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <!-- 系统设置 -->
            <router-link 
              to="/settings/maimai" 
              class="btn btn-outline btn-lg h-24 flex-col gap-2 hover:bg-accent hover:text-accent-content transition-all duration-200"
            >
              <Icon icon="mdi:cog" class="text-2xl" />
              <span class="text-sm">系统设置</span>
            </router-link>
            
            <!-- 适配器设置 -->
            <router-link 
              to="/settings/adapter" 
              class="btn btn-outline btn-lg h-24 flex-col gap-2 hover:bg-info hover:text-info-content transition-all duration-200"
            >
              <Icon icon="mdi:tune" class="text-2xl" />
              <span class="text-sm">适配器设置</span>
            </router-link>
            
            <!-- 资源管理 -->
            <router-link 
              to="/resources/emoji" 
              class="btn btn-outline btn-lg h-24 flex-col gap-2 hover:bg-success hover:text-success-content transition-all duration-200"
            >
              <Icon icon="mdi:folder-multiple-image" class="text-2xl" />
              <span class="text-sm">资源管理</span>
            </router-link>
            
            <!-- 表情管理 -->
            <router-link 
              to="/resources/expression" 
              class="btn btn-outline btn-lg h-24 flex-col gap-2 hover:bg-warning hover:text-warning-content transition-all duration-200"
            >
              <Icon icon="mdi:emoticon-happy" class="text-2xl" />
              <span class="text-sm">表情管理</span>
            </router-link>
            
            <!-- 插件广场 -->
            <router-link 
              to="/plugin-market" 
              class="btn btn-outline btn-lg h-24 flex-col gap-2 hover:bg-secondary hover:text-secondary-content transition-all duration-200"
            >
              <Icon icon="mdi:puzzle" class="text-2xl" />
              <span class="text-sm">插件广场</span>
            </router-link>
            
            <!-- 欢迎设置 -->
            <router-link 
              to="/settings/welcome" 
              class="btn btn-outline btn-lg h-24 flex-col gap-2 hover:bg-primary hover:text-primary-content transition-all duration-200"
            >
              <Icon icon="mdi:hand-wave" class="text-2xl" />
              <span class="text-sm">欢迎设置</span>
            </router-link>
            
            <!-- 关于 -->
            <router-link 
              to="/about" 
              class="btn btn-outline btn-lg h-24 flex-col gap-2 hover:bg-base-300 hover:text-base-content transition-all duration-200"
            >
              <Icon icon="mdi:information" class="text-2xl" />
              <span class="text-sm">关于</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { Icon } from '@iconify/vue'

const route = useRoute()

// 接口定义
interface HealthData {
  status: string
  uptime: number
  memory?: {
    used: number
    total: number
    external: number
  }
  version?: string
  service?: string
}

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
const healthData = ref<HealthData>({} as HealthData)
const systemInfo = ref<SystemInfo>({} as SystemInfo)

// 定时器
let refreshTimer: number | null = null

// 方法
const fetchHealthData = async () => {
  try {
    const response = await fetch('http://localhost:7999/api/health')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const result = await response.json()
    if (result.status === 200) {
      healthData.value = result.data
    } else {
      throw new Error(result.message || '获取健康信息失败')
    }
  } catch (error) {
    console.error('获取健康信息失败:', error)
    healthData.value = { status: 'error' } as HealthData
  }
}

const fetchSystemInfo = async () => {
  try {
    const response = await fetch('http://localhost:7999/api/info')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const result = await response.json()
    if (result.status === 200) {
      systemInfo.value = result.data
    } else {
      throw new Error(result.message || '获取系统信息失败')
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
  }
}

const refreshSystemInfo = async () => {
  loading.value = true
  try {
    await Promise.all([fetchHealthData(), fetchSystemInfo()])
  } finally {
    loading.value = false
  }
}

const getHealthStatusText = () => {
  switch (healthData.value.status) {
    case 'healthy':
      return '健康'
    case 'error':
      return '错误'
    default:
      return '加载中'
  }
}

const formatUptime = (uptime: number) => {
  if (!uptime) return '未知'
  
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  
  if (days > 0) {
    return `${days}天 ${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

// 生命周期
onMounted(async () => {
  // 初始加载数据
  await refreshSystemInfo()
  
  // 设置定时刷新 (每5秒)
  refreshTimer = window.setInterval(async () => {
    await Promise.all([fetchHealthData(), fetchSystemInfo()])
  }, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

// 路由离开守卫 - 立即清除定时器
onBeforeRouteLeave((_to, _from, next) => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  next()
})

// 监听路由变化
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/' && oldPath !== '/') {
    // 返回首页时重新启动定时器
    refreshSystemInfo().then(() => {
      if (!refreshTimer) {
        refreshTimer = window.setInterval(async () => {
          await Promise.all([fetchHealthData(), fetchSystemInfo()])
        }, 5000)
      }
    })
  }
})
</script>

<style scoped>
/* 自定义渐变背景 */
.bg-gradient-to-br {
  animation: gradientShift 8s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background: linear-gradient(135deg, hsl(var(--b2)) 0%, hsl(var(--b3)) 100%);
  }
  50% {
    background: linear-gradient(135deg, hsl(var(--b3)) 0%, hsl(var(--b2)) 100%);
  }
}

/* 头像动画 */
.avatar .rounded-full {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 卡片悬停效果 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

/* 功能按钮特效 */
.btn-outline {
  position: relative;
  overflow: hidden;
}

.btn-outline::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.btn-outline:hover::before {
  left: 100%;
}

/* 进度条动画 */
.progress {
  animation: progressGlow 2s ease-in-out infinite alternate;
}

@keyframes progressGlow {
  0% {
    filter: brightness(1);
  }
  100% {
    filter: brightness(1.2);
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .text-5xl {
    font-size: 2.5rem;
  }
  
  .grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  
  .btn-lg.h-24 {
    height: 4rem;
    font-size: 0.75rem;
  }
  
  .card-body {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .avatar .w-24 {
    width: 4rem;
    height: 4rem;
  }
  
  .text-5xl {
    font-size: 2rem;
  }
  
  .text-xl {
    font-size: 1rem;
  }
  
  .grid.grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .btn-lg.h-24 {
    height: 3rem;
  }
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .bg-gradient-to-br {
    background: linear-gradient(135deg, hsl(var(--b1)) 0%, hsl(var(--b2)) 100%);
  }
}

/* 加载状态 */
.animate-spin {
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

/* 徽章脉冲效果 */
.badge-success {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
