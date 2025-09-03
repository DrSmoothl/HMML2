<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200/50 to-base-300/30">
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-16 h-16">
            <Icon icon="mdi:store" class="text-5xl text-primary" />
          </div>
          <div>
            <h1 class="text-4xl font-bold text-primary">
              插件广场
            </h1>
            <p class="text-base-content/70 mt-2">发现并安装优秀的麦麦插件</p>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex items-center gap-3">
          <button 
            class="btn btn-outline btn-sm gap-2"
            @click="refreshPlugins"
            :disabled="loading"
          >
            <Icon 
              icon="mdi:refresh" 
              :class="{ 'animate-spin': loading }"
            />
            刷新
          </button>
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-sm gap-2">
              <Icon icon="mdi:sort" />
              排序
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><a @click="setSortBy('name')">按名称</a></li>
              <li><a @click="setSortBy('version')">按版本</a></li>
              <li><a @click="setSortBy('author')">按作者</a></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="card bg-base-100 shadow-lg mb-6">
        <div class="card-body">
          <div class="flex flex-col md:flex-row gap-4">
            <!-- 搜索框 -->
            <div class="flex-1">
              <div class="form-control">
                <div class="input-group">
                  <input 
                    type="text" 
                    placeholder="搜索插件..." 
                    class="input input-bordered flex-1"
                    v-model="searchQuery"
                    @input="filterPlugins"
                  />
                  <button class="btn btn-square">
                    <Icon icon="mdi:magnify" />
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 分类筛选 -->
            <div class="form-control w-full md:w-auto">
              <select 
                class="select select-bordered"
                v-model="selectedCategory"
                @change="filterPlugins"
              >
                <option value="">所有分类</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            
            <!-- 安装状态筛选 -->
            <div class="form-control w-full md:w-auto">
              <select 
                class="select select-bordered"
                v-model="selectedInstallStatus"
                @change="filterPlugins"
              >
                <option value="">所有插件</option>
                <option value="installed">已安装</option>
                <option value="not-installed">未安装</option>
              </select>
            </div>
            
            <!-- 版本兼容性筛选 -->
            <div class="form-control w-full md:w-auto">
              <select 
                class="select select-bordered"
                v-model="selectedCompatibility"
                @change="filterPlugins"
              >
                <option value="">所有版本</option>
                <option value="compatible">兼容当前版本</option>
                <option value="incompatible">不兼容</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/70">正在加载插件...</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="alert alert-error">
        <Icon icon="mdi:alert-circle" />
        <div>
          <h3 class="font-bold">加载失败</h3>
          <div class="text-xs">{{ error }}</div>
        </div>
        <button class="btn btn-sm" @click="refreshPlugins">重试</button>
      </div>

      <!-- 插件列表 -->
      <div v-else>
        <!-- 统计信息 -->
        <div class="flex items-center justify-between mb-6">
          <p class="text-base-content/70">
            共找到 <span class="font-bold text-primary">{{ filteredPlugins.length }}</span> 个插件
          </p>
          <div class="flex items-center gap-2">
            <span class="text-sm text-base-content/50">显示方式:</span>
            <div class="btn-group">
              <button 
                class="btn btn-sm"
                :class="{ 'btn-active': viewMode === 'grid' }"
                @click="viewMode = 'grid'"
              >
                <Icon icon="mdi:view-grid" />
              </button>
              <button 
                class="btn btn-sm"
                :class="{ 'btn-active': viewMode === 'list' }"
                @click="viewMode = 'list'"
              >
                <Icon icon="mdi:view-list" />
              </button>
            </div>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <PluginCard 
            v-for="plugin in filteredPlugins" 
            :key="plugin.id" 
            :plugin="plugin"
            :is-compatible="isPluginCompatible(plugin)"
            :current-version="currentMaiVersion"
            @install="handleInstall"
            @view-details="handleViewDetails"
          />
        </div>

        <!-- 列表视图 -->
        <div v-else class="space-y-4">
          <PluginListItem 
            v-for="plugin in filteredPlugins" 
            :key="plugin.id" 
            :plugin="plugin"
            :is-compatible="isPluginCompatible(plugin)"
            :current-version="currentMaiVersion"
            @install="handleInstall"
            @view-details="handleViewDetails"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="filteredPlugins.length === 0" class="text-center py-20">
          <Icon icon="mdi:package-variant" class="text-6xl text-base-content/30 mb-4" />
          <h3 class="text-xl font-bold text-base-content/70 mb-2">没有找到匹配的插件</h3>
          <p class="text-base-content/50">尝试调整搜索条件或筛选器</p>
        </div>
      </div>
    </div>

    <!-- 插件详情弹窗 -->
    <PluginDetailsModal 
      v-if="selectedPlugin"
      :plugin="selectedPlugin"
      @close="selectedPlugin = null"
      @install="handleInstall"
    />

    <!-- 确认安装模态框 -->
    <div class="modal" :class="{ 'modal-open': showInstallConfirm }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">确认安装插件</h3>
        <p class="py-4" v-if="pluginToInstall">
          确定要安装插件 <span class="font-bold text-primary">"{{ pluginToInstall.manifest.name }}"</span> 吗？
          <br><br>
          这将从仓库克隆插件代码到本地。
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="cancelInstall">取消</button>
          <button class="btn btn-primary" @click="confirmInstall" :disabled="installing">
            <span v-if="installing" class="loading loading-spinner loading-sm"></span>
            {{ installing ? '安装中...' : '确认安装' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示模态框 -->
    <div class="modal" :class="{ 'modal-open': showMessage }">
      <div class="modal-box">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <Icon 
            :icon="messageType === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'"
            :class="messageType === 'success' ? 'text-success' : 'text-error'"
          />
          {{ messageType === 'success' ? '操作成功' : '操作失败' }}
        </h3>
        <p class="py-4">{{ messageContent }}</p>
        <div class="modal-action">
          <button class="btn btn-primary" @click="closeMessage">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import PluginCard from '@/components/plugin/PluginCard.vue'
import PluginListItem from '@/components/plugin/PluginListItem.vue'
import PluginDetailsModal from '@/components/plugin/PluginDetailsModal.vue'
import api from '@/utils/api'

// 插件接口定义
interface PluginAuthor {
  name: string
  url?: string
}

interface PluginHostApplication {
  min_version: string
  max_version?: string
}

interface PluginManifest {
  manifest_version: number
  name: string
  version: string
  description: string
  author: PluginAuthor
  license: string
  host_application: PluginHostApplication
  homepage_url?: string
  repository_url?: string
  keywords: string[]
  categories?: string[]
  default_locale: string
  locales_path?: string
}

interface Plugin {
  id: string
  manifest: PluginManifest
  installed: boolean
}

// 响应式数据
const loading = ref(false)
const error = ref<string | null>(null)
const plugins = ref<Plugin[]>([])
const filteredPlugins = ref<Plugin[]>([])
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedInstallStatus = ref('')
const selectedCompatibility = ref('')
const sortBy = ref('name')
const viewMode = ref<'grid' | 'list'>('grid')
const selectedPlugin = ref<Plugin | null>(null)

// 版本相关
const currentMaiVersion = ref<string>('')

// 模态框相关
const showInstallConfirm = ref(false)
const pluginToInstall = ref<Plugin | null>(null)
const installing = ref(false)
const showMessage = ref(false)
const messageType = ref<'success' | 'error'>('success')
const messageContent = ref('')

// 计算属性
const categories = computed(() => {
  const categorySet = new Set<string>()
  plugins.value.forEach(plugin => {
    if (plugin.manifest.categories) {
      plugin.manifest.categories.forEach(category => categorySet.add(category))
    }
  })
  return Array.from(categorySet).sort()
})

// 版本比较函数
const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length)
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
}

// 检查插件是否兼容当前麦麦版本
const isPluginCompatible = (plugin: Plugin): boolean => {
  if (!currentMaiVersion.value || !plugin.manifest.host_application) {
    return true // 如果版本信息不完整，默认兼容
  }
  
  const currentVersion = currentMaiVersion.value
  const minVersion = plugin.manifest.host_application.min_version
  const maxVersion = plugin.manifest.host_application.max_version
  
  // 检查最低版本要求
  if (minVersion && compareVersions(currentVersion, minVersion) < 0) {
    return false
  }
  
  // 检查最高版本限制（如果有的话）
  if (maxVersion && compareVersions(currentVersion, maxVersion) > 0) {
    return false
  }
  
  return true
}

// 获取当前麦麦版本
const fetchMaiVersion = async () => {
  try {
    const response = await api.get('/system/getMaiVersion')
    if (response.data.status === 200) {
      currentMaiVersion.value = response.data.data.version
      console.log('当前麦麦版本:', currentMaiVersion.value)
    } else {
      console.warn('获取麦麦版本失败:', response.data.message)
    }
  } catch (error) {
    console.error('获取麦麦版本失败:', error)
  }
}

// 方法
const fetchPlugins = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get('/pluginMarket/get')
    
    if (response.data.status === 200) {
      plugins.value = response.data.data.items || []
      filterPlugins()
    } else {
      throw new Error(response.data.message || '获取插件列表失败')
    }
  } catch (err: any) {
    error.value = err.message || '网络请求失败'
    console.error('获取插件列表失败:', err)
  } finally {
    loading.value = false
  }
}

const filterPlugins = () => {
  let filtered = [...plugins.value]
  
  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(plugin => 
      plugin.manifest.name?.toLowerCase().includes(query) ||
      plugin.manifest.description?.toLowerCase().includes(query) ||
      plugin.manifest.author?.name?.toLowerCase().includes(query) ||
      plugin.manifest.keywords?.some(keyword => keyword.toLowerCase().includes(query))
    )
  }
  
  // 分类过滤
  if (selectedCategory.value) {
    filtered = filtered.filter(plugin => 
      plugin.manifest.categories?.includes(selectedCategory.value)
    )
  }
  
  // 安装状态过滤
  if (selectedInstallStatus.value) {
    if (selectedInstallStatus.value === 'installed') {
      filtered = filtered.filter(plugin => plugin.installed)
    } else if (selectedInstallStatus.value === 'not-installed') {
      filtered = filtered.filter(plugin => !plugin.installed)
    }
  }
  
  // 版本兼容性过滤
  if (selectedCompatibility.value) {
    if (selectedCompatibility.value === 'compatible') {
      filtered = filtered.filter(plugin => isPluginCompatible(plugin))
    } else if (selectedCompatibility.value === 'incompatible') {
      filtered = filtered.filter(plugin => !isPluginCompatible(plugin))
    }
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return (a.manifest.name || '').localeCompare(b.manifest.name || '')
      case 'version':
        return (b.manifest.version || '').localeCompare(a.manifest.version || '')
      case 'author':
        return (a.manifest.author?.name || '').localeCompare(b.manifest.author?.name || '')
      default:
        return 0
    }
  })
  
  filteredPlugins.value = filtered
}

const refreshPlugins = () => {
  fetchPlugins()
}

const setSortBy = (sort: string) => {
  sortBy.value = sort
  filterPlugins()
}

const handleInstall = async (plugin: Plugin) => {
  // 显示安装确认模态框
  pluginToInstall.value = plugin
  showInstallConfirm.value = true
}

const cancelInstall = () => {
  showInstallConfirm.value = false
  pluginToInstall.value = null
}

const confirmInstall = async () => {
  if (!pluginToInstall.value) return
  
  installing.value = true
  
  try {
    const response = await api.post('/pluginMarket/install', {
      plugin_id: pluginToInstall.value.id
    })
    
    if (response.data.status === 200) {
      showInstallConfirm.value = false
      showMessageModal('success', `插件 "${pluginToInstall.value.manifest.name}" 安装成功！`)
      // 刷新插件列表以更新安装状态
      await fetchPlugins()
    } else {
      throw new Error(response.data.message || '安装失败')
    }
  } catch (err: any) {
    console.error('安装插件失败:', err)
    showInstallConfirm.value = false
    showMessageModal('error', `安装失败: ${err.message || '未知错误'}`)
  } finally {
    installing.value = false
    pluginToInstall.value = null
  }
}

const showMessageModal = (type: 'success' | 'error', content: string) => {
  messageType.value = type
  messageContent.value = content
  showMessage.value = true
}

const closeMessage = () => {
  showMessage.value = false
  messageContent.value = ''
}

const handleViewDetails = (plugin: Plugin) => {
  selectedPlugin.value = plugin
}

// 生命周期
onMounted(async () => {
  await fetchMaiVersion()
  fetchPlugins()
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

/* 卡片悬停效果 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

/* 搜索框焦点效果 */
.input:focus {
  box-shadow: 0 0 0 2px hsl(var(--p) / 0.2);
}

/* 下拉菜单动画 */
.dropdown-content {
  animation: fadeInUp 0.2s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .text-4xl {
    font-size: 2rem;
  }
  
  .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>
