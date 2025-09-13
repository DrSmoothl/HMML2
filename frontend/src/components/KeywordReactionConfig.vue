<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-base-content">{{ label }}</label>
    </div>
    
    <div class="space-y-4">
      <!-- 关键词规则 -->
      <div class="bg-base-200 rounded-lg p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2 min-w-[220px]">
            <Icon icon="mdi:key" class="w-5 h-5 text-primary" />
            <span class="text-sm font-semibold">关键词规则</span>
            <span class="badge badge-info">{{ keywordRules.length }} 条</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              class="btn btn-primary btn-sm"
              @click="addKeywordRule"
            >
              <Icon icon="mdi:plus" class="w-4 h-4" />新增
            </button>
          </div>
        </div>
        
        <div class="space-y-3">
          <div 
            v-for="(rule, index) in keywordRules" 
            :key="index"
            class="card bg-base-100 border border-base-300 p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-base-content/80">规则 {{ index + 1 }}</span>
              <button 
                class="btn btn-error btn-xs"
                @click="removeKeywordRule(index)"
              >
                <Icon icon="mdi:delete" class="w-3 h-3" />
              </button>
            </div>
            
            <!-- 关键词列表 -->
            <div class="form-control mb-3">
              <label class="label py-1 block">
                <span class="label-text text-xs font-medium mb-1">触发关键词</span>
              </label>
              <div class="flex flex-wrap gap-1 mb-2 min-h-[2rem]">
                <div 
                  v-for="(keyword, kwIndex) in rule.keywords" 
                  :key="kwIndex"
                  class="badge badge-outline gap-1"
                >
                  {{ keyword }}
                  <button 
                    @click="removeKeyword(index, kwIndex)"
                    class="btn btn-ghost btn-circle btn-xs"
                  >
                    <Icon icon="mdi:close" class="w-2 h-2" />
                  </button>
                </div>
              </div>
              <div class="join w-full max-w-xl">
                <input 
                  v-model="newKeywords[index]"
                  type="text" 
                  class="input input-bordered input-sm join-item flex-1"
                  placeholder="输入关键词后回车（可多次）"
                  @keyup.enter="addKeyword(index)"
                />
                <button 
                  class="btn btn-primary btn-sm join-item"
                  @click="addKeyword(index)"
                  :disabled="!newKeywords[index]"
                >
                  <Icon icon="mdi:plus" class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <!-- 回复内容 -->
            <div class="form-control">
              <label class="label py-1 block">
                <span class="label-text text-xs font-medium mb-1">回复内容</span>
              </label>
              <textarea 
                class="textarea textarea-bordered textarea-sm leading-relaxed w-full"
                :value="rule.reaction"
                @input="updateReaction(index, ($event.target as HTMLTextAreaElement).value)"
                placeholder="输入触发关键词时的回复内容"
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div v-if="keywordRules.length === 0" class="text-center py-4 text-base-content/60">
            <Icon icon="mdi:key-off" class="w-8 h-8 mx-auto mb-2" />
            <p class="text-sm">暂无关键词规则，点击上方按钮添加</p>
          </div>
        </div>
      </div>

      <!-- 正则规则 -->
      <div class="bg-base-200 rounded-lg p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2 min-w-[220px]">
            <Icon icon="mdi:regex" class="w-5 h-5 text-secondary" />
            <span class="text-sm font-semibold">正则规则</span>
            <span class="badge badge-info">{{ regexRules.length }} 条</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              class="btn btn-secondary btn-sm"
              @click="addRegexRule"
            >
              <Icon icon="mdi:plus" class="w-4 h-4" />新增
            </button>
          </div>
        </div>
        
        <div class="space-y-3">
          <div 
            v-for="(rule, index) in regexRules" 
            :key="index"
            class="card bg-base-100 border border-base-300 p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-base-content/80">正则 {{ index + 1 }}</span>
              <button 
                class="btn btn-error btn-xs"
                @click="removeRegexRule(index)"
              >
                <Icon icon="mdi:delete" class="w-3 h-3" />
              </button>
            </div>
            
            <!-- 正则表达式列表 -->
            <div class="form-control mb-3">
              <label class="label py-1 block">
                <span class="label-text text-xs font-medium mb-1">正则表达式</span>
              </label>
              <div class="flex flex-wrap gap-1 mb-2 min-h-[2rem]">
                <div 
                  v-for="(regex, regIndex) in rule.regex" 
                  :key="regIndex"
                  class="badge badge-outline badge-secondary gap-1 font-mono text-xs"
                >
                  {{ regex }}
                  <button 
                    @click="removeRegex(index, regIndex)"
                    class="btn btn-ghost btn-circle btn-xs"
                  >
                    <Icon icon="mdi:close" class="w-2 h-2" />
                  </button>
                </div>
              </div>
              <div class="join w-full max-w-xl">
                <input 
                  v-model="newRegexes[index]"
                  type="text" 
                  class="input input-bordered input-sm join-item flex-1 font-mono"
                  placeholder="输入正则后回车（可多条）"
                  @keyup.enter="addRegex(index)"
                />
                <button 
                  class="btn btn-secondary btn-sm join-item"
                  @click="addRegex(index)"
                  :disabled="!newRegexes[index]"
                >
                  <Icon icon="mdi:plus" class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <!-- 回复内容 -->
            <div class="form-control">
              <label class="label py-1 block">
                <span class="label-text text-xs font-medium mb-1">回复内容</span>
              </label>
              <textarea 
                class="textarea textarea-bordered textarea-sm leading-relaxed w-full"
                :value="rule.reaction"
                @input="updateRegexReaction(index, ($event.target as HTMLTextAreaElement).value)"
                placeholder="输入匹配正则时的回复内容"
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div v-if="regexRules.length === 0" class="text-center py-4 text-base-content/60">
            <Icon icon="mdi:regex" class="w-8 h-8 mx-auto mb-2" />
            <p class="text-sm">暂无正则规则，点击上方按钮添加</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置说明 -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-3">
      <div class="flex items-start gap-2">
        <Icon icon="mdi:information" class="w-4 h-4 text-info mt-0.5" />
        <div class="text-xs text-info">
          <div class="font-medium mb-1">配置说明:</div>
          <ul class="space-y-1 list-disc list-inside">
            <li><strong>关键词规则:</strong> 检测到指定关键词时触发回复</li>
            <li><strong>正则规则:</strong> 使用正则表达式匹配消息模式</li>
            <li><strong>回复内容:</strong> 支持特殊占位符，如正则捕获组</li>
            <li><strong>示例:</strong> 正则 "^(?P&lt;n&gt;\\S+)是这样的$" 可捕获名称</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

interface KeywordRule {
  keywords: string[]
  reaction: string
}

interface RegexRule {
  regex: string[]
  reaction: string
}

interface Props {
  label: string
  value: {
    keyword_rules?: KeywordRule[]
    regex_rules?: RegexRule[]
  }
}

interface Emits {
  (e: 'update', value: { keyword_rules: KeywordRule[], regex_rules: RegexRule[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 规则数据
const keywordRules = ref<KeywordRule[]>([])
const regexRules = ref<RegexRule[]>([])

// 新增输入
const newKeywords = ref<string[]>([])
const newRegexes = ref<string[]>([])

// 初始化值
const initializeValue = () => {
  if (props.value) {
    keywordRules.value = props.value.keyword_rules ? [...props.value.keyword_rules] : []
    regexRules.value = props.value.regex_rules ? [...props.value.regex_rules] : []
  } else {
    keywordRules.value = []
    regexRules.value = []
  }
  
  // 初始化输入框数组
  newKeywords.value = new Array(keywordRules.value.length).fill('')
  newRegexes.value = new Array(regexRules.value.length).fill('')
}

// 监听props变化
watch(
  () => props.value,
  () => {
    initializeValue()
  },
  { immediate: true, deep: true }
)

// 更新配置
const updateConfig = () => {
  emit('update', {
    keyword_rules: keywordRules.value,
    regex_rules: regexRules.value
  })
}

// 关键词规则操作
const addKeywordRule = () => {
  keywordRules.value.push({ keywords: [], reaction: '' })
  newKeywords.value.push('')
  updateConfig()
}

const removeKeywordRule = (index: number) => {
  keywordRules.value.splice(index, 1)
  newKeywords.value.splice(index, 1)
  updateConfig()
}

const addKeyword = (ruleIndex: number) => {
  const keyword = newKeywords.value[ruleIndex]?.trim()
  if (keyword && !keywordRules.value[ruleIndex].keywords.includes(keyword)) {
    keywordRules.value[ruleIndex].keywords.push(keyword)
    newKeywords.value[ruleIndex] = ''
    updateConfig()
  }
}

const removeKeyword = (ruleIndex: number, keywordIndex: number) => {
  keywordRules.value[ruleIndex].keywords.splice(keywordIndex, 1)
  updateConfig()
}

const updateReaction = (ruleIndex: number, reaction: string) => {
  keywordRules.value[ruleIndex].reaction = reaction
  updateConfig()
}

// 正则规则操作
const addRegexRule = () => {
  regexRules.value.push({ regex: [], reaction: '' })
  newRegexes.value.push('')
  updateConfig()
}

const removeRegexRule = (index: number) => {
  regexRules.value.splice(index, 1)
  newRegexes.value.splice(index, 1)
  updateConfig()
}

const addRegex = (ruleIndex: number) => {
  const regex = newRegexes.value[ruleIndex]?.trim()
  if (regex && !regexRules.value[ruleIndex].regex.includes(regex)) {
    regexRules.value[ruleIndex].regex.push(regex)
    newRegexes.value[ruleIndex] = ''
    updateConfig()
  }
}

const removeRegex = (ruleIndex: number, regexIndex: number) => {
  regexRules.value[ruleIndex].regex.splice(regexIndex, 1)
  updateConfig()
}

const updateRegexReaction = (ruleIndex: number, reaction: string) => {
  regexRules.value[ruleIndex].reaction = reaction
  updateConfig()
}
</script>
