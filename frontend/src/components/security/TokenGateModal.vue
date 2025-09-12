<template>
  <div
    class="fixed inset-0 z-[1000] flex items-center justify-center bg-base-200/95 backdrop-blur-sm px-4"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-sm">
      <div class="card shadow-2xl bg-base-100 border border-base-300">
        <div class="card-body space-y-4">
          <h1 class="text-2xl font-bold text-center">访问验证</h1>
          <p class="text-sm text-base-content/70 text-center">请输入访问 Token 继续使用系统</p>
          <form @submit.prevent="submit" autocomplete="off">
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text">访问 Token</span>
              </label>
              <input
                v-model="token"
                ref="inputRef"
                type="password"
                class="input input-bordered"
                placeholder="输入访问 Token"
                autocomplete="new-password"
                @keydown.enter.prevent="submit"
              />
            </div>
            <div class="form-control">
              <button :disabled="loading || !token" class="btn btn-primary w-full">
                <span v-if="!loading">验证</span>
                <span v-else class="loading loading-spinner"></span>
              </button>
            </div>
          </form>
          <p v-if="error" class="text-error text-sm text-center">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import api from '@/utils/api'

const token = ref('')
const loading = ref(false)
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{(e: 'validated'): void}>()

const focusInput = () => {
  nextTick(() => inputRef.value?.focus())
}

const submit = async () => {
  if (!token.value || loading.value) return
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/system/verifyToken', { token: token.value })
    if (res.data?.data?.valid) {
      localStorage.setItem('access_token_valid', '1')
      emit('validated')
    } else {
      error.value = '验证失败'
      focusInput()
    }
  } catch (e: any) {
    error.value = e?.message || '验证失败'
    focusInput()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  focusInput()
})
</script>

<style scoped>
/* 防止背景滚动 */
body {
  overflow: hidden;
}
</style>
