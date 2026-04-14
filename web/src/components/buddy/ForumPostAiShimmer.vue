<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const lines = [
  '正在读取你的画像…',
  '智能体正在组织语言…',
  '生成标题与正文中…',
  '马上就好…',
]

const idx = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    idx.value = (idx.value + 1) % lines.length
  }, 1500)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="forum-ai-shimmer" aria-busy="true" aria-live="polite">
    <div class="shimmer-title buddy-shimmer-fill" />
    <div class="shimmer-line wide buddy-shimmer-fill" />
    <div class="shimmer-line buddy-shimmer-fill" />
    <div class="shimmer-line mid buddy-shimmer-fill" />
    <div class="shimmer-line buddy-shimmer-fill" />
    <div class="shimmer-line short buddy-shimmer-fill" />
    <p class="tip">{{ lines[idx] }}</p>
  </div>
</template>

<style scoped>
.forum-ai-shimmer {
  padding: 16px 0 8px;
}

.shimmer-title {
  height: 22px;
  border-radius: 8px;
  margin-bottom: 16px;
  max-width: 92%;
}

.shimmer-line {
  height: 14px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.shimmer-line.wide {
  max-width: 100%;
}

.shimmer-line.mid {
  max-width: 88%;
}

.shimmer-line.short {
  max-width: 56%;
}

.tip {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--buddy-text-muted);
  text-align: center;
  line-height: 1.45;
}
</style>
