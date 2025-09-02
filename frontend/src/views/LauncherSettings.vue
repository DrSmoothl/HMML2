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
  </div>
</template>

<script setup lang="ts">
// import { ref } from 'vue'

// 主题设置
// const selectedTheme = ref('auto')

// const handleThemeChange = (theme: string) => {
//   selectedTheme.value = theme
//   // 这里可以添加实际的主题切换逻辑
//   console.log('切换主题到:', theme)
// }
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
