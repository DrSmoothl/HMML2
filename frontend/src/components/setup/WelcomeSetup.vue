<template>
  <div class="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <!-- 欢迎卡片 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body text-center p-8">
          <!-- 步骤指示器 -->
          <div class="steps w-full mb-8">
            <div class="step" :class="{ 'step-primary': currentStep >= 1 }">欢迎</div>
            <div class="step" :class="{ 'step-primary': currentStep >= 2 }">设置路径</div>
            <div class="step" :class="{ 'step-primary': currentStep >= 3 }">添加适配器</div>
            <div class="step" :class="{ 'step-primary': currentStep >= 4 }">完成</div>
          </div>

          <!-- 步骤1: 欢迎 -->
          <div v-if="currentStep === 1" class="space-y-6">
            <!-- 一键包环境检测中 -->
            <div v-if="envCheckLoading" class="space-y-6">
              <div class="text-6xl mb-6">🔍</div>
              <h1 class="text-4xl font-bold text-primary mb-4">
                检测运行环境
              </h1>
              <p class="text-lg text-base-content/70 mb-8">
                正在检测当前运行环境...
              </p>
              <div class="flex justify-center">
                <span class="loading loading-spinner loading-lg"></span>
              </div>
            </div>

            <!-- 一键包环境 -->
            <div v-else-if="isOneKeyEnv" class="space-y-6">
              <div class="text-6xl mb-6">🎮</div>
              <h1 class="text-4xl font-bold text-primary mb-4">
                欢迎使用 MaiMai Launcher
              </h1>
              <div class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div class="font-bold">检测到一键包环境！</div>
                  <div class="text-sm">系统已自动配置所有必要的路径设置，无需手动配置。</div>
                </div>
              </div>
              <p class="text-lg text-base-content/70 mb-8">
                感谢您选择 MaiMai Launcher！<br>
                由于您使用的是一键包版本，所有配置已自动完成。<br>
                即将进入主界面...
              </p>
              <div class="flex justify-center">
                <span class="loading loading-spinner loading-lg text-primary"></span>
              </div>
            </div>

            <!-- 开发环境/手动配置 -->
            <div v-else class="space-y-6">
              <div class="text-6xl mb-6">🎮</div>
              <h1 class="text-4xl font-bold text-primary mb-4">
                欢迎使用 MaiMai Launcher
              </h1>
              <p class="text-lg text-base-content/70 mb-8">
                感谢您选择 MaiMai Launcher！<br>
                让我们开始设置，只需要几个简单的步骤即可完成配置。
              </p>
              <div class="flex gap-4 justify-center">
                <button class="btn btn-primary btn-lg flex items-center gap-2 whitespace-nowrap" @click="nextStep">
                  开始设置
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 步骤2: 设置路径 -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div class="text-5xl mb-6">📁</div>
            <h2 class="text-3xl font-bold mb-4">设置 MaiMai 根目录</h2>
            <p class="text-base-content/70 mb-8">
              请输入您的 MaiMai 主程序所在的完整路径。<br>
              这个目录通常包含 MaiMai 的主程序文件和配置文件。
            </p>

            <!-- 路径选择区域 -->
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">MaiMai 根目录路径</span>
                </label>
                <div class="space-y-2">
                  <input 
                    v-model="selectedPath"
                    type="text" 
                    placeholder="例如: C:\MaiMai 或 /home/user/MaiMai" 
                    class="input input-bordered w-full"
                    :class="{ 
                      'input-error': selectedPath && !pathValidation.isValid,
                      'input-success': selectedPath && pathValidation.isValid
                    }"
                    @input="validatePath"
                  />
                  <div class="text-xs text-base-content/60">
                    请输入完整的文件夹路径
                  </div>
                </div>
                
                <!-- 路径验证提示 -->
                <div class="label" v-if="selectedPath">
                  <span class="label-text-alt" :class="{
                    'text-error': !pathValidation.isValid,
                    'text-success': pathValidation.isValid
                  }">
                    {{ pathValidation.message }}
                  </span>
                </div>

                <!-- 路径格式说明 -->
                <div class="mt-6 p-4 bg-base-200 rounded-lg">
                  <h4 class="font-semibold mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    路径格式说明
                  </h4>
                  
                  <div class="space-y-2 text-sm text-base-content/70 mb-4">
                    <div class="flex items-center gap-2">
                      <span class="w-16 font-medium">Windows:</span>
                      <code class="bg-base-300 px-2 py-1 rounded text-xs">C:\Games\MaiMai</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-16 font-medium">macOS:</span>
                      <code class="bg-base-300 px-2 py-1 rounded text-xs">/Applications/MaiMai</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-16 font-medium">Linux:</span>
                      <code class="bg-base-300 px-2 py-1 rounded text-xs">/home/用户名/MaiMai</code>
                    </div>
                  </div>
                  
                  <!-- 快捷路径按钮 -->
                  <div>
                    <p class="text-sm font-medium mb-2">快速填入：</p>
                    <div class="flex gap-2">
                      <button 
                        v-for="template in pathTemplates" 
                        :key="template.path"
                        class="btn btn-sm btn-outline"
                        @click="applyPathTemplate(template.path)"
                        :title="template.description"
                      >
                        {{ template.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 路径验证状态 -->
              <div v-if="pathValidation.checked" class="alert" :class="pathValidation.isValid ? 'alert-success' : 'alert-error'">
                <svg v-if="pathValidation.isValid" xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ pathValidation.message }}</span>
              </div>
            </div>

            <div class="flex gap-4 justify-center">
              <button class="btn btn-outline flex items-center gap-2 whitespace-nowrap" @click="prevStep">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                返回
              </button>
              <button 
                class="btn btn-primary flex items-center gap-2 whitespace-nowrap min-w-fit" 
                @click="savePath"
                :disabled="!selectedPath || submitting || !pathValidation.isValid"
                :loading="submitting"
              >
                <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
                <template v-else>
                  保存并继续
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </template>
              </button>
            </div>
          </div>

          <!-- 步骤3: 添加适配器 -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="text-5xl mb-6">🎯</div>
            <h2 class="text-3xl font-bold mb-4">添加 QQ 适配器</h2>
            <p class="text-base-content/70 mb-8">
              请输入您的 QQ 适配器所在的完整路径。<br>
              适配器用于连接和管理外部服务，这是 MaiMai 的重要组件。
            </p>

            <!-- 适配器路径选择区域 -->
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">QQ 适配器根目录路径</span>
                </label>
                <div class="space-y-2">
                  <input 
                    v-model="selectedAdapterPath"
                    type="text" 
                    placeholder="例如: C:\QQBot\Adapter 或 /home/user/QQAdapter" 
                    class="input input-bordered w-full"
                    :class="{ 
                      'input-error': selectedAdapterPath && !adapterPathValidation.isValid,
                      'input-success': selectedAdapterPath && adapterPathValidation.isValid
                    }"
                    @input="validateAdapterPath"
                  />
                  <div class="text-xs text-base-content/60">
                    请输入 QQ 适配器的完整文件夹路径
                  </div>
                </div>
                
                <!-- 适配器路径验证提示 -->
                <div class="label" v-if="selectedAdapterPath">
                  <span class="label-text-alt" :class="{
                    'text-error': !adapterPathValidation.isValid,
                    'text-success': adapterPathValidation.isValid
                  }">
                    {{ adapterPathValidation.message }}
                  </span>
                </div>

                <!-- 适配器路径格式说明 -->
                <div class="mt-6 p-4 bg-base-200 rounded-lg">
                  <h4 class="font-semibold mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    适配器路径格式说明
                  </h4>
                  
                  <div class="space-y-2 text-sm text-base-content/70 mb-4">
                    <div class="flex items-center gap-2">
                      <span class="w-16 font-medium">Windows:</span>
                      <code class="bg-base-300 px-2 py-1 rounded text-xs">C:\QQBot\Adapter</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-16 font-medium">macOS:</span>
                      <code class="bg-base-300 px-2 py-1 rounded text-xs">/Applications/QQAdapter</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-16 font-medium">Linux:</span>
                      <code class="bg-base-300 px-2 py-1 rounded text-xs">/home/用户名/QQAdapter</code>
                    </div>
                  </div>
                  
                  <!-- 快捷适配器路径按钮 -->
                  <div>
                    <p class="text-sm font-medium mb-2">快速填入：</p>
                    <div class="flex gap-2">
                      <button 
                        v-for="template in adapterPathTemplates" 
                        :key="template.path"
                        class="btn btn-sm btn-outline"
                        @click="applyAdapterPathTemplate(template.path)"
                        :title="template.description"
                      >
                        {{ template.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 适配器路径验证状态 -->
              <div v-if="adapterPathValidation.checked" class="alert" :class="adapterPathValidation.isValid ? 'alert-success' : 'alert-error'">
                <svg v-if="adapterPathValidation.isValid" xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ adapterPathValidation.message }}</span>
              </div>
            </div>

            <div class="flex gap-4 justify-center">
              <button class="btn btn-outline flex items-center gap-2 whitespace-nowrap" @click="prevStep">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                返回
              </button>
              <button 
                class="btn btn-outline flex items-center gap-2 whitespace-nowrap" 
                @click="skipAdapter"
              >
                跳过此步
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                </svg>
              </button>
              <button 
                class="btn btn-primary flex items-center gap-2 whitespace-nowrap min-w-fit" 
                @click="saveAdapterPath"
                :disabled="!selectedAdapterPath || submittingAdapter || !adapterPathValidation.isValid"
                :loading="submittingAdapter"
              >
                <span v-if="submittingAdapter" class="loading loading-spinner loading-sm"></span>
                <template v-else>
                  设置适配器
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </template>
              </button>
            </div>
          </div>

          <!-- 步骤4: 完成 -->
          <div v-if="currentStep === 4" class="space-y-6">
            <div class="text-6xl mb-6">🎉</div>
            <h2 class="text-3xl font-bold text-success mb-4">设置完成！</h2>
            <p class="text-lg text-base-content/70 mb-8">
              恭喜！您已成功配置 MaiMai Launcher。<br>
              现在您可以开始使用所有功能了。
            </p>

            <div class="stats bg-base-200 shadow w-full">
              <div class="stat">
                <div class="stat-figure text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div class="stat-title">MaiMai 根目录</div>
                <div class="stat-value text-base text-success">已配置</div>
                <div class="stat-desc">{{ selectedPath }}</div>
              </div>
              
              <div class="stat" v-if="selectedAdapterPath">
                <div class="stat-figure text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div class="stat-title">QQ 适配器</div>
                <div class="stat-value text-base text-success">已配置</div>
                <div class="stat-desc">{{ selectedAdapterPath }}</div>
              </div>
              
              <div class="stat" v-else>
                <div class="stat-figure text-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div class="stat-title">QQ 适配器</div>
                <div class="stat-value text-base text-warning">已跳过</div>
                <div class="stat-desc">可稍后在设置中配置</div>
              </div>
            </div>

            <div class="flex justify-center">
              <button class="btn btn-primary btn-lg flex items-center gap-2 whitespace-nowrap" @click="completeSetup">
                进入主界面
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="text-center mt-6">
        <p class="text-base-content/50 text-sm">
          如果您在设置过程中遇到问题，请查看帮助文档或联系技术支持
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import api from '@/utils/api'

// 组件事件
const emit = defineEmits<{
  complete: []
}>()

// 一键包环境检测
const isOneKeyEnv = ref(false)
const envCheckLoading = ref(true)

// 路径模板数据
const pathTemplates = [
  { label: 'Windows', path: 'C:\\Games\\MaiMai', description: 'Windows 系统推荐路径' },
  { label: 'macOS', path: '/Applications/MaiMai', description: 'macOS 系统推荐路径' },
  { label: 'Linux', path: '/home/用户名/MaiMai', description: 'Linux 系统推荐路径' }
]

// 适配器路径模板数据
const adapterPathTemplates = [
  { label: 'Windows', path: 'C:\\QQBot\\Adapter', description: 'Windows 系统 QQ 适配器推荐路径' },
  { label: 'macOS', path: '/Applications/QQAdapter', description: 'macOS 系统 QQ 适配器推荐路径' },
  { label: 'Linux', path: '/home/用户名/QQAdapter', description: 'Linux 系统 QQ 适配器推荐路径' }
]

// 响应式数据
const currentStep = ref(1)
const selectedPath = ref('')
const selectedAdapterPath = ref('')
const submitting = ref(false)
const submittingAdapter = ref(false)

// 路径验证状态
const pathValidation = reactive({
  checked: false,
  isValid: false,
  message: ''
})

// 适配器路径验证状态
const adapterPathValidation = reactive({
  checked: false,
  isValid: false,
  message: ''
})

// 检测一键包环境
async function checkOneKeyEnvironment() {
  try {
    envCheckLoading.value = true
    const response = await api.get('/system/isOneKeyEnv')
    
    if (response.data.status === 200) {
      isOneKeyEnv.value = response.data.data.isOneKeyEnv
      
      if (isOneKeyEnv.value) {
        console.log('检测到一键包环境，自动跳过设置流程')
        // 在一键包环境中，直接完成设置
        setTimeout(() => {
          completeSetup()
        }, 1000) // 给用户一点时间看到检测结果
      }
    }
  } catch (error) {
    console.error('检测一键包环境失败:', error)
    // 检测失败时默认为非一键包环境，继续正常流程
    isOneKeyEnv.value = false
  } finally {
    envCheckLoading.value = false
  }
}

// 组件挂载时检测环境
onMounted(() => {
  checkOneKeyEnvironment()
})

// 监听路径变化，进行验证
watch(selectedPath, async (newPath) => {
  if (newPath) {
    await validatePath()
  } else {
    pathValidation.checked = false
    pathValidation.isValid = false
    pathValidation.message = ''
  }
})

// 监听适配器路径变化，进行验证
watch(selectedAdapterPath, async (newPath) => {
  if (newPath) {
    await validateAdapterPath()
  } else {
    adapterPathValidation.checked = false
    adapterPathValidation.isValid = false
    adapterPathValidation.message = ''
  }
})

// 方法
function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function validatePath() {
  if (!selectedPath.value) {
    pathValidation.isValid = false
    pathValidation.message = '请输入路径'
    return
  }

  const path = selectedPath.value.trim()
  
  try {
    // 检测操作系统类型
    const isWindows = /^[A-Za-z]:\\/.test(path) || /^\\\\/.test(path)
    const isUnixLike = path.startsWith('/')
    
    if (!isWindows && !isUnixLike) {
      pathValidation.isValid = false
      pathValidation.message = '路径格式不正确，请参考下方示例'
      return
    }

    // Windows路径验证
    if (isWindows) {
      // 检查Windows路径格式
      const windowsPathRegex = /^[A-Za-z]:\\(?:[^<>:"|?*\r\n\/\\]+\\?)*$|^\\\\[^<>:"|?*\r\n\/\\]+\\[^<>:"|?*\r\n\/\\]+(?:\\[^<>:"|?*\r\n\/\\]+)*\\?$/
      if (!windowsPathRegex.test(path)) {
        pathValidation.isValid = false
        pathValidation.message = 'Windows路径格式不正确，不能包含 < > : " | ? * 等字符'
        return
      }

      // 检查驱动器字母
      const driveLetter = path.charAt(0).toUpperCase()
      if (driveLetter < 'A' || driveLetter > 'Z') {
        pathValidation.isValid = false
        pathValidation.message = '驱动器字母必须是A-Z之间'
        return
      }
    }

    // Unix-like路径验证 (Linux/macOS)
    if (isUnixLike) {
      // 检查是否包含非法字符（在Unix系统中，主要是空字节）
      if (path.includes('\0')) {
        pathValidation.isValid = false
        pathValidation.message = 'Unix路径不能包含空字节'
        return
      }

      // 检查路径长度（大多数文件系统限制）
      if (path.length > 4096) {
        pathValidation.isValid = false
        pathValidation.message = '路径太长，请使用较短的路径'
        return
      }

      // 检查单个路径组件长度
      const pathComponents = path.split('/').filter(component => component.length > 0)
      for (const component of pathComponents) {
        if (component.length > 255) {
          pathValidation.isValid = false
          pathValidation.message = '文件夹名称太长，单个名称不能超过255字符'
          return
        }
      }
    }

    // 检查路径长度
    if (path.length < 3) {
      pathValidation.isValid = false
      pathValidation.message = '路径太短，请输入完整路径'
      return
    }

    if (path.length > 260 && isWindows) {
      pathValidation.isValid = false
      pathValidation.message = 'Windows路径不能超过260字符，请使用较短的路径'
      return
    }

    // 检查是否是根目录（通常不建议）
    if ((isWindows && /^[A-Za-z]:\\?$/.test(path)) || (isUnixLike && path === '/')) {
      pathValidation.isValid = false
      pathValidation.message = '不建议使用根目录，请选择一个子文件夹'
      return
    }

    // 检查连续的路径分隔符
    if (path.includes('//') || (isWindows && path.includes('\\\\'))) {
      pathValidation.isValid = false
      pathValidation.message = '路径中不能有连续的分隔符'
      return
    }

    // 如果所有验证都通过
    pathValidation.isValid = true
    pathValidation.message = '路径格式正确'

  } catch (error) {
    pathValidation.isValid = false
    pathValidation.message = '路径验证失败'
  }
}

async function validateAdapterPath() {
  if (!selectedAdapterPath.value) {
    adapterPathValidation.isValid = false
    adapterPathValidation.message = '请输入适配器路径'
    return
  }

  const path = selectedAdapterPath.value.trim()
  
  try {
    // 检测操作系统类型
    const isWindows = /^[A-Za-z]:\\/.test(path) || /^\\\\/.test(path)
    const isUnixLike = path.startsWith('/')
    
    if (!isWindows && !isUnixLike) {
      adapterPathValidation.isValid = false
      adapterPathValidation.message = '路径格式不正确，请参考下方示例'
      return
    }

    // Windows路径验证
    if (isWindows) {
      // 检查Windows路径格式
      const windowsPathRegex = /^[A-Za-z]:\\(?:[^<>:"|?*\r\n\/\\]+\\?)*$|^\\\\[^<>:"|?*\r\n\/\\]+\\[^<>:"|?*\r\n\/\\]+(?:\\[^<>:"|?*\r\n\/\\]+)*\\?$/
      if (!windowsPathRegex.test(path)) {
        adapterPathValidation.isValid = false
        adapterPathValidation.message = 'Windows路径格式不正确，不能包含 < > : " | ? * 等字符'
        return
      }

      // 检查驱动器字母
      const driveLetter = path.charAt(0).toUpperCase()
      if (driveLetter < 'A' || driveLetter > 'Z') {
        adapterPathValidation.isValid = false
        adapterPathValidation.message = '驱动器字母必须是A-Z之间'
        return
      }
    }

    // Unix-like路径验证 (Linux/macOS)
    if (isUnixLike) {
      // 检查是否包含非法字符（在Unix系统中，主要是空字节）
      if (path.includes('\0')) {
        adapterPathValidation.isValid = false
        adapterPathValidation.message = 'Unix路径不能包含空字节'
        return
      }

      // 检查路径长度（大多数文件系统限制）
      if (path.length > 4096) {
        adapterPathValidation.isValid = false
        adapterPathValidation.message = '路径太长，请使用较短的路径'
        return
      }

      // 检查单个路径组件长度
      const pathComponents = path.split('/').filter(component => component.length > 0)
      for (const component of pathComponents) {
        if (component.length > 255) {
          adapterPathValidation.isValid = false
          adapterPathValidation.message = '文件夹名称太长，单个名称不能超过255字符'
          return
        }
      }
    }

    // 检查路径长度
    if (path.length < 3) {
      adapterPathValidation.isValid = false
      adapterPathValidation.message = '路径太短，请输入完整路径'
      return
    }

    if (path.length > 260 && isWindows) {
      adapterPathValidation.isValid = false
      adapterPathValidation.message = 'Windows路径不能超过260字符，请使用较短的路径'
      return
    }

    // 检查是否是根目录（通常不建议）
    if ((isWindows && /^[A-Za-z]:\\?$/.test(path)) || (isUnixLike && path === '/')) {
      adapterPathValidation.isValid = false
      adapterPathValidation.message = '不建议使用根目录，请选择一个子文件夹'
      return
    }

    // 检查连续的路径分隔符
    if (path.includes('//') || (isWindows && path.includes('\\\\'))) {
      adapterPathValidation.isValid = false
      adapterPathValidation.message = '路径中不能有连续的分隔符'
      return
    }

    // 如果所有验证都通过
    adapterPathValidation.isValid = true
    adapterPathValidation.message = '适配器路径格式正确'

    // 注意：这里不检查适配器是否已存在，将在设置阶段处理

  } catch (error) {
    adapterPathValidation.isValid = false
    adapterPathValidation.message = '适配器路径验证失败'
  }
}

async function savePath() {
  if (!selectedPath.value || !pathValidation.isValid) {
    return
  }

  try {
    submitting.value = true

    // 调用后端API保存主程序根目录
    const response = await api.post('/pathCache/setRootPath', {
      mainRoot: selectedPath.value
    })

    if (response.data.status === 200) {
      // 保存成功，进入下一步
      nextStep()
    } else {
      throw new Error(response.data.message || '保存路径失败')
    }
  } catch (error) {
    console.error('保存路径失败:', error)
    alert('保存路径失败: ' + (error instanceof Error ? error.message : String(error)))
  } finally {
    submitting.value = false
  }
}

async function saveAdapterPath() {
  if (!selectedAdapterPath.value || !adapterPathValidation.isValid) {
    return
  }

  try {
    submittingAdapter.value = true

    // 直接尝试添加适配器
    try {
      await api.post('/pathCache/addAdapterRoot', {
        adapterName: 'QQ适配器',
        rootPath: selectedAdapterPath.value
      })

      // 添加成功，进入下一步
      nextStep()
      return
    } catch (addError: any) {
      console.log('添加适配器失败，错误信息:', addError)
      console.log('错误状态码:', addError?.response?.status)
      console.log('错误code:', addError?.code)
      
      // 如果添加失败，可能是因为适配器已存在，尝试更新
      if (addError?.response?.status === 409 || addError?.code === '409') {
        console.log('适配器已存在，尝试更新...')
        // 适配器已存在，使用更新接口
        try {
          await api.put('/pathCache/updateAdapterRoot', {
            adapterName: 'QQ适配器',
            rootPath: selectedAdapterPath.value
          })
          
          console.log('更新适配器成功')
          // 更新成功，进入下一步
          nextStep()
        } catch (updateError: any) {
          console.error('更新适配器失败:', updateError)
          throw new Error('更新适配器失败: ' + (updateError?.response?.data?.message || updateError.message))
        }
      } else {
        // 其他错误，重新抛出
        console.log('其他错误，重新抛出')
        throw addError
      }
    }
  } catch (error: any) {
    console.error('设置适配器失败:', error)
    
    // 处理具体的错误信息
    let errorMessage = '设置适配器失败'
    if (error instanceof Error) {
      errorMessage += ': ' + error.message
    } else if (error?.response?.data?.message) {
      errorMessage += ': ' + error.response.data.message
    } else {
      errorMessage += ': ' + String(error)
    }
    
    alert(errorMessage)
  } finally {
    submittingAdapter.value = false
  }
}

function skipAdapter() {
  // 跳过适配器配置，直接进入下一步
  nextStep()
}

function completeSetup() {
  // 保存设置完成标识到 localStorage
  localStorage.setItem('setup-completed', 'true')
  
  // 触发完成事件
  emit('complete')
}

// 应用路径模板
function applyPathTemplate(templatePath: string) {
  selectedPath.value = templatePath
  // 手动触发验证
  validatePath()
}

// 应用适配器路径模板
function applyAdapterPathTemplate(templatePath: string) {
  selectedAdapterPath.value = templatePath
  // 手动触发验证
  validateAdapterPath()
}
</script>

<style scoped>
.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.input-group .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
