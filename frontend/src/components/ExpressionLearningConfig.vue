<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-base-content">{{ label }}</label>
    </div>
    
    <div class="space-y-3">
      <!-- 表达学习配置列表 -->
      <div 
        v-for="(config, index) in localValue" 
        :key="index"
        class="bg-base-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Icon 
              :icon="getChatFlowIcon(config[0])" 
              class="w-5 h-5 text-primary" 
            />
            <span class="text-sm font-medium">
              {{ getChatFlowLabel(config[0]) }}
            </span>
          </div>
          <button 
            @click="removeConfig(index)"
            class="btn btn-sm btn-error btn-circle"
            :disabled="getChatFlowType(config[0]) === 'global' && localValue.length === 1"
          >
            <Icon icon="mdi:delete" class="w-4 h-4" />
          </button>
        </div>

        <!-- 聊天流标识选择 -->
        <div class="mb-3">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text text-xs">聊天流标识</span>
              <span class="label-text-alt text-xs text-base-content/60">
                选择平台类型和聊天类型，或设置为全局配置
              </span>
            </label>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <!-- 配置类型选择 -->
              <select 
                :value="getChatFlowType(config[0])"
                @change="updateConfigType(index, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="global">全局配置</option>
                <option value="custom">自定义配置</option>
              </select>

              <!-- 平台选择 -->
              <select 
                v-if="getChatFlowType(config[0]) === 'custom'"
                :value="getChatFlowPlatform(config[0])"
                @change="updateConfigPlatform(index, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="">选择平台</option>
                <option value="qq">QQ</option>
                <option value="wechat">微信</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
              </select>

              <!-- 聊天类型选择 -->
              <select 
                v-if="getChatFlowType(config[0]) === 'custom'"
                :value="getChatFlowChatType(config[0])"
                @change="updateConfigChatType(index, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="">选择类型</option>
                <option value="group">群聊</option>
                <option value="private">私聊</option>
              </select>
            </div>

            <!-- ID输入框 -->
            <div 
              v-if="getChatFlowType(config[0]) === 'custom'" 
              class="mt-2"
            >
              <input
                :value="getChatFlowId(config[0])"
                @input="updateConfigId(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="输入聊天ID (例: 114514)"
                class="input input-bordered input-sm w-full h-10"
              />
            </div>
          </div>
        </div>

        <!-- 学习配置选项 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">学习配置选项</span>
          </div>
          
          <!-- 表头 -->
          <div class="grid grid-cols-12 gap-2 items-center text-xs text-base-content/60 font-medium px-1">
            <div class="col-span-3">使用学到的表达</div>
            <div class="col-span-3">学习新表达</div>
            <div class="col-span-6">学习强度</div>
          </div>
          
          <!-- 配置选项 -->
          <div class="grid grid-cols-12 gap-2 items-center">
            <!-- 使用表达开关 -->
            <div class="col-span-3">
              <select 
                :value="config[1]"
                @change="updateConfigOption(index, 1, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="enable">启用</option>
                <option value="disable">禁用</option>
              </select>
            </div>
            
            <!-- 学习表达开关 -->
            <div class="col-span-3">
              <select 
                :value="config[2]"
                @change="updateConfigOption(index, 2, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="enable">启用</option>
                <option value="disable">禁用</option>
              </select>
            </div>
            
            <!-- 学习强度 -->
            <div class="col-span-6">
              <div class="flex items-center gap-2">
                <!-- 滑块 -->
                <input
                  :value="config[3]"
                  @input="updateConfigOption(index, 3, ($event.target as HTMLInputElement).value)"
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  class="range range-primary range-sm flex-1"
                />
                <!-- 数值输入 -->
                <input
                  :value="config[3]"
                  @input="updateConfigOption(index, 3, ($event.target as HTMLInputElement).value)"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  class="input input-bordered input-sm w-20 text-center h-10"
                />
              </div>
            </div>
          </div>
          
          <!-- 状态显示 -->
          <div class="grid grid-cols-12 gap-2 items-center text-xs px-1">
            <div class="col-span-3 flex items-center gap-1">
              <Icon 
                :icon="config[1] === 'enable' ? 'mdi:check-circle' : 'mdi:close-circle'" 
                :class="config[1] === 'enable' ? 'text-success' : 'text-error'"
                class="w-3 h-3" 
              />
              <span :class="config[1] === 'enable' ? 'text-success' : 'text-error'">
                {{ config[1] === 'enable' ? '已启用' : '已禁用' }}
              </span>
            </div>
            <div class="col-span-3 flex items-center gap-1">
              <Icon 
                :icon="config[2] === 'enable' ? 'mdi:check-circle' : 'mdi:close-circle'" 
                :class="config[2] === 'enable' ? 'text-success' : 'text-error'"
                class="w-3 h-3" 
              />
              <span :class="config[2] === 'enable' ? 'text-success' : 'text-error'">
                {{ config[2] === 'enable' ? '已启用' : '已禁用' }}
              </span>
            </div>
            <div class="col-span-6 text-base-content/60">
              学习间隔: {{ Math.round(300 / parseFloat(config[3])) }}秒 
              (每小时最多 {{ Math.floor(3600 / (300 / parseFloat(config[3]))) }}次)
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="mt-3 p-2 bg-base-300 rounded text-xs">
          <div class="text-base-content/60 mb-1">预览:</div>
          <code class="text-primary">{{ JSON.stringify(config) }}</code>
        </div>
      </div>
    </div>

    <!-- 添加表达学习配置按钮 -->
    <div class="bg-base-200 rounded-lg p-4 border-2 border-dashed border-base-300">
      <button 
        @click="addConfig" 
        class="btn btn-outline btn-primary w-full"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        添加表达学习配置
      </button>
    </div>

    <!-- 配置说明 -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-3">
      <div class="flex items-start gap-2">
        <Icon icon="mdi:information" class="w-4 h-4 text-info mt-0.5" />
        <div class="text-xs text-info">
          <div class="font-medium mb-1">配置说明:</div>
          <ul class="space-y-1 list-disc list-inside">
            <li><strong>全局配置:</strong> 作为所有聊天的默认表达学习设置</li>
            <li><strong>自定义配置:</strong> 针对特定聊天的个性化表达学习设置</li>
            <li><strong>使用表达:</strong> 是否在回复中使用已学到的表达方式</li>
            <li><strong>学习表达:</strong> 是否从聊天中学习新的表达方式</li>
            <li><strong>学习强度:</strong> 数值越高学习越频繁，最短间隔 = 300/强度 秒</li>
            <li><strong>示例:</strong> QQ群聊(114514) 启用使用和学习，强度1.5</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  label: string
  value: string[][]
}

interface Emits {
  (e: 'update', value: string[][]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地值
const localValue = ref<string[][]>([])

// 初始化本地值
const initializeValue = () => {
  if (props.value && props.value.length > 0) {
    localValue.value = JSON.parse(JSON.stringify(props.value))
  } else {
    // 默认添加一个全局配置
    localValue.value = [['', 'enable', 'enable', '1.0']]
  }
}

// 监听props变化
watch(
  () => props.value,
  () => {
    initializeValue()
  },
  { immediate: true, deep: true }
)

// 获取聊天流图标
const getChatFlowIcon = (identifier: string): string => {
  if (!identifier) return 'mdi:earth'
  if (identifier.includes('group')) return 'mdi:account-group'
  if (identifier.includes('private')) return 'mdi:account'
  return 'mdi:chat'
}

// 获取聊天流标签
const getChatFlowLabel = (identifier: string): string => {
  if (!identifier) return '全局默认配置'
  const parts = identifier.split(':')
  if (parts.length === 3) {
    const [platform, id, type] = parts
    const typeLabel = type === 'group' ? '群聊' : type === 'private' ? '私聊' : type
    return `${platform.toUpperCase()} ${typeLabel} (${id})`
  }
  return identifier
}

// 获取聊天流配置类型
const getChatFlowType = (identifier: string): string => {
  return identifier === '' ? 'global' : 'custom'
}

// 获取聊天流平台
const getChatFlowPlatform = (identifier: string): string => {
  if (!identifier) return ''
  const parts = identifier.split(':')
  return parts[0] || ''
}

// 获取聊天流ID
const getChatFlowId = (identifier: string): string => {
  if (!identifier) return ''
  const parts = identifier.split(':')
  return parts[1] || ''
}

// 获取聊天流聊天类型
const getChatFlowChatType = (identifier: string): string => {
  if (!identifier) return ''
  const parts = identifier.split(':')
  return parts[2] || ''
}

// 更新配置类型
const updateConfigType = (configIndex: number, type: string) => {
  if (type === 'global') {
    // 检查是否已经有全局配置
    const hasGlobal = localValue.value.some((config, idx) => idx !== configIndex && config[0] === '')
    if (hasGlobal) {
      // 如果已有全局配置，不允许再设置
      return
    }
    localValue.value[configIndex][0] = ''
  } else {
    // 如果是自定义类型，但当前是空的，设置默认值
    if (localValue.value[configIndex][0] === '') {
      localValue.value[configIndex][0] = 'qq::group'
    }
  }
  updateConfig()
}

// 检查是否有全局配置
const hasGlobalConfig = computed(() => {
  return localValue.value.some(config => config[0] === '')
})

// 更新配置平台
const updateConfigPlatform = (configIndex: number, platform: string) => {
  const current = localValue.value[configIndex][0]
  const parts = current.split(':')
  parts[0] = platform
  localValue.value[configIndex][0] = parts.join(':')
  updateConfig()
}

// 更新配置ID
const updateConfigId = (configIndex: number, id: string) => {
  const current = localValue.value[configIndex][0]
  const parts = current.split(':')
  parts[1] = id
  localValue.value[configIndex][0] = parts.join(':')
  updateConfig()
}

// 更新配置聊天类型
const updateConfigChatType = (configIndex: number, chatType: string) => {
  const current = localValue.value[configIndex][0]
  const parts = current.split(':')
  parts[2] = chatType
  localValue.value[configIndex][0] = parts.join(':')
  updateConfig()
}

// 更新配置选项
const updateConfigOption = (configIndex: number, optionIndex: number, value: string) => {
  localValue.value[configIndex][optionIndex] = value
  updateConfig()
}

// 添加配置
const addConfig = () => {
  // 如果没有全局配置，优先添加全局配置
  if (!hasGlobalConfig.value) {
    localValue.value.push(['', 'enable', 'enable', '1.0'])
  } else {
    // 否则添加自定义配置
    localValue.value.push(['qq::group', 'enable', 'enable', '1.0'])
  }
  updateConfig()
}

// 删除配置
const removeConfig = (index: number) => {
  const config = localValue.value[index]
  // 不能删除全局配置（如果它是唯一的）
  if (config[0] === '' && localValue.value.length === 1) {
    return
  }
  localValue.value.splice(index, 1)
  updateConfig()
}

// 更新配置
const updateConfig = () => {
  emit('update', localValue.value)
}
</script>

<style scoped>
/* 自定义样式 */
code {
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
