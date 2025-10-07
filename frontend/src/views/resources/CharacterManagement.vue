<template>
  <div class="space-y-6">
    <!-- 头部操作区 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">人物信息管理</h1>
        <p class="text-base-content/70 mt-1">管理机器人认识的人物信息和关系</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openAddModal">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        添加人物
      </button>
    </div>

    <!-- 搜索和过滤器 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-4">
        <div class="flex flex-wrap gap-4">
          <!-- 搜索框 -->
          <div class="form-control flex-1 min-w-64">
            <div class="input-group">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索人物姓名、昵称..."
                class="input input-bordered flex-1"
                @keyup.enter="handleSearch"
              />
              <button class="btn btn-square btn-primary" @click="handleSearch">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- 平台筛选 -->
          <div class="form-control">
            <select v-model="filters.platform" class="select select-bordered" @change="loadPersonInfos">
              <option value="">所有平台</option>
              <option v-for="platform in platforms" :key="platform" :value="platform">
                {{ getPlatformName(platform) }}
              </option>
            </select>
          </div>

          <!-- 清除筛选 -->
          <button class="btn btn-ghost btn-sm" @click="clearFilters">
            清除筛选
          </button>
        </div>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" v-if="stats">
      <div class="stat bg-base-100 shadow rounded-box">
        <div class="stat-figure text-primary">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div class="stat-title">总人物数</div>
        <div class="stat-value text-primary">{{ stats.total }}</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-box">
        <div class="stat-figure text-secondary">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div class="stat-title">平均认知次数</div>
        <div class="stat-value text-secondary">{{ stats.avgKnowTimes.toFixed(1) }}</div>
      </div>

      <div class="stat bg-base-100 shadow rounded-box">
        <div class="stat-figure text-accent">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-title">最近活跃</div>
        <div class="stat-value text-accent">{{ stats.recentActive }}</div>
        <div class="stat-desc">7天内有互动</div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && personInfos.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-base-content/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 class="text-lg font-semibold text-base-content/70 mb-2">暂无人物信息</h3>
          <p class="text-base-content/50 mb-4">
            {{ searchKeyword ? '未找到匹配的人物信息' : '开始添加第一个人物信息' }}
          </p>
          <button v-if="!searchKeyword" class="btn btn-primary" @click="openAddModal">
            添加人物
          </button>
        </div>

        <!-- 数据表格 -->
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th class="cursor-pointer hover:bg-base-200" @click="handleSort('person_name')">
                  <div class="flex items-center gap-1">
                    姓名
                    <svg v-if="sortBy === 'person_name'" class="w-4 h-4" :class="sortDir === 'ASC' ? '' : 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </div>
                </th>
                <th>平台</th>
                <th class="cursor-pointer hover:bg-base-200" @click="handleSort('know_times')">
                  <div class="flex items-center gap-1">
                    认知次数
                    <svg v-if="sortBy === 'know_times'" class="w-4 h-4" :class="sortDir === 'ASC' ? '' : 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </div>
                </th>
                <th class="cursor-pointer hover:bg-base-200" @click="handleSort('last_know')">
                  <div class="flex items-center gap-1">
                    最后互动
                    <svg v-if="sortBy === 'last_know'" class="w-4 h-4" :class="sortDir === 'ASC' ? '' : 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </div>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="person in personInfos" :key="person.id" class="hover">
                <td>
                  <div>
                    <div class="font-bold">{{ person.person_name }}</div>
                    <div class="text-sm opacity-50" v-if="person.nickname">
                      {{ person.nickname }}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="badge badge-outline badge-sm">
                    {{ getPlatformName(person.platform) }}
                  </div>
                </td>
                <td>
                  <div class="badge badge-ghost badge-sm">
                    {{ person.know_times }} 次
                  </div>
                </td>
                <td>
                  <div class="text-sm">
                    {{ formatTimestamp(person.last_know) }}
                  </div>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" @click="openViewModal(person)" title="查看详情">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button class="btn btn-ghost btn-xs" @click="openEditModal(person)" title="编辑">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button class="btn btn-ghost btn-xs text-error hover:bg-error/20" @click="openDeleteModal(person)" title="删除">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center border-t p-4">
          <div class="join">
            <!-- 上一页按钮 -->
            <button 
              class="join-item btn btn-sm" 
              :class="{ 'btn-disabled': !pagination.hasPrev }"
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
              :class="{ 'btn-disabled': !pagination.hasNext }"
              @click="changePage(pagination.currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑人物模态框 -->
    <div class="modal" :class="{ 'modal-open': showEditModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingPerson ? '编辑人物信息' : '添加人物信息' }}
        </h3>
        
        <form @submit.prevent="savePersonInfo" class="space-y-6">
          <!-- 基础信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <div class="block">
                <span class="text-sm font-medium text-base-content">人物ID <span class="text-error">*</span></span>
              </div>
              <input
                v-model="formData.person_id"
                type="text"
                placeholder="唯一标识符"
                class="input input-bordered w-full"
                :disabled="!!editingPerson"
                required
              />
              <div class="text-xs text-base-content/60" v-if="!editingPerson">
                人物的唯一标识符，创建后不可修改
              </div>
            </div>

            <div class="space-y-2">
              <div class="block">
                <span class="text-sm font-medium text-base-content">姓名 <span class="text-error">*</span></span>
              </div>
              <input
                v-model="formData.person_name"
                type="text"
                placeholder="人物姓名"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div class="space-y-2">
              <div class="block">
                <span class="text-sm font-medium text-base-content">平台 <span class="text-error">*</span></span>
              </div>
              <select v-model="formData.platform" class="select select-bordered w-full" :disabled="!!editingPerson" required>
                <option value="">请选择平台</option>
                <option v-for="platform in platforms" :key="platform" :value="platform">
                  {{ getPlatformName(platform) }}
                </option>
              </select>
              <div class="text-xs text-base-content/60" v-if="editingPerson">
                平台信息创建后不可修改
              </div>
            </div>

            <div class="space-y-2">
              <div class="block">
                <span class="text-sm font-medium text-base-content">用户ID <span class="text-error">*</span></span>
              </div>
              <input
                v-model="formData.user_id"
                type="text"
                placeholder="平台用户ID"
                class="input input-bordered w-full"
                :disabled="!!editingPerson"
                required
              />
              <div class="text-xs text-base-content/60" v-if="editingPerson">
                用户ID创建后不可修改
              </div>
            </div>

            <div class="space-y-2">
              <div class="block">
                <span class="text-sm font-medium text-base-content">昵称</span>
              </div>
              <input
                v-model="formData.nickname"
                type="text"
                placeholder="昵称或备注名"
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- 记忆点信息 -->
          <div class="space-y-2">
            <div class="block">
              <span class="text-sm font-medium text-base-content">记忆点 (JSON格式)</span>
            </div>
            <textarea
              v-model="formData.memory_points"
              class="textarea textarea-bordered h-32 resize-none w-full font-mono text-sm"
              placeholder='例如: ["喜欢打游戏","性格开朗","经常加班"]'
            ></textarea>
            <div class="text-xs text-base-content/60">
              请输入JSON数组格式的记忆点列表
            </div>
          </div>

          <div class="space-y-2">
            <div class="block">
              <span class="text-sm font-medium text-base-content">取名原因</span>
            </div>
            <textarea
              v-model="formData.name_reason"
              class="textarea textarea-bordered resize-none w-full"
              placeholder="为什么这样称呼这个人..."
            ></textarea>
          </div>
        </form>
        
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeEditModal">取消</button>
          <button 
            type="submit" 
            class="btn btn-primary"
            @click="savePersonInfo"
            :disabled="saving"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{ editingPerson ? '保存' : '添加' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeEditModal"></form>
    </div>

    <!-- 查看详情模态框 -->
    <div class="modal" :class="{ 'modal-open': showViewModal }">
      <div class="modal-box max-w-2xl max-h-[80vh]">
        <h3 class="font-bold text-lg mb-4" v-if="viewingPerson">
          {{ viewingPerson.person_name }} 的详细信息
        </h3>
        
        <div class="space-y-4 max-h-96 overflow-y-auto" v-if="viewingPerson">
          <!-- 基础信息卡片 -->
          <div class="card bg-base-200/50">
            <div class="card-body p-4">
              <h4 class="card-title text-base mb-3">基础信息</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div class="space-y-1">
                  <span class="font-medium text-base-content/70">人物ID</span>
                  <div class="font-mono text-xs bg-base-100 px-2 py-1 rounded">{{ viewingPerson.person_id }}</div>
                </div>
                <div class="space-y-1">
                  <span class="font-medium text-base-content/70">平台</span>
                  <div>
                    <div class="badge badge-outline badge-sm">{{ getPlatformName(viewingPerson.platform) }}</div>
                  </div>
                </div>
                <div class="space-y-1">
                  <span class="font-medium text-base-content/70">用户ID</span>
                  <div class="font-mono text-xs bg-base-100 px-2 py-1 rounded">{{ viewingPerson.user_id }}</div>
                </div>
                <div class="space-y-1">
                  <span class="font-medium text-base-content/70">昵称</span>
                  <div>{{ viewingPerson.nickname || '未设置' }}</div>
                </div>
                <div class="space-y-1">
                  <span class="font-medium text-base-content/70">认知次数</span>
                  <div>
                    <div class="badge badge-ghost badge-sm">{{ viewingPerson.know_times }} 次</div>
                  </div>
                </div>
                <div class="space-y-1">
                  <span class="font-medium text-base-content/70">认识时间</span>
                  <div class="text-xs">{{ formatTimestamp(viewingPerson.know_since) }}</div>
                </div>
                <div class="space-y-1">
                  <span class="font-medium text-base-content/70">最后互动</span>
                  <div class="text-xs">{{ formatTimestamp(viewingPerson.last_know) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 记忆点信息 -->
          <div class="card bg-base-200/50" v-if="viewingPerson.memory_points">
            <div class="card-body p-4">
              <h4 class="card-title text-base mb-3">记忆点</h4>
              <div class="text-sm">
                <div class="bg-base-100 px-3 py-2 rounded text-base-content leading-relaxed font-mono">
                  {{ viewingPerson.memory_points }}
                </div>
              </div>
            </div>
          </div>

          <!-- 取名原因 -->
          <div class="card bg-base-200/50" v-if="viewingPerson.name_reason">
            <div class="card-body p-4">
              <h4 class="card-title text-base mb-3">取名原因</h4>
              <div class="text-sm">
                <div class="bg-base-100 px-3 py-2 rounded text-base-content leading-relaxed">
                  {{ viewingPerson.name_reason }}
                </div>
              </div>
            </div>
          </div>

          <!-- 要点信息 -->
          <div class="card bg-base-200/50" v-if="viewingPerson.name_reason">
            <div class="card-body p-4">
              <h4 class="card-title text-base mb-3">取名原因</h4>
              <div class="text-sm">
                <div class="bg-base-100 px-3 py-2 rounded text-base-content leading-relaxed">
                  {{ viewingPerson.name_reason }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeViewModal">关闭</button>
          <button class="btn btn-primary" @click="editFromView">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            编辑
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeViewModal"></form>
    </div>

    <!-- 删除确认模态框 -->
    <div class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">确认删除</h3>
        <p class="py-4" v-if="deletingPerson">
          确定要删除人物 <strong class="text-base-content">{{ deletingPerson.person_name }}</strong> 的信息吗？此操作无法撤销。
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeDeleteModal">取消</button>
          <button 
            class="btn btn-error" 
            @click="confirmDelete"
            :disabled="deleting"
          >
            <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
            确认删除
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeDeleteModal"></form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { personInfoApi } from '@/utils/personApi'
import type { PersonInfo, PersonInfoQueryParams, PersonInfoStats, CreatePersonInfoRequest, UpdatePersonInfoRequest, AvailablePlatform } from '@/types/person'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const personInfos = ref<PersonInfo[]>([])
const stats = ref<PersonInfoStats | null>(null)
const platforms = ref<AvailablePlatform[]>(['qq', 'wechat', 'telegram', 'discord', 'line', 'other'])
const searchKeyword = ref('')

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
})

// 排序和筛选
const sortBy = ref('person_name')
const sortDir = ref<'ASC' | 'DESC'>('ASC')
const filters = reactive({
  platform: ''
})

// 编辑相关
const editingPerson = ref<PersonInfo | null>(null)
const viewingPerson = ref<PersonInfo | null>(null)
const deletingPerson = ref<PersonInfo | null>(null)

// 模态框状态
const showEditModal = ref<boolean>(false)
const showViewModal = ref<boolean>(false)
const showDeleteModal = ref<boolean>(false)

const formData = reactive<CreatePersonInfoRequest>({
  person_id: '',
  person_name: '',
  platform: '',
  user_id: '',
  nickname: '',
  name_reason: '',
  memory_points: ''
})

// 工具函数
const getPlatformName = (platform: string): string => {
  const platformNames: Record<string, string> = {
    'qq': 'QQ',
    'wechat': '微信',
    'telegram': 'Telegram',
    'discord': 'Discord', 
    'line': 'LINE',
    'other': '其他'
  }
  return platformNames[platform] || platform
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes} 分钟前`
  } else if (hours < 24) {
    return `${hours} 小时前`
  } else if (days < 30) {
    return `${days} 天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

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

// API 调用函数
const loadPersonInfos = async (): Promise<void> => {
  loading.value = true
  try {
    const params: PersonInfoQueryParams = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      orderBy: sortBy.value,
      orderDir: sortDir.value
    }
    
    if (filters.platform) {
      params.platform = filters.platform
    }
    
    const response = await personInfoApi.getPersonInfos(params)
    if (response.status === 200 && response.data) {
      personInfos.value = response.data.items
      pagination.total = response.data.total
      pagination.totalPages = response.data.totalPages
      pagination.hasNext = response.data.hasNext
      pagination.hasPrev = response.data.hasPrev
    }
  } catch (error) {
    console.error('加载人物信息失败:', error)
    // 可以添加toast通知
  } finally {
    loading.value = false
  }
}

const loadStats = async (): Promise<void> => {
  try {
    const response = await personInfoApi.getPersonInfoStats()
    if (response.status === 200 && response.data) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const loadPlatforms = async (): Promise<void> => {
  try {
    const response = await personInfoApi.getAvailablePlatforms()
    if (response.status === 200 && response.data) {
      platforms.value = response.data
    }
  } catch (error) {
    console.error('加载平台列表失败:', error)
  }
}

// 搜索和筛选
const handleSearch = async (): Promise<void> => {
  if (!searchKeyword.value.trim()) {
    await loadPersonInfos()
    return
  }
  
  loading.value = true
  try {
    const response = await personInfoApi.searchPersonInfo({
      keyword: searchKeyword.value.trim(),
      limit: 50
    })
    if (response.status === 200 && response.data) {
      personInfos.value = response.data
      // 重置分页信息
      pagination.currentPage = 1
      pagination.total = response.data.length
      pagination.totalPages = 1
      pagination.hasNext = false
      pagination.hasPrev = false
    }
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const clearFilters = (): void => {
  searchKeyword.value = ''
  filters.platform = ''
  pagination.currentPage = 1
  loadPersonInfos()
}

// 排序处理
const handleSort = (field: string): void => {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = field
    sortDir.value = 'ASC'
  }
  pagination.currentPage = 1
  loadPersonInfos()
}

// 分页处理
const changePage = (page: number): void => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.currentPage = page
    loadPersonInfos()
  }
}

// 模态框操作
const openAddModal = (): void => {
  editingPerson.value = null
  resetFormData()
  showEditModal.value = true
}

const openEditModal = (person: PersonInfo): void => {
  editingPerson.value = person
  fillFormData(person)
  showEditModal.value = true
}

const openViewModal = (person: PersonInfo): void => {
  viewingPerson.value = person
  showViewModal.value = true
}

const openDeleteModal = (person: PersonInfo): void => {
  deletingPerson.value = person
  showDeleteModal.value = true
}

const closeEditModal = (): void => {
  showEditModal.value = false
  editingPerson.value = null
  resetFormData()
}

const closeViewModal = (): void => {
  showViewModal.value = false
  viewingPerson.value = null
}

const closeDeleteModal = (): void => {
  showDeleteModal.value = false
  deletingPerson.value = null
}

// 表单操作
const resetFormData = (): void => {
  formData.person_id = ''
  formData.person_name = ''
  formData.platform = ''
  formData.user_id = ''
  formData.nickname = ''
  formData.name_reason = ''
  formData.memory_points = ''
}

const fillFormData = (person: PersonInfo): void => {
  formData.person_id = person.person_id
  formData.person_name = person.person_name
  formData.platform = person.platform
  formData.user_id = person.user_id
  formData.nickname = person.nickname || ''
  formData.name_reason = person.name_reason || ''
  formData.memory_points = person.memory_points || ''
}

// CRUD 操作
const savePersonInfo = async (): Promise<void> => {
  saving.value = true
  try {
    if (editingPerson.value) {
      // 更新
      const updateData: UpdatePersonInfoRequest = {
        person_name: formData.person_name,
        nickname: formData.nickname,
        name_reason: formData.name_reason,
        memory_points: formData.memory_points
      }
      
      await personInfoApi.updatePersonInfo(editingPerson.value.id, updateData)
    } else {
      // 创建
      const createData: CreatePersonInfoRequest = {
        ...formData
      }
      
      await personInfoApi.createPersonInfo(createData)
    }
    
    closeEditModal()
    await loadPersonInfos()
    await loadStats()
  } catch (error) {
    console.error('保存失败:', error)
    // 可以添加toast通知
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (): Promise<void> => {
  if (!deletingPerson.value) return
  
  deleting.value = true
  try {
    await personInfoApi.deletePersonInfo(deletingPerson.value.id)
    closeDeleteModal()
    await loadPersonInfos()
    await loadStats()
  } catch (error) {
    console.error('删除失败:', error)
    // 可以添加toast通知
  } finally {
    deleting.value = false
  }
}

const editFromView = (): void => {
  if (viewingPerson.value) {
    closeViewModal()
    openEditModal(viewingPerson.value)
  }
}

// 初始化
onMounted(async () => {
  await Promise.all([
    loadPersonInfos(),
    loadStats(), 
    loadPlatforms()
  ])
})
</script>
