<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Emoji 管理</h1>
        <p class="text-base-content/70 mt-1">管理机器人使用的表情包和 Emoji</p>
      </div>
      <button 
        class="btn btn-primary btn-sm" 
        @click="openAddModal"
      >
        <Icon icon="mdi:plus" class="w-4 h-4" />
        添加 Emoji
      </button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- 搜索框 -->
          <div class="flex-1">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">搜索描述</span>
              </label>
              <div class="input-group">
                <input 
                  v-model="filters.description"
                  type="text" 
                  placeholder="输入描述关键词进行搜索..." 
                  class="input input-bordered input-sm flex-1"
                />
                <button 
                  class="btn btn-sm btn-primary"
                  @click="loadEmojis"
                  :disabled="loading"
                >
                  <Icon icon="mdi:magnify" class="w-4 h-4" />
                  <span v-if="loading" class="loading loading-spinner loading-xs ml-1"></span>
                  <span v-else class="ml-1">搜索</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 格式筛选 -->
          <div class="w-full sm:w-48">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">文件格式</span>
              </label>
              <select v-model="filters.format" class="select select-bordered select-sm">
                <option value="">全部格式</option>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="gif">GIF</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="w-full sm:w-auto flex items-end">
            <button 
              class="btn btn-sm btn-outline"
              @click="resetFilters"
            >
              <Icon icon="mdi:refresh" class="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
        
        <div class="flex justify-end items-center mt-4">
          <div class="text-sm text-base-content/70">
            共 {{ pagination.total }} 条记录
          </div>
        </div>
      </div>
    </div>

    <!-- Emoji 列表 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <!-- 批量操作区域 - 固定高度避免UI跳动 -->
        <div class="h-12 mb-4 flex items-center">
          <transition name="fade" mode="out-in">
            <div v-if="selectedItems.length > 0" class="flex items-center justify-between w-full">
              <div class="flex items-center gap-3">
                <div class="badge badge-primary badge-sm">{{ selectedItems.length }}</div>
                <span class="text-sm font-medium">已选择 {{ selectedItems.length }} 个表情包</span>
                <button 
                  class="btn btn-sm btn-error"
                  @click="showBatchDeleteModal = true"
                  :disabled="submitting"
                >
                  <Icon icon="mdi:delete-multiple" class="w-4 h-4" />
                  <span v-if="submitting" class="loading loading-spinner loading-xs ml-1"></span>
                  <span v-else class="ml-1">批量删除</span>
                </button>
              </div>
              <button 
                class="btn btn-sm btn-ghost"
                @click="selectedItems = []"
              >
                <Icon icon="mdi:close" class="w-4 h-4" />
                取消选择
              </button>
            </div>
            <div v-else class="text-sm text-base-content/50">
              选择表情包后可进行批量操作
            </div>
          </transition>
        </div>

        <!-- 表格 -->
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-sm"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>预览</th>
                <th>描述</th>
                <th>格式</th>
                <th>情感</th>
                <th>查询次数</th>
                <th>使用次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="text-center">
                <td colspan="8">
                  <div class="flex justify-center items-center py-4">
                    <span class="loading loading-spinner loading-md"></span>
                    <span class="ml-2">加载中...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="emojis.length === 0" class="text-center">
                <td colspan="8" class="text-base-content/50 py-8">
                  暂无数据
                </td>
              </tr>
              <tr v-else v-for="emoji in emojis" :key="emoji.id">
                <td>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-sm"
                    :value="emoji.id"
                    v-model="selectedItems"
                  />
                </td>
                <td>
                  <div class="avatar">
                    <div class="w-12 h-12 rounded">
                      <img 
                        :src="emojiImages[emoji.id] || '/placeholder-emoji.png'" 
                        :alt="emoji.description"
                        @error="handleImageError"
                        class="object-cover"
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div class="max-w-xs truncate" :title="emoji.description">
                    {{ emoji.description || '无描述' }}
                  </div>
                </td>
                <td>
                  <div class="badge badge-outline">{{ emoji.format?.toUpperCase() }}</div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1 max-w-32">
                    <template v-if="getEmotionTags(emoji.emotion || '').length > 0">
                      <div 
                        v-for="(tag, index) in getEmotionTags(emoji.emotion || '').slice(0, 3)" 
                        :key="index"
                        class="badge badge-sm text-xs"
                        :class="getEmotionBadgeClass(index)"
                      >
                        {{ tag }}
                      </div>
                      <div 
                        v-if="getEmotionTags(emoji.emotion || '').length > 3"
                        class="badge badge-ghost badge-sm text-xs"
                        :title="getEmotionTags(emoji.emotion || '').slice(3).join(', ')"
                      >
                        +{{ getEmotionTags(emoji.emotion || '').length - 3 }}
                      </div>
                    </template>
                    <div v-else class="text-base-content/50 text-xs">无</div>
                  </div>
                </td>
                <td>{{ emoji.query_count || 0 }}</td>
                <td>{{ emoji.usage_count || 0 }}</td>
                <td>
                  <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button" class="btn btn-ghost btn-xs">
                      <Icon icon="mdi:dots-vertical" class="w-4 h-4" />
                    </div>
                    <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow">
                      <li>
                        <a @click="editEmoji(emoji)">
                          <Icon icon="mdi:pencil" class="w-4 h-4" />
                          编辑
                        </a>
                      </li>
                      <li>
                        <a @click="confirmDeleteEmoji(emoji)" class="text-error">
                          <Icon icon="mdi:delete" class="w-4 h-4" />
                          删除
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="flex justify-between items-center mt-4">
          <div class="text-sm text-base-content/70">
            显示第 {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} - {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }} 条，共 {{ pagination.total }} 条
          </div>
          <div class="join" v-if="pagination.totalPages > 1">
            <!-- 上一页按钮 -->
            <button 
              class="join-item btn btn-sm"
              :disabled="!pagination.hasPrev"
              @click="changePage(pagination.currentPage - 1)"
            >
              上一页
            </button>
            
            <!-- 页码按钮 -->
            <template v-for="page in paginationPages" :key="page">
              <button 
                v-if="typeof page === 'number'"
                class="join-item btn btn-sm"
                :class="{ 'btn-active': page === pagination.currentPage }"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
              <button 
                v-else
                class="join-item btn btn-sm btn-disabled"
                disabled
              >
                ...
              </button>
            </template>
            
            <!-- 下一页按钮 -->
            <button 
              class="join-item btn btn-sm"
              :disabled="!pagination.hasNext"
              @click="changePage(pagination.currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑 Emoji 弹窗 -->
    <dialog ref="addModal" class="modal" :class="{ 'modal-open': showAddModal }">
      <div class="modal-box max-w-2xl">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeAddModal">
            <Icon icon="mdi:close" class="w-4 h-4" />
          </button>
        </form>
        <h3 class="font-bold text-lg mb-4">
          <Icon :icon="editingEmoji ? 'mdi:pencil' : 'mdi:plus'" class="w-5 h-5 inline mr-2" />
          {{ editingEmoji ? '编辑' : '添加' }} Emoji
        </h3>
        
        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">
                <Icon icon="mdi:file-image" class="w-4 h-4 inline mr-1" />
                文件路径 <span class="text-error">*</span>
              </span>
            </label>
            <input 
              v-model="emojiForm.full_path"
              type="text" 
              placeholder="例如: emoji/happy/smile.png" 
              class="input input-bordered w-full"
              required
              @blur="calculateImageHash"
            />
            <label class="label">
              <span class="label-text-alt text-info">
                <Icon icon="mdi:information" class="w-3 h-3 inline mr-1" />
                请输入相对于麦麦主程序根目录的路径
              </span>
            </label>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">
                <Icon icon="mdi:file-document" class="w-4 h-4 inline mr-1" />
                格式 <span class="text-error">*</span>
              </span>
            </label>
            <select v-model="emojiForm.format" class="select select-bordered w-full" required>
              <option value="">请选择格式</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="gif">GIF</option>
              <option value="webp">WEBP</option>
            </select>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">
                <Icon icon="mdi:text" class="w-4 h-4 inline mr-1" />
                描述
              </span>
            </label>
            <textarea 
              v-model="emojiForm.description"
              class="textarea textarea-bordered w-full" 
              placeholder="输入 emoji 描述..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">
                <Icon icon="mdi:emoticon" class="w-4 h-4 inline mr-1" />
                情感分类
              </span>
            </label>
            <div class="space-y-2">
              <!-- 已添加的情感标签 -->
              <div v-if="emotionTags.length > 0" class="flex flex-wrap gap-2">
                <div 
                  v-for="(tag, index) in emotionTags" 
                  :key="index"
                  class="badge badge-primary gap-2"
                >
                  {{ tag }}
                  <button 
                    type="button"
                    @click="removeEmotionTag(index)"
                    class="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                  >
                    <Icon icon="mdi:close" class="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <!-- 添加新标签 -->
              <div class="flex gap-2">
                <input 
                  v-model="newEmotionTag"
                  type="text" 
                  placeholder="输入情感分类，支持中英文逗号分隔，如：开心快乐，幽默讽刺" 
                  class="input input-bordered input-sm flex-1"
                  @keyup.enter="addEmotionTag"
                />
                <button 
                  type="button"
                  class="btn btn-sm btn-primary"
                  @click="addEmotionTag"
                  :disabled="!newEmotionTag.trim()"
                >
                  <Icon icon="mdi:plus" class="w-4 h-4" />
                </button>
              </div>
              
              <!-- 常用标签快速添加 -->
              <div class="text-xs text-base-content/60">
                <span>常用标签：</span>
                <button 
                  v-for="preset in presetEmotions" 
                  :key="preset"
                  type="button"
                  @click="addPresetEmotion(preset)"
                  class="btn btn-ghost btn-xs ml-1"
                  :disabled="emotionTags.includes(preset)"
                >
                  {{ preset }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">
                <Icon icon="mdi:pound" class="w-4 h-4 inline mr-1" />
                哈希值
                <span class="text-xs text-base-content/50 ml-2">(自动计算)</span>
                <span v-if="calculatingHash" class="loading loading-spinner loading-xs ml-2"></span>
              </span>
            </label>
            <input 
              v-model="emojiForm.emoji_hash"
              type="text" 
              placeholder="将根据图片路径自动计算" 
              class="input input-bordered w-full"
              readonly
              :class="{ 'input-disabled': calculatingHash }"
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">
                <Icon icon="mdi:block-helper" class="w-4 h-4 inline mr-1" />
                状态设置
              </span>
            </label>
            <div class="flex items-center gap-3">
              <input v-model="emojiForm.is_banned" type="checkbox" class="checkbox checkbox-primary" />
              <span class="text-sm text-base-content/60">勾选表示禁用该emoji</span>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeAddModal">
            <Icon icon="mdi:close" class="w-4 h-4" />
            取消
          </button>
          <button type="button" class="btn btn-primary" @click="saveEmoji" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            <Icon v-else :icon="editingEmoji ? 'mdi:content-save' : 'mdi:plus'" class="w-4 h-4" />
            {{ editingEmoji ? '更新' : '添加' }}
          </button>
        </div>
      </div>
    </dialog>

    <!-- 删除确认弹窗 -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">
          <Icon icon="mdi:delete-alert" class="w-5 h-5 inline mr-2" />
          确认删除
        </h3>
        <p class="py-4">
          确定要删除 "{{ deletingEmoji?.description || deletingEmoji?.full_path }}" 吗？
          <br>
          <span class="text-warning text-sm">此操作不可撤销！</span>
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showDeleteModal = false">
            <Icon icon="mdi:close" class="w-4 h-4" />
            取消
          </button>
          <button class="btn btn-error" @click="executeDelete" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            <Icon v-else icon="mdi:delete" class="w-4 h-4" />
            确认删除
          </button>
        </div>
      </div>
    </dialog>

    <!-- 批量删除确认弹窗 -->
    <dialog class="modal" :class="{ 'modal-open': showBatchDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">
          <Icon icon="mdi:delete-alert" class="w-5 h-5 inline mr-2" />
          确认批量删除
        </h3>
        <p class="py-4">
          确定要批量删除 <span class="badge badge-error">{{ selectedItems.length }}</span> 个emoji吗？
          <br>
          <span class="text-warning text-sm font-medium">此操作不可撤销！</span>
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showBatchDeleteModal = false">
            <Icon icon="mdi:close" class="w-4 h-4" />
            取消
          </button>
          <button class="btn btn-error" @click="executeBatchDelete" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            <Icon v-else icon="mdi:delete-multiple" class="w-4 h-4" />
            确认批量删除
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/utils/api'

// Emoji 类型定义（内联）
interface EmojiItem {
  id: number
  full_path: string
  format: string
  emoji_hash: string
  description?: string
  query_count?: number
  is_registered?: number
  is_banned?: number
  emotion?: string
  record_time?: number
  register_time?: number
  usage_count?: number
  last_used_time?: number
}

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const calculatingHash = ref(false) // 哈希计算状态
const emojis = ref<EmojiItem[]>([])
const selectedItems = ref<number[]>([])
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const showBatchDeleteModal = ref(false)
const editingEmoji = ref<EmojiItem | null>(null)
const deletingEmoji = ref<EmojiItem | null>(null)
const emojiImages = ref<Record<number, string>>({}) // 存储emoji图片的base64数据

// 情感标签相关
const emotionTags = ref<string[]>([])
const newEmotionTag = ref('')
const presetEmotions = ['开心快乐', '悲伤难过', '愤怒生气', '惊讶震惊', '困惑焦虑', '喜爱心动', '幽默讽刺', '恐惧害怕']

// 筛选条件
const filters = reactive({
  description: '',
  format: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
})

// 表单数据
const emojiForm = reactive({
  full_path: '',
  format: '',
  emoji_hash: '',
  description: '',
  emotion: '',
  query_count: 0,
  is_banned: false,
  usage_count: 0
})

// 计算属性
const isAllSelected = computed(() => {
  return emojis.value.length > 0 && selectedItems.value.length === emojis.value.length
})

// 智能分页计算属性
const paginationPages = computed(() => {
  const current = pagination.currentPage
  const total = pagination.totalPages
  const pages = []
  
  if (total <= 7) {
    // 总页数较少时，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总页数较多时，使用智能分页
    pages.push(1) // 始终显示第一页
    
    if (current <= 4) {
      // 当前页靠前 - 显示更多前面的页码
      for (let i = 2; i <= Math.min(5, total - 1); i++) {
        pages.push(i)
      }
      if (total > 6) {
        pages.push('...')
        pages.push(total)
      } else if (total > 5) {
        pages.push(total)
      }
    } else if (current >= total - 3) {
      // 当前页靠后
      if (total > 2) {
        pages.push('...')
        for (let i = Math.max(total - 4, 2); i <= total; i++) {
          pages.push(i)
        }
      }
    } else {
      // 当前页在中间
      if (current > 3) {
        pages.push('...')
      }
      for (let i = Math.max(current - 1, 2); i <= Math.min(current + 1, total - 1); i++) {
        pages.push(i)
      }
      if (current < total - 2) {
        pages.push('...')
      }
      pages.push(total)
    }
  }
  
  return pages
})

// 初始化
onMounted(() => {
  loadEmojis()
})

// 方法
async function loadEmojis() {
  try {
    loading.value = true
    
    const params: any = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      orderBy: 'id',
      orderDir: 'DESC'
    }
    
    // 添加筛选条件
    if (filters.description) params.description = filters.description
    if (filters.format) params.format = filters.format
    
    const response = await api.get('/database/emoji/get', { params })
    
    if (response.data.status === 200) {
      emojis.value = response.data.data.items || []
      Object.assign(pagination, response.data.data)
      
      // 加载所有emoji的预览图片
      emojis.value.forEach(emoji => {
        if (emoji.id && !emojiImages.value[emoji.id]) {
          loadEmojiImage(emoji.id)
        }
      })
    }
  } catch (error) {
    console.error('加载 emoji 失败:', error)
    // TODO: 显示错误提示
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, {
    description: '',
    format: ''
  })
  pagination.currentPage = 1
  loadEmojis()
}

function changePage(page: number) {
  pagination.currentPage = page
  loadEmojis()
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = emojis.value.map((item: EmojiItem) => item.id)
  }
}

function openAddModal() {
  editingEmoji.value = null
  resetForm()
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
  editingEmoji.value = null
  resetForm()
}

function resetForm() {
  Object.assign(emojiForm, {
    full_path: '',
    format: '',
    emoji_hash: '',
    description: '',
    emotion: '',
    query_count: 0,
    is_registered: false,
    is_banned: false,
    usage_count: 0
  })
  emotionTags.value = []
  newEmotionTag.value = ''
}

function editEmoji(emoji: EmojiItem) {
  editingEmoji.value = emoji
  Object.assign(emojiForm, {
    full_path: emoji.full_path || '',
    format: emoji.format || '',
    emoji_hash: emoji.emoji_hash || '',
    description: emoji.description || '',
    emotion: emoji.emotion || '',
    query_count: emoji.query_count || 0,
    is_registered: !!emoji.is_registered,
    is_banned: !!emoji.is_banned,
    usage_count: emoji.usage_count || 0
  })
  
  // 解析情感标签
  if (emoji.emotion) {
    // 支持中文逗号（，）、英文逗号（,）以及中英文混合的情况
    emotionTags.value = emoji.emotion.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag)
  } else {
    emotionTags.value = []
  }
  
  showAddModal.value = true
}

// 情感标签相关方法
function addEmotionTag() {
  if (newEmotionTag.value.trim()) {
    // 支持中英文逗号分隔，统一转换为英文逗号存储
    const tags = newEmotionTag.value.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag);
    tags.forEach(tag => {
      if (!emotionTags.value.includes(tag)) {
        emotionTags.value.push(tag);
      }
    });
    newEmotionTag.value = '';
  }
}

function removeEmotionTag(index: number) {
  emotionTags.value.splice(index, 1)
}

function addPresetEmotion(emotion: string) {
  if (!emotionTags.value.includes(emotion)) {
    emotionTags.value.push(emotion)
  }
}

// 计算图片哈希值
async function calculateImageHash() {
  if (!emojiForm.full_path.trim()) {
    emojiForm.emoji_hash = ''
    return
  }
  
  try {
    calculatingHash.value = true
    
    const response = await api.post('/database/emoji/calculateHash', {
      imagePath: emojiForm.full_path
    })
    
    if (response.data.status === 200) {
      emojiForm.emoji_hash = response.data.data.imageHash
      console.log('成功计算哈希值:', response.data.data.imageHash)
    } else {
      console.error('计算哈希值失败:', response.data.message)
      emojiForm.emoji_hash = ''
    }
    
  } catch (error: any) {
    console.error('计算图片哈希值失败:', error)
    // 如果是文件不存在等错误，清空哈希值但不显示错误
    emojiForm.emoji_hash = ''
  } finally {
    calculatingHash.value = false
  }
}

async function saveEmoji() {
  try {
    submitting.value = true
    
    const data = {
      ...emojiForm,
      emotion: emotionTags.value.join(','), // 将标签用英文逗号拼接
      is_banned: emojiForm.is_banned ? 1 : 0
    }
    
    if (editingEmoji.value) {
      // 更新
      await api.post('/database/emoji/update', {
        id: editingEmoji.value.id,
        ...data
      })
    } else {
      // 新增
      await api.post('/database/emoji/insert', data)
    }
    
    closeAddModal()
    loadEmojis()
    // TODO: 显示成功提示
  } catch (error) {
    console.error('保存 emoji 失败:', error)
    // TODO: 显示错误提示
  } finally {
    submitting.value = false
  }
}

function confirmDeleteEmoji(emoji: EmojiItem) {
  deletingEmoji.value = emoji
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deletingEmoji.value) return
  
  try {
    submitting.value = true
    await api.delete(`/database/emoji/delete/${deletingEmoji.value.id}`)
    showDeleteModal.value = false
    deletingEmoji.value = null
    loadEmojis()
    // TODO: 显示成功提示
  } catch (error) {
    console.error('删除 emoji 失败:', error)
    // TODO: 显示错误提示
  } finally {
    submitting.value = false
  }
}

async function executeBatchDelete() {
  if (selectedItems.value.length === 0) return
  
  try {
    submitting.value = true
    // 并行删除所有选中的items
    await Promise.all(
      selectedItems.value.map(id => 
        api.delete(`/database/emoji/delete/${id}`)
      )
    )
    selectedItems.value = []
    showBatchDeleteModal.value = false
    loadEmojis()
    // TODO: 显示成功提示
  } catch (error) {
    console.error('批量删除失败:', error)
    // TODO: 显示错误提示
  } finally {
    submitting.value = false
  }
}

// 获取emoji图片
async function loadEmojiImage(emojiId: number): Promise<string> {
  // 如果已经缓存了，直接返回
  if (emojiImages.value[emojiId]) {
    return emojiImages.value[emojiId]
  }

  try {
    const response = await api.get('/database/emoji/getSingleEmojiImage', {
      params: { id: emojiId }
    })
    
    if (response.data.status === 200 && response.data.data.imageb64) {
      const base64Image = `data:image/png;base64,${response.data.data.imageb64}`
      emojiImages.value[emojiId] = base64Image
      return base64Image
    }
  } catch (error) {
    console.error('获取emoji图片失败:', error)
  }
  
  return '/placeholder-emoji.png'
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-emoji.png' // 设置默认占位图
}


function getEmotionTags(emotion: string): string[] {
  if (!emotion) return []
  // 支持中文逗号（，）、英文逗号（,）以及中英文混合的情况
  return emotion.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag)
}

function getEmotionBadgeClass(index: number): string {
  const classes = [
    'badge-primary',
    'badge-secondary', 
    'badge-accent',
    'badge-info',
    'badge-success',
    'badge-warning'
  ]
  return classes[index % classes.length]
}
</script>

<style scoped>
/* 批量操作过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 输入组样式优化 */
.input-group {
  display: flex;
  width: 100%;
}

.input-group .input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.input-group .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* 情感标签样式 */
.badge {
  background: oklch(var(--p) / var(--tw-bg-opacity));
  color: oklch(var(--pc) / var(--tw-text-opacity));
}

/* 情感标签删除按钮 */
.badge .btn-ghost:hover {
  background: oklch(var(--pc) / 0.1);
}

/* 表格情感标签容器 */
.max-w-32 {
  max-width: 8rem;
}
</style>
