<template>
  <div class="min-h-screen bg-base-200 p-4 md:p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-base-100 rounded-xl shadow-sm p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-base-content">QQ 适配器配置</h1>
            <p class="text-base-content/70 mt-2">配置 QQ 适配器连接参数、聊天权限和功能选项</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button 
              class="btn btn-outline btn-sm"
              @click="testConnection"
              :disabled="loading"
            >
              <Icon v-if="!testing" icon="mdi:wifi" class="w-4 h-4" />
              <span v-else class="loading loading-spinner loading-xs"></span>
              {{ testing ? '测试中...' : '测试连接' }}
            </button>
            <button 
              class="btn btn-success btn-sm"
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

      <!-- Connection Settings Section -->
      <div class="bg-base-100 rounded-xl shadow-sm">
        <div class="p-6 border-b border-base-300">
          <div>
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:link-variant" class="w-6 h-6" />
              连接配置
            </h2>
            <p class="text-base-content/70 text-sm mt-1">配置 Napcat 和 MaiBot 服务器连接参数</p>
          </div>
        </div>
        
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Napcat Server Settings -->
            <div class="card bg-base-200 border border-base-300">
              <div class="card-body p-4">
                <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                  <Icon icon="mdi:server-network" class="w-5 h-5" />
                  Napcat 服务器
                </h3>
                
                <div class="space-y-4">
                  <div class="form-control">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-24 shrink-0">主机地址</span>
                      <input 
                        type="text" 
                        class="input input-bordered input-sm flex-1"
                        v-model="config.napcat_server.host"
                        @input="markAsChanged"
                        placeholder="localhost"
                      />
                    </div>
                  </div>

                  <div class="form-control">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-24 shrink-0">端口</span>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm flex-1"
                        v-model.number="config.napcat_server.port"
                        @input="markAsChanged"
                        min="1"
                        max="65535"
                        placeholder="8095"
                      />
                    </div>
                  </div>

                  <div class="form-control">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-24 shrink-0">心跳间隔</span>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm flex-1"
                        v-model.number="config.napcat_server.heartbeat_interval"
                        @input="markAsChanged"
                        min="1"
                        max="300"
                        placeholder="30"
                      />
                    </div>
                    <div class="text-xs text-base-content/60 ml-28">与 Napcat 设置保持一致，单位：秒</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- MaiBot Server Settings -->
            <div class="card bg-base-200 border border-base-300">
              <div class="card-body p-4">
                <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                  <Icon icon="mdi:robot" class="w-5 h-5" />
                  MaiBot 服务器
                </h3>
                
                <div class="space-y-4">
                  <div class="form-control">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-24 shrink-0">主机地址</span>
                      <input 
                        type="text" 
                        class="input input-bordered input-sm flex-1"
                        v-model="config.maibot_server.host"
                        @input="markAsChanged"
                        placeholder="localhost"
                      />
                    </div>
                    <div class="text-xs text-base-content/60 ml-28">对应 .env 中的 HOST</div>
                  </div>

                  <div class="form-control">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-24 shrink-0">端口</span>
                      <input 
                        type="number" 
                        class="input input-bordered input-sm flex-1"
                        v-model.number="config.maibot_server.port"
                        @input="markAsChanged"
                        min="1"
                        max="65535"
                        placeholder="8000"
                      />
                    </div>
                    <div class="text-xs text-base-content/60 ml-28">对应 .env 中的 PORT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Permissions Section -->
      <div class="bg-base-100 rounded-xl shadow-sm">
        <div class="p-6 border-b border-base-300">
          <div>
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:account-group" class="w-6 h-6" />
              聊天权限管理
            </h2>
            <p class="text-base-content/70 text-sm mt-1">设置群组和私聊的白名单或黑名单，管理用户访问权限</p>
          </div>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Group Settings -->
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                <Icon icon="mdi:account-group" class="w-5 h-5" />
                群组权限设置
              </h3>
              
              <div class="space-y-4">
                <div class="form-control">
                  <div class="flex items-center gap-4 mb-2">
                    <span class="label-text font-medium w-32 shrink-0">群组名单类型</span>
                    <select 
                      class="select select-bordered select-sm flex-1"
                      v-model="config.chat.group_list_type"
                      @change="markAsChanged"
                    >
                      <option value="whitelist">白名单（仅允许名单中的群组）</option>
                      <option value="blacklist">黑名单（禁止名单中的群组）</option>
                    </select>
                  </div>
                </div>

                <div class="form-control">
                  <div class="mb-3">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-32 shrink-0">群组列表</span>
                      <div class="flex gap-2 flex-1">
                        <input 
                          type="text" 
                          class="input input-bordered input-sm flex-1"
                          v-model="newGroupId"
                          @keyup.enter="addGroupId"
                          placeholder="输入群组ID（纯数字）"
                          pattern="[0-9]+"
                        />
                        <button 
                          class="btn btn-primary btn-sm"
                          @click="addGroupId"
                          :disabled="!isValidGroupId"
                        >
                          <Icon icon="mdi:plus" class="w-4 h-4" />
                          添加
                        </button>
                      </div>
                    </div>
                    <div class="text-xs text-base-content/60 ml-36">
                      {{ config.chat.group_list_type === 'whitelist' ? '仅这些群组可以聊天' : '这些群组无法聊天' }}
                    </div>
                  </div>
                  
                  <div class="flex flex-wrap gap-2 ml-36">
                    <div 
                      v-for="(groupId, index) in config.chat.group_list" 
                      :key="groupId"
                      class="badge badge-outline badge-lg gap-2"
                    >
                      {{ groupId }}
                      <button 
                        class="btn btn-ghost btn-xs"
                        @click="removeGroupId(index)"
                      >
                        <Icon icon="mdi:close" class="w-3 h-3" />
                      </button>
                    </div>
                    <div v-if="config.chat.group_list.length === 0" class="text-base-content/50 text-sm py-2">
                      暂无群组配置
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Private Chat Settings -->
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                <Icon icon="mdi:account" class="w-5 h-5" />
                私聊权限设置
              </h3>
              
              <div class="space-y-4">
                <div class="form-control">
                  <div class="flex items-center gap-4 mb-2">
                    <span class="label-text font-medium w-32 shrink-0">私聊名单类型</span>
                    <select 
                      class="select select-bordered select-sm flex-1"
                      v-model="config.chat.private_list_type"
                      @change="markAsChanged"
                    >
                      <option value="whitelist">白名单（仅允许名单中的用户）</option>
                      <option value="blacklist">黑名单（禁止名单中的用户）</option>
                    </select>
                  </div>
                </div>

                <div class="form-control">
                  <div class="mb-3">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-32 shrink-0">用户列表</span>
                      <div class="flex gap-2 flex-1">
                        <input 
                          type="text" 
                          class="input input-bordered input-sm flex-1"
                          v-model="newPrivateId"
                          @keyup.enter="addPrivateId"
                          placeholder="输入用户QQ号（纯数字）"
                          pattern="[0-9]+"
                        />
                        <button 
                          class="btn btn-primary btn-sm"
                          @click="addPrivateId"
                          :disabled="!isValidPrivateId"
                        >
                          <Icon icon="mdi:plus" class="w-4 h-4" />
                          添加
                        </button>
                      </div>
                    </div>
                    <div class="text-xs text-base-content/60 ml-36">
                      {{ config.chat.private_list_type === 'whitelist' ? '仅这些用户可以私聊' : '这些用户无法私聊' }}
                    </div>
                  </div>
                  
                  <div class="flex flex-wrap gap-2 ml-36">
                    <div 
                      v-for="(userId, index) in config.chat.private_list" 
                      :key="userId"
                      class="badge badge-outline badge-lg gap-2"
                    >
                      {{ userId }}
                      <button 
                        class="btn btn-ghost btn-xs"
                        @click="removePrivateId(index)"
                      >
                        <Icon icon="mdi:close" class="w-3 h-3" />
                      </button>
                    </div>
                    <div v-if="config.chat.private_list.length === 0" class="text-base-content/50 text-sm py-2">
                      暂无用户配置
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ban Settings -->
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                <Icon icon="mdi:account-cancel" class="w-5 h-5" />
                全局禁止名单
              </h3>
              
              <div class="space-y-4">
                <div class="form-control">
                  <div class="mb-3">
                    <div class="flex items-center gap-4 mb-2">
                      <span class="label-text font-medium w-32 shrink-0">禁止用户列表</span>
                      <div class="flex gap-2 flex-1">
                        <input 
                          type="text" 
                          class="input input-bordered input-sm flex-1"
                          v-model="newBanId"
                          @keyup.enter="addBanId"
                          placeholder="输入要禁止的用户QQ号"
                          pattern="[0-9]+"
                        />
                        <button 
                          class="btn btn-error btn-sm"
                          @click="addBanId"
                          :disabled="!isValidBanId"
                        >
                          <Icon icon="mdi:account-cancel" class="w-4 h-4" />
                          禁止
                        </button>
                      </div>
                    </div>
                    <div class="text-xs text-base-content/60 ml-36">这些用户无法进行任何聊天</div>
                  </div>
                  
                  <div class="flex flex-wrap gap-2 ml-36">
                    <div 
                      v-for="(userId, index) in config.chat.ban_user_id" 
                      :key="userId"
                      class="badge badge-error badge-lg gap-2"
                    >
                      {{ userId }}
                      <button 
                        class="btn btn-ghost btn-xs text-error-content"
                        @click="removeBanId(index)"
                      >
                        <Icon icon="mdi:close" class="w-3 h-3" />
                      </button>
                    </div>
                    <div v-if="config.chat.ban_user_id.length === 0" class="text-base-content/50 text-sm py-2">
                      暂无禁止用户
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Settings Section -->
      <div class="bg-base-100 rounded-xl shadow-sm">
        <div class="p-6 border-b border-base-300">
          <div>
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:feature-search" class="w-6 h-6" />
              功能设置
            </h2>
            <p class="text-base-content/70 text-sm mt-1">配置适配器的各项功能开关和参数</p>
          </div>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Bot Detection -->
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-base-content flex items-center gap-2">
                    <Icon icon="mdi:robot-outline" class="w-5 h-5" />
                    屏蔽 QQ 官方机器人
                  </h3>
                  <p class="text-sm text-base-content/70 mt-1">防止与 QQ 官方机器人产生冲突</p>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <input 
                      type="checkbox" 
                      class="toggle toggle-primary"
                      v-model="config.chat.ban_qq_bot"
                      @change="markAsChanged"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Poke Feature -->
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-base-content flex items-center gap-2">
                    <Icon icon="mdi:hand-pointing-right" class="w-5 h-5" />
                    启用戳一戳功能
                  </h3>
                  <p class="text-sm text-base-content/70 mt-1">允许响应 QQ 戳一戳消息</p>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <input 
                      type="checkbox" 
                      class="toggle toggle-primary"
                      v-model="config.chat.enable_poke"
                      @change="markAsChanged"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Voice/TTS Settings -->
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-base-content flex items-center gap-2">
                    <Icon icon="mdi:microphone" class="w-5 h-5" />
                    启用 TTS 语音
                  </h3>
                  <p class="text-sm text-base-content/70 mt-1">使用文本转语音功能（需确保配置了 TTS 适配器）</p>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <input 
                      type="checkbox" 
                      class="toggle toggle-primary"
                      v-model="config.voice.use_tts"
                      @change="markAsChanged"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Debug Settings -->
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                <Icon icon="mdi:bug" class="w-5 h-5" />
                调试设置
              </h3>
              
              <div class="form-control">
                <div class="flex items-center gap-4 mb-2">
                  <span class="label-text font-medium w-24 shrink-0">日志等级</span>
                  <select 
                    class="select select-bordered select-sm flex-1"
                    v-model="config.debug.level"
                    @change="markAsChanged"
                  >
                    <option value="DEBUG">DEBUG（最详细）</option>
                    <option value="INFO">INFO（信息）</option>
                    <option value="WARNING">WARNING（警告）</option>
                    <option value="ERROR">ERROR（错误）</option>
                    <option value="CRITICAL">CRITICAL（严重错误）</option>
                  </select>
                </div>
                <div class="text-xs text-base-content/60 ml-28">控制日志输出的详细程度</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Version Info Section -->
      <div class="bg-base-100 rounded-xl shadow-sm">
        <div class="p-6 border-b border-base-300">
          <div>
            <h2 class="text-xl font-semibold text-base-content flex items-center gap-2">
              <Icon icon="mdi:information" class="w-6 h-6" />
              版本信息
            </h2>
            <p class="text-base-content/70 text-sm mt-1">当前适配器版本和内部配置信息</p>
          </div>
        </div>
        
        <div class="p-6">
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-base-content">适配器版本</h3>
                  <p class="text-sm text-base-content/70 mt-1">当前使用的适配器版本号</p>
                </div>
                <div class="badge badge-primary badge-lg">
                  v{{ config.inner.version }}
                </div>
              </div>
              <div class="divider my-2"></div>
              <div class="alert alert-info">
                <Icon icon="mdi:information" class="w-5 h-5" />
                <span class="text-sm">请勿随意修改版本号，除非您清楚自己在做什么</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/utils/api'

// 接口定义
interface AdapterConfig {
  inner: {
    version: string
  }
  nickname: string
  napcat_server: {
    host: string
    port: number
    heartbeat_interval: number
  }
  maibot_server: {
    host: string
    port: number
  }
  chat: {
    group_list_type: 'whitelist' | 'blacklist'
    group_list: number[]
    private_list_type: 'whitelist' | 'blacklist'
    private_list: number[]
    ban_user_id: number[]
    ban_qq_bot: boolean
    enable_poke: boolean
  }
  voice: {
    use_tts: boolean
  }
  debug: {
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  }
}

// 响应式数据
const config = reactive<AdapterConfig>({
  inner: {
    version: "0.1.1"
  },
  nickname: "",
  napcat_server: {
    host: "localhost",
    port: 8095,
    heartbeat_interval: 30
  },
  maibot_server: {
    host: "localhost",
    port: 8000
  },
  chat: {
    group_list_type: "whitelist",
    group_list: [941657197, 1022489779],
    private_list_type: "whitelist",
    private_list: [],
    ban_user_id: [],
    ban_qq_bot: true,
    enable_poke: true
  },
  voice: {
    use_tts: false
  },
  debug: {
    level: "INFO"
  }
})

const loading = ref(false)
const testing = ref(false)
const hasChanges = ref(false)

// 临时输入数据
const newGroupId = ref('')
const newPrivateId = ref('')
const newBanId = ref('')

// 计算属性
const isValidGroupId = computed(() => {
  const id = newGroupId.value.trim()
  return id && /^\d+$/.test(id) && !config.chat.group_list.includes(Number(id))
})

const isValidPrivateId = computed(() => {
  const id = newPrivateId.value.trim()
  return id && /^\d+$/.test(id) && !config.chat.private_list.includes(Number(id))
})

const isValidBanId = computed(() => {
  const id = newBanId.value.trim()
  return id && /^\d+$/.test(id) && !config.chat.ban_user_id.includes(Number(id))
})

// 消息提示函数
const showMessage = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
  // 移除现有的toast
  const existingToasts = document.querySelectorAll('.toast')
  existingToasts.forEach(toast => toast.remove())

  // 创建toast消息
  const toast = document.createElement('div')
  toast.className = `toast toast-top toast-end z-50`
  
  const alert = document.createElement('div')
  alert.className = `alert ${
    type === 'success' ? 'alert-success' : 
    type === 'error' ? 'alert-error' : 
    type === 'warning' ? 'alert-warning' :
    'alert-info'
  } shadow-lg`
  alert.innerHTML = `
    <div class="flex items-center gap-2">
      ${type === 'success' ? '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : ''}
      ${type === 'error' ? '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : ''}
      ${type === 'warning' ? '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>' : ''}
      ${type === 'info' ? '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : ''}
      <span>${message}</span>
    </div>
  `
  
  toast.appendChild(alert)
  document.body.appendChild(toast)
  
  // 3秒后自动移除
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  }, 3000)
}

// 方法
const markAsChanged = () => {
  hasChanges.value = true
}

const loadConfig = async () => {
  try {
    loading.value = true
    
    // 调用后端API获取QQ适配器配置
    const response = await api.get('/config/adapter/qq/get')
    
    if (response.data.status === 200) {
      // 将从后端获取的配置数据合并到当前配置
      Object.assign(config, response.data.data)
      showMessage('success', '配置加载成功')
    } else {
      throw new Error(response.data.message || '获取配置失败')
    }
    
    hasChanges.value = false
  } catch (error) {
    console.error('Load config error:', error)
    if (error instanceof Error && error.message.includes('QQ适配器根目录未设置')) {
      showMessage('error', '请先在路径缓存中设置QQ适配器根目录')
    } else if (error instanceof Error && error.message.includes('配置文件不存在')) {
      showMessage('error', '配置文件不存在，请检查QQ适配器根目录是否正确')
    } else {
      showMessage('error', '加载配置失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  try {
    loading.value = true
    
    // 调用后端API更新QQ适配器配置
    const response = await api.post('/config/adapter/qq/update', config)
    
    if (response.data.status === 200) {
      showMessage('success', '配置保存成功')
      hasChanges.value = false
    } else {
      throw new Error(response.data.message || '保存配置失败')
    }
  } catch (error) {
    console.error('Save config error:', error)
    if (error instanceof Error && error.message.includes('QQ适配器根目录未设置')) {
      showMessage('error', '请先在路径缓存中设置QQ适配器根目录')
    } else if (error instanceof Error && error.message.includes('配置文件不存在')) {
      showMessage('error', '配置文件不存在，请检查QQ适配器根目录是否正确')
    } else if (error instanceof Error && error.message.includes('验证失败')) {
      showMessage('error', '配置数据验证失败，请检查输入的数据格式')
    } else {
      showMessage('error', '保存配置失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  } finally {
    loading.value = false
  }
}

const testConnection = async () => {
  try {
    testing.value = true
    
    // 使用配置文件信息API作为连接测试的替代方案
    const response = await api.get('/config/adapter/qq/info')
    
    if (response.data.status === 200) {
      const fileInfo = response.data.data
      if (fileInfo.exists && fileInfo.readable && fileInfo.writable) {
        showMessage('success', '连接测试成功 - 配置文件可正常访问')
      } else if (!fileInfo.exists) {
        showMessage('error', '连接测试失败 - 配置文件不存在')
      } else if (!fileInfo.readable) {
        showMessage('error', '连接测试失败 - 配置文件不可读')
      } else if (!fileInfo.writable) {
        showMessage('error', '连接测试失败 - 配置文件不可写')
      } else {
        showMessage('warning', '连接测试部分成功 - 配置文件存在但可能有权限问题')
      }
    } else {
      throw new Error(response.data.message || '连接测试失败')
    }
  } catch (error) {
    console.error('Test connection error:', error)
    if (error instanceof Error && error.message.includes('QQ适配器根目录未设置')) {
      showMessage('error', '连接测试失败 - 请先在路径缓存中设置QQ适配器根目录')
    } else {
      showMessage('error', '连接测试失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  } finally {
    testing.value = false
  }
}

// 群组管理方法
const addGroupId = () => {
  if (!isValidGroupId.value) return
  
  const id = Number(newGroupId.value.trim())
  config.chat.group_list.push(id)
  newGroupId.value = ''
  markAsChanged()
}

const removeGroupId = (index: number) => {
  config.chat.group_list.splice(index, 1)
  markAsChanged()
}

// 私聊管理方法
const addPrivateId = () => {
  if (!isValidPrivateId.value) return
  
  const id = Number(newPrivateId.value.trim())
  config.chat.private_list.push(id)
  newPrivateId.value = ''
  markAsChanged()
}

const removePrivateId = (index: number) => {
  config.chat.private_list.splice(index, 1)
  markAsChanged()
}

// 禁止用户管理方法
const addBanId = () => {
  if (!isValidBanId.value) return
  
  const id = Number(newBanId.value.trim())
  config.chat.ban_user_id.push(id)
  newBanId.value = ''
  markAsChanged()
}

const removeBanId = (index: number) => {
  config.chat.ban_user_id.splice(index, 1)
  markAsChanged()
}

// 生命周期
onMounted(() => {
  // 页面加载时自动加载配置
  loadConfig()
})
</script>
