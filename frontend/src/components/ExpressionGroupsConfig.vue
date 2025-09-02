<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-base-content">{{ label }}</label>
    </div>
    
    <div class="space-y-3">
      <!-- 表达分组列表 -->
      <div 
        v-for="(group, groupIndex) in localValue" 
        :key="groupIndex"
        class="bg-base-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:folder-group" class="w-5 h-5 text-primary" />
            <span class="text-sm font-medium">分组 {{ groupIndex + 1 }}</span>
            <span class="badge badge-info">{{ group.length }} 个聊天流</span>
          </div>
          <button 
            @click="removeGroup(groupIndex)"
            class="btn btn-sm btn-error btn-circle"
          >
            <Icon icon="mdi:delete" class="w-4 h-4" />
          </button>
        </div>

        <!-- 分组内的聊天流列表 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">聊天流成员</span>
            <button 
              @click="addChatFlowToGroup(groupIndex)"
              class="btn btn-sm btn-outline"
            >
              <Icon icon="mdi:plus" class="w-4 h-4" />
              添加聊天流
            </button>
          </div>
          
          <!-- 表头 -->
          <div class="grid grid-cols-12 gap-2 items-center text-xs text-base-content/60 font-medium px-1">
            <div class="col-span-2">平台</div>
            <div class="col-span-3">聊天ID</div>
            <div class="col-span-2">类型</div>
            <div class="col-span-4">完整标识</div>
            <div class="col-span-1 text-center">操作</div>
          </div>
          
          <div class="space-y-2">
            <div 
              v-for="(chatFlow, flowIndex) in group" 
              :key="flowIndex"
              class="grid grid-cols-12 gap-2 items-center"
            >
              <!-- 平台选择 -->
              <div class="col-span-2">
                <select 
                  :value="getChatFlowPlatform(chatFlow)"
                  @change="updateChatFlowPlatform(groupIndex, flowIndex, ($event.target as HTMLSelectElement).value)"
                  class="select select-bordered select-sm w-full h-10"
                >
                  <option value="qq">QQ</option>
                  <option value="wechat">微信</option>
                  <option value="telegram">TG</option>
                  <option value="discord">DC</option>
                </select>
              </div>
              
              <!-- 聊天ID输入 -->
              <div class="col-span-3">
                <input
                  :value="getChatFlowId(chatFlow)"
                  @input="updateChatFlowId(groupIndex, flowIndex, ($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="输入聊天ID"
                  class="input input-bordered input-sm w-full h-10"
                />
              </div>
              
              <!-- 聊天类型选择 -->
              <div class="col-span-2">
                <select 
                  :value="getChatFlowType(chatFlow)"
                  @change="updateChatFlowType(groupIndex, flowIndex, ($event.target as HTMLSelectElement).value)"
                  class="select select-bordered select-sm w-full h-10"
                >
                  <option value="group">群聊</option>
                  <option value="private">私聊</option>
                </select>
              </div>
              
              <!-- 完整标识显示 -->
              <div class="col-span-4">
                <div class="flex items-center gap-2 p-2 bg-base-300 rounded text-xs font-mono">
                  <Icon :icon="getChatFlowIcon(chatFlow)" class="w-4 h-4" />
                  <span class="truncate">{{ chatFlow }}</span>
                </div>
              </div>
              
              <!-- 删除按钮 -->
              <div class="col-span-1 flex justify-center">
                <button 
                  @click="removeChatFlowFromGroup(groupIndex, flowIndex)"
                  class="btn btn-sm btn-error btn-circle"
                  :disabled="group.length <= 1"
                >
                  <Icon icon="mdi:close" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="mt-3 p-2 bg-base-300 rounded text-xs">
          <div class="text-base-content/60 mb-1">分组预览:</div>
          <code class="text-primary">{{ JSON.stringify(group) }}</code>
        </div>
      </div>
    </div>

    <!-- 添加表达分组按钮 -->
    <div class="bg-base-200 rounded-lg p-4 border-2 border-dashed border-base-300">
      <button 
        @click="addGroup" 
        class="btn btn-outline btn-primary w-full"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        添加表达分组
      </button>
    </div>

    <!-- 配置说明 -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-3">
      <div class="flex items-start gap-2">
        <Icon icon="mdi:information" class="w-4 h-4 text-info mt-0.5" />
        <div class="text-xs text-info">
          <div class="font-medium mb-1">配置说明:</div>
          <ul class="space-y-1 list-disc list-inside">
            <li><strong>表达分组:</strong> 将相关的聊天流分组，共享表达学习结果</li>
            <li><strong>聊天流格式:</strong> platform:chat_id:type (如: qq:114514:group)</li>
            <li><strong>共享机制:</strong> 同一分组内的聊天流会共享学习到的表达方式</li>
            <li><strong>平台支持:</strong> QQ、微信、Telegram、Discord等</li>
            <li><strong>类型区分:</strong> group(群聊) 和 private(私聊)</li>
            <li><strong>示例:</strong> 将多个相关群聊放在一个分组中共享表达学习</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
    // 默认添加一个分组
    localValue.value = [['qq::group']]
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
const getChatFlowIcon = (chatFlow: string): string => {
  if (chatFlow.includes('group')) return 'mdi:account-group'
  if (chatFlow.includes('private')) return 'mdi:account'
  return 'mdi:chat'
}

// 获取聊天流平台
const getChatFlowPlatform = (chatFlow: string): string => {
  const parts = chatFlow.split(':')
  return parts[0] || 'qq'
}

// 获取聊天流ID
const getChatFlowId = (chatFlow: string): string => {
  const parts = chatFlow.split(':')
  return parts[1] || ''
}

// 获取聊天流类型
const getChatFlowType = (chatFlow: string): string => {
  const parts = chatFlow.split(':')
  return parts[2] || 'group'
}

// 更新聊天流平台
const updateChatFlowPlatform = (groupIndex: number, flowIndex: number, platform: string) => {
  const current = localValue.value[groupIndex][flowIndex]
  const parts = current.split(':')
  parts[0] = platform
  localValue.value[groupIndex][flowIndex] = parts.join(':')
  updateConfig()
}

// 更新聊天流ID
const updateChatFlowId = (groupIndex: number, flowIndex: number, id: string) => {
  const current = localValue.value[groupIndex][flowIndex]
  const parts = current.split(':')
  parts[1] = id
  localValue.value[groupIndex][flowIndex] = parts.join(':')
  updateConfig()
}

// 更新聊天流类型
const updateChatFlowType = (groupIndex: number, flowIndex: number, type: string) => {
  const current = localValue.value[groupIndex][flowIndex]
  const parts = current.split(':')
  parts[2] = type
  localValue.value[groupIndex][flowIndex] = parts.join(':')
  updateConfig()
}

// 添加分组
const addGroup = () => {
  localValue.value.push(['qq::group'])
  updateConfig()
}

// 删除分组
const removeGroup = (groupIndex: number) => {
  localValue.value.splice(groupIndex, 1)
  updateConfig()
}

// 向分组添加聊天流
const addChatFlowToGroup = (groupIndex: number) => {
  localValue.value[groupIndex].push('qq::group')
  updateConfig()
}

// 从分组删除聊天流
const removeChatFlowFromGroup = (groupIndex: number, flowIndex: number) => {
  if (localValue.value[groupIndex].length > 1) {
    localValue.value[groupIndex].splice(flowIndex, 1)
    updateConfig()
  }
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
