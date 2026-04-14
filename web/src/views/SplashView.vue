<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/api/http'
import { isProfileComplete } from '@/utils/profile'

const router = useRouter()
const user = useUserStore()

const lottieRef = ref<HTMLElement | null>(null)
let lottieAnim: { destroy: () => void } | null = null

onMounted(async () => {
  try {
    const lottie = (await import('lottie-web')).default
    if (lottieRef.value) {
      lottieAnim = lottie.loadAnimation({
        container: lottieRef.value,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: `${import.meta.env.BASE_URL}lottie/splash.json`,
      })
    }
  } catch {
    /* 无 Lottie 时保留下方 Loading 图标 */
  }
  const delay = () => new Promise((r) => setTimeout(r, 1000))
  await delay()

  const token = getToken()
  if (!token) {
    void router.replace('/login')
    return
  }

  try {
    await user.fetchProfile()
  } catch {
    void router.replace('/login')
    return
  }

  if (!isProfileComplete(user.profile)) {
    void router.replace('/onboarding')
    return
  }

  if (!user.gameInterestCompleted) {
    void router.replace('/game-interest')
    return
  }

  void router.replace('/app/home')
})

onBeforeUnmount(() => {
  lottieAnim?.destroy()
  lottieAnim = null
})
</script>

<template>
  <div class="splash buddy-page">
    <div class="splash__glow" aria-hidden="true" />
    <div class="brand buddy-card-surface">
      <h1 class="splash-title">元流同频</h1>
      <p class="sub">电竞 IP × 文旅 × 潮流 · 场景化 AI 体验</p>
      <p class="splash-tagline">峡谷工作台加载中…</p>
      <div ref="lottieRef" class="splash-lottie" aria-hidden="true" />
      <el-icon class="spin splash-spin-fallback" :size="36"><Loading /></el-icon>
    </div>
  </div>
</template>

<style scoped>
.splash {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--buddy-page-bg);
  isolation: isolate;
  overflow: hidden;
}

.splash__glow {
  position: absolute;
  inset: -20%;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 30% 40%, rgb(var(--buddy-rgb-brand) / 0.14) 0%, transparent 42%),
    radial-gradient(circle at 75% 65%, rgb(var(--buddy-rgb-accent) / 0.12) 0%, transparent 45%),
    radial-gradient(circle at 50% 100%, rgb(var(--buddy-rgb-honor-gold) / 0.1) 0%, transparent 48%);
  opacity: 0.85;
}

@media (prefers-reduced-motion: no-preference) {
  .splash__glow {
    animation: splash-aurora 14s ease-in-out infinite alternate;
  }
}

@keyframes splash-aurora {
  0% {
    transform: scale(1) translate(0, 0);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.06) translate(2%, -1%);
    opacity: 1;
  }
}

.brand {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 48px 40px;
  max-width: 380px;
  animation: splash-card-in 0.75s var(--buddy-ease-emphasized) both;
}

@media (prefers-reduced-motion: no-preference) {
  .brand {
    box-shadow:
      var(--buddy-shadow-card),
      0 0 40px rgb(var(--buddy-rgb-honor-gold) / 0.1);
  }
}

@keyframes splash-card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand {
    animation: none;
  }
}

.splash-tagline {
  margin: 0 0 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--buddy-text-muted);
  text-transform: uppercase;
  opacity: 0.9;
  animation: splash-tagline-pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .splash-tagline {
    animation: none;
  }
}

@keyframes splash-tagline-pulse {
  0%,
  100% {
    opacity: 0.65;
  }
  50% {
    opacity: 1;
  }
}

.splash-title {
  margin: 0 0 8px;
  font-size: 28px;
  letter-spacing: 0.12em;
  font-weight: 800;
  background: var(--buddy-gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sub {
  margin: 0 0 10px;
  color: var(--buddy-text-muted);
  font-size: 14px;
}

.splash-lottie {
  width: min(200px, 52vw);
  height: min(200px, 52vw);
  margin: 0 auto 16px;
}

.splash-spin-fallback {
  margin-top: 8px;
}

.spin {
  animation: spin 1s linear infinite;
  color: var(--buddy-amber);
  filter: drop-shadow(0 0 8px rgb(var(--buddy-rgb-honor-gold) / 0.35));
}

.splash-lottie:not(:empty) + .splash-spin-fallback {
  display: none;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
