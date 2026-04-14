<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    fallback: RouteLocationRaw
    label?: string
    /** 为 true 时优先 history.back()，无法后退再 fallback */
    preferHistory?: boolean
    /** dark：顶栏深色底；light：浅底内容区 */
    theme?: 'dark' | 'light'
  }>(),
  {
    label: '返回',
    preferHistory: false,
    theme: 'light',
  },
)

const router = useRouter()

function goBack() {
  if (props.preferHistory && typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    return
  }
  /** replace：避免在「上一層」再 push 一筆，否則系統返回鍵會在父子頁間來回打轉 */
  void router.replace(props.fallback)
}
</script>

<template>
  <button
    type="button"
    class="buddy-back-btn"
    :class="{ 'buddy-back-btn--dark': theme === 'dark' }"
    :aria-label="label"
    @click="goBack"
  >
    <el-icon :size="theme === 'dark' ? 17 : 18"><ArrowLeft /></el-icon>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.buddy-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin: 0;
  padding: 6px 8px 6px 6px;
  border: 1px solid var(--buddy-border);
  border-radius: var(--buddy-radius-sm);
  background: var(--buddy-surface);
  color: var(--buddy-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.buddy-back-btn:hover {
  background: var(--buddy-info-banner);
  border-color: rgba(37, 99, 235, 0.35);
}

.buddy-back-btn--dark {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.buddy-back-btn--dark:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.35);
}
</style>
