<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-base-content">{{ label }}</label>
    </div>
    
    <div class="space-y-3">
      <!-- 聊天流配置列表 -->
      <div 
        v-for="(chatFlow, index) in localValue" 
        :key="index"
        class="bg-base-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Icon 
              :icon="getChatFlowIcon(chatFlow[0])" 
              class="w-5 h-5 text-primary" 
            />
            <span class="text-sm font-medium">
              {{ getChatFlowLabel(chatFlow[0]) }}
            </span>
          </div>
          <button 
            @click="removeChatFlow(index)"
            class="btn btn-sm btn-error btn-circle"
            :disabled="getChatFlowType(chatFlow[0]) === 'global'"
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
                :value="getChatFlowType(chatFlow[0])"
                @change="updateChatFlowType(index, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="global">全局配置</option>
                <option value="custom">自定义配置</option>
              </select>

              <!-- 平台选择 -->
              <select 
                v-if="getChatFlowType(chatFlow[0]) === 'custom'"
                :value="getChatFlowPlatform(chatFlow[0])"
                @change="updateChatFlowPlatform(index, ($event.target as HTMLSelectElement).value)"
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
                v-if="getChatFlowType(chatFlow[0]) === 'custom'"
                :value="getChatFlowChatType(chatFlow[0])"
                @change="updateChatFlowChatType(index, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="">选择类型</option>
                <option value="group">群聊</option>
                <option value="private">私聊</option>
              </select>
            </div>

            <!-- ID输入框 -->
            <div 
              v-if="getChatFlowType(chatFlow[0]) === 'custom'" 
              class="mt-2"
            >
              <input
                :value="getChatFlowId(chatFlow[0])"
                @input="updateChatFlowId(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="输入聊天ID (例: 114514)"
                class="input input-bordered input-sm w-full h-10"
              />
            </div>
          </div>
        </div>

        <!-- 时间段配置 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">时间段配置</span>
          </div>
          
          <!-- 表头 -->
          <div class="grid grid-cols-12 gap-2 items-center text-xs text-base-content/60 font-medium px-1">
            <div class="col-span-4">开始时间</div>
            <div class="col-span-7">数值</div>
            <div class="col-span-1 text-center">操作</div>
          </div>
          
          <div class="space-y-2">
            <div 
              v-for="(timeSlot, slotIndex) in chatFlow.slice(1)" 
              :key="slotIndex"
              class="grid grid-cols-12 gap-2 items-center"
            >
              <div class="col-span-4">
                <input
                  :value="getTimeFromSlot(timeSlot)"
                  @input="updateTimeSlot(index, slotIndex, 'time', ($event.target as HTMLInputElement).value)"
                  type="time"
                  class="input input-bordered input-sm w-full h-10"
                />
              </div>
              
              <div class="col-span-7">
                <div class="flex items-center gap-2">
                  <!-- 滑块 -->
                  <input
                    :value="getValueFromSlot(timeSlot)"
                    @input="updateTimeSlot(index, slotIndex, 'value', ($event.target as HTMLInputElement).value)"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.01"
                    class="range range-primary range-sm flex-1"
                  />
                  <!-- 数值输入 -->
                  <input
                    :value="getValueFromSlot(timeSlot)"
                    @input="updateTimeSlot(index, slotIndex, 'value', ($event.target as HTMLInputElement).value)"
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1.0"
                    class="input input-bordered input-sm w-20 text-center h-10"
                  />
                </div>
              </div>
              
              <div class="col-span-1 flex justify-center">
                <button 
                  @click="removeTimeSlot(index, slotIndex)"
                  class="btn btn-sm btn-error btn-circle"
                  :disabled="chatFlow.length <= 2"
                >
                  <Icon icon="mdi:close" class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <!-- 添加时间段按钮移到这里 -->
            <div class="col-span-12 pt-2">
              <button 
                @click="addTimeSlot(index)" 
                class="btn btn-sm btn-outline w-full h-10"
              >
                <Icon icon="mdi:plus" class="w-4 h-4" />
                添加时间段
              </button>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="mt-3 p-2 bg-base-300 rounded text-xs">
          <div class="text-base-content/60 mb-1">预览:</div>
          <code class="text-primary">{{ JSON.stringify(chatFlow) }}</code>
        </div>
      </div>
    </div>

    <!-- 添加聊天流配置按钮 -->
    <div class="bg-base-200 rounded-lg p-4 border-2 border-dashed border-base-300">
      <button 
        @click="addChatFlow" 
        class="btn btn-outline btn-primary w-full"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        添加聊天流配置
      </button>
    </div>

    <!-- 配置说明 -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-3">
      <div class="flex items-start gap-2">
        <Icon icon="mdi:information" class="w-4 h-4 text-info mt-0.5" />
        <div class="text-xs text-info">
          <div class="font-medium mb-1">配置说明:</div>
          <ul class="space-y-1 list-disc list-inside">
            <li><strong>全局配置:</strong> 作为所有聊天的默认设置</li>
            <li><strong>自定义配置:</strong> 针对特定聊天的个性化设置</li>
            <li><strong>时间格式:</strong> 24小时制，数值范围 0.1-1.0</li>
            <li><strong>优先级:</strong> 自定义配置 > 全局配置 > 系统默认</li>
            <li><strong>示例:</strong> QQ群聊(114514) 在12:20设置为0.6</li>
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
    localValue.value = [['', '8:00,1.0', '12:00,0.8', '18:00,1.0', '01:00,0.3']]
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

// 从时间段字符串中提取时间
const getTimeFromSlot = (slot: string): string => {
  const parts = slot.split(',')
  return parts[0] || '00:00'
}

// 从时间段字符串中提取数值
const getValueFromSlot = (slot: string): string => {
  const parts = slot.split(',')
  return parts[1] || '1.0'
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

// 更新聊天流配置类型
const updateChatFlowType = (chatFlowIndex: number, type: string) => {
  if (type === 'global') {
    // 检查是否已经有全局配置
    const hasGlobal = localValue.value.some((flow, idx) => idx !== chatFlowIndex && flow[0] === '')
    if (hasGlobal) {
      // 如果已有全局配置，不允许再设置
      return
    }
    localValue.value[chatFlowIndex][0] = ''
  } else {
    // 如果是自定义类型，但当前是空的，设置默认值
    if (localValue.value[chatFlowIndex][0] === '') {
      localValue.value[chatFlowIndex][0] = 'qq::group'
    }
  }
  updateChatFlow()
}

// 检查是否有全局配置
const hasGlobalConfig = computed(() => {
  return localValue.value.some(flow => flow[0] === '')
})

// 更新聊天流平台
const updateChatFlowPlatform = (chatFlowIndex: number, platform: string) => {
  const current = localValue.value[chatFlowIndex][0]
  const parts = current.split(':')
  parts[0] = platform
  localValue.value[chatFlowIndex][0] = parts.join(':')
  updateChatFlow()
}

// 更新聊天流ID
const updateChatFlowId = (chatFlowIndex: number, id: string) => {
  const current = localValue.value[chatFlowIndex][0]
  const parts = current.split(':')
  parts[1] = id
  localValue.value[chatFlowIndex][0] = parts.join(':')
  updateChatFlow()
}

// 更新聊天流聊天类型
const updateChatFlowChatType = (chatFlowIndex: number, chatType: string) => {
  const current = localValue.value[chatFlowIndex][0]
  const parts = current.split(':')
  parts[2] = chatType
  localValue.value[chatFlowIndex][0] = parts.join(':')
  updateChatFlow()
}

// 更新时间段
const updateTimeSlot = (chatFlowIndex: number, slotIndex: number, type: 'time' | 'value', newValue: string) => {
  const actualSlotIndex = slotIndex + 1 // 跳过第一个标识符元素
  const currentSlot = localValue.value[chatFlowIndex][actualSlotIndex]
  const parts = currentSlot.split(',')
  
  if (type === 'time') {
    parts[0] = newValue
  } else {
    parts[1] = newValue
  }
  
  localValue.value[chatFlowIndex][actualSlotIndex] = parts.join(',')
  updateChatFlow()
}

// 添加聊天流
const addChatFlow = () => {
  // 如果没有全局配置，优先添加全局配置
  if (!hasGlobalConfig.value) {
    localValue.value.push(['', '8:00,1.0', '12:00,0.8', '18:00,1.0', '01:00,0.3'])
  } else {
    // 否则添加自定义配置
    localValue.value.push(['qq::group', '8:00,1.0', '12:00,0.8', '18:00,1.0', '01:00,0.3'])
  }
  updateChatFlow()
}

// 删除聊天流
const removeChatFlow = (index: number) => {
  const chatFlow = localValue.value[index]
  // 不能删除全局配置（如果它是唯一的）
  if (chatFlow[0] === '' && localValue.value.length === 1) {
    return
  }
  localValue.value.splice(index, 1)
  updateChatFlow()
}

// 添加时间段
const addTimeSlot = (chatFlowIndex: number) => {
  localValue.value[chatFlowIndex].push('12:00,1.0')
  updateChatFlow()
}

// 删除时间段
const removeTimeSlot = (chatFlowIndex: number, slotIndex: number) => {
  if (localValue.value[chatFlowIndex].length > 2) { // 至少保留一个时间段
    const actualSlotIndex = slotIndex + 1
    localValue.value[chatFlowIndex].splice(actualSlotIndex, 1)
    updateChatFlow()
  }
}

// 更新聊天流配置
const updateChatFlow = () => {
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
