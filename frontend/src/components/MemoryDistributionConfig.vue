<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-base-content">{{ label }}</label>
    </div>
    
    <!-- 分布配置 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 分布1 -->
      <div class="bg-base-200 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <Icon icon="mdi:chart-bell-curve" class="w-5 h-5 text-primary" />
          <span class="text-sm font-semibold">分布 1</span>
        </div>
        
        <div class="space-y-3">
          <!-- 均值 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">均值</span>
              <span class="badge badge-neutral font-mono text-xs">{{ distribution1.mean }}</span>
            </label>
            <input 
              type="number" 
              class="input input-bordered input-sm"
              :value="distribution1.mean"
              @input="updateDistribution(1, 'mean', parseFloat(($event.target as HTMLInputElement).value))"
              step="0.1"
              min="0"
            />
          </div>
          
          <!-- 标准差 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">标准差</span>
              <span class="badge badge-neutral font-mono text-xs">{{ distribution1.std }}</span>
            </label>
            <input 
              type="number" 
              class="input input-bordered input-sm"
              :value="distribution1.std"
              @input="updateDistribution(1, 'std', parseFloat(($event.target as HTMLInputElement).value))"
              step="0.1"
              min="0.1"
            />
          </div>
          
          <!-- 权重滑块 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">权重</span>
              <span class="badge badge-primary font-mono text-xs">{{ (distribution1.weight * 100).toFixed(1) }}%</span>
            </label>
            <input 
              type="range" 
              class="range range-primary range-sm"
              :value="distribution1.weight"
              @input="updateWeight1(parseFloat(($event.target as HTMLInputElement).value))"
              min="0.1"
              max="0.9"
              step="0.01"
            />
            <div class="flex justify-between text-xs text-base-content/60 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>90%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分布2 -->
      <div class="bg-base-200 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <Icon icon="mdi:chart-bell-curve-cumulative" class="w-5 h-5 text-secondary" />
          <span class="text-sm font-semibold">分布 2</span>
        </div>
        
        <div class="space-y-3">
          <!-- 均值 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">均值</span>
              <span class="badge badge-neutral font-mono text-xs">{{ distribution2.mean }}</span>
            </label>
            <input 
              type="number" 
              class="input input-bordered input-sm"
              :value="distribution2.mean"
              @input="updateDistribution(2, 'mean', parseFloat(($event.target as HTMLInputElement).value))"
              step="0.1"
              min="0"
            />
          </div>
          
          <!-- 标准差 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">标准差</span>
              <span class="badge badge-neutral font-mono text-xs">{{ distribution2.std }}</span>
            </label>
            <input 
              type="number" 
              class="input input-bordered input-sm"
              :value="distribution2.std"
              @input="updateDistribution(2, 'std', parseFloat(($event.target as HTMLInputElement).value))"
              step="0.1"
              min="0.1"
            />
          </div>
          
          <!-- 权重滑块 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">权重</span>
              <span class="badge badge-secondary font-mono text-xs">{{ (distribution2.weight * 100).toFixed(1) }}%</span>
            </label>
            <input 
              type="range" 
              class="range range-secondary range-sm"
              :value="distribution2.weight"
              @input="updateWeight2(parseFloat(($event.target as HTMLInputElement).value))"
              min="0.1"
              max="0.9"
              step="0.01"
            />
            <div class="flex justify-between text-xs text-base-content/60 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>90%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 权重总和提示 -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-3">
      <div class="flex items-center gap-2">
        <Icon icon="mdi:information" class="w-4 h-4 text-info" />
        <div class="text-xs text-info">
          <span class="font-semibold">权重总和: {{ (distribution1.weight + distribution2.weight).toFixed(2) }}</span>
          <span class="ml-2">{{ Math.abs(distribution1.weight + distribution2.weight - 1) < 0.01 ? '✓ 正确' : '⚠ 应等于1.0' }}</span>
        </div>
      </div>
    </div>

    <!-- 预览 -->
    <div class="bg-base-300 rounded-lg p-3">
      <div class="text-xs text-base-content/60 mb-1">当前配置预览:</div>
      <code class="text-primary text-xs">{{ JSON.stringify(currentValue) }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  label: string
  value: number[]
}

interface Emits {
  (e: 'update', value: number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 分布配置
const distribution1 = ref({
  mean: 6.0,
  std: 3.0,
  weight: 0.6
})

const distribution2 = ref({
  mean: 32.0,
  std: 12.0,
  weight: 0.4
})

// 当前值
const currentValue = computed(() => {
  return [
    distribution1.value.mean,
    distribution1.value.std,
    distribution1.value.weight,
    distribution2.value.mean,
    distribution2.value.std,
    distribution2.value.weight
  ]
})

// 初始化值
const initializeValue = () => {
  if (props.value && props.value.length === 6) {
    distribution1.value = {
      mean: props.value[0] || 6.0,
      std: props.value[1] || 3.0,
      weight: props.value[2] || 0.6
    }
    distribution2.value = {
      mean: props.value[3] || 32.0,
      std: props.value[4] || 12.0,
      weight: props.value[5] || 0.4
    }
  }
}

// 监听props变化
watch(
  () => props.value,
  () => {
    initializeValue()
  },
  { immediate: true }
)

// 监听当前值变化并发送更新
watch(currentValue, (newValue) => {
  emit('update', newValue)
}, { deep: true })

// 更新分布参数
const updateDistribution = (distributionNum: number, param: 'mean' | 'std', value: number) => {
  if (isNaN(value)) return
  
  if (distributionNum === 1) {
    distribution1.value[param] = value
  } else {
    distribution2.value[param] = value
  }
}

// 更新权重1，自动调整权重2
const updateWeight1 = (value: number) => {
  if (isNaN(value)) return
  distribution1.value.weight = value
  distribution2.value.weight = 1 - value
}

// 更新权重2，自动调整权重1
const updateWeight2 = (value: number) => {
  if (isNaN(value)) return
  distribution2.value.weight = value
  distribution1.value.weight = 1 - value
}
</script>
