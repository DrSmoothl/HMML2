<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="text-center">
      <div class="text-9xl mb-8">🤖</div>
      <h1 class="text-6xl font-bold text-base-content mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-base-content/80 mb-6">页面不存在</h2>
      <p class="text-base-content/60 mb-8 max-w-md">
        抱歉，您访问的页面不存在。可能是链接错误或页面已被删除。
      </p>
      <div class="flex gap-4 justify-center">
        <router-link to="/" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          返回首页
        </router-link>
        <button @click="$router.back()" class="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          返回上页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 页面
</script>
