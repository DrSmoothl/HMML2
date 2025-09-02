<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">麦麦聊天流监控</h1>
        <p class="text-base-content/70 mt-1">监控和管理麦麦的聊天流数据</p>
      </div>
      <div class="flex gap-2">
        <button 
          class="btn btn-outline btn-sm" 
          @click="loadStats"
          :disabled="loading"
        >
          <Icon icon="mdi:refresh" class="w-4 h-4" />
          <span v-if="loading" class="loading loading-spinner loading-xs ml-1"></span>
          <span v-else class="ml-1">刷新统计</span>
        </button>
        <button 
          class="btn btn-primary btn-sm" 
          @click="openAddModal"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
          添加聊天流
        </button>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-primary">
          <Icon icon="mdi:forum" class="w-8 h-8" />
        </div>
        <div class="stat-title">总聊天流</div>
        <div class="stat-value text-primary">{{ stats.totalCount }}</div>
        <div class="stat-desc">所有记录数量</div>
      </div>
      
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-success">
          <Icon icon="mdi:clock-check" class="w-8 h-8" />
        </div>
        <div class="stat-title">24小时活跃</div>
        <div class="stat-value text-success">{{ stats.recentActiveCount }}</div>
        <div class="stat-desc">最近活跃的聊天流</div>
      </div>
      
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-info">
          <Icon icon="mdi:apps" class="w-8 h-8" />
        </div>
        <div class="stat-title">平台数量</div>
        <div class="stat-value text-info">{{ stats.platformStats.length }}</div>
        <div class="stat-desc">支持的平台类型</div>
      </div>
      
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-warning">
          <Icon icon="mdi:account-group" class="w-8 h-8" />
        </div>
        <div class="stat-title">群组平台</div>
        <div class="stat-value text-warning">{{ stats.groupPlatformStats.length }}</div>
        <div class="stat-desc">群组平台类型</div>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <!-- 标签行 -->
        <div class="grid gap-4 mb-2" style="grid-template-columns: 2fr 2fr 1fr;">
          <div>
            <span class="label-text font-medium">群组名称</span>
          </div>
          <div>
            <span class="label-text font-medium">用户昵称</span>
          </div>
          <div>
            <span class="label-text font-medium">操作</span>
          </div>
        </div>
        
        <!-- 输入框行 -->
        <div class="grid gap-4" style="grid-template-columns: 2fr 2fr 1fr;">
          <!-- 群组名称搜索框 -->
          <div class="join">
            <input 
              v-model="filters.group_name"
              type="text" 
              placeholder="搜索群组名称..." 
              class="input input-bordered input-sm join-item flex-1"
              @keyup.enter="loadChatStreams"
            />
            <button 
              class="btn btn-sm btn-primary join-item"
              @click="loadChatStreams"
              :disabled="loading"
            >
              <Icon icon="mdi:magnify" class="w-4 h-4" />
            </button>
          </div>

          <!-- 用户昵称搜索框 -->
          <input 
            v-model="filters.user_nickname"
            type="text" 
            placeholder="搜索用户昵称..." 
            class="input input-bordered input-sm"
            @keyup.enter="loadChatStreams"
          />

          <!-- 重置筛选按钮 -->
          <button 
            class="btn btn-sm btn-outline whitespace-nowrap"
            @click="resetFilters"
          >
            <Icon icon="mdi:refresh" class="w-4 h-4" />
            重置筛选
          </button>
        </div>
        
        <div class="flex justify-end items-center mt-4">
          <div class="text-sm text-base-content/70">
            共 {{ pagination.total }} 条记录
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天流列表 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <!-- 批量操作区域 -->
        <div class="h-12 mb-4 flex items-center">
          <transition name="fade" mode="out-in">
            <div v-if="selectedItems.length > 0" class="flex items-center justify-between w-full">
              <div class="flex items-center gap-3">
                <div class="badge badge-primary badge-sm">{{ selectedItems.length }}</div>
                <span class="text-sm font-medium">已选择 {{ selectedItems.length }} 个聊天流</span>
                <button 
                  class="btn btn-sm btn-error"
                  @click="showBatchDeleteModal = true"
                  :disabled="submitting"
                >
                  <Icon icon="mdi:delete-multiple" class="w-4 h-4" />
                  批量删除
                </button>
              </div>
              <button 
                class="btn btn-sm btn-ghost"
                @click="clearSelection"
              >
                取消选择
              </button>
            </div>
            <div v-else class="flex items-center justify-between w-full">
              <span class="text-sm text-base-content/50">选择聊天流进行批量操作</span>
            </div>
          </transition>
        </div>

        <!-- 聊天流表格 -->
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
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
                <th>聊天流ID</th>
                <th>群组信息</th>
                <th>用户信息</th>
                <th>创建时间</th>
                <th>最后活跃</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading && chatStreams.length === 0">
                <td colspan="7" class="text-center py-12">
                  <div class="flex flex-col items-center gap-3">
                    <span class="loading loading-spinner loading-lg"></span>
                    <span class="text-base-content/60">正在加载聊天流数据...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="chatStreams.length === 0">
                <td colspan="7" class="text-center py-12">
                  <div class="flex flex-col items-center gap-3 text-base-content/60">
                    <Icon icon="mdi:forum-outline" class="w-16 h-16" />
                    <span>暂无聊天流数据</span>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="stream in chatStreams" :key="stream.id">
                <td>
                  <input 
                    type="checkbox" 
                    class="checkbox checkbox-sm"
                    :checked="selectedItems.includes(stream.id)"
                    @change="toggleItemSelection(stream.id)"
                  />
                </td>
                <td>
                  <div class="font-mono text-xs">
                    {{ stream.stream_id.substring(0, 8) }}...
                  </div>
                </td>
                <td>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ stream.group_name }}</span>
                    <span class="text-xs text-base-content/60">
                      {{ stream.group_platform }}:{{ stream.group_id }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ stream.user_nickname }}</span>
                    <span class="text-xs text-base-content/60" v-if="stream.user_cardname !== stream.user_nickname">
                      群昵称: {{ stream.user_cardname }}
                    </span>
                    <span class="text-xs text-base-content/60">
                      {{ stream.user_platform }}:{{ stream.user_id }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="text-sm">
                    {{ formatDateTime(stream.create_time) }}
                  </div>
                </td>
                <td>
                  <div class="text-sm" :class="getActiveTimeClass(stream.last_active_time)">
                    {{ formatDateTime(stream.last_active_time) }}
                  </div>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button 
                      class="btn btn-ghost btn-xs"
                      @click="editChatStream(stream)"
                      title="编辑"
                    >
                      <Icon icon="mdi:pencil" class="w-3 h-3" />
                    </button>
                    <button 
                      class="btn btn-error btn-xs"
                      @click="deleteSingleChatStream(stream)"
                      title="删除"
                    >
                      <Icon icon="mdi:delete" class="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页控件 -->
        <div class="flex justify-center mt-6" v-if="pagination.totalPages > 1">
          <div class="join">
            <button 
              class="join-item btn btn-sm"
              :disabled="!pagination.hasPrev"
              @click="goToPage(pagination.currentPage - 1)"
            >
              <Icon icon="mdi:chevron-left" class="w-4 h-4" />
            </button>
            
            <button 
              v-for="page in visiblePages" 
              :key="page"
              class="join-item btn btn-sm"
              :class="{ 'btn-active': page === pagination.currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            
            <button 
              class="join-item btn btn-sm"
              :disabled="!pagination.hasNext"
              @click="goToPage(pagination.currentPage + 1)"
            >
              <Icon icon="mdi:chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑聊天流模态框 -->
    <dialog ref="addModalRef" class="modal" :class="{ 'modal-open': showAddModal }">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          <Icon icon="mdi:forum" class="w-5 h-5 inline mr-2" />
          {{ editingStream ? '编辑聊天流' : '添加聊天流' }}
        </h3>
        
        <form @submit.prevent="saveChatStream">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 聊天流ID -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">
                  <Icon icon="mdi:identifier" class="w-4 h-4 inline mr-1" />
                  聊天流ID
                </span>
              </label>
              <input 
                v-model="streamForm.stream_id"
                type="text" 
                placeholder="聊天流唯一标识" 
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- 群组ID -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">
                  <Icon icon="mdi:pound" class="w-4 h-4 inline mr-1" />
                  群组ID
                </span>
              </label>
              <input 
                v-model="streamForm.group_id"
                type="text" 
                placeholder="群组唯一ID" 
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- 群组名称 -->
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text font-medium">
                  <Icon icon="mdi:forum" class="w-4 h-4 inline mr-1" />
                  群组名称
                </span>
              </label>
              <input 
                v-model="streamForm.group_name"
                type="text" 
                placeholder="群组显示名称" 
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- 用户ID -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">
                  <Icon icon="mdi:account-box" class="w-4 h-4 inline mr-1" />
                  用户ID
                </span>
              </label>
              <input 
                v-model="streamForm.user_id"
                type="text" 
                placeholder="用户唯一ID" 
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- 用户昵称 -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">
                  <Icon icon="mdi:account-circle" class="w-4 h-4 inline mr-1" />
                  用户昵称
                </span>
              </label>
              <input 
                v-model="streamForm.user_nickname"
                type="text" 
                placeholder="用户昵称" 
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- 用户群昵称 -->
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text font-medium">
                  <Icon icon="mdi:card-account-details" class="w-4 h-4 inline mr-1" />
                  用户群昵称
                </span>
              </label>
              <input 
                v-model="streamForm.user_cardname"
                type="text" 
                placeholder="用户在群内的昵称" 
                class="input input-bordered w-full"
                required
              />
            </div>
          </div>
          
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="closeAddModal">
              取消
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="submitting"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs mr-2"></span>
              <Icon v-else icon="mdi:content-save" class="w-4 h-4 mr-2" />
              {{ editingStream ? '更新' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- 删除确认模态框 -->
    <dialog ref="deleteModalRef" class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error mb-4">
          <Icon icon="mdi:alert" class="w-5 h-5 inline mr-2" />
          确认删除
        </h3>
        <p class="mb-4">
          确定要删除聊天流 "{{ deletingStream?.group_name }}" 吗？此操作不可撤销。
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showDeleteModal = false">
            取消
          </button>
          <button 
            class="btn btn-error"
            @click="confirmDelete"
            :disabled="submitting"
          >
            <span v-if="submitting" class="loading loading-spinner loading-xs mr-2"></span>
            <Icon v-else icon="mdi:delete" class="w-4 h-4 mr-2" />
            删除
          </button>
        </div>
      </div>
    </dialog>

    <!-- 批量删除确认模态框 -->
    <dialog ref="batchDeleteModalRef" class="modal" :class="{ 'modal-open': showBatchDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error mb-4">
          <Icon icon="mdi:alert-multiple" class="w-5 h-5 inline mr-2" />
          批量删除确认
        </h3>
        <p class="mb-4">
          确定要删除选中的 <span class="font-bold text-error">{{ selectedItems.length }}</span> 个聊天流吗？此操作不可撤销。
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showBatchDeleteModal = false">
            取消
          </button>
          <button 
            class="btn btn-error"
            @click="confirmBatchDelete"
            :disabled="submitting"
          >
            <span v-if="submitting" class="loading loading-spinner loading-xs mr-2"></span>
            <Icon v-else icon="mdi:delete-multiple" class="w-4 h-4 mr-2" />
            批量删除
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { 
  getChatStreams, 
  getChatStreamStats, 
  createChatStream, 
  updateChatStream, 
  deleteChatStream 
} from '@/utils/chatStream'
import type { ChatStream, ChatStreamStats, ChatStreamFilters, ChatStreamFormData } from '@/types/chatStream'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const chatStreams = ref<ChatStream[]>([])
const selectedItems = ref<number[]>([])
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const showBatchDeleteModal = ref(false)
const editingStream = ref<ChatStream | null>(null)
const deletingStream = ref<ChatStream | null>(null)

// 统计信息
const stats = ref<ChatStreamStats>({
  totalCount: 0,
  recentActiveCount: 0,
  platformStats: [],
  groupPlatformStats: []
})

// 筛选条件
const filters = reactive<ChatStreamFilters>({
  group_name: '',
  user_nickname: ''
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
const streamForm = reactive<ChatStreamFormData>({
  stream_id: '',
  create_time: Date.now(),
  group_platform: '',
  group_id: '',
  group_name: '',
  last_active_time: Date.now(),
  platform: '',
  user_platform: '',
  user_id: '',
  user_nickname: '',
  user_cardname: ''
})

// 计算属性
const isAllSelected = computed(() => 
  chatStreams.value.length > 0 && selectedItems.value.length === chatStreams.value.length
)

const visiblePages = computed(() => {
  const current = pagination.currentPage
  const total = pagination.totalPages
  const pages = []
  
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// 组件挂载时加载数据
onMounted(() => {
  loadChatStreams()
  loadStats()
})

// 方法
async function loadChatStreams() {
  try {
    loading.value = true
    
    const params: any = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      orderBy: 'last_active_time',
      orderDir: 'DESC'
    }
    
    // 添加筛选条件
    if (filters.group_name) params.group_name = filters.group_name
    if (filters.user_nickname) params.user_nickname = filters.user_nickname
    
    const response = await getChatStreams(params)
    
    chatStreams.value = response.items
    pagination.total = response.total
    pagination.totalPages = response.totalPages
    pagination.currentPage = response.currentPage
    pagination.pageSize = response.pageSize
    pagination.hasNext = response.hasNext
    pagination.hasPrev = response.hasPrev
    
  } catch (error) {
    console.error('加载聊天流数据失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    stats.value = await getChatStreamStats()
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

function resetFilters() {
  filters.group_name = ''
  filters.user_nickname = ''
  pagination.currentPage = 1
  loadChatStreams()
}

function goToPage(page: number) {
  pagination.currentPage = page
  loadChatStreams()
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = chatStreams.value.map(stream => stream.id)
  }
}

function toggleItemSelection(id: number) {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

function clearSelection() {
  selectedItems.value = []
}

function openAddModal() {
  editingStream.value = null
  resetForm()
  showAddModal.value = true
}

function editChatStream(stream: ChatStream) {
  editingStream.value = stream
  Object.assign(streamForm, stream)
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
  editingStream.value = null
  resetForm()
}

function resetForm() {
  streamForm.stream_id = ''
  streamForm.create_time = Date.now()
  streamForm.group_platform = 'qq'
  streamForm.group_id = ''
  streamForm.group_name = ''
  streamForm.last_active_time = Date.now()
  streamForm.platform = 'qq'
  streamForm.user_platform = 'qq'
  streamForm.user_id = ''
  streamForm.user_nickname = ''
  streamForm.user_cardname = ''
}

async function saveChatStream() {
  try {
    submitting.value = true
    
    const data = {
      ...streamForm,
      create_time: streamForm.create_time || Date.now(),
      last_active_time: streamForm.last_active_time || Date.now(),
      // 固定设置为QQ平台
      platform: 'qq',
      group_platform: 'qq',
      user_platform: 'qq'
    }
    
    if (editingStream.value) {
      // 更新
      await updateChatStream({
        id: editingStream.value.id,
        ...data
      })
    } else {
      // 新增
      await createChatStream(data)
    }
    
    closeAddModal()
    await loadChatStreams()
    await loadStats()
    
  } catch (error) {
    console.error('保存聊天流失败:', error)
  } finally {
    submitting.value = false
  }
}

function deleteSingleChatStream(stream: ChatStream) {
  deletingStream.value = stream
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingStream.value) return
  
  try {
    submitting.value = true
    await deleteChatStream(deletingStream.value.id)
    showDeleteModal.value = false
    deletingStream.value = null
    await loadChatStreams()
    await loadStats()
  } catch (error) {
    console.error('删除聊天流失败:', error)
  } finally {
    submitting.value = false
  }
}

async function confirmBatchDelete() {
  try {
    submitting.value = true
    
    // 并行删除选中的聊天流
    await Promise.all(selectedItems.value.map(id => deleteChatStream(id)))
    
    showBatchDeleteModal.value = false
    selectedItems.value = []
    await loadChatStreams()
    await loadStats()
    
  } catch (error) {
    console.error('批量删除聊天流失败:', error)
  } finally {
    submitting.value = false
  }
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getActiveTimeClass(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour
  
  if (diff < oneHour) {
    return 'text-success'
  } else if (diff < oneDay) {
    return 'text-warning'
  } else {
    return 'text-error'
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
