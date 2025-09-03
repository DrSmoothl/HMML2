<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl w-full max-h-[90vh] overflow-auto">
      <!-- 模态框头部 -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <!-- 插件图标 -->
          <div class="avatar placeholder">
            <div class="bg-sky-500 text-white rounded-xl w-20 h-20 relative">
              <span class="text-3xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{ getPluginInitial() }}</span>
            </div>
          </div>
          
          <div>
            <h3 class="font-bold text-2xl mb-2">{{ plugin.manifest.name || '未知插件' }}</h3>
            <div class="flex items-center gap-3 text-sm text-base-content/70">
              <span>{{ plugin.manifest.author?.name || '未知作者' }}</span>
              <div class="badge badge-outline">v{{ plugin.manifest.version || '0.0.0' }}</div>
              <div class="badge badge-ghost">{{ plugin.manifest.license || '未知许可证' }}</div>
              <div 
                v-if="plugin.installed" 
                class="badge badge-success gap-1"
              >
                <Icon icon="mdi:check-circle" class="text-xs" />
                已安装
              </div>
            </div>
          </div>
        </div>
        
        <!-- 关闭按钮 -->
        <button 
          class="btn btn-sm btn-circle btn-ghost"
          @click="$emit('close')"
        >
          <Icon icon="mdi:close" />
        </button>
      </div>

      <!-- 插件描述 -->
      <div class="mb-6">
        <h4 class="font-semibold text-lg mb-3 flex items-center gap-2">
          <Icon icon="mdi:information" class="text-info" />
          插件描述
        </h4>
        <p class="text-base-content/80 leading-relaxed">
          {{ plugin.manifest.description || '暂无描述信息' }}
        </p>
      </div>

      <!-- 插件信息网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- 基本信息 -->
        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h5 class="font-semibold mb-3 flex items-center gap-2">
              <Icon icon="mdi:tag" class="text-primary" />
              基本信息
            </h5>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/70">插件 ID:</span>
                <span class="font-mono text-sm">{{ plugin.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">版本:</span>
                <span class="font-mono">{{ plugin.manifest.version || '0.0.0' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">许可证:</span>
                <span>{{ plugin.manifest.license || '未知' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">默认语言:</span>
                <span>{{ plugin.manifest.default_locale || '未知' }}</span>
              </div>
              <div class="flex justify-between" v-if="plugin.manifest.manifest_version">
                <span class="text-base-content/70">清单版本:</span>
                <span>{{ plugin.manifest.manifest_version }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 作者信息 -->
        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h5 class="font-semibold mb-3 flex items-center gap-2">
              <Icon icon="mdi:account" class="text-secondary" />
              作者信息
            </h5>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/70">作者:</span>
                <span>{{ plugin.manifest.author?.name || '未知作者' }}</span>
              </div>
              <div class="flex justify-between" v-if="plugin.manifest.author?.url">
                <span class="text-base-content/70">主页:</span>
                <a 
                  :href="plugin.manifest.author.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary"
                >
                  访问
                </a>
              </div>
              <div class="flex justify-between" v-if="plugin.manifest.homepage_url">
                <span class="text-base-content/70">插件主页:</span>
                <a 
                  :href="plugin.manifest.homepage_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary"
                >
                  访问
                </a>
              </div>
              <div class="flex justify-between" v-if="plugin.manifest.repository_url">
                <span class="text-base-content/70">源码仓库:</span>
                <a 
                  :href="plugin.manifest.repository_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary"
                >
                  查看
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 兼容性信息 -->
      <div class="card bg-base-200 shadow-sm mb-6">
        <div class="card-body p-4">
          <h5 class="font-semibold mb-3 flex items-center gap-2">
            <Icon icon="mdi:check-decagram" class="text-success" />
            兼容性信息
          </h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex justify-between">
              <span class="text-base-content/70">最低版本:</span>
              <span class="font-mono">{{ plugin.manifest.host_application?.min_version || '未知' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/70">最高版本:</span>
              <span class="font-mono">
                {{ plugin.manifest.host_application?.max_version || '最新版本' }}
              </span>
            </div>
          </div>
          
          <!-- 兼容性状态 -->
          <div class="mt-4 p-3 rounded-lg" :class="[getCompatibilityInfo().bgClass, getCompatibilityInfo().borderClass]" style="border-width: 1px;">
            <div class="flex items-center gap-2" :class="getCompatibilityInfo().textClass">
              <Icon :icon="getCompatibilityInfo().icon" />
              <span class="font-medium">{{ getCompatibilityInfo().title }}</span>
            </div>
            <p class="text-sm text-base-content/70 mt-1">
              {{ getCompatibilityInfo().description }}
            </p>
          </div>
        </div>
      </div>

      <!-- 关键词标签 -->
      <div class="mb-6" v-if="plugin.manifest.keywords?.length">
        <h5 class="font-semibold mb-3 flex items-center gap-2">
          <Icon icon="mdi:tag-multiple" class="text-warning" />
          标签关键词
        </h5>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="keyword in plugin.manifest.keywords" 
            :key="keyword"
            class="badge badge-outline badge-lg"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <!-- 分类信息 -->
      <div class="mb-6" v-if="plugin.manifest.categories?.length">
        <h5 class="font-semibold mb-3 flex items-center gap-2">
          <Icon icon="mdi:folder-multiple" class="text-info" />
          插件分类
        </h5>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="category in plugin.manifest.categories" 
            :key="category"
            class="badge badge-primary badge-lg"
          >
            {{ category }}
          </span>
        </div>
      </div>

      <!-- 语言支持 -->
      <div class="mb-6" v-if="plugin.manifest.locales_path">
        <h5 class="font-semibold mb-3 flex items-center gap-2">
          <Icon icon="mdi:translate" class="text-accent" />
          多语言支持
        </h5>
        <div class="p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <div class="flex items-center gap-2 text-accent">
            <Icon icon="mdi:check-circle" />
            <span class="font-medium">支持多语言</span>
          </div>
          <p class="text-sm text-base-content/70 mt-1">
            此插件支持多语言，默认语言为 {{ plugin.manifest.default_locale }}
          </p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="modal-action justify-between">
        <div class="flex gap-2">
          <!-- 外部链接 -->
          <a 
            v-if="plugin.manifest.homepage_url"
            :href="plugin.manifest.homepage_url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost gap-2"
          >
            <Icon icon="mdi:home" />
            访问主页
          </a>
          <a 
            v-if="plugin.manifest.repository_url"
            :href="plugin.manifest.repository_url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost gap-2"
          >
            <Icon icon="mdi:source-repository" />
            查看源码
          </a>
        </div>
        
        <div class="flex gap-2">
          <button 
            class="btn btn-ghost"
            @click="$emit('close')"
          >
            取消
          </button>
          <!-- 安装状态按钮 -->
          <button 
            v-if="plugin.installed"
            class="btn btn-success gap-2"
            disabled
          >
            <Icon icon="mdi:check-circle" />
            已安装
          </button>
          <button 
            v-else
            class="btn btn-primary gap-2"
            @click="$emit('install', plugin)"
            :disabled="!plugin.manifest.repository_url"
            :title="!plugin.manifest.repository_url ? '此插件没有提供仓库地址，无法安装' : ''"
          >
            <Icon icon="mdi:download" />
            {{ !plugin.manifest.repository_url ? '无法安装' : '安装插件' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 模态框背景 -->
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">关闭</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

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

// Props
const props = defineProps<{
  plugin: Plugin
  isCompatible?: boolean
  currentVersion?: string
}>()

// Emits
defineEmits<{
  close: []
  install: [plugin: Plugin]
}>()

// 方法
const getPluginInitial = () => {
  const name = props.plugin?.manifest?.name
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const getCompatibilityInfo = () => {
  if (!props.currentVersion || !props.plugin.manifest.host_application) {
    return {
      compatible: true,
      title: '版本信息不完整',
      description: '无法确定兼容性，请谨慎安装',
      bgClass: 'bg-warning/10',
      borderClass: 'border-warning/20',
      textClass: 'text-warning',
      icon: 'mdi:alert-circle'
    }
  }
  
  if (props.isCompatible) {
    return {
      compatible: true,
      title: '兼容当前版本',
      description: `此插件与当前麦麦版本 ${props.currentVersion} 兼容，可以安全安装使用`,
      bgClass: 'bg-success/10',
      borderClass: 'border-success/20',
      textClass: 'text-success',
      icon: 'mdi:check-circle'
    }
  } else {
    const minVersion = props.plugin.manifest.host_application.min_version
    const maxVersion = props.plugin.manifest.host_application.max_version
    let versionRange = `需要版本 ${minVersion}`
    if (maxVersion) {
      versionRange += ` - ${maxVersion}`
    } else {
      versionRange += ' 及以上'
    }
    
    return {
      compatible: false,
      title: '不兼容当前版本',
      description: `此插件与当前麦麦版本 ${props.currentVersion} 不兼容。${versionRange}`,
      bgClass: 'bg-error/10',
      borderClass: 'border-error/20',
      textClass: 'text-error',
      icon: 'mdi:close-circle'
    }
  }
}
</script>

<style scoped>
/* 模态框滚动条样式 */
.modal-box::-webkit-scrollbar {
  width: 6px;
}

.modal-box::-webkit-scrollbar-track {
  background: hsl(var(--b3));
  border-radius: 3px;
}

.modal-box::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.3);
  border-radius: 3px;
}

.modal-box::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.5);
}

/* 头像样式 */
.avatar .bg-sky-500 {
  transition: all 0.3s ease;
}

.avatar .bg-sky-500:hover {
  transform: scale(1.05);
}

/* 卡片悬停效果 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* 徽章动画 */
.badge {
  transition: all 0.2s ease;
}

.badge:hover {
  transform: scale(1.05);
}

/* 链接悬停效果 */
.link {
  transition: all 0.2s ease;
}

.link:hover {
  transform: translateX(2px);
}

/* 状态框动画 */
.bg-success\/10 {
  animation: successGlow 2s ease-in-out infinite alternate;
}

.bg-error\/10 {
  animation: errorGlow 2s ease-in-out infinite alternate;
}

.bg-warning\/10 {
  animation: warningGlow 2s ease-in-out infinite alternate;
}

.bg-accent\/10 {
  animation: accentGlow 2s ease-in-out infinite alternate;
}

@keyframes successGlow {
  0% {
    background-color: hsl(var(--su) / 0.1);
  }
  100% {
    background-color: hsl(var(--su) / 0.15);
  }
}

@keyframes errorGlow {
  0% {
    background-color: hsl(var(--er) / 0.1);
  }
  100% {
    background-color: hsl(var(--er) / 0.15);
  }
}

@keyframes warningGlow {
  0% {
    background-color: hsl(var(--wa) / 0.1);
  }
  100% {
    background-color: hsl(var(--wa) / 0.15);
  }
}

@keyframes accentGlow {
  0% {
    background-color: hsl(var(--a) / 0.1);
  }
  100% {
    background-color: hsl(var(--a) / 0.15);
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .modal-box {
    max-width: 95vw;
    margin: 1rem;
  }
  
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .avatar .w-20 {
    width: 4rem;
    height: 4rem;
  }
}

@media (max-width: 480px) {
  .flex.items-start.justify-between {
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn {
    font-size: 0.75rem;
    padding: 0.5rem 1rem;
  }
  
  .modal-action {
    flex-direction: column;
    gap: 1rem;
  }
  
  .modal-action > div {
    width: 100%;
    justify-content: center;
  }
}
</style>
