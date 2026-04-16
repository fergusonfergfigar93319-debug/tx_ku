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
  <div class="home-view home-view--dp dp-page buddy-page app-page-stack" aria-label="开发者门户首页">
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
/* ==========================================================
   1. 全局页面背景 (完美融合深浅色模式)
   ========================================================== */
.home-view {
  min-height: 100vh;
  box-sizing: border-box;
  transition: background 0.6s ease;
}

:global(html:not(.dark)) .home-view {
  background:
    radial-gradient(ellipse 120% 320px at 50% 0%, rgb(var(--current-theme-rgb) / 0.12) 0%, transparent 100%),
    linear-gradient(180deg, #0f172a 0%, #1e293b 260px, #e2e8f0 320px, #f8fafc 400px, var(--buddy-page-bg) 600px);
}

:global(html.dark) .home-view {
  background:
    radial-gradient(ellipse 120% 320px at 50% 0%, rgb(var(--current-theme-rgb) / 0.18) 0%, transparent 100%),
    linear-gradient(180deg, #0f172a 0%, #020617 100%);
}

.home-view--dp.app-page-stack { gap: 24px; padding-top: 12px; }
.dp-page__swiper { margin-bottom: 32px; flex-shrink: 0; }

/* ==========================================================
   2. 彻底粉碎丑陋的外部大方块 (释放真实的独立卡片)
   ========================================================== */
.home-view :deep(.dp-metrics),
.home-view :deep(.dp-qs),
.home-view :deep(.dp-int) {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

/* ==========================================================
   3. BENTO BOX 独立便当盒卡片 (亮色模式)
   ========================================================== */
:global(html:not(.dark)) .home-view :deep(.dp-hero),
:global(html:not(.dark)) .home-view :deep(.dp-metrics__card),
:global(html:not(.dark)) .home-view :deep(.dp-qs__item),
:global(html:not(.dark)) .home-view :deep(.dp-int__card),
:global(html:not(.dark)) .home-view :deep(.dp-api),
:global(html:not(.dark)) .home-view :deep(.dp-status),
:global(html:not(.dark)) .home-view :deep(.dp-cl),
:global(html:not(.dark)) .home-view :deep(.dp-fp) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.6) 100%) !important;
  backdrop-filter: blur(20px) saturate(150%) !important;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  border-bottom-color: rgba(226, 232, 240, 0.6) !important;
  box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  border-radius: 20px !important;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

/* ==========================================================
   4. BENTO BOX 独立便当盒卡片 (暗黑模式 - 霓虹霜化玻璃)
   ========================================================== */
:global(html.dark) .home-view :deep(.dp-hero),
:global(html.dark) .home-view :deep(.dp-metrics__card),
:global(html.dark) .home-view :deep(.dp-qs__item),
:global(html.dark) .home-view :deep(.dp-int__card),
:global(html.dark) .home-view :deep(.dp-api),
:global(html.dark) .home-view :deep(.dp-status),
:global(html.dark) .home-view :deep(.dp-cl),
:global(html.dark) .home-view :deep(.dp-fp) {
  /* 注入微弱的深蓝紫底光，打破死灰 */
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
  backdrop-filter: blur(24px) saturate(200%) !important;
  /* 提亮外部物理边框 */
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-top-color: rgba(255, 255, 255, 0.2) !important;
  /* 核心：内发光 (Inset) + 外部弥散光晕 (Glow) */
  box-shadow:
    0 16px 32px -8px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(59, 130, 246, 0.08),
    0 1px 1px rgba(255, 255, 255, 0.15) inset !important;
  border-radius: 20px !important;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  color: #f8fafc !important; /* 保证文字颜色 */
}

/* 修复暗色模式下的小字颜色 */
:global(html.dark) .home-view :deep(.dp-metrics__label),
:global(html.dark) .home-view :deep(.dp-metrics__k),
:global(html.dark) .home-view :deep(.dp-metrics__hint),
:global(html.dark) .home-view :deep(.dp-hero p) {
  color: #94a3b8 !important;
}

/* ==========================================================
   5. 统一磁悬浮悬停特效 (Hover)
   ========================================================== */
.home-view :deep(.dp-hero):hover,
.home-view :deep(.dp-metrics__card):hover,
.home-view :deep(.dp-qs__item):hover,
.home-view :deep(.dp-int__card):hover,
.home-view :deep(.dp-api):hover,
.home-view :deep(.dp-status):hover,
.home-view :deep(.dp-cl):hover,
.home-view :deep(.dp-fp):hover {
  transform: translateY(-4px) scale(1.02) !important;
}

/* 暗色模式的专属 Hover 光晕爆发 */
:global(html.dark) .home-view :deep(.dp-hero):hover,
:global(html.dark) .home-view :deep(.dp-metrics__card):hover,
:global(html.dark) .home-view :deep(.dp-qs__item):hover,
:global(html.dark) .home-view :deep(.dp-int__card):hover,
:global(html.dark) .home-view :deep(.dp-api):hover,
:global(html.dark) .home-view :deep(.dp-status):hover,
:global(html.dark) .home-view :deep(.dp-cl):hover,
:global(html.dark) .home-view :deep(.dp-fp):hover {
  border-color: rgba(96, 165, 250, 0.5) !important;
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.9),
    0 0 30px rgba(59, 130, 246, 0.25),
    0 1px 1px rgba(255, 255, 255, 0.3) inset !important;
}

/* ==========================================================
   6. 数据穿透爆改：点亮沉闷的数字与标题
   ========================================================== */
/* 为 Metrics 里面的大数字加上极光渐变 */
.home-view :deep(.dp-metrics__value),
.home-view :deep(.dp-metrics__v),
.home-view :deep(.dp-metrics__card strong) {
  background: linear-gradient(135deg, #38bdf8 0%, #a855f7 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  font-weight: 900 !important;
}

/* 暗色模式下，大数字和欢迎语自带霓虹发光 */
:global(html.dark) .home-view :deep(.dp-metrics__value),
:global(html.dark) .home-view :deep(.dp-metrics__v),
:global(html.dark) .home-view :deep(.dp-metrics__card strong) {
  filter: drop-shadow(0 2px 8px rgba(168, 85, 247, 0.4)) !important;
}

:global(html.dark) .home-view :deep(.dp-hero h1),
:global(html.dark) .home-view :deep(.dp-hero .dp-hero__title),
:global(html.dark) .home-view :deep(.dp-hero .dp-hero__greeting) {
  background: linear-gradient(to right, #f8fafc, #93c5fd) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  filter: drop-shadow(0 2px 10px rgba(147, 197, 253, 0.3)) !important;
}

/* ==========================================================
   7. 胶囊跳跃导航条 (Jump Nav)
   ========================================================== */
.home-view :deep(.dp-page__jump) {
  border-radius: 999px !important;
  padding: 12px 32px !important;
  margin: 8px auto 16px !important;
  width: fit-content !important;
  display: flex !important;
  gap: 16px !important;
  align-items: center !important;
}

:global(html:not(.dark)) .home-view :deep(.dp-page__jump) {
  background: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 1) !important;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05) !important;
}

:global(html.dark) .home-view :deep(.dp-page__jump) {
  background: rgba(15, 23, 42, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 16px rgba(59, 130, 246, 0.15) !important;
}

:global(html.dark) .home-view :deep(.dp-page__jump-link) {
  color: #60a5fa !important;
  text-shadow: 0 0 8px rgba(96, 165, 250, 0.4) !important;
}

:global(html.dark) .home-view :deep(.dp-page__jump-label) {
  color: #94a3b8 !important;
}

/* ==========================================================
   暴力破解：強制消除所有首頁組件的 Element Plus / App Layer 外殼
   ========================================================== */
:global(.home-view .el-card),
:global(.home-view .app-layer),
:global(.home-view .buddy-card-surface) {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

:global(.home-view .el-card__body),
:global(.home-view .app-layer__inner) {
  padding: 0 !important; /* 消除外殼自帶的內邊距，讓裡面的 Bento Box 撐滿 */
}

/* ==========================================================
   重新賦予內部元素 Bento Box 質感 (亮色模式)
   ========================================================== */
:global(html:not(.dark)) .home-view .dp-metrics,
:global(html:not(.dark)) .home-view .dp-hero,
:global(html:not(.dark)) .home-view .dp-api,
:global(html:not(.dark)) .home-view .dp-status,
:global(html:not(.dark)) .home-view .dp-cl,
:global(html:not(.dark)) .home-view .dp-fp {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.6) 100%) !important;
  backdrop-filter: blur(24px) saturate(150%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(150%) !important;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  border-radius: 24px !important;
  box-shadow:
    0 12px 28px -6px rgba(15, 23, 42, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  padding: 24px !important; /* 為這些組件重新提供內邊距 */
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease !important;
}

/* ==========================================================
   重新賦予內部元素 Bento Box 質感 (暗色霓虹模式)
   ========================================================== */
:global(html.dark) .home-view .dp-metrics,
:global(html.dark) .home-view .dp-hero,
:global(html.dark) .home-view .dp-api,
:global(html.dark) .home-view .dp-status,
:global(html.dark) .home-view .dp-cl,
:global(html.dark) .home-view .dp-fp {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
  backdrop-filter: blur(24px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-top-color: rgba(255, 255, 255, 0.2) !important;
  border-radius: 24px !important;
  box-shadow:
    0 16px 32px -8px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(59, 130, 246, 0.08),
    0 1px 1px rgba(255, 255, 255, 0.15) inset !important;
  padding: 24px !important;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease !important;
}

/* 統一懸停浮起 */
:global(.home-view .dp-metrics:hover),
:global(.home-view .dp-hero:hover),
:global(.home-view .dp-api:hover),
:global(.home-view .dp-status:hover),
:global(.home-view .dp-cl:hover),
:global(.home-view .dp-fp:hover) {
  transform: translateY(-4px) scale(1.01) !important;
}

/* 暗色模式懸停發光 */
:global(html.dark) .home-view .dp-metrics:hover,
:global(html.dark) .home-view .dp-hero:hover,
:global(html.dark) .home-view .dp-api:hover,
:global(html.dark) .home-view .dp-status:hover,
:global(html.dark) .home-view .dp-cl:hover,
:global(html.dark) .home-view .dp-fp:hover {
  border-color: rgba(96, 165, 250, 0.5) !important;
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.9),
    0 0 36px rgba(59, 130, 246, 0.25),
    0 1px 1px rgba(255, 255, 255, 0.3) inset !important;
}
</style>
