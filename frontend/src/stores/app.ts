import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AppState {
  isLoading: boolean
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
}

export const useAppStore = defineStore('app', () => {
  // State
  const isLoading = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const sidebarCollapsed = ref(false)
  
  // Getters
  const isDarkTheme = computed(() => theme.value === 'dark')
  
  // Actions
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    // 应用主题到 HTML 元素
    document.documentElement.setAttribute('data-theme', theme.value)
    // 保存到本地存储
    localStorage.setItem('theme', theme.value)
  }
  
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }
  
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const savedSidebar = localStorage.getItem('sidebarCollapsed')
    
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      // 检测系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
    
    if (savedSidebar !== null) {
      sidebarCollapsed.value = savedSidebar === 'true'
    }
  }
  
  return {
    // State
    isLoading,
    theme,
    sidebarCollapsed,
    
    // Getters
    isDarkTheme,
    
    // Actions
    setLoading,
    toggleTheme,
    setTheme,
    toggleSidebar,
    initializeTheme,
  }
})
