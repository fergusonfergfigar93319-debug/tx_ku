<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BuddyBackButton from '@/components/buddy/BuddyBackButton.vue'
import { ElMessage } from 'element-plus'
import { Compass, Grid, Key, Message, UserFilled } from '@element-plus/icons-vue'
import * as authApi from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const user = useUserStore()

const loading = ref(false)
const form = reactive({
  email: '',
  password: '',
  nickname: '',
})

async function submit() {
  loading.value = true
  try {
    const res = await authApi.register({
      email: form.email,
      password: form.password,
      nickname: form.nickname || undefined,
    })
    user.hydrateFromLoginResponse(res)
    await user.fetchProfile()
    void router.replace('/onboarding')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-aurora" aria-hidden="true">
      <div class="auth-aurora__mesh" />
      <span class="auth-aurora__blob auth-aurora__blob--a" />
      <span class="auth-aurora__blob auth-aurora__blob--b" />
      <span class="auth-aurora__blob auth-aurora__blob--c" />
      <span class="auth-aurora__blob auth-aurora__blob--d" />
    </div>

    <BuddyBackButton class="auth-float-back" :fallback="{ name: 'login' }" />

    <div class="auth-grid">
      <aside class="auth-showcase">
        <div class="auth-showcase__glow" aria-hidden="true" />
        <div class="auth-showcase__inner">
          <div class="auth-showcase__kicker">
            <p class="auth-showcase__eyebrow">新召唤师 · 同频入驻</p>
            <span class="auth-showcase__portal-pill">Join the flow</span>
          </div>
          <h1 class="auth-showcase__title">加入元流同频</h1>
          <p class="auth-showcase__tagline">一步注册 · 完整工作台体验</p>

          <div class="auth-hero-art auth-hero-art--join" aria-hidden="true">
            <svg class="auth-hero-art__svg" viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="authRegSky" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="rgb(245 158 11 / 0.14)" />
                  <stop offset="45%" stop-color="rgb(37 99 235 / 0.1)" />
                  <stop offset="100%" stop-color="rgb(124 58 237 / 0.1)" />
                </linearGradient>
                <linearGradient id="authRegArch" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="rgb(37 99 235 / 0.45)" />
                  <stop offset="100%" stop-color="rgb(13 148 136 / 0.35)" />
                </linearGradient>
                <radialGradient id="authRegGlow" cx="50%" cy="35%" r="55%">
                  <stop offset="0%" stop-color="rgb(251 191 36 / 0.35)" />
                  <stop offset="100%" stop-color="transparent" />
                </radialGradient>
              </defs>
              <rect width="420" height="200" rx="20" fill="url(#authRegSky)" />
              <ellipse cx="210" cy="56" rx="160" ry="48" fill="url(#authRegGlow)" />
              <path
                d="M118 178 L118 92 Q210 38 302 92 L302 178"
                fill="none"
                stroke="url(#authRegArch)"
                stroke-width="5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path d="M138 178 L138 108 Q210 62 282 108 L282 178" fill="rgb(255 255 255 / 0.35)" />
              <circle cx="210" cy="118" r="22" fill="rgb(37 99 235 / 0.15)" stroke="rgb(37 99 235 / 0.35)" stroke-width="2" />
              <path
                d="M202 118 L208 124 L220 110"
                fill="none"
                stroke="#15803d"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <g fill="rgb(245 158 11 / 0.75)">
                <circle cx="72" cy="64" r="3" />
                <circle cx="348" cy="72" r="2.5" />
                <circle cx="96" cy="148" r="2" />
              </g>
              <path
                d="M0 168 Q105 152 210 156 T420 162 L420 200 L0 200 Z"
                fill="rgb(30 58 138 / 0.08)"
              />
            </svg>
            <div class="auth-hero-art__chips">
              <span class="auth-hero-art__chip auth-hero-art__chip--join"><el-icon><Message /></el-icon>邮箱</span>
              <span class="auth-hero-art__chip auth-hero-art__chip--join"><el-icon><UserFilled /></el-icon>档案</span>
              <span class="auth-hero-art__chip auth-hero-art__chip--join"><el-icon><Compass /></el-icon>兴趣</span>
            </div>
          </div>

          <p class="auth-showcase__accent-line auth-showcase__accent-line--join">一次注册，同频开场</p>

          <div class="auth-showcase__metrics" aria-label="注册价值">
            <div class="auth-metric auth-metric--blue">
              <span class="auth-metric__icon" aria-hidden="true"><el-icon><Key /></el-icon></span>
              <span class="auth-metric__val">一步</span>
              <span class="auth-metric__lbl">邮箱即账号</span>
            </div>
            <div class="auth-metric auth-metric--violet">
              <span class="auth-metric__icon" aria-hidden="true"><el-icon><UserFilled /></el-icon></span>
              <span class="auth-metric__val">建档</span>
              <span class="auth-metric__lbl">昵称与元流名片</span>
            </div>
            <div class="auth-metric auth-metric--teal">
              <span class="auth-metric__icon" aria-hidden="true"><el-icon><Grid /></el-icon></span>
              <span class="auth-metric__val">全开</span>
              <span class="auth-metric__lbl">资讯 · 广场 · AI</span>
            </div>
          </div>

          <ol class="auth-reg-steps auth-reg-steps--inline" aria-label="注册后流程">
            <li>
              <span class="auth-reg-steps__num" aria-hidden="true">1</span>
              <span class="auth-reg-steps__ttl">账号</span>
            </li>
            <li>
              <span class="auth-reg-steps__num" aria-hidden="true">2</span>
              <span class="auth-reg-steps__ttl">档案</span>
            </li>
            <li>
              <span class="auth-reg-steps__num" aria-hidden="true">3</span>
              <span class="auth-reg-steps__ttl">兴趣</span>
            </li>
          </ol>
          <p class="auth-showcase__fine-print">密码建议 8 位以上；资料可随时在元流档案中修改。</p>
        </div>
      </aside>

      <div class="auth-stack">
        <header class="auth-brand auth-brand--hide-desktop">
          <div class="auth-logo-ring">
            <span class="auth-logo-core">元</span>
          </div>
          <h1 class="auth-brand-title">创建账号</h1>
          <p class="auth-brand-sub">邮箱注册 · onboarding 建档</p>
          <div class="auth-brand-chips">
            <span class="auth-chip auth-chip--brand">电竞 IP × 文旅</span>
            <span class="auth-chip auth-chip--accent">峡谷同频</span>
            <span class="auth-chip auth-chip--gold">场景化 AI</span>
          </div>
        </header>

        <el-card class="auth-glass-card auth-glass-card--rift" shadow="never">
          <template #header>
            <div>
              <p class="auth-card-eyebrow">注册 · Sign up</p>
              <h2 class="auth-card-title">创建你的同频账号</h2>
              <p class="auth-card-hint">邮箱用于登录与通知；昵称可稍后在档案中完善</p>
            </div>
          </template>

          <ul class="auth-card-perks auth-card-perks--compact" aria-label="注册即享">
            <li>注册后进入 onboarding</li>
            <li>解锁首页与峡谷广场</li>
            <li>AI 搭子随档案解锁</li>
          </ul>

          <el-form class="auth-form register-form" label-position="top" @submit.prevent="submit">
            <el-form-item label="邮箱">
              <el-input
                v-model="form.email"
                type="email"
                autocomplete="username"
                placeholder="name@example.com"
                size="large"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="form.password"
                type="password"
                show-password
                autocomplete="new-password"
                placeholder="至少 8 位，建议字母与数字组合"
                size="large"
              />
            </el-form-item>
            <el-form-item label="昵称（可选）">
              <el-input v-model="form.nickname" maxlength="32" show-word-limit size="large" placeholder="用于社区展示" />
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
                注册并建档
              </el-button>
            </el-form-item>
            <div class="auth-form-footer">
              <router-link class="auth-footer-link" to="/login"><strong>已有账号？</strong> 去登录</router-link>
            </div>
            <p class="auth-legal-line">
              注册即表示你同意我们的
              <a href="javascript:void(0)" @click.prevent>用户协议</a>
              与
              <a href="javascript:void(0)" @click.prevent>隐私说明</a>
              （示例链接，正式环境可替换为真实地址）。
            </p>
          </el-form>
        </el-card>
      </div>
    </div>

    <p class="auth-compliance">
      元流同频为第三方社区工具，非《王者荣耀》客户端、腾讯或相关权利方官方产品；与官方无隶属关系。请遵守游戏用户协议与社区规范。
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

.register-form {
  padding-top: 2px;
}

.auth-form-footer {
  text-align: center;
  padding-top: 6px;
}
</style>
