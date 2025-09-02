import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Home from '../views/Home.vue'

describe('Home', () => {
  it('renders properly', () => {
    const wrapper = mount(Home)
    expect(wrapper.text()).toContain('欢迎使用 MaiMai Launcher')
  })

  it('displays system status', () => {
    const wrapper = mount(Home)
    const statsCards = wrapper.findAll('.stats')
    expect(statsCards.length).toBeGreaterThan(0)
  })

  it('has quick action buttons', () => {
    const wrapper = mount(Home)
    const quickActions = wrapper.find('.card-body')
    expect(quickActions.exists()).toBe(true)
  })
})
