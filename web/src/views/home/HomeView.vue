<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import DevPortalHero from '@/components/devportal/DevPortalHero.vue'
import DevPortalMetrics from '@/components/devportal/DevPortalMetrics.vue'
import DevPortalQuickstart from '@/components/devportal/DevPortalQuickstart.vue'
import DevPortalIntegrations from '@/components/devportal/DevPortalIntegrations.vue'
import DevPortalApiConsole from '@/components/devportal/DevPortalApiConsole.vue'
import DevPortalStatusStrip from '@/components/devportal/DevPortalStatusStrip.vue'
import DevPortalChangelog from '@/components/devportal/DevPortalChangelog.vue'
import DevPortalForumPreview from '@/components/devportal/DevPortalForumPreview.vue'
import HomeCardSwiper from '@/components/home/HomeCardSwiper.vue'
import { buildHomeSwiperCards } from '@/data/homeSwiperCards'
import { MOCK_NEWS, mockPosts } from '@/mock/seedData'

const user = useUserStore()

/** 保留：QQ 音乐风格主题卡片轮播（≥3 张 loop 两侧露边） */
const homeSwiperCards = computed(() => buildHomeSwiperCards(user.agentChatUnlocked))

const greeting = computed(() => {
  const n = user.profile?.nickname?.trim()
  return n ? `${n}，欢迎进入开发者门户` : '欢迎进入开发者门户'
})

const portalLead = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜间构建也要注意休息：凭证与沙箱状态可在下方一站式查看。'
  if (h < 12) return '上午适合对齐集成计划：先扫一遍功能地图，再拉起第一条示例请求。'
  if (h < 18) return '下午好：查阅 Changelog 与论坛讨论，确认是否有影响集成的变更。'
  return '晚上好：适合跑通沙箱联调；智能体工作台可用于场景化验收。'
})

const metricsItems = computed(() => [
  {
    label: '资讯条目',
    value: String(MOCK_NEWS.length),
    hint: '打开资讯流',
    to: '/app/feed',
  },
  {
    label: '社区帖子',
    value: String(mockPosts.length),
    hint: '开发者讨论',
    to: '/app/forum',
  },
  {
    label: '沙箱 / 智能体',
    value: user.agentChatUnlocked ? '已解锁' : '待解锁',
    hint: user.agentChatUnlocked ? '进入对话' : '前往工作台',
    to: user.agentChatUnlocked ? '/app/agent/chat' : '/app/agent',
  },
])

const changelogItems = MOCK_NEWS.slice(0, 5)
const forumPreview = mockPosts.slice(0, 4)
</script>

<template>
  <div class="home-view dp-page buddy-page app-page-stack" aria-label="开发者门户首页">
    <div class="dp-page__swiper" aria-label="主题卡片轮播">
      <HomeCardSwiper compact full-bleed :items="homeSwiperCards" />
    </div>

    <DevPortalHero :greeting="greeting" :lead="portalLead" />

    <DevPortalMetrics :items="metricsItems" />

    <nav class="dp-page__jump" aria-label="本页导航">
      <span class="dp-page__jump-label">跳转</span>
      <RouterLink class="dp-page__jump-link" :to="{ name: 'home', hash: '#dp-credentials' }">凭证</RouterLink>
      <span class="dp-page__jump-sep" aria-hidden="true">·</span>
      <RouterLink class="dp-page__jump-link" :to="{ name: 'home', hash: '#home-news' }">Changelog</RouterLink>
      <span class="dp-page__jump-sep" aria-hidden="true">·</span>
      <RouterLink class="dp-page__jump-link" :to="{ name: 'home', hash: '#home-forum' }">讨论</RouterLink>
    </nav>

    <DevPortalQuickstart />

    <DevPortalIntegrations />

    <DevPortalApiConsole />

    <DevPortalStatusStrip />

    <DevPortalChangelog :items="changelogItems" />

    <DevPortalForumPreview :posts="forumPreview" />
  </div>
</template>

<style scoped>
/* 沉浸背景：tokens 基底 + 當前輪播卡主題光暈（--current-theme-rgb 由 HomeCardSwiper 同步） */
.home-view {
  background:
    var(--home-bg-gradient),
    radial-gradient(ellipse 120% 80% at 50% 0%, rgb(var(--current-theme-rgb) / 0.09), transparent 55%),
    radial-gradient(ellipse 90% 60% at 100% 100%, rgb(var(--current-theme-rgb) / 0.06), transparent 50%),
    radial-gradient(circle at 0% 0%, #f0f4ff 0%, transparent 52%),
    radial-gradient(circle at 100% 100%, #e6e9ff 0%, transparent 48%),
    #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
  transition: background 0.6s ease;
}

.dp-page {
  padding-bottom: 36px;
  max-width: min(768px, 100%);
  margin: 0 auto;
  position: relative;
}

@media (min-width: 1100px) {
  .dp-page {
    max-width: min(1040px, 94vw);
  }
}

@media (min-width: 1280px) {
  .dp-page {
    max-width: min(1120px, 92vw);
  }
}

.dp-page__swiper {
  margin-bottom: 8px;
  /* 避免 app-page-stack 將首屏輪播壓成 0 高度（內層 Swiper 延遲量測時） */
  flex-shrink: 0;
}

.dp-page::before {
  content: '';
  position: absolute;
  width: min(320px, 70vw);
  height: min(320px, 70vw);
  top: -60px;
  right: -80px;
  border-radius: 50%;
  filter: blur(64px);
  opacity: 0.45;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(circle, rgb(var(--buddy-rgb-brand) / 0.2) 0%, transparent 65%);
}

.dp-page__jump {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgb(15 23 42 / 0.07);
  background: rgb(255 255 255 / 0.85);
  box-shadow: 0 2px 12px rgb(15 23 42 / 0.04);
}

.dp-page__jump-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--buddy-rgb-brand) / 0.7);
}

.dp-page__jump-link {
  font-size: 12px;
  font-weight: 700;
  color: var(--buddy-primary);
  text-decoration: none;
}

.dp-page__jump-link:hover {
  text-decoration: underline;
}

.dp-page__jump-sep {
  color: var(--buddy-text-muted);
  font-weight: 600;
}

/* 快捷与模块卡片：统一更大圆角 + 柔和阴影（子组件 scoped，用 :deep） */
.home-view :deep(.dp-page__jump) {
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  border-color: rgba(15, 23, 42, 0.06);
}

.home-view :deep(.dp-qs) {
  border-radius: 20px;
  box-shadow: 0 6px 28px rgba(15, 23, 42, 0.06);
}

.home-view :deep(.dp-qs__item) {
  border-radius: 16px;
}

.home-view :deep(.dp-metrics) {
  border-radius: 20px;
  box-shadow: 0 6px 28px rgba(15, 23, 42, 0.05);
}

.home-view :deep(.dp-metrics__card) {
  border-radius: 16px;
}

.home-view :deep(.dp-hero) {
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
}

.home-view :deep(.dp-int__card) {
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
}

.home-view :deep(.dp-api),
.home-view :deep(.dp-status),
.home-view :deep(.dp-cl),
.home-view :deep(.dp-fp) {
  border-radius: 20px;
  box-shadow: 0 6px 28px rgba(15, 23, 42, 0.05);
}
</style>
