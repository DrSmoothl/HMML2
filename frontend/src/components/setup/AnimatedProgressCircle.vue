<template>
  <div class="animated-circle-container">
    <canvas ref="canvasRef" :width="size" :height="size"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { animate, engine } from 'animejs'

interface Props {
  size?: number
  progress?: number[] // 4个扇形的进度 [0-1, 0-1, 0-1, 0-1]
}

const props = withDefaults(defineProps<Props>(), {
  size: 500,
  progress: () => [0, 0, 0, 0]
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrame: number | null = null
let rotationAngle = 0

// 扇形颜色配置
const sectorColors = [
  { start: '#ff6b6b', end: '#ff8e53' }, // 红-橙
  { start: '#ffd93d', end: '#6bcf7f' }, // 黄-绿
  { start: '#4ecdc4', end: '#44a7f5' }, // 青-蓝
  { start: '#a67bff', end: '#ff6b9d' }  // 紫-粉
]

// 当前进度对象（用于 anime.js 动画）
const progressState = {
  sector0: 0,
  sector1: 0,
  sector2: 0,
  sector3: 0
}

// 绘制圆环
function drawCircle() {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const centerX = props.size / 2
  const centerY = props.size / 2
  const outerRadius = props.size / 2 - 20
  const innerRadius = outerRadius - 60
  const tickRadius = outerRadius - 10

  // 清空画布
  ctx.clearRect(0, 0, props.size, props.size)

  // 绘制背景圆环
  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius - 30, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 40
  ctx.stroke()

  // 绘制4个扇形进度
  const anglePerSector = (Math.PI * 2) / 4
  const currentProgress = [
    progressState.sector0,
    progressState.sector1,
    progressState.sector2,
    progressState.sector3
  ]

  currentProgress.forEach((progress, index) => {
    const startAngle = -Math.PI / 2 + anglePerSector * index + rotationAngle * 0.001
    const endAngle = startAngle + anglePerSector * progress

    // 创建渐变
    const gradient = ctx.createLinearGradient(
      centerX + Math.cos(startAngle) * outerRadius,
      centerY + Math.sin(startAngle) * outerRadius,
      centerX + Math.cos(endAngle) * outerRadius,
      centerY + Math.sin(endAngle) * outerRadius
    )
    gradient.addColorStop(0, sectorColors[index].start)
    gradient.addColorStop(1, sectorColors[index].end)

    // 绘制进度弧
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius - 30, startAngle, endAngle)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 40
    ctx.lineCap = 'round'
    ctx.stroke()

    // 绘制刻度线
    const tickCount = 60
    const ticksPerSector = Math.floor(tickCount / 4)
    
    for (let i = 0; i < ticksPerSector; i++) {
      const tickAngle = startAngle + (anglePerSector / ticksPerSector) * i
      const tickProgress = i / ticksPerSector
      
      if (tickProgress <= progress) {
        const tickStart = {
          x: centerX + Math.cos(tickAngle) * (tickRadius - 5),
          y: centerY + Math.sin(tickAngle) * (tickRadius - 5)
        }
        const tickEnd = {
          x: centerX + Math.cos(tickAngle) * tickRadius,
          y: centerY + Math.sin(tickAngle) * tickRadius
        }

        ctx.beginPath()
        ctx.moveTo(tickStart.x, tickStart.y)
        ctx.lineTo(tickEnd.x, tickEnd.y)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
  })

  // 绘制中心装饰圆
  const decorCircles = [
    { radius: innerRadius - 20, opacity: 0.1 },
    { radius: innerRadius - 40, opacity: 0.15 },
    { radius: innerRadius - 60, opacity: 0.08 }
  ]

  decorCircles.forEach(circle => {
    ctx.beginPath()
    ctx.arc(centerX, centerY, circle.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 255, 255, ${circle.opacity})`
    ctx.lineWidth = 2
    ctx.stroke()
  })

  // 绘制装饰线条
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + rotationAngle * 0.002
    const lineStart = innerRadius - 80
    const lineEnd = innerRadius - 100
    
    ctx.beginPath()
    ctx.moveTo(
      centerX + Math.cos(angle) * lineStart,
      centerY + Math.sin(angle) * lineStart
    )
    ctx.lineTo(
      centerX + Math.cos(angle) * lineEnd,
      centerY + Math.sin(angle) * lineEnd
    )
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  rotationAngle += 0.3
  animationFrame = requestAnimationFrame(drawCircle)
}

// 监听进度变化，使用 anime.js 动画
watch(() => props.progress, (newProgress) => {
  // 使用 anime.js 统一管理动画
  animate(progressState, {
    sector0: newProgress[0] || 0,
    sector1: newProgress[1] || 0,
    sector2: newProgress[2] || 0,
    sector3: newProgress[3] || 0,
    duration: 800,
    ease: 'inOut(2)'
  })
}, { deep: true })

onMounted(() => {
  if (canvasRef.value) {
    // 初始化进度
    progressState.sector0 = props.progress[0] || 0
    progressState.sector1 = props.progress[1] || 0
    progressState.sector2 = props.progress[2] || 0
    progressState.sector3 = props.progress[3] || 0
    
    // 启动动画循环
    drawCircle()
  }
})

onBeforeUnmount(() => {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
  }
  // 暂停 anime.js 引擎
  engine.pause()
})
</script>

<style scoped>
.animated-circle-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  filter: drop-shadow(0 0 30px rgba(0, 0, 0, 0.3));
}
</style>
