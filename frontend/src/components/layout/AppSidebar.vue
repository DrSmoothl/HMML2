<template>
  <aside class="w-80 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
    <!-- Logo/Brand -->
    <div class="p-6 border-b border-base-300 flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
          <img 
            src="@/assets/images/maimai.png" 
            alt="MaiMai Logo" 
            class="w-8 h-8 object-cover rounded"
          />
        </div>
        <div>
          <h2 class="text-lg font-bold text-base-content">MaiMai</h2>
          <p class="text-xs text-base-content/70">启动器管理面板</p>
        </div>
      </div>
    </div>
    
    <!-- Navigation Menu -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <nav class="flex-1 overflow-y-auto p-4">
        <ul class="menu menu-lg w-full space-y-1">
          <!-- 首页 -->
          <li>
            <router-link 
              to="/" 
              class="flex items-center gap-3 p-3 rounded-lg transition-colors"
              :class="{ 'active': $route.name === 'Home' }"
            >
              <HomeIcon class="w-5 h-5" />
              <span>首页</span>
            </router-link>
          </li>
          
          <!-- 麦麦设置 -->
          <li>
            <details :open="isSettingsSectionOpen">
              <summary class="flex items-center gap-3 p-3 rounded-lg transition-colors">
                <Cog6ToothIcon class="w-5 h-5" />
                <span>麦麦设置</span>
              </summary>
              <ul class="ml-4">
                <li>
                  <router-link 
                    to="/settings/maimai" 
                    class="p-2 rounded-lg transition-colors"
                    :class="{ 'active': $route.name === 'MaimaiSettings' }"
                  >
                    麦麦本体设置
                  </router-link>
                </li>
                <li>
                  <router-link 
                    to="/settings/model" 
                    class="p-2 rounded-lg transition-colors"
                    :class="{ 'active': $route.name === 'ModelSettings' }"
                  >
                    麦麦模型设置
                  </router-link>
                </li>
                <li>
                  <router-link 
                    to="/settings/adapter" 
                    class="p-2 rounded-lg transition-colors"
                    :class="{ 'active': $route.name === 'AdapterSettings' }"
                  >
                    麦麦适配器设置
                  </router-link>
                </li>
              </ul>
            </details>
          </li>
          
          <!-- 麦麦资源管理 -->
          <li>
            <details :open="isResourcesSectionOpen">
              <summary class="flex items-center gap-3 p-3 rounded-lg transition-colors">
                <FolderIcon class="w-5 h-5" />
                <span>麦麦资源管理</span>
              </summary>
              <ul class="ml-4">
                <li>
                  <router-link 
                    to="/resources/emoji" 
                    class="p-2 rounded-lg transition-colors"
                    :class="{ 'active': $route.name === 'EmojiManagement' }"
                  >
                    Emoji管理
                  </router-link>
                </li>
                <li>
                  <router-link 
                    to="/resources/expression" 
                    class="p-2 rounded-lg transition-colors"
                    :class="{ 'active': $route.name === 'ExpressionManagement' }"
                  >
                    表达方式管理
                  </router-link>
                </li>
                <li>
                  <router-link 
                    to="/resources/character" 
                    class="p-2 rounded-lg transition-colors"
                    :class="{ 'active': $route.name === 'CharacterManagement' }"
                  >
                    人物信息管理
                  </router-link>
                </li>
                <li>
                  <router-link 
                    to="/resources/chatstream" 
                    class="p-2 rounded-lg transition-colors"
                    :class="{ 'active': $route.name === 'ChatStreamMonitor' }"
                  >
                    麦麦聊天流监控
                  </router-link>
                </li>
              </ul>
            </details>
          </li>
          
          <!-- 插件广场 -->
          <li>
            <router-link 
              to="/plugin-market" 
              class="flex items-center gap-3 p-3 rounded-lg transition-colors"
              :class="{ 'active': $route.name === 'PluginMarket' }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
              </svg>
              <span>插件广场</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Bottom Menu Items -->
      <div class="p-4 border-t border-base-300">
        <ul class="menu menu-lg w-full space-y-1">
          <!-- 关于 -->
          <li>
            <router-link 
              to="/about" 
              class="flex items-center gap-3 p-3 rounded-lg transition-colors"
              :class="{ 'active': $route.name === 'About' }"
            >
              <InformationCircleIcon class="w-5 h-5" />
              <span>关于</span>
            </router-link>
          </li>
          
          <!-- 启动器设置 -->
          <li>
            <router-link 
              to="/launcher-settings" 
              class="flex items-center gap-3 p-3 rounded-lg transition-colors"
              :class="{ 'active': $route.name === 'LauncherSettings' }"
            >
              <AdjustmentsHorizontalIcon class="w-5 h-5" />
              <span>启动器设置</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  Cog6ToothIcon,
  FolderIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()

// 计算当前展开的菜单节
const isSettingsSectionOpen = computed(() => {
  return route.path.startsWith('/settings')
})

const isResourcesSectionOpen = computed(() => {
  return route.path.startsWith('/resources')
})
</script>

<style scoped>
/* 自定义样式 */
.menu li > details > summary:hover {
  background-color: hsl(var(--b3));
}

.menu li > a.active {
  background-color: hsl(var(--p));
  color: hsl(var(--pc));
}

.menu li > details > ul > li > a.active {
  background-color: hsl(var(--p) / 0.2);
  color: hsl(var(--p));
  font-weight: 500;
}
</style>
