<template>
  <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 h-full flex flex-col">
    <div class="card-body p-6 flex flex-col h-full">
      <!-- 插件头部信息 -->
      <div class="flex items-start justify-between mb-4 gap-3">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <!-- 插件图标/占位符 -->
          <div class="avatar placeholder flex-shrink-0">
            <div class="bg-sky-500 text-white rounded-lg w-12 h-12 relative">
              <span class="text-lg font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{{ getPluginInitial() }}</span>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <h3 
              class="font-bold text-lg leading-tight mb-1 line-clamp-2" 
              :title="plugin.manifest.name"
            >
              {{ plugin.manifest.name || '未知插件' }}
            </h3>
            <p class="text-sm text-base-content/60 truncate" :title="plugin.manifest.author?.name">
              by {{ plugin.manifest.author?.name || '未知作者' }}
            </p>
          </div>
        </div>
        
        <!-- 版本徽章和安装状态 -->
        <div class="flex flex-col items-end gap-1 flex-shrink-0">
          <div class="badge badge-outline badge-sm">
            v{{ plugin.manifest.version || '0.0.0' }}
          </div>
          <div 
            v-if="plugin.installed" 
            class="badge badge-success badge-sm gap-1"
          >
            <Icon icon="mdi:check-circle" class="text-xs" />
            已安装
          </div>
        </div>
      </div>

      <!-- 插件描述 -->
      <p 
        class="text-sm text-base-content/70 mb-4 line-clamp-3"
        :title="plugin.manifest.description"
      >
        {{ plugin.manifest.description || '暂无描述' }}
      </p>

      <!-- 插件标签 -->
      <div class="flex flex-wrap gap-1 mb-4" v-if="plugin.manifest.keywords?.length">
        <span 
          v-for="keyword in plugin.manifest.keywords.slice(0, 3)" 
          :key="keyword"
          class="badge badge-ghost badge-xs"
        >
          {{ keyword }}
        </span>
        <span 
          v-if="plugin.manifest.keywords.length > 3"
          class="badge badge-ghost badge-xs"
        >
          +{{ plugin.manifest.keywords.length - 3 }}
        </span>
      </div>

      <!-- 分类信息 -->
      <div class="flex flex-wrap gap-1 mb-4" v-if="plugin.manifest.categories?.length">
        <span 
          v-for="category in plugin.manifest.categories.slice(0, 2)" 
          :key="category"
          class="badge badge-primary badge-xs"
        >
          {{ category }}
        </span>
        <span 
          v-if="plugin.manifest.categories.length > 2"
          class="badge badge-primary badge-xs"
        >
          +{{ plugin.manifest.categories.length - 2 }}
        </span>
      </div>

      <!-- 兼容性信息 -->
      <div class="flex items-center gap-2 mb-4 text-xs text-base-content/50">
        <Icon icon="mdi:check-circle" class="text-success" />
        <span>
          兼容 {{ plugin.manifest.host_application?.min_version || '未知' }}
          {{ plugin.manifest.host_application?.max_version ? ` - ${plugin.manifest.host_application.max_version}` : '+' }}
        </span>
      </div>

      <!-- 许可证信息 -->
      <div class="flex items-center gap-2 mb-4 text-xs text-base-content/50">
        <Icon icon="mdi:license" />
        <span>{{ plugin.manifest.license || '未知许可证' }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="card-actions justify-end mt-auto">
        <button 
          class="btn btn-ghost btn-sm gap-1"
          @click="$emit('viewDetails', plugin)"
        >
          <Icon icon="mdi:information-outline" />
          详情
        </button>
        
        <!-- 安装状态按钮 -->
        <button 
          v-if="plugin.installed"
          class="btn btn-success btn-sm gap-1"
          disabled
        >
          <Icon icon="mdi:check-circle" />
          已安装
        </button>
        <button 
          v-else
          class="btn btn-primary btn-sm gap-1"
          @click="$emit('install', plugin)"
          :disabled="!plugin.manifest.repository_url"
          :title="!plugin.manifest.repository_url ? '此插件没有提供仓库地址，无法安装' : ''"
        >
          <Icon icon="mdi:download" />
          {{ !plugin.manifest.repository_url ? '无法安装' : '安装' }}
        </button>
      </div>

      <!-- 链接按钮 -->
      <div class="flex gap-2 mt-2" v-if="plugin.manifest.homepage_url || plugin.manifest.repository_url">
        <a 
          v-if="plugin.manifest.homepage_url"
          :href="plugin.manifest.homepage_url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-xs gap-1"
        >
          <Icon icon="mdi:home" />
          主页
        </a>
        <a 
          v-if="plugin.manifest.repository_url"
          :href="plugin.manifest.repository_url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-xs gap-1"
        >
          <Icon icon="mdi:source-repository" />
          仓库
        </a>
      </div>
    </div>

    <!-- 收藏角标 -->
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="btn btn-ghost btn-xs btn-circle">
        <Icon icon="mdi:heart-outline" />
      </button>
    </div>
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
}>()

// Emits
defineEmits<{
  install: [plugin: Plugin]
  viewDetails: [plugin: Plugin]
}>()

// 方法
const getPluginInitial = () => {
  const name = props.plugin?.manifest?.name
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
</script>

<style scoped>
/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  hyphens: auto;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片悬停效果 */
.card {
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transition: left 0.5s;
}

.card:hover::before {
  left: 100%;
}

/* 头像样式 */
.avatar .bg-sky-500 {
  transition: all 0.3s ease;
}

.avatar .bg-sky-500:hover {
  transform: scale(1.05);
}

/* 徽章动画 */
.badge {
  transition: all 0.2s ease;
}

.badge:hover {
  transform: scale(1.05);
}

/* 按钮悬停效果 */
.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

/* 响应式优化 */
@media (max-width: 640px) {
  .card-body {
    padding: 1rem;
  }
  
  .text-lg {
    font-size: 1rem;
    line-height: 1.4;
  }
  
  .btn-sm {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
  }
  
  .avatar .w-12 {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .avatar .text-xl {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .card-body {
    padding: 0.75rem;
  }
  
  .badge-sm {
    font-size: 0.6rem;
    padding: 0.125rem 0.375rem;
  }
}
</style>
