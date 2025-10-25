<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">启动器设置</h1>
        <p class="text-base-content/70 mt-1">选择您喜欢的界面主题</p>
      </div>
      <button class="btn btn-primary btn-sm">保存设置</button>
    </div>
    
    <!-- Theme Settings -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="card-title text-lg mb-6">主题选择</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 自动跟随系统 -->
          <div class="form-control">
            <label class="label cursor-pointer p-0">
              <input type="radio" name="theme-radio" class="radio radio-primary sr-only" checked />
              <div class="card bg-base-200 hover:bg-base-300 transition-all duration-200 border-2 border-transparent hover:border-primary w-full">
                <div class="card-body p-4">
                  <div class="flex items-center justify-center mb-3">
                    <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-base-100 to-base-300 flex items-center justify-center shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-primary">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-center">
                    <h4 class="font-semibold text-base-content">自动跟随系统</h4>
                    <p class="text-sm text-base-content/60 mt-1">根据系统设置自动切换</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <!-- 明亮主题 -->
          <div class="form-control">
            <label class="label cursor-pointer p-0">
              <input type="radio" name="theme-radio" class="radio radio-primary sr-only" />
              <div class="card bg-base-200 hover:bg-base-300 transition-all duration-200 border-2 border-transparent hover:border-primary w-full">
                <div class="card-body p-4">
                  <div class="flex items-center justify-center mb-3">
                    <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-orange-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-center">
                    <h4 class="font-semibold text-base-content">明亮主题</h4>
                    <p class="text-sm text-base-content/60 mt-1">清新明亮的白色界面</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <!-- 深色主题 -->
          <div class="form-control">
            <label class="label cursor-pointer p-0">
              <input type="radio" name="theme-radio" class="radio radio-primary sr-only" />
              <div class="card bg-base-200 hover:bg-base-300 transition-all duration-200 border-2 border-transparent hover:border-primary w-full">
                <div class="card-body p-4">
                  <div class="flex items-center justify-center mb-3">
                    <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-300">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-center">
                    <h4 class="font-semibold text-base-content">深色主题</h4>
                    <p class="text-sm text-base-content/60 mt-1">护眼舒适的暗色界面</p>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="mt-6 p-4 bg-base-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-info mt-0.5 flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div class="text-sm text-base-content/70">
              <p class="font-medium mb-1">主题说明：</p>
              <p>选择"自动跟随系统"时，启动器会根据您的操作系统主题设置自动切换明亮或深色模式。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Token 管理 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body space-y-4">
        <h3 class="card-title text-lg">访问 Token 管理</h3>
        <p class="text-sm text-base-content/70 leading-relaxed">
          再生访问 Token 将使现有所有已验证的前端实例在下次刷新时被重新要求输入新 Token。此操作不可逆，旧 Token 立即失效，请务必在关闭窗口前复制并妥善保存新 Token。
        </p>
        <div class="flex flex-wrap gap-3">
          <button class="btn btn-error btn-sm" :disabled="regenerating" @click="openConfirmModal">
            <span v-if="!regenerating">再生访问 Token</span>
            <span v-else class="loading loading-spinner"></span>
          </button>
          <button v-if="newToken && !showTokenModal" class="btn btn-outline btn-sm" @click="showTokenModal = true">再次查看刚生成的 Token</button>
        </div>
        <p v-if="errorMsg" class="text-error text-sm">{{ errorMsg }}</p>
        <p v-if="successMsg" class="text-success text-sm">{{ successMsg }}</p>
      </div>
    </div>

    <!-- 再生二次确认模态 -->
    <div v-if="showConfirmModal" class="fixed inset-0 z-[1150] flex items-center justify-center bg-base-200/90 backdrop-blur-sm p-4">
      <div class="w-full max-w-md">
        <div class="card bg-base-100 shadow-xl border border-base-300">
          <div class="card-body space-y-4">
            <h2 class="card-title text-lg">确认再生访问 Token</h2>
            <div class="text-sm space-y-2 leading-relaxed">
              <p>此操作将立即使当前 Token 失效，所有前端会在刷新后被要求输入新 Token。</p>
              <p class="font-medium text-warning">请在下方输入 <code class="px-1 py-0.5 bg-base-200 rounded text-xs">REGENERATE</code> 以确认。</p>
            </div>
            <div class="space-y-2">
              <input v-model="confirmText" type="text" class="input input-bordered w-full"
                     placeholder="输入 REGENERATE 以继续" autocomplete="off" />
              <p v-if="confirmText && confirmText !== 'REGENERATE'" class="text-xs text-error">输入不匹配</p>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button class="btn btn-ghost btn-sm" @click="closeConfirmModal" :disabled="regenerating">取消</button>
              <button class="btn btn-error btn-sm" :disabled="confirmText !== 'REGENERATE' || regenerating" @click="confirmRegenerate">
                <span v-if="!regenerating">确认再生</span>
                <span v-else class="loading loading-spinner"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新 Token 一次性展示模态 -->
    <div v-if="showTokenModal" class="fixed inset-0 z-[1200] flex items-center justify-center bg-base-200/90 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg">
        <div class="card bg-base-100 shadow-2xl border border-base-300">
          <div class="card-body space-y-4">
            <h2 class="card-title text-lg">新访问 Token 已生成</h2>
            <div class="alert alert-warning text-sm leading-relaxed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <div>
                <p class="font-semibold">请立即复制保存！</p>
                <p>关闭本窗口后将无法再次从服务器获取此明文 Token（除非再次再生）。</p>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm text-base-content/70">新 Token：</label>
              <div class="flex items-stretch gap-2">
                <input :value="newToken" readonly class="input input-bordered flex-1 font-mono text-sm" />
                <button class="btn btn-outline" @click="copyToken" :disabled="!newToken || copied">
                  <span v-if="!copied">复制</span>
                  <span v-else>已复制</span>
                </button>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button class="btn btn-ghost" @click="closeTokenModal(false)">稍后再说</button>
              <button class="btn btn-primary" @click="closeTokenModal(true)">我已复制</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/utils/api'

// Token 再生状态
const regenerating = ref(false)
const newToken = ref<string | null>(null)
const showTokenModal = ref(false)
const showConfirmModal = ref(false)
const confirmText = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const copied = ref(false)

const openConfirmModal = () => {
  confirmText.value = ''
  showConfirmModal.value = true
}

const closeConfirmModal = () => {
  if (regenerating.value) return
  showConfirmModal.value = false
}

const confirmRegenerate = async () => {
  if (confirmText.value !== 'REGENERATE' || regenerating.value) return
  await regenerateToken()
  showConfirmModal.value = false
}

const regenerateToken = async () => {
  regenerating.value = true
  errorMsg.value = ''
  successMsg.value = ''
  copied.value = false
  try {
    const res = await api.post('/system/regenerateToken', {})
    const token = res.data?.data?.token
    if (token) {
      newToken.value = token
      showTokenModal.value = true
      successMsg.value = '再生成功，请及时复制新 Token'
      // 既然旧 token 失效，应清除验证状态，下次刷新会重新要求输入
      sessionStorage.removeItem('access_token_valid')
      // 同时清除可能存在的旧版 localStorage
      localStorage.removeItem('access_token_valid')
    } else {
      throw new Error('未返回新 Token')
    }
  } catch (e: any) {
    errorMsg.value = e?.message || '再生失败'
  } finally {
    regenerating.value = false
  }
}

const copyToken = async () => {
  if (!newToken.value) return
  try {
    await navigator.clipboard.writeText(newToken.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 3000)
  } catch (e) {
    errorMsg.value = '复制失败，请手动选择复制'
  }
}

const closeTokenModal = (ack: boolean) => {
  showTokenModal.value = false
  if (ack) {
    // 提示刷新以触发重新验证流程
    setTimeout(() => {
      if (window.confirm('是否立即刷新页面以使用新 Token？')) {
        window.location.reload()
      }
    }, 100)
  }
}
</script>

<style scoped>
/* 主题选择卡片选中状态 */
.form-control input[type="radio"]:checked + .card {
  border-color: hsl(var(--p));
  background-color: hsl(var(--p) / 0.05);
}

.form-control input[type="radio"]:checked + .card .card-body h4 {
  color: hsl(var(--p));
}

/* 卡片悬停效果 */
.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
}

/* 主题图标渐变效果 */
.w-16.h-16 {
  transition: all 0.3s ease;
}

.form-control:hover .w-16.h-16 {
  transform: scale(1.05);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>
