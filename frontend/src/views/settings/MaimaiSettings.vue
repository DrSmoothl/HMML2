<template>
  <div class="min-h-screen bg-base-200 p-4 md:p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-base-100 rounded-xl shadow-sm p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-base-content">麦麦主程序配置</h1>
            <p class="text-base-content/70 mt-2">管理麦麦的核心功能设置</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button 
              class="btn btn-outline btn-sm"
              @click="loadConfig"
              :disabled="loading"
            >
              <Icon v-if="!loading" icon="mdi:refresh" class="w-4 h-4" />
              <span v-else class="loading loading-spinner loading-xs"></span>
              {{ loading ? '加载中...' : '重新加载' }}
            </button>
            <button 
              class="btn btn-primary btn-sm"
              @click="saveConfig"
              :disabled="loading || !hasChanges"
            >
              <Icon icon="mdi:content-save" class="w-4 h-4" />
              保存设置
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !config" class="bg-base-100 rounded-xl shadow-sm p-12">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/70 mt-4">正在加载配置...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error && !config" class="bg-base-100 rounded-xl shadow-sm p-12">
        <div class="text-center text-error">
          <Icon icon="mdi:alert-circle" class="w-16 h-16 mx-auto mb-4" />
          <p class="text-lg font-semibold mb-2">加载失败</p>
          <p class="text-base-content/70 mb-4">{{ error }}</p>
          <button class="btn btn-outline btn-sm" @click="loadConfig">
            <Icon icon="mdi:refresh" class="w-4 h-4" />
            重试
          </button>
        </div>
      </div>

      <!-- Configuration Sections -->
      <div v-if="config && !loading" class="space-y-6">
        <!-- Bot Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:robot" class="w-6 h-6" />
              {{ getConfigLabel('bot') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">机器人基础信息配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.bot" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`bot.${key}`)" 
                :value="value" 
                :path="`bot.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Personality Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:account-heart" class="w-6 h-6" />
              {{ getConfigLabel('personality') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">人格特质与身份设定</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.personality" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`personality.${key}`)" 
                :value="value" 
                :path="`personality.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Expression Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:emoticon-happy" class="w-6 h-6" />
              {{ getConfigLabel('expression') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">表达学习与分组配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.expression" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`expression.${key}`)" 
                :value="value" 
                :path="`expression.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Chat Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:chat" class="w-6 h-6" />
              {{ getConfigLabel('chat') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">聊天行为与频率设置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.chat" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`chat.${key}`)" 
                :value="value" 
                :path="`chat.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Relationship Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:account-group" class="w-6 h-6" />
              {{ getConfigLabel('relationship') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">关系系统配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.relationship" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`relationship.${key}`)" 
                :value="value" 
                :path="`relationship.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Message Receive Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:message-processing" class="w-6 h-6" />
              {{ getConfigLabel('message_receive') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">消息接收与过滤</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.message_receive" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`message_receive.${key}`)" 
                :value="value" 
                :path="`message_receive.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Tool Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:tools" class="w-6 h-6" />
              {{ getConfigLabel('tool') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">工具功能设置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.tool" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`tool.${key}`)" 
                :value="value" 
                :path="`tool.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Mood Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:emoticon" class="w-6 h-6" />
              {{ getConfigLabel('mood') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">情绪系统配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.mood" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`mood.${key}`)" 
                :value="value" 
                :path="`mood.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Emoji Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:emoticon-lol" class="w-6 h-6" />
              {{ getConfigLabel('emoji') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">表情包功能配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.emoji" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`emoji.${key}`)" 
                :value="value" 
                :path="`emoji.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Memory Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:brain" class="w-6 h-6" />
              {{ getConfigLabel('memory') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">记忆系统配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.memory" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`memory.${key}`)" 
                :value="value" 
                :path="`memory.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Voice Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:microphone" class="w-6 h-6" />
              {{ getConfigLabel('voice') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">语音识别配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.voice" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`voice.${key}`)" 
                :value="value" 
                :path="`voice.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- LPMM Knowledge Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:book-open" class="w-6 h-6" />
              {{ getConfigLabel('lpmm_knowledge') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">LPMM知识库配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.lpmm_knowledge" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`lpmm_knowledge.${key}`)" 
                :value="value" 
                :path="`lpmm_knowledge.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Keyword Reaction Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:reply" class="w-6 h-6" />
              {{ getConfigLabel('keyword_reaction') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">关键词反应配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.keyword_reaction" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`keyword_reaction.${key}`)" 
                :value="value" 
                :path="`keyword_reaction.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Custom Prompt Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:format-text" class="w-6 h-6" />
              {{ getConfigLabel('custom_prompt') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">自定义提示词配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.custom_prompt" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`custom_prompt.${key}`)" 
                :value="value" 
                :path="`custom_prompt.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Response Post Process Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:cog" class="w-6 h-6" />
              {{ getConfigLabel('response_post_process') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">回复后处理配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.response_post_process" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`response_post_process.${key}`)" 
                :value="value" 
                :path="`response_post_process.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Chinese Typo Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:alphabetical" class="w-6 h-6" />
              {{ getConfigLabel('chinese_typo') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">中文错别字生成配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.chinese_typo" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`chinese_typo.${key}`)" 
                :value="value" 
                :path="`chinese_typo.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Response Splitter Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:call-split" class="w-6 h-6" />
              {{ getConfigLabel('response_splitter') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">回复分割器配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.response_splitter" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`response_splitter.${key}`)" 
                :value="value" 
                :path="`response_splitter.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Log Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:file-document" class="w-6 h-6" />
              {{ getConfigLabel('log') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">日志系统配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.log" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`log.${key}`)" 
                :value="value" 
                :path="`log.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Debug Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:bug" class="w-6 h-6" />
              {{ getConfigLabel('debug') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">调试选项配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.debug" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`debug.${key}`)" 
                :value="value" 
                :path="`debug.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Maim Message Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:message" class="w-6 h-6" />
              {{ getConfigLabel('maim_message') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">MaimMessage服务配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.maim_message" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`maim_message.${key}`)" 
                :value="value" 
                :path="`maim_message.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Telemetry Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:chart-line" class="w-6 h-6" />
              {{ getConfigLabel('telemetry') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">统计信息发送配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.telemetry" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`telemetry.${key}`)" 
                :value="value" 
                :path="`telemetry.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>

        <!-- Experimental Configuration -->
        <div class="bg-base-100 rounded-xl shadow-sm">
          <div class="p-6 border-b border-base-300">
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:flask" class="w-6 h-6" />
              {{ getConfigLabel('experimental') }}
            </h2>
            <p class="text-base-content/70 text-sm mt-1">实验性功能配置</p>
          </div>
          <div class="p-6 space-y-6">
            <div v-for="(value, key) in config.experimental" :key="key" class="form-control">
              <ConfigItem 
                :label="getConfigLabel(`experimental.${key}`)" 
                :value="value" 
                :path="`experimental.${key}`"
                @update="updateConfig"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { MaimaiConfigAPI } from '@/utils/maimaiConfigApi'
import ConfigItem from '@/components/ConfigItem.vue'

// 响应式数据
const config = ref<any>(null)
const loading = ref(false)
const hasChanges = ref(false)
const error = ref<string | null>(null)

// 配置标签翻译映射
const configLabels: Record<string, string> = {
  // Bot配置
  'bot': '机器人配置',
  'bot.platform': '平台类型',
  'bot.qq_account': 'QQ账号',
  'bot.nickname': '昵称',
  'bot.alias_names': '别名列表',
  
  // 人格配置
  'personality': '人格配置',
  'personality.personality': '人格特质与身份特征',
  'personality.reply_style': '回复风格',
  'personality.emotion_style': '情感特征',
  'personality.interest': '兴趣爱好',
  
  // 表达配置
  'expression': '表达学习',
  'expression.learning_list': '学习配置列表',
  'expression.expression_groups': '表达分组',
  
  // 聊天配置
  'chat': '聊天设置',
  'chat.talk_frequency': '活跃度',
  'chat.focus_value': '专注度',
  'chat.max_context_size': '上下文长度',
  'chat.mentioned_bot_reply': '提及回复概率增幅',
  'chat.at_bot_inevitable_reply': 'At回复概率增幅',
  'chat.planner_size': '副规划器大小',
  'chat.focus_value_adjust': '专注度时间段调整',
  'chat.talk_frequency_adjust': '活跃度时间段调整',
  
  // 关系配置
  'relationship': '关系系统',
  'relationship.enable_relationship': '启用关系系统',
  
  // 消息接收配置
  'message_receive': '消息过滤',
  'message_receive.ban_words': '禁用词列表',
  'message_receive.ban_msgs_regex': '禁用消息正则',
  
  // 工具配置
  'tool': '工具功能',
  'tool.enable_tool': '启用工具',
  
  // 情绪配置
  'mood': '情绪系统',
  'mood.enable_mood': '启用情绪',
  'mood.mood_update_threshold': '情绪更新阈值',
  
  // 表情包配置
  'emoji': '表情包功能',
  'emoji.emoji_chance': '表情包激活概率',
  'emoji.max_reg_num': '最大注册数量',
  'emoji.do_replace': '达到上限时替换',
  'emoji.check_interval': '检查间隔',
  'emoji.steal_emoji': '偷取表情包',
  'emoji.content_filtration': '内容过滤',
  'emoji.filtration_prompt': '过滤要求',
  
  // 记忆配置
  'memory': '记忆系统',
  'memory.enable_memory': '启用记忆系统',
  'memory.forget_memory_interval': '记忆遗忘间隔（秒）',
  'memory.memory_forget_time': '遗忘时间（小时）',
  'memory.memory_forget_percentage': '记忆遗忘比例',
  'memory.memory_ban_words': '记忆禁用词',
  
  // 语音配置
  'voice': '语音识别',
  'voice.enable_asr': '启用语音识别',
  
  // LPMM知识库配置
  'lpmm_knowledge': 'LPMM知识库',
  'lpmm_knowledge.enable': '启用知识库',
  'lpmm_knowledge.rag_synonym_search_top_k': '同义词搜索TopK',
  'lpmm_knowledge.rag_synonym_threshold': '同义词阈值',
  'lpmm_knowledge.info_extraction_workers': '实体提取线程数',
  'lpmm_knowledge.qa_relation_search_top_k': '关系搜索TopK',
  'lpmm_knowledge.qa_relation_threshold': '关系阈值',
  'lpmm_knowledge.qa_paragraph_search_top_k': '段落搜索TopK',
  'lpmm_knowledge.qa_paragraph_node_weight': '段落节点权重',
  'lpmm_knowledge.qa_ent_filter_top_k': '实体过滤TopK',
  'lpmm_knowledge.qa_ppr_damping': 'PPR阻尼系数',
  'lpmm_knowledge.qa_res_top_k': '最终文段TopK',
  'lpmm_knowledge.embedding_dimension': '嵌入向量维度',
  
  // 关键词反应配置
  'keyword_reaction': '关键词反应',
  'keyword_reaction.keyword_rules': '关键词规则',
  'keyword_reaction.regex_rules': '正则规则',
  
  // 自定义提示词配置
  'custom_prompt': '自定义提示词',
  'custom_prompt.image_prompt': '图片提示词',
  
  // 回复后处理配置
  'response_post_process': '回复后处理',
  'response_post_process.enable_response_post_process': '启用回复后处理',
  
  // 中文错别字配置
  'chinese_typo': '中文错别字',
  'chinese_typo.enable': '启用错别字',
  'chinese_typo.error_rate': '单字替换概率',
  'chinese_typo.min_freq': '最小字频阈值',
  'chinese_typo.tone_error_rate': '声调错误概率',
  'chinese_typo.word_replace_rate': '整词替换概率',
  
  // 回复分割配置
  'response_splitter': '回复分割器',
  'response_splitter.enable': '启用回复分割',
  'response_splitter.max_length': '最大长度',
  'response_splitter.max_sentence_num': '最大句子数',
  'response_splitter.enable_kaomoji_protection': '颜文字保护',
  
  // 日志配置
  'log': '日志系统',
  'log.date_style': '日期格式',
  'log.log_level_style': '日志级别样式',
  'log.color_text': '文本颜色',
  'log.log_level': '全局日志级别',
  'log.console_log_level': '控制台日志级别',
  'log.file_log_level': '文件日志级别',
  'log.suppress_libraries': '屏蔽库列表',
  'log.library_log_levels': '库日志级别',
  
  // 调试配置
  'debug': '调试选项',
  'debug.show_prompt': '显示提示词',
  
  // MaimMessage配置
  'maim_message': 'MaimMessage服务',
  'maim_message.auth_token': '认证令牌',
  'maim_message.use_custom': '使用自定义服务器',
  'maim_message.host': '主机地址',
  'maim_message.port': '端口号',
  'maim_message.mode': '连接模式',
  'maim_message.use_wss': '使用WSS',
  'maim_message.cert_file': 'SSL证书文件',
  'maim_message.key_file': 'SSL密钥文件',
  
  // 统计配置
  'telemetry': '统计信息',
  'telemetry.enable': '启用统计',
  
  // 实验功能配置
  'experimental': '实验性功能',
  'experimental.enable_friend_chat': '启用好友聊天',
}

// 消息提示函数
const showMessage = (type: 'success' | 'error' | 'info', message: string) => {
  const toast = document.createElement('div')
  toast.className = `toast toast-top toast-end`
  
  const alert = document.createElement('div')
  alert.className = `alert ${
    type === 'success' ? 'alert-success' : 
    type === 'error' ? 'alert-error' : 
    'alert-info'
  }`
  alert.textContent = message
  
  toast.appendChild(alert)
  document.body.appendChild(toast)
  
  setTimeout(() => {
    document.body.removeChild(toast)
  }, 3000)
}

// 获取配置标签
const getConfigLabel = (key: string): string => {
  return configLabels[key] || key
}

// 更新配置
const updateConfig = (path: string, value: any) => {
  if (!config.value) return
  
  const keys = path.split('.')
  let target = config.value
  
  for (let i = 0; i < keys.length - 1; i++) {
    target = target[keys[i]]
  }
  
  target[keys[keys.length - 1]] = value
  hasChanges.value = true
}

// 加载配置
const loadConfig = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await MaimaiConfigAPI.getMainConfig()
    
    if (response.status === 200 && response.data) {
      config.value = response.data
      hasChanges.value = false
    } else {
      throw new Error(response.message || '获取配置失败')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载配置失败'
    console.error('Load config error:', err)
  } finally {
    loading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  if (!config.value) return
  
  try {
    loading.value = true
    
    // 确保特定字段的类型正确
    const configToSave = JSON.parse(JSON.stringify(config.value))
    
    // 确保QQ账号是数字类型
    if (configToSave.bot && configToSave.bot.qq_account) {
      const qqAccount = configToSave.bot.qq_account
      if (typeof qqAccount === 'string') {
        const numValue = parseInt(qqAccount, 10)
        if (!isNaN(numValue)) {
          configToSave.bot.qq_account = numValue
        }
      }
    }
    
    const response = await MaimaiConfigAPI.updateMainConfig(configToSave)
    
    if (response.status === 200) {
      hasChanges.value = false
      showMessage('success', '保存成功')
    } else {
      throw new Error(response.message || '保存失败')
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '保存失败'
    showMessage('error', errorMsg)
    console.error('Save config error:', err)
  } finally {
    loading.value = false
  }
}

// 页面加载时获取配置
onMounted(() => {
  loadConfig()
})
</script>