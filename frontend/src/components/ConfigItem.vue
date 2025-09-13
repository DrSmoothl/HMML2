<template>
  <div class="form-control w-full">
    <label class="label">
      <span class="label-text font-medium text-base">{{ label }}</span>
      <span v-if="showValue && (configType === 'number' || configType === 'range')" 
            class="badge badge-neutral font-mono">
        {{ displayValue }}
      </span>
    </label>
    
    <!-- 字符串输入框 -->
    <input 
      v-if="configType === 'string'"
      type="text" 
      class="input input-bordered w-full h-12"
      :value="value"
      @input="handleUpdate($event)"
      :placeholder="`输入${label}`"
    />

    <!-- 多行文本框 -->
    <textarea 
      v-else-if="configType === 'textarea'"
      class="textarea textarea-bordered w-full min-h-[8rem]"
      :value="value"
      @input="handleUpdate($event)"
      :placeholder="`输入${label}`"
    ></textarea>
    
    <!-- 数字输入框 -->
    <div v-else-if="configType === 'number'" class="join w-full">
      <button 
        class="btn btn-outline join-item h-12"
        @click="decrementNumber"
        :disabled="isAtMin"
      >
        <Icon icon="mdi:minus" class="w-4 h-4" />
      </button>
      <input 
        type="number" 
        class="input input-bordered join-item flex-1 text-center h-12"
        :value="value"
        @input="handleUpdate($event)"
        :min="numberMin"
        :max="numberMax"
        :step="numberStep"
      />
      <button 
        class="btn btn-outline join-item h-12"
        @click="incrementNumber"
        :disabled="isAtMax"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
      </button>
    </div>

    <!-- 布尔开关 -->
    <div v-else-if="configType === 'boolean'" class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
      <div class="flex items-center gap-3">
        <input 
          type="checkbox" 
          class="toggle toggle-primary"
          :checked="value"
          @change="handleUpdate($event)"
        />
        <div class="flex items-center gap-2">
          <span class="text-sm">状态:</span>
          <span :class="['badge', value ? 'badge-success' : 'badge-error']">
            {{ value ? '已启用' : '已禁用' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 范围滑块 -->
    <div v-else-if="configType === 'range'" class="px-2 py-2">
      <input 
        type="range" 
        class="range range-primary w-full mb-2"
        :value="value"
        @input="handleUpdate($event)"
        :min="rangeMin"
        :max="rangeMax"
        :step="rangeStep"
      />
      <div class="flex justify-between text-xs text-base-content/60">
        <span>{{ rangeMin }}</span>
        <span>{{ ((rangeMax - rangeMin) / 2 + rangeMin).toFixed(1) }}</span>
        <span>{{ rangeMax }}</span>
      </div>
    </div>
    
    <!-- 列表编辑器 -->
    <div v-else-if="configType === 'array'" class="space-y-3">
      <!-- 折叠/展开控制 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">共 {{ arrayValue.length }} 项</span>
          <span class="badge badge-neutral">{{ arrayValue.length === 0 ? '空列表' : `${arrayValue.length} 个项目` }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="arrayValue.length > 5"
            class="btn btn-ghost btn-xs"
            @click="showAllItems = !showAllItems"
          >
            <Icon :icon="showAllItems ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-4 h-4" />
            {{ showAllItems ? '收起' : `显示全部 (${arrayValue.length})` }}
          </button>
          <button 
            class="btn btn-primary btn-xs"
            @click="addArrayItem"
          >
            <Icon icon="mdi:plus" class="w-4 h-4" />
            添加
          </button>
        </div>
      </div>
      
      <!-- 数组项列表 -->
      <div class="space-y-2 max-h-80 overflow-y-auto">
        <div 
          v-for="(item, index) in displayedArrayItems" 
          :key="index"
          class="join w-full"
        >
          <input 
            type="text"
            class="input input-bordered join-item flex-1 h-10"
            :value="item"
            @input="updateArrayItem(index, $event)"
            :placeholder="`项目 ${index + 1}`"
          />
          <button 
            class="btn btn-error join-item h-10"
            @click="removeArrayItem(index)"
          >
            <Icon icon="mdi:delete" class="w-4 h-4" />
          </button>
        </div>
        
        <!-- 显示省略提示 -->
        <div v-if="!showAllItems && arrayValue.length > 5" class="text-center py-2">
          <span class="text-xs text-base-content/60">
            还有 {{ arrayValue.length - 5 }} 个项目未显示，点击上方按钮查看全部
          </span>
        </div>
      </div>
    </div>

  <!-- (已移除 chatflow_adjust 配置类型) -->

    <!-- 表达学习配置 -->
    <ExpressionLearningConfig
      v-else-if="configType === 'expression_learning'"
      :label="label"
      :value="value"
      @update="(newValue) => emit('update', props.path, newValue)"
    />

    <!-- 表达分组配置 -->
    <ExpressionGroupsConfig
      v-else-if="configType === 'expression_groups'"
      :label="label"
      :value="value"
      @update="(newValue) => emit('update', props.path, newValue)"
    />

    <!-- 记忆构建分布配置 - 已移除 -->
    <!-- <MemoryDistributionConfig
      v-else-if="configType === 'memory_distribution'"
      :label="label"
      :value="value"
      @update="(newValue) => emit('update', props.path, newValue)"
    /> -->

    <!-- 关键词反应配置 -->
    <KeywordReactionConfig
      v-else-if="configType === 'keyword_reaction'"
      :label="label"
      :value="value"
      @update="(newValue) => emit('update', props.path, newValue)"
    />

    <!-- 二维数组编辑器 -->
    <div v-else-if="configType === 'array2d'" class="space-y-4">
      <div 
        v-for="(subArray, arrayIndex) in array2dValue" 
        :key="arrayIndex"
        class="card bg-base-200 border border-base-300 p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium badge badge-primary">组 {{ arrayIndex + 1 }}</span>
          <button 
            class="btn btn-error btn-sm"
            @click="removeArray2dGroup(arrayIndex)"
          >
            <Icon icon="mdi:delete" class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-2">
          <div 
            v-for="(item, itemIndex) in subArray" 
            :key="itemIndex"
            class="join w-full"
          >
            <input 
              type="text"
              class="input input-bordered join-item flex-1 h-10"
              :value="item"
              @input="updateArray2dItem(arrayIndex, itemIndex, $event)"
              :placeholder="`项目 ${itemIndex + 1}`"
            />
            <button 
              class="btn btn-error btn-sm join-item h-10"
              @click="removeArray2dItem(arrayIndex, itemIndex)"
            >
              <Icon icon="mdi:delete" class="w-4 h-4" />
            </button>
          </div>
          <button 
            class="btn btn-outline btn-sm w-full h-10"
            @click="addArray2dItem(arrayIndex)"
          >
            <Icon icon="mdi:plus" class="w-4 h-4" />
            添加项目
          </button>
        </div>
      </div>
      <button 
        class="btn btn-outline w-full h-12"
        @click="addArray2dGroup"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        添加组
      </button>
    </div>

    <!-- 对象编辑器（键值对） -->
    <div v-else-if="configType === 'object'" class="space-y-3">
      <div 
        v-for="(objValue, key) in objectValue" 
        :key="key"
        class="join w-full"
      >
        <input 
          type="text"
          class="input input-bordered join-item w-1/3 h-12"
          :value="key"
          @input="updateObjectKey(key as unknown as string, $event)"
          placeholder="键"
          readonly
        />
        <input 
          type="text"
          class="input input-bordered join-item flex-1 h-12"
          :value="objValue"
          @input="updateObjectValue(key as unknown as string, $event)"
          placeholder="值"
        />
        <button 
          class="btn btn-error join-item h-12"
          @click="removeObjectItem(key as unknown as string)"
        >
          <Icon icon="mdi:delete" class="w-4 h-4" />
        </button>
      </div>
      <div class="join w-full">
        <input 
          type="text"
          class="input input-bordered join-item w-1/3 h-12"
          v-model="newObjectKey"
          placeholder="新键名"
        />
        <input 
          type="text"
          class="input input-bordered join-item flex-1 h-12"
          v-model="newObjectValue"
          placeholder="新值"
        />
        <button 
          class="btn btn-primary join-item h-12"
          @click="addObjectItem"
          :disabled="!newObjectKey"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 未知类型显示 -->
    <div v-else class="alert alert-warning">
      <Icon icon="mdi:alert" class="w-5 h-5" />
      <div>
        <h3 class="font-bold">未支持的配置类型: {{ configType }}</h3>
        <div class="text-xs mt-2">
          <pre class="bg-base-300 p-2 rounded text-xs overflow-auto">{{ JSON.stringify(value, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import ExpressionLearningConfig from './ExpressionLearningConfig.vue'
import ExpressionGroupsConfig from './ExpressionGroupsConfig.vue'
// import MemoryDistributionConfig from './MemoryDistributionConfig.vue' // 已移除
import KeywordReactionConfig from './KeywordReactionConfig.vue'

interface Props {
  label: string
  value: any
  path: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [path: string, value: any]
}>()

// 新增对象项的临时变量
const newObjectKey = ref('')
const newObjectValue = ref('')

// 数组显示控制
const showAllItems = ref(false)

// 检测配置类型
const configType = computed(() => {
  const value = props.value
  const path = props.path.toLowerCase()
  
  // 检查是否为聊天流调整配置
  // 已移除 focus_value_adjust / talk_frequency_adjust 相关配置
  
  // 检查是否为表达学习配置
  if (path.includes('learning_list')) {
    return 'expression_learning'
  }
  
  // 检查是否为表达分组配置
  if (path.includes('expression_groups')) {
    return 'expression_groups'
  }
  
  // 检查是否为记忆构建分布配置 - 已移除，跳过
  // if (path.includes('memory_build_distribution')) {
  //   return 'memory_distribution'
  // }
  
  // 检查是否为关键词反应配置 - 检查整个路径
  if (path === 'keyword_reaction') {
    return 'keyword_reaction'
  }
  
  // 特殊字段强制使用boolean类型（需要在其他检查之前） - 已移除相关配置
  // if (path.includes('compress_personality') || path.includes('compress_identity')) {
  //   return 'boolean'
  // }
  
  // 人格配置相关字段强制使用textarea
  if (path.includes('personality.personality') || 
      path.includes('personality.reply_style') || 
      path.includes('personality.emotion_style') || 
      path.includes('personality.interest') ||
      path.includes('style')) {
    return 'textarea'
  }
  
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  
  if (typeof value === 'string') {
    // 长文本使用textarea
    if (value.length > 100 || value.includes('\n')) {
      return 'textarea'
    }
    return 'string'
  }
  
  if (typeof value === 'number') {
    // QQ账号特殊处理，使用字符串输入
    if (path.includes('qq_account')) {
      return 'string'
    }
    // 判断是否为概率值 (0-1之间的小数)
    if (value >= 0 && value <= 1 && !Number.isInteger(value)) {
      return 'range'
    }
    return 'number'
  }
  
  if (Array.isArray(value)) {
    // 检查是否为二维数组
    if (value.length > 0 && Array.isArray(value[0])) {
      return 'array2d'
    }
    return 'array'
  }
  
  if (typeof value === 'object' && value !== null) {
    return 'object'
  }
  
  return 'unknown'
})

// 数字输入框的范围配置
const numberMin = computed(() => {
  const key = props.path.toLowerCase()
  if (key.includes('port')) return 1
  if (key.includes('timeout')) return 1
  if (key.includes('retry') || key.includes('interval')) return 0
  if (key.includes('threshold') || key.includes('rate')) return 0
  // QQ账号不设置范围限制，使用字符串输入
  if (key.includes('qq_account')) return undefined
  return undefined
})

const numberMax = computed(() => {
  const key = props.path.toLowerCase()
  if (key.includes('port')) return 65535
  if (key.includes('timeout')) return 300
  // QQ账号不设置范围限制，使用字符串输入
  if (key.includes('qq_account')) return undefined
  return undefined
})

const numberStep = computed(() => {
  const key = props.path.toLowerCase()
  if (key.includes('rate') || key.includes('threshold') || key.includes('weight')) return 0.01
  return 1
})

// 范围滑块的配置
const rangeMin = computed(() => 0)
const rangeMax = computed(() => 1)
const rangeStep = computed(() => 0.01)

// 当前值是否达到边界
const isAtMin = computed(() => {
  if (numberMin.value === undefined) return false
  return props.value <= numberMin.value
})

const isAtMax = computed(() => {
  if (numberMax.value === undefined) return false
  return props.value >= numberMax.value
})

// 显示值
const displayValue = computed(() => {
  if (configType.value === 'range') {
    return (props.value as number).toFixed(2)
  }
  return props.value?.toString() || ''
})

const showValue = computed(() => {
  return configType.value === 'range' || configType.value === 'number'
})

// 数组值处理
const arrayValue = computed(() => {
  return Array.isArray(props.value) ? props.value : []
})

// 显示的数组项（支持折叠）
const displayedArrayItems = computed(() => {
  const items = arrayValue.value
  if (showAllItems.value || items.length <= 5) {
    return items
  }
  return items.slice(0, 5)
})

// 二维数组值处理
const array2dValue = computed(() => {
  const value = props.value
  if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
    return value
  }
  return []
})

// 对象值处理
const objectValue = computed(() => {
  return typeof props.value === 'object' && props.value !== null && !Array.isArray(props.value) ? props.value : {}
})

// 处理更新事件
const handleUpdate = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement

  let newValue: any
  
  if (configType.value === 'boolean') {
    newValue = (target as HTMLInputElement).checked
  } else if (configType.value === 'number' || configType.value === 'range') {
    newValue = parseFloat(target.value) || 0
  } else {
    newValue = target.value
    // 对于QQ账号等应该是数字的字段，进行类型转换
    if (props.path.includes('qq_account') && target.value) {
      const numValue = parseInt(target.value, 10)
      if (!isNaN(numValue)) {
        newValue = numValue
      }
    }
  }
  
  emit('update', props.path, newValue)
}

// 数字增减操作
const incrementNumber = () => {
  const step = numberStep.value
  const newValue = (props.value as number) + step
  if (numberMax.value === undefined || newValue <= numberMax.value) {
    emit('update', props.path, newValue)
  }
}

const decrementNumber = () => {
  const step = numberStep.value
  const newValue = (props.value as number) - step
  if (numberMin.value === undefined || newValue >= numberMin.value) {
    emit('update', props.path, newValue)
  }
}

// 数组操作
const addArrayItem = () => {
  const newArray = [...arrayValue.value, '']
  emit('update', props.path, newArray)
}

const removeArrayItem = (index: number) => {
  const newArray = arrayValue.value.filter((_, i: number) => i !== index)
  emit('update', props.path, newArray)
}

const updateArrayItem = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const newArray = [...arrayValue.value]
  newArray[index] = target.value
  emit('update', props.path, newArray)
}

// 二维数组操作
const addArray2dGroup = () => {
  const newArray = [...array2dValue.value, []]
  emit('update', props.path, newArray)
}

const removeArray2dGroup = (arrayIndex: number) => {
  const newArray = array2dValue.value.filter((_, i) => i !== arrayIndex)
  emit('update', props.path, newArray)
}

const addArray2dItem = (arrayIndex: number) => {
  const newArray = [...array2dValue.value]
  newArray[arrayIndex] = [...newArray[arrayIndex], '']
  emit('update', props.path, newArray)
}

const removeArray2dItem = (arrayIndex: number, itemIndex: number) => {
  const newArray = [...array2dValue.value]
  newArray[arrayIndex] = newArray[arrayIndex].filter((_: any, i: number) => i !== itemIndex)
  emit('update', props.path, newArray)
}

const updateArray2dItem = (arrayIndex: number, itemIndex: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const newArray = [...array2dValue.value]
  newArray[arrayIndex] = [...newArray[arrayIndex]]
  newArray[arrayIndex][itemIndex] = target.value
  emit('update', props.path, newArray)
}

// 对象操作
const addObjectItem = () => {
  if (!newObjectKey.value) return
  
  const newObject = { ...objectValue.value }
  newObject[newObjectKey.value] = newObjectValue.value || ''
  
  emit('update', props.path, newObject)
  
  // 清空输入框
  newObjectKey.value = ''
  newObjectValue.value = ''
}

const removeObjectItem = (key: string) => {
  const newObject = { ...objectValue.value }
  delete newObject[key]
  emit('update', props.path, newObject)
}

const updateObjectValue = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const newObject = { ...objectValue.value }
  newObject[key] = target.value
  emit('update', props.path, newObject)
}

const updateObjectKey = (oldKey: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const newKey = target.value
  
  if (newKey !== oldKey && newKey) {
    const newObject = { ...objectValue.value }
    const value = newObject[oldKey]
    delete newObject[oldKey]
    newObject[newKey] = value
    emit('update', props.path, newObject)
  }
}
</script>
