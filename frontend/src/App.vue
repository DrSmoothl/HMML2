<template>
  <div id="app" class="min-h-screen bg-base-100">
    <!-- 初始设置流程 -->
    <WelcomeSetup 
      v-if="showSetup"
      @complete="handleSetupComplete"
    />
    
    <!-- 主应用界面 -->
    <div v-else class="drawer lg:drawer-open">
      <input 
        id="drawer-toggle" 
        type="checkbox" 
        class="drawer-toggle" 
        v-model="isSidebarOpen"
      />
      
      <!-- Main Content -->
      <div class="drawer-content flex flex-col">
        <!-- Header -->
        <header class="navbar bg-base-100 shadow-sm border-b border-base-200 sticky top-0 z-40">
          <div class="navbar-start">
            <label 
              for="drawer-toggle" 
              class="btn btn-square btn-ghost lg:hidden"
              aria-label="打开菜单"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                class="inline-block w-5 h-5 stroke-current"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </label>
          </div>
          
          <div class="navbar-center">
            <h1 class="text-xl font-semibold text-base-content">
              {{ pageTitle }}
            </h1>
          </div>
          
          <div class="navbar-end">
            <!-- 主题切换开关 -->
            <div class="flex items-center mr-2">
              <label class="swap swap-rotate cursor-pointer p-2 rounded-lg hover:bg-base-200 transition-colors">
                <input 
                  type="checkbox" 
                  class="theme-controller sr-only" 
                  @change="toggleTheme"
                  :checked="isDarkTheme"
                />
                
                <!-- 太阳图标 (明亮主题) -->
                <svg 
                  class="swap-off fill-current w-6 h-6 text-amber-500" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,1L15.39,6L20.36,5.64L17.77,10.17L22,12L17.77,13.83L20.36,18.36L15.39,18L12,23L8.61,18L3.64,18.36L6.23,13.83L2,12L6.23,10.17L3.64,5.64L8.61,6L12,1Z"/>
                </svg>
                
                <!-- 月亮图标 (深色主题) -->
                <svg 
                  class="swap-on fill-current w-6 h-6 text-blue-400" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24"
                >
                  <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z"/>
                </svg>
              </label>
            </div>
            
            <!-- 设置下拉菜单 -->
            <div class="dropdown dropdown-end">
              <label tabindex="0" class="btn btn-ghost btn-circle">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </label>
              <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li v-if="!isOneKeyEnv"><a @click="resetSetup">重置设置</a></li>
                <li><a>设置</a></li>
              </ul>
            </div>
          </div>
        </header>
        
        <!-- Page Content -->
        <main class="flex-1 p-6">
          <router-view v-slot="{ Component, route }">
            <component :is="Component" :key="route.path" />
          </router-view>
        </main>
      </div>
      
      <!-- Sidebar -->
      <div class="drawer-side z-50">
        <label for="drawer-toggle" class="drawer-overlay"></label>
        <AppSidebar />
      </div>
    </div>
    
    <!-- Loading Overlay -->
    <div 
      v-if="isLoading" 
      class="fixed inset-0 bg-base-100/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="loading loading-spinner loading-lg text-primary"></div>
    </div>

    <!-- 全屏 Token 验证模态（未验证前阻挡一切交互） -->
    <TokenGateModal
      v-if="!tokenValidated"
      @validated="handleTokenValidated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import WelcomeSetup from '@/components/setup/WelcomeSetup.vue'
import TokenGateModal from '@/components/security/TokenGateModal.vue'
import api from '@/utils/api'

const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const isSidebarOpen = ref(false)
const showSetup = ref(false)
const isOneKeyEnv = ref(false)
const tokenValidated = ref(localStorage.getItem('access_token_valid') === '1')

// 计算属性
const isLoading = computed(() => appStore.isLoading)
const isDarkTheme = computed(() => appStore.isDarkTheme)

const pageTitle = computed(() => {
  const routeMeta = route.meta
  return (routeMeta?.title as string) || 'MaiMai Launcher'
})

// 检测一键包环境
const checkOneKeyEnvironment = async () => {
  try {
    const response = await api.get('/system/isOneKeyEnv')
    if (response.data.status === 200) {
      isOneKeyEnv.value = response.data.data.isOneKeyEnv
    }
  } catch (error) {
    console.error('检测一键包环境失败:', error)
    isOneKeyEnv.value = false
  }
}

// 检查是否需要显示设置流程
const checkSetupRequired = () => {
  // 在一键包环境中自动标记设置完成
  if (isOneKeyEnv.value) {
    localStorage.setItem('setup-completed', 'true')
    showSetup.value = false
    return
  }
  
  const setupCompleted = localStorage.getItem('setup-completed')
  if (!setupCompleted) {
    showSetup.value = true
  }
}

// 处理设置完成
const handleSetupComplete = () => {
  showSetup.value = false
  localStorage.setItem('setup-completed', 'true')
}

const handleTokenValidated = () => {
  tokenValidated.value = true
}

// 重置设置（用于测试或重新配置）
const resetSetup = () => {
  // 在一键包环境中不允许重置设置
  if (isOneKeyEnv.value) {
    return
  }
  
  localStorage.removeItem('setup-completed')
  localStorage.removeItem('maimai-root-path')
  showSetup.value = true
}

// 切换主题
const toggleTheme = () => {
  appStore.toggleTheme()
}

// 组件挂载时检查设置状态
onMounted(async () => {
  // 初始化主题
  appStore.initializeTheme()
  
  // 检测一键包环境
  await checkOneKeyEnvironment()
  
  // 检查是否需要显示设置流程（必须在环境检测之后）
  checkSetupRequired()
})
</script>

<style scoped>
/* 组件特定样式 */
.navbar {
  backdrop-filter: blur(10px);
}

/* 主题切换开关样式 */
.swap {
  transition: all 0.3s ease-in-out;
}

.swap:hover {
  transform: scale(1.1);
}

.swap svg {
  transition: all 0.3s ease-in-out;
}

.swap-off {
  transform: rotate(0deg);
  opacity: 1;
}

.swap-on {
  transform: rotate(180deg);
  opacity: 1;
}

.theme-controller:checked ~ .swap-off {
  transform: rotate(-180deg);
  opacity: 0;
}

.theme-controller:checked ~ .swap-on {
  transform: rotate(0deg);
  opacity: 1;
}

.theme-controller:not(:checked) ~ .swap-off {
  transform: rotate(0deg);
  opacity: 1;
}

.theme-controller:not(:checked) ~ .swap-on {
  transform: rotate(180deg);
  opacity: 0;
}

/* 主题切换动画效果 */
.swap svg.swap-off {
  animation: sunRise 0.5s ease-in-out;
}

.swap svg.swap-on {
  animation: moonRise 0.5s ease-in-out;
}

@keyframes sunRise {
  0% { transform: rotate(-90deg) scale(0.8); opacity: 0; }
  100% { transform: rotate(0deg) scale(1); opacity: 1; }
}

@keyframes moonRise {
  0% { transform: rotate(90deg) scale(0.8); opacity: 0; }
  100% { transform: rotate(0deg) scale(1); opacity: 1; }
}
</style>
