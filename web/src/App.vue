<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { isMockApiEnabled } from '@/mock/config'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()

watchEffect(() => {
  document.documentElement.classList.toggle('dark', ui.isDark)
  document.documentElement.style.colorScheme = ui.isDark ? 'dark' : 'light'
})

/**
 * 顶层路由过渡 key：/app 下全部使用同一 key，避免切换子页（含 AI 搭子）时销毁 MainLayout。
 * 登录/注册/引导等独立页用 path 区分，以触发与 MainLayout 同一套 fade-slide 动画。
 */
const rootTransitionKey = computed(() => {
  if (route.path.startsWith('/app')) return 'shell-app'
  return route.path
})
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__veil" aria-hidden="true" />
    <div v-if="isMockApiEnabled()" class="mock-strip" role="status">
      模拟数据模式已开启（VITE_USE_MOCK=true），未连接真实后端
    </div>
    <div class="route-fade-slide-wrap">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" :key="rootTransitionKey" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  background: var(--buddy-page-bg);
}

/* 轻量全屏氛围：极光缓慢漂移，不阻挡交互 */
.app-shell__veil {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.72;
  background:
    radial-gradient(ellipse 95% 75% at 12% -8%, rgb(var(--buddy-rgb-brand) / 0.07) 0%, transparent 52%),
    radial-gradient(ellipse 70% 55% at 98% 8%, rgb(var(--buddy-rgb-accent) / 0.06) 0%, transparent 48%),
    radial-gradient(ellipse 55% 45% at 48% 102%, rgb(var(--buddy-rgb-honor-gold) / 0.045) 0%, transparent 50%);
}

@media (prefers-reduced-motion: no-preference) {
  .app-shell__veil {
    animation: buddy-app-veil 24s ease-in-out infinite alternate;
  }
}

@keyframes buddy-app-veil {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.68;
  }
  50% {
    transform: translate(-1.2%, 0.8%) scale(1.025);
    opacity: 0.82;
  }
  100% {
    transform: translate(0.6%, -0.4%) scale(1.01);
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-shell__veil {
    animation: none;
    opacity: 0.85;
    transform: none;
  }
}

.app-shell > :not(.app-shell__veil) {
  position: relative;
  z-index: 1;
}

.mock-strip {
  position: sticky;
  top: 0;
  z-index: 2000;
  padding: 8px 16px;
  font-size: 12px;
  text-align: center;
  color: #9a3412;
  background: linear-gradient(90deg, rgb(255 251 235) 0%, rgb(254 243 199 / 0.97) 50%, rgb(255 251 235) 100%);
  border-bottom: 1px solid rgb(251 191 36 / 0.38);
  animation: mock-strip-in 0.45s var(--buddy-ease-emphasized) both;
}

@keyframes mock-strip-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mock-strip {
    animation: none;
  }
}
</style>
