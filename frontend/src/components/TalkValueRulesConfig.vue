<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-base-content">{{ label }}</label>
    </div>
    
    <div class="space-y-3">
      <!-- 动态发言频率规则列表 -->
      <div 
        v-for="(rule, index) in localValue" 
        :key="index"
        class="bg-base-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Icon 
              :icon="getRuleIcon(rule.target)" 
              class="w-5 h-5 text-primary" 
            />
            <span class="text-sm font-medium">
              {{ getRuleLabel(rule.target) }}
            </span>
          </div>
          <button 
            @click="removeRule(index)"
            class="btn btn-sm btn-error btn-circle"
          >
            <Icon icon="mdi:delete" class="w-4 h-4" />
          </button>
        </div>

        <!-- 目标聊天选择 -->
        <div class="mb-3">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text text-xs">目标聊天</span>
              <span class="label-text-alt text-xs text-base-content/60">
                选择应用此规则的聊天对象
              </span>
            </label>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <!-- 规则类型选择 -->
              <select 
                :value="getRuleType(rule.target)"
                @change="updateRuleType(index, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="global">全局规则</option>
                <option value="custom">指定聊天</option>
              </select>

              <!-- 平台选择 -->
              <select 
                v-if="getRuleType(rule.target) === 'custom'"
                :value="getRulePlatform(rule.target)"
                @change="updateRulePlatform(index, ($event.target as HTMLSelectElement).value)"
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
                v-if="getRuleType(rule.target) === 'custom'"
                :value="getRuleChatType(rule.target)"
                @change="updateRuleChatType(index, ($event.target as HTMLSelectElement).value)"
                class="select select-bordered select-sm w-full h-10"
              >
                <option value="">选择类型</option>
                <option value="group">群聊</option>
                <option value="private">私聊</option>
              </select>
            </div>

            <!-- ID输入框 -->
            <div 
              v-if="getRuleType(rule.target) === 'custom'" 
              class="mt-2"
            >
              <input
                :value="getRuleId(rule.target)"
                @input="updateRuleId(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="输入聊天ID (例: 1919810)"
                class="input input-bordered input-sm w-full h-10"
              />
            </div>
          </div>
        </div>

        <!-- 时间段设置 -->
        <div class="mb-3">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text text-xs">生效时间段</span>
              <span class="label-text-alt text-xs text-base-content/60">
                支持跨夜区间，如 23:00-02:00
              </span>
            </label>
            
            <div class="grid grid-cols-2 gap-2">
              <!-- 开始时间 -->
              <div class="flex items-center gap-2">
                <Icon icon="mdi:clock-start" class="w-4 h-4 text-base-content/60" />
                <input
                  :value="getStartTime(rule.time)"
                  @input="updateStartTime(index, ($event.target as HTMLInputElement).value)"
                  type="time"
                  class="input input-bordered input-sm w-full h-10"
                />
              </div>
              
              <!-- 结束时间 -->
              <div class="flex items-center gap-2">
                <Icon icon="mdi:clock-end" class="w-4 h-4 text-base-content/60" />
                <input
                  :value="getEndTime(rule.time)"
                  @input="updateEndTime(index, ($event.target as HTMLInputElement).value)"
                  type="time"
                  class="input input-bordered input-sm w-full h-10"
                />
              </div>
            </div>

            <!-- 时间预览 -->
            <div class="mt-2 p-2 bg-base-300 rounded text-xs flex items-center gap-2">
              <Icon icon="mdi:information-outline" class="w-4 h-4 text-info" />
              <span class="text-base-content/70">
                时间段: <code class="text-primary">{{ rule.time }}</code>
                <span v-if="isOvernightPeriod(rule.time)" class="text-warning ml-2">
                  (跨夜时段)
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- 频率值设置 -->
        <div class="mb-3">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text text-xs">聊天频率值</span>
              <span class="label-text-alt text-xs font-mono">{{ rule.value.toFixed(1) }}</span>
            </label>
            
            <div class="flex items-center gap-3">
              <!-- 滑块 -->
              <input
                :value="rule.value"
                @input="updateRuleValue(index, parseFloat(($event.target as HTMLInputElement).value))"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="range range-primary range-sm flex-1"
              />
              <!-- 数值输入 -->
              <input
                :value="rule.value"
                @input="updateRuleValue(index, parseFloat(($event.target as HTMLInputElement).value))"
                type="number"
                step="0.1"
                min="0"
                max="1"
                class="input input-bordered input-sm w-20 text-center h-10"
              />
            </div>

            <!-- 频率说明 -->
            <div class="flex justify-between text-xs mt-2 px-1">
              <span class="text-left flex-1 text-base-content/60">沉默 (0)</span>
              <span class="text-center flex-1 text-base-content/60">适中 (0.5)</span>
              <span class="text-right flex-1 text-base-content/60">活跃 (1)</span>
            </div>
          </div>
        </div>

        <!-- 规则预览 -->
        <div class="mt-3 p-3 bg-base-300 rounded">
          <div class="text-xs text-base-content/60 mb-2 flex items-center gap-1">
            <Icon icon="mdi:code-json" class="w-4 h-4" />
            配置预览:
          </div>
          <code class="text-xs text-primary block">{{ formatRulePreview(rule) }}</code>
        </div>

        <!-- 规则效果说明 -->
        <div class="mt-2 p-2 rounded text-xs" :class="getEffectClass(rule.value)">
          <div class="flex items-start gap-2">
            <Icon :icon="getEffectIcon(rule.value)" class="w-4 h-4 mt-0.5" />
            <div>
              <div class="font-medium mb-0.5">{{ getEffectTitle(rule.value) }}</div>
              <div class="opacity-80">{{ getEffectDescription(rule.value, rule.time) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加规则按钮 -->
    <div class="bg-base-200 rounded-lg p-4 border-2 border-dashed border-base-300">
      <button 
        @click="addRule" 
        class="btn btn-outline btn-primary w-full"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        添加动态频率规则
      </button>
    </div>

    <!-- 配置说明 -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-4">
      <div class="flex items-start gap-2">
        <Icon icon="mdi:information" class="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div class="text-xs text-info">
          <div class="font-medium mb-2">📋 配置说明:</div>
          <ul class="space-y-1.5 list-disc list-inside">
            <li><strong>全局规则:</strong> 应用于所有聊天的默认时段频率设置</li>
            <li><strong>指定聊天:</strong> 针对特定群聊或私聊的个性化时段频率</li>
            <li><strong>时间格式:</strong> HH:MM-HH:MM，支持跨夜区间（如 23:00-02:00）</li>
            <li><strong>频率值范围:</strong> 0（完全沉默）到 1（最活跃），建议 0-1</li>
            <li><strong>优先级:</strong> 指定聊天规则优先于全局规则</li>
          </ul>
          <div class="mt-3 p-2 bg-info/5 rounded border border-info/10">
            <div class="font-medium mb-1">💡 使用示例:</div>
            <ul class="space-y-1 text-[11px]">
              <li>• 全局: 00:00-08:59 设为 0.8（夜间降低活跃度）</li>
              <li>• 全局: 09:00-22:59 设为 1.0（白天保持活跃）</li>
              <li>• QQ群(1919810): 20:00-23:59 设为 0.6（晚间降低）</li>
              <li>• QQ私聊(114514): 00:00-23:59 设为 0.3（全天降低）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 规则汇总 -->
    <div class="bg-base-200 rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <Icon icon="mdi:chart-timeline-variant" class="w-5 h-5 text-secondary" />
        <span class="text-sm font-medium">规则汇总</span>
        <span class="badge badge-secondary badge-sm">{{ localValue.length }} 条</span>
      </div>
      <div class="space-y-2">
        <div v-for="(rule, idx) in localValue" :key="idx" class="text-xs flex items-center justify-between p-2 bg-base-300 rounded">
          <div class="flex items-center gap-2">
            <span class="badge badge-outline badge-xs">{{ idx + 1 }}</span>
            <Icon :icon="getRuleIcon(rule.target)" class="w-3 h-3" />
            <span class="font-medium">{{ getRuleLabel(rule.target) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-base-content/60">{{ rule.time }}</span>
            <span class="font-mono font-medium text-primary">{{ rule.value.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

interface TalkValueRule {
  target: string
  time: string
  value: number
}

interface Props {
  label: string
  value: TalkValueRule[]
}

interface Emits {
  (e: 'update', value: TalkValueRule[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地值
const localValue = ref<TalkValueRule[]>([])

// 初始化本地值
const initializeValue = () => {
  if (props.value && props.value.length > 0) {
    localValue.value = JSON.parse(JSON.stringify(props.value))
  } else {
    // 默认添加示例规则
    localValue.value = [
      { target: '', time: '00:00-08:59', value: 0.8 },
      { target: '', time: '09:00-22:59', value: 1.0 }
    ]
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

// 获取规则图标
const getRuleIcon = (target: string): string => {
  if (!target) return 'mdi:earth'
  if (target.includes('group')) return 'mdi:account-group'
  if (target.includes('private')) return 'mdi:account'
  return 'mdi:chat'
}

// 获取规则标签
const getRuleLabel = (target: string): string => {
  if (!target) return '全局默认规则'
  const parts = target.split(':')
  if (parts.length === 3) {
    const [platform, id, type] = parts
    const typeLabel = type === 'group' ? '群聊' : type === 'private' ? '私聊' : type
    return `${platform.toUpperCase()} ${typeLabel} (${id})`
  }
  return target
}

// 获取规则类型
const getRuleType = (target: string): string => {
  return target === '' ? 'global' : 'custom'
}

// 获取平台
const getRulePlatform = (target: string): string => {
  if (!target) return ''
  const parts = target.split(':')
  return parts[0] || ''
}

// 获取ID
const getRuleId = (target: string): string => {
  if (!target) return ''
  const parts = target.split(':')
  return parts[1] || ''
}

// 获取聊天类型
const getRuleChatType = (target: string): string => {
  if (!target) return ''
  const parts = target.split(':')
  return parts[2] || ''
}

// 获取开始时间
const getStartTime = (timeRange: string): string => {
  const parts = timeRange.split('-')
  return parts[0] || '00:00'
}

// 获取结束时间
const getEndTime = (timeRange: string): string => {
  const parts = timeRange.split('-')
  return parts[1] || '23:59'
}

// 判断是否是跨夜时段
const isOvernightPeriod = (timeRange: string): boolean => {
  const [start, end] = timeRange.split('-')
  return start > end
}

// 更新规则类型
const updateRuleType = (ruleIndex: number, type: string) => {
  if (type === 'global') {
    localValue.value[ruleIndex].target = ''
  } else {
    if (localValue.value[ruleIndex].target === '') {
      localValue.value[ruleIndex].target = 'qq::group'
    }
  }
  updateRules()
}

// 更新平台
const updateRulePlatform = (ruleIndex: number, platform: string) => {
  const current = localValue.value[ruleIndex].target
  const parts = current.split(':')
  parts[0] = platform
  localValue.value[ruleIndex].target = parts.join(':')
  updateRules()
}

// 更新ID
const updateRuleId = (ruleIndex: number, id: string) => {
  const current = localValue.value[ruleIndex].target
  const parts = current.split(':')
  parts[1] = id
  localValue.value[ruleIndex].target = parts.join(':')
  updateRules()
}

// 更新聊天类型
const updateRuleChatType = (ruleIndex: number, chatType: string) => {
  const current = localValue.value[ruleIndex].target
  const parts = current.split(':')
  parts[2] = chatType
  localValue.value[ruleIndex].target = parts.join(':')
  updateRules()
}

// 更新开始时间
const updateStartTime = (ruleIndex: number, time: string) => {
  const endTime = getEndTime(localValue.value[ruleIndex].time)
  localValue.value[ruleIndex].time = `${time}-${endTime}`
  updateRules()
}

// 更新结束时间
const updateEndTime = (ruleIndex: number, time: string) => {
  const startTime = getStartTime(localValue.value[ruleIndex].time)
  localValue.value[ruleIndex].time = `${startTime}-${time}`
  updateRules()
}

// 更新频率值
const updateRuleValue = (ruleIndex: number, value: number) => {
  localValue.value[ruleIndex].value = Math.max(0, Math.min(1, value))
  updateRules()
}

// 添加规则
const addRule = () => {
  localValue.value.push({
    target: '',
    time: '00:00-23:59',
    value: 1.0
  })
  updateRules()
}

// 删除规则
const removeRule = (index: number) => {
  localValue.value.splice(index, 1)
  updateRules()
}

// 更新规则
const updateRules = () => {
  emit('update', localValue.value)
}

// 格式化规则预览
const formatRulePreview = (rule: TalkValueRule): string => {
  return `{ target = "${rule.target}", time = "${rule.time}", value = ${rule.value.toFixed(1)} }`
}

// 获取效果样式类
const getEffectClass = (value: number): string => {
  if (value >= 0.8) return 'bg-success/10 border border-success/20 text-success'
  if (value >= 0.5) return 'bg-info/10 border border-info/20 text-info'
  if (value >= 0.3) return 'bg-warning/10 border border-warning/20 text-warning'
  return 'bg-error/10 border border-error/20 text-error'
}

// 获取效果图标
const getEffectIcon = (value: number): string => {
  if (value >= 0.8) return 'mdi:fire'
  if (value >= 0.5) return 'mdi:chat'
  if (value >= 0.3) return 'mdi:chat-outline'
  return 'mdi:sleep'
}

// 获取效果标题
const getEffectTitle = (value: number): string => {
  if (value >= 0.8) return '🔥 高活跃模式'
  if (value >= 0.5) return '💬 标准聊天模式'
  if (value >= 0.3) return '🌙 低活跃模式'
  return '😴 沉默模式'
}

// 获取效果描述
const getEffectDescription = (value: number, time: string): string => {
  const period = `在 ${time} 时段`
  if (value >= 0.8) return `${period}，麦麦会非常活跃地参与聊天`
  if (value >= 0.5) return `${period}，麦麦保持正常的聊天频率`
  if (value >= 0.3) return `${period}，麦麦会降低发言频率`
  return `${period}，麦麦几乎不会主动发言`
}
</script>

<style scoped>
code {
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
