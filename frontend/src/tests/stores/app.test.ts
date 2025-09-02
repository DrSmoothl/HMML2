import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../../stores/app'

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with correct default values', () => {
    const store = useAppStore()
    expect(store.isLoading).toBe(false)
    expect(store.theme).toBe('light')
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('can toggle theme', () => {
    const store = useAppStore()
    expect(store.theme).toBe('light')
    
    store.toggleTheme()
    expect(store.theme).toBe('dark')
    
    store.toggleTheme()
    expect(store.theme).toBe('light')
  })

  it('can set loading state', () => {
    const store = useAppStore()
    expect(store.isLoading).toBe(false)
    
    store.setLoading(true)
    expect(store.isLoading).toBe(true)
    
    store.setLoading(false)
    expect(store.isLoading).toBe(false)
  })

  it('computes isDarkTheme correctly', () => {
    const store = useAppStore()
    expect(store.isDarkTheme).toBe(false)
    
    store.setTheme('dark')
    expect(store.isDarkTheme).toBe(true)
    
    store.setTheme('light')
    expect(store.isDarkTheme).toBe(false)
  })
})
