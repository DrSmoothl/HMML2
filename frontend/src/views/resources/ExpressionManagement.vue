<template>
  <div class="space-y-6">
    <!-- 头部区域 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">表达方式管理</h1>
        <p class="text-base-content/70 mt-1">管理机器人的各种表达方式和回复模板</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        添加表达方式
      </button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">搜索关键词</span>
            </label>
            <input 
              v-model="searchKeyword"
              type="text" 
              placeholder="搜索情境或表达方式..." 
              class="input input-bordered input-sm"
              @input="debouncedSearch"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">类型</span>
            </label>
            <select v-model="filters.type" class="select select-bordered select-sm" @change="loadData">
              <option value="">全部类型</option>
              <option value="style">表达风格</option>
              <option value="grammar">语法模板</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">聊天ID</span>
            </label>
            <input 
              v-model="filters.chat_id"
              type="text" 
              placeholder="过滤聊天ID..." 
              class="input input-bordered input-sm"
              @change="loadData"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">排序</span>
            </label>
            <select v-model="sortBy" class="select select-bordered select-sm" @change="loadData">
              <option value="id:DESC">最新添加</option>
              <option value="id:ASC">最早添加</option>
              <option value="count:DESC">使用次数多</option>
              <option value="count:ASC">使用次数少</option>
              <option value="last_active_time:DESC">最近使用</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" v-if="stats">
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-title">总数量</div>
        <div class="stat-value">{{ Math.floor(stats.total || 0) }}</div>
        <div class="stat-desc">表达方式总数</div>
      </div>
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-title">平均使用</div>
        <div class="stat-value">{{ (stats.avgCount || 0).toFixed(1) }}</div>
        <div class="stat-desc">平均使用次数</div>
      </div>
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-title">总使用</div>
        <div class="stat-value">{{ Math.floor(stats.totalCount || 0) }}</div>
        <div class="stat-desc">累计使用次数</div>
      </div>
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-title">活跃数量</div>
        <div class="stat-value">{{ Math.floor(stats.recentActive || 0) }}</div>
        <div class="stat-desc">最近活跃的表达方式</div>
      </div>
    </div>

    <!-- 表达方式列表 -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="expressions.length === 0" class="card bg-base-100 shadow-sm">
      <div class="card-body text-center py-16">
        <div class="text-base-content/50 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4-4 4-4-4" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-base-content/70">暂无表达方式</h3>
        <p class="text-base-content/50 mt-1">点击右上角按钮添加第一个表达方式</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="expression in expressions" 
        :key="expression.id" 
        class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="card-body">
          <div class="flex items-start justify-between mb-2">
            <div class="badge badge-outline badge-sm">{{ expression.type || '未分类' }}</div>
            <div class="flex items-center space-x-1 text-xs text-base-content/50">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{{ expression.count }}</span>
            </div>
          </div>
          
          <h3 class="font-semibold text-base mb-2 line-clamp-2" :title="expression.situation">
            {{ expression.situation || '未设置情境' }}
          </h3>
          
          <p class="text-sm text-base-content/70 mb-4 line-clamp-3" :title="expression.style">
            {{ expression.style }}
          </p>
          
          <div class="text-xs text-base-content/50 mb-4 space-y-1">
            <div v-if="expression.chat_id">聊天ID: {{ expression.chat_id }}</div>
            <div>创建时间: {{ formatDate(expression.create_date) }}</div>
            <div v-if="expression.last_active_time">
              最后使用: {{ formatDate(expression.last_active_time) }}
            </div>
          </div>
          
          <div class="card-actions justify-end">
            <button class="btn btn-ghost btn-xs" @click="editExpression(expression)">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              编辑
            </button>
            <button 
              class="btn btn-ghost btn-xs text-error" 
              @click="deleteExpression(expression)"
              :disabled="deletingIds.has(expression.id)"
            >
              <span v-if="deletingIds.has(expression.id)" class="loading loading-spinner loading-xs"></span>
              <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.totalPages > 1" class="flex justify-center">
      <div class="join">
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

    <!-- 创建/编辑模态框 -->
    <div class="modal" :class="{ 'modal-open': showCreateModal || showEditModal }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingExpression ? '编辑表达方式' : '添加表达方式' }}
        </h3>
        
        <form @submit.prevent="submitForm" class="space-y-6">
          <div class="space-y-2">
            <div class="block">
              <span class="text-sm font-medium text-base-content">情境描述 <span class="text-error">*</span></span>
            </div>
            <textarea 
              v-model="formData.situation"
              class="textarea textarea-bordered h-24 resize-none w-full" 
              placeholder="描述使用这个表达方式的情境..."
              required
            ></textarea>
          </div>
          
          <div class="space-y-2">
            <div class="block">
              <span class="text-sm font-medium text-base-content">表达方式 <span class="text-error">*</span></span>
            </div>
            <textarea 
              v-model="formData.style"
              class="textarea textarea-bordered h-32 resize-none w-full" 
              placeholder="具体的表达内容或回复模板..."
              required
            ></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <div class="block">
                <span class="text-sm font-medium text-base-content">类型</span>
              </div>
              <select v-model="formData.type" class="select select-bordered w-full">
                <option value="style">表达风格</option>
                <option value="grammar">语法模板</option>
                <option value="">其他</option>
              </select>
            </div>
            
            <div class="space-y-2">
              <div class="block">
                <span class="text-sm font-medium text-base-content">聊天ID</span>
              </div>
              <input 
                v-model="formData.chat_id"
                type="text" 
                class="input input-bordered w-full" 
                placeholder="关联的聊天ID（可选）"
              />
            </div>
          </div>
          
          <div class="text-xs text-base-content/60">
            可选，用于关联特定聊天场景
          </div>
          
          <div class="space-y-2" v-if="editingExpression">
            <div class="block">
              <span class="text-sm font-medium text-base-content">使用次数</span>
            </div>
            <input 
              v-model.number="formData.count"
              type="number" 
              class="input input-bordered w-full" 
              min="0"
            />
          </div>
        </form>
        
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeModal">取消</button>
          <button 
            type="submit" 
            class="btn btn-primary"
            @click="submitForm"
            :disabled="submitting"
          >
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            {{ editingExpression ? '保存' : '添加' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal"></form>
    </div>

    <!-- 删除确认模态框 -->
    <div class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">确认删除</h3>
        <p class="py-4">确定要删除这个表达方式吗？此操作不可撤销。</p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showDeleteModal = false">取消</button>
          <button 
            class="btn btn-error" 
            @click="confirmDelete"
            :disabled="submitting"
          >
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            删除
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showDeleteModal = false"></form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { debounce } from 'lodash-es'
import type { Expression, ExpressionCreateParams, ExpressionStats } from '@/types/expression'
import { 
  getExpressions, 
  createExpression, 
  updateExpression, 
  deleteExpression as deleteExpressionApi,
  getExpressionStats,
  searchExpressions
} from '@/utils/expression'

// 响应式数据
const expressions = ref<Expression[]>([])
const stats = ref<ExpressionStats | null>(null)
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingExpression = ref<Expression | null>(null)
const deletingExpression = ref<Expression | null>(null)
const deletingIds = ref(new Set<number>())

// 筛选和排序
const filters = reactive({
  type: '',
  chat_id: ''
})

const sortBy = ref('id:DESC')

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
})

// 表单数据
const formData = reactive<ExpressionCreateParams>({
  situation: '',
  style: '',
  type: 'style',
  chat_id: '',
  count: 0
})

// 计算属性
const sortField = computed(() => sortBy.value.split(':')[0])
const sortDirection = computed(() => sortBy.value.split(':')[1] as 'ASC' | 'DESC')

// 防抖搜索
const debouncedSearch = debounce(() => {
  if (searchKeyword.value.trim()) {
    searchData()
  } else {
    loadData()
  }
}, 500)

// 格式化日期
const formatDate = (timestamp: number) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// 智能分页计算属性
const paginationPages = computed(() => {
  const current = pagination.currentPage
  const total = pagination.totalPages
  const pages = []
  
  // 调试信息
  console.log('智能分页计算:', { current, total, paginationData: pagination })
  
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
  
  console.log('生成的页码:', pages)
  return pages
})


// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    
    const [expressionsRes, statsRes] = await Promise.all([
      getExpressions({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        orderBy: sortField.value,
        orderDir: sortDirection.value,
        type: filters.type || undefined,
        chat_id: filters.chat_id || undefined
      }),
      getExpressionStats()
    ])
    
    if (expressionsRes.status === 200 && expressionsRes.data) {
      expressions.value = expressionsRes.data.items
      
      // 调试信息：查看返回的分页数据
      console.log('表达方式分页数据:', {
        items: expressionsRes.data.items?.length || 0,
        total: expressionsRes.data.total,
        totalPages: expressionsRes.data.totalPages,
        currentPage: expressionsRes.data.currentPage,
        pageSize: expressionsRes.data.pageSize,
        hasNext: expressionsRes.data.hasNext,
        hasPrev: expressionsRes.data.hasPrev
      })
      
      Object.assign(pagination, {
        total: expressionsRes.data.total,
        totalPages: expressionsRes.data.totalPages,
        currentPage: expressionsRes.data.currentPage,
        hasNext: expressionsRes.data.hasNext,
        hasPrev: expressionsRes.data.hasPrev
      })
    }
    
    if (statsRes.status === 200) {
      stats.value = statsRes.data || null
    }
  } catch (error) {
    console.error('加载表达方式失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索数据
const searchData = async () => {
  if (!searchKeyword.value.trim()) {
    return loadData()
  }
  
  try {
    loading.value = true
    const response = await searchExpressions({
      keyword: searchKeyword.value.trim(),
      limit: 50
    })
    
    if (response.status === 200) {
      expressions.value = response.data || []
      // 重置分页信息
      Object.assign(pagination, {
        currentPage: 1,
        total: expressions.value.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      })
    }
  } catch (error) {
    console.error('搜索表达方式失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换页面
const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.currentPage = page
    if (searchKeyword.value.trim()) {
      searchData()
    } else {
      loadData()
    }
  }
}

// 编辑表达方式
const editExpression = (expression: Expression) => {
  editingExpression.value = expression
  Object.assign(formData, {
    situation: expression.situation,
    style: expression.style,
    type: expression.type,
    chat_id: expression.chat_id,
    count: expression.count
  })
  showEditModal.value = true
}

// 删除表达方式
const deleteExpression = (expression: Expression) => {
  deletingExpression.value = expression
  showDeleteModal.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!deletingExpression.value) return
  
  try {
    submitting.value = true
    deletingIds.value.add(deletingExpression.value.id)
    
    const response = await deleteExpressionApi(deletingExpression.value.id)
    
    if (response.status === 200) {
      await loadData()
      showDeleteModal.value = false
      deletingExpression.value = null
    }
  } catch (error) {
    console.error('删除表达方式失败:', error)
  } finally {
    submitting.value = false
    if (deletingExpression.value) {
      deletingIds.value.delete(deletingExpression.value.id)
    }
  }
}

// 提交表单
const submitForm = async () => {
  try {
    submitting.value = true
    
    if (editingExpression.value) {
      // 更新
      const response = await updateExpression({
        id: editingExpression.value.id,
        ...formData
      })
      
      if (response.status === 200) {
        await loadData()
        closeModal()
      }
    } else {
      // 创建
      const response = await createExpression(formData)
      
      if (response.status === 200) {
        await loadData()
        closeModal()
      }
    }
  } catch (error) {
    console.error('保存表达方式失败:', error)
  } finally {
    submitting.value = false
  }
}


// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingExpression.value = null
  
  // 重置表单
  Object.assign(formData, {
    situation: '',
    style: '',
    type: 'style',
    chat_id: '',
    count: 0
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}
</style>
