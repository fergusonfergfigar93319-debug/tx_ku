<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound,
  ChatLineRound,
  Cpu,
  FolderOpened,
  Grid,
  Location,
  Lock,
  Message,
  Position,
  Search,
  TrophyBase,
} from '@element-plus/icons-vue'
import * as authApi from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { isDevQuickLoginEnabled } from '@/dev/quickLogin'
import { isProfileComplete } from '@/utils/profile'
import BuddyBackButton from '@/components/buddy/BuddyBackButton.vue'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const isDev = isDevQuickLoginEnabled()
const hasDevEnvCredentials = Boolean(
  import.meta.env.VITE_DEV_EMAIL?.trim() && import.meta.env.VITE_DEV_PASSWORD
)

const loading = ref(false)
const devLoading = ref(false)
const showHistoryBack = ref(false)

onMounted(() => {
  showHistoryBack.value = typeof window !== 'undefined' && window.history.length > 1
})
const form = reactive({
  email: '',
  password: '',
})

async function submit() {
  loading.value = true
  try {
    const res = await authApi.login({ email: form.email, password: form.password })
    user.hydrateFromLoginResponse(res)
    await user.fetchProfile()
    const redirect = (route.query.redirect as string) || ''
    if (redirect && redirect.startsWith('/')) {
      void router.replace(redirect)
      return
    }
    if (!isProfileComplete(user.profile)) {
      void router.replace('/onboarding')
    } else if (!user.gameInterestCompleted) {
      void router.replace('/game-interest')
    } else {
      void router.replace('/app/home')
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '登录失败')
  } finally {
    loading.value = false
  }
}

function devQuickEnter() {
  user.devQuickLoginMock()
  void router.replace('/app/home')
}

async function devEnvLogin() {
  devLoading.value = true
  try {
    const ok = await user.devLoginWithEnvCredentials()
    if (!ok) {
      ElMessage.warning('请在 .env.development.local 中配置 VITE_DEV_EMAIL 与 VITE_DEV_PASSWORD')
      return
    }
    const redirect = (route.query.redirect as string) || ''
    if (redirect && redirect.startsWith('/')) {
      void router.replace(redirect)
      return
    }
    if (!isProfileComplete(user.profile)) {
      void router.replace('/onboarding')
    } else if (!user.gameInterestCompleted) {
      void router.replace('/game-interest')
    } else {
      void router.replace('/app/home')
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '测试账号登录失败')
  } finally {
    devLoading.value = false
  }
}
</script>

<template>
  <div class="auth-shell auth-shell--login-rich">
    <div class="auth-aurora" aria-hidden="true">
      <div class="auth-aurora__mesh" />
      <div class="auth-aurora__dots" />
      <span class="auth-aurora__arc auth-aurora__arc--tl" />
      <span class="auth-aurora__arc auth-aurora__arc--br" />
      <span class="auth-aurora__blob auth-aurora__blob--a" />
      <span class="auth-aurora__blob auth-aurora__blob--b" />
      <span class="auth-aurora__blob auth-aurora__blob--c" />
      <span class="auth-aurora__blob auth-aurora__blob--d" />
    </div>

    <BuddyBackButton
      v-if="showHistoryBack"
      class="auth-float-back"
      theme="light"
      :fallback="{ name: 'splash' }"
      prefer-history
    />

    <div class="auth-grid">
      <aside class="auth-showcase">
        <div class="auth-showcase__glow" aria-hidden="true" />
        <span class="auth-float-tag auth-float-tag--kbd" aria-hidden="true">⌨ Ctrl+K</span>
        <span class="auth-float-tag auth-float-tag--wide" aria-hidden="true">宽屏多栏</span>
        <div class="auth-showcase__frame">
        <div class="auth-showcase__inner">
          <div class="auth-showcase__kicker">
            <p class="auth-showcase__eyebrow">峡谷工作台 · 浏览器优先</p>
            <span class="auth-showcase__portal-pill">Developer Portal</span>
          </div>
          <h1 class="auth-showcase__title">元流同频</h1>
          <p class="auth-showcase__tagline">电竞 · 文旅 · 潮流 · 场景化 AI</p>

          <div class="auth-hero-art" aria-hidden="true">
            <div class="auth-hero-art__canvas">
            <svg class="auth-hero-art__svg" viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="authHeroSky" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="rgb(37 99 235 / 0.12)" />
                  <stop offset="55%" stop-color="rgb(124 58 237 / 0.08)" />
                  <stop offset="100%" stop-color="rgb(13 148 136 / 0.1)" />
                </linearGradient>
                <linearGradient id="authHeroRift" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#fbbf24" />
                  <stop offset="100%" stop-color="#0d9488" />
                </linearGradient>
                <filter id="authHeroGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="420" height="200" rx="20" fill="url(#authHeroSky)" />
              <path
                d="M0 140 L85 72 L142 118 L210 48 L268 96 L332 58 L420 132 L420 200 L0 200 Z"
                fill="rgb(30 58 138 / 0.14)"
              />
              <path
                d="M0 155 L72 98 L130 132 L198 78 L255 118 L318 82 L420 148 L420 200 L0 200 Z"
                fill="rgb(37 99 235 / 0.1)"
              />
              <path
                d="M198 48 L210 200"
                stroke="url(#authHeroRift)"
                stroke-width="4"
                stroke-linecap="round"
                filter="url(#authHeroGlow)"
                opacity="0.9"
              />
              <circle cx="92" cy="88" r="5" fill="rgb(37 99 235 / 0.55)" />
              <circle cx="268" cy="68" r="4" fill="rgb(245 158 11 / 0.65)" />
              <circle cx="338" cy="92" r="4" fill="rgb(13 148 136 / 0.55)" />
              <g opacity="0.85">
                <rect x="312" y="112" width="36" height="44" rx="4" fill="rgb(255 255 255 / 0.5)" />
                <rect x="318" y="120" width="24" height="6" rx="2" fill="rgb(37 99 235 / 0.35)" />
                <rect x="318" y="132" width="24" height="4" rx="1" fill="rgb(124 58 237 / 0.25)" />
              </g>
              <path
                d="M48 128 Q210 108 372 124"
                fill="none"
                stroke="rgb(37 99 235 / 0.2)"
                stroke-width="2"
                stroke-dasharray="6 8"
              />
            </svg>
            <div class="auth-hero-art__chips">
              <span class="auth-hero-art__chip"><el-icon><TrophyBase /></el-icon>赛事</span>
              <span class="auth-hero-art__chip"><el-icon><Location /></el-icon>文旅</span>
              <span class="auth-hero-art__chip"><el-icon><Cpu /></el-icon>AI</span>
            </div>
            </div>
            <p class="auth-hero-art__caption">线上峡谷，线下同频</p>
          </div>

          <div class="auth-showcase__metrics" aria-label="产品亮点">
            <div class="auth-metric auth-metric--blue">
              <span class="auth-metric__icon" aria-hidden="true"><el-icon><Grid /></el-icon></span>
              <span class="auth-metric__val">多栏</span>
              <span class="auth-metric__lbl">资讯与广场同屏</span>
            </div>
            <div class="auth-metric auth-metric--violet">
              <span class="auth-metric__icon" aria-hidden="true"><el-icon><Search /></el-icon></span>
              <span class="auth-metric__val">Ctrl+K</span>
              <span class="auth-metric__lbl">全局搜索与指令</span>
            </div>
            <div class="auth-metric auth-metric--teal">
              <span class="auth-metric__icon" aria-hidden="true"><el-icon><ChatDotRound /></el-icon></span>
              <span class="auth-metric__val">AI+</span>
              <span class="auth-metric__lbl">搭子与场景共创</span>
            </div>
          </div>

          <ul class="auth-showcase__personas" aria-label="适合谁">
            <li>赛事党</li>
            <li>文旅打卡</li>
            <li>开黑招募</li>
            <li>潮流共创</li>
          </ul>
        </div>
        </div>
      </aside>

      <div class="auth-stack">
        <header class="auth-brand auth-brand--hide-desktop">
          <div class="auth-logo-ring">
            <span class="auth-logo-core">元</span>
          </div>
          <h1 class="auth-brand-title">元流同频</h1>
          <p class="auth-brand-sub">电竞 IP × 文旅 × 潮流 · 场景化 AI 体验</p>
          <div class="auth-brand-chips">
            <span class="auth-chip auth-chip--brand">王者电竞气质</span>
            <span class="auth-chip auth-chip--accent">峡谷广场</span>
            <span class="auth-chip auth-chip--gold">荣耀金点缀</span>
          </div>
        </header>

        <el-card class="auth-glass-card auth-glass-card--rift" shadow="never">
          <template #header>
            <div class="auth-card-head">
              <div class="auth-card-head__visual" aria-hidden="true">
                <svg class="auth-card-head__svg" viewBox="0 0 80 72" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="authCardMiniSky" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="rgb(37 99 235 / 0.2)" />
                      <stop offset="100%" stop-color="rgb(124 58 237 / 0.12)" />
                    </linearGradient>
                    <linearGradient id="authCardMiniBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#fbbf24" />
                      <stop offset="100%" stop-color="#2563eb" />
                    </linearGradient>
                  </defs>
                  <rect width="80" height="72" rx="16" fill="url(#authCardMiniSky)" />
                  <path
                    d="M8 52 L22 28 L36 40 L52 20 L64 34 L72 52"
                    fill="none"
                    stroke="rgb(37 99 235 / 0.25)"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M38 16 L40 56"
                    stroke="url(#authCardMiniBeam)"
                    stroke-width="3"
                    stroke-linecap="round"
                    opacity="0.95"
                  />
                  <circle cx="24" cy="32" r="3" fill="rgb(37 99 235 / 0.45)" />
                  <circle cx="56" cy="36" r="2.5" fill="rgb(245 158 11 / 0.6)" />
                </svg>
              </div>
              <div class="auth-card-head__body">
                <p class="auth-card-eyebrow">账户 · Account</p>
                <h2 class="auth-card-title">欢迎回到峡谷工作台</h2>
                <p class="auth-card-hint">同频接续：资讯流、峡谷广场与 AI 搭子</p>
              </div>
            </div>
          </template>

          <div class="auth-card-pillars" aria-label="登录后可使用">
            <div class="auth-pillar auth-pillar--blue">
              <span class="auth-pillar__icon" aria-hidden="true"><el-icon><FolderOpened /></el-icon></span>
              <span class="auth-pillar__lbl">数据云同步</span>
              <span class="auth-pillar__sub">档案与偏好</span>
            </div>
            <div class="auth-pillar auth-pillar--violet">
              <span class="auth-pillar__icon" aria-hidden="true"><el-icon><ChatLineRound /></el-icon></span>
              <span class="auth-pillar__lbl">AI 会话</span>
              <span class="auth-pillar__sub">智能体接续</span>
            </div>
            <div class="auth-pillar auth-pillar--teal">
              <span class="auth-pillar__icon" aria-hidden="true"><el-icon><Position /></el-icon></span>
              <span class="auth-pillar__lbl">无缝返回</span>
              <span class="auth-pillar__sub">续接原页面</span>
            </div>
          </div>

          <el-form class="auth-form login-form" label-position="top" @submit.prevent="submit">
            <el-form-item label="邮箱">
              <el-input
                v-model="form.email"
                type="email"
                autocomplete="username"
                placeholder="name@example.com"
                size="large"
                class="auth-input-rich"
              >
                <template #prefix>
                  <el-icon class="auth-input-rich__ico"><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="form.password"
                type="password"
                show-password
                autocomplete="current-password"
                placeholder="输入密码"
                size="large"
                class="auth-input-rich"
              >
                <template #prefix>
                  <el-icon class="auth-input-rich__ico"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                class="auth-form-primary"
                size="large"
                :loading="loading"
                native-type="submit"
                @click="submit"
              >
                登录
              </el-button>
            </el-form-item>
            <div class="auth-form-footer">
              <router-link class="auth-footer-link" to="/register"
                >没有账号？<strong>立即注册</strong></router-link
              >
            </div>
          </el-form>

          <template v-if="isDev">
            <el-divider class="dev-divider">开发者通道</el-divider>
            <p class="dev-hint">仅开发模式（npm run dev）可见，生产构建不包含。</p>
            <el-button class="dev-btn dev-btn-mock" plain @click="devQuickEnter">快速进入主界面（模拟会话）</el-button>
            <el-button
              v-if="hasDevEnvCredentials"
              class="dev-btn dev-btn-env"
              plain
              :loading="devLoading"
              @click="devEnvLogin"
            >
              使用 .env 测试账号登录
            </el-button>
          </template>
        </el-card>
      </div>
    </div>

    <div class="auth-wave" aria-hidden="true">
      <svg class="auth-wave__svg" viewBox="0 0 1440 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="rgb(255 255 255 / 0.35)"
          d="M0 32 C180 8 360 40 540 24 C720 8 900 36 1080 22 C1260 8 1320 28 1440 18 L1440 48 L0 48 Z"
        />
        <path
          fill="rgb(37 99 235 / 0.06)"
          d="M0 38 C200 18 400 42 600 28 C800 14 1000 38 1200 26 C1320 18 1400 32 1440 28 L1440 48 L0 48 Z"
        />
      </svg>
    </div>

    <p class="auth-compliance">
      元流同频为第三方社区工具，非《王者荣耀》客户端、腾讯或相关权利方官方产品；与官方无隶属关系。
    </p>
  </div>
</template>

<style scoped>
.auth-float-back {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 5;
}

.login-form {
  padding-top: 0;
}

.login-form :deep(.el-input__prefix) {
  margin-right: 4px;
}

.dev-divider {
  margin: 20px 0 12px;
}

.dev-divider :deep(.el-divider__text) {
  background: linear-gradient(165deg, rgb(255 255 255 / 0.95) 0%, rgb(248 250 252 / 0.9) 100%);
  color: var(--buddy-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.dev-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--buddy-text-muted);
  line-height: 1.45;
}

.dev-btn {
  width: 100%;
  border-radius: 12px !important;
}

.dev-btn-mock {
  border-color: rgb(217 119 6 / 0.42) !important;
  color: #a16207 !important;
  background: linear-gradient(180deg, rgb(255 251 235) 0%, var(--buddy-amber-soft) 100%) !important;
}

.dev-btn-env {
  margin-top: 8px;
  border-color: rgb(22 163 74 / 0.38) !important;
  color: #15803d !important;
  background: linear-gradient(180deg, rgb(240 253 244) 0%, rgb(220 252 231 / 0.96) 100%) !important;
}

.auth-form-footer {
  text-align: center;
  padding-top: 6px;
}
</style>
