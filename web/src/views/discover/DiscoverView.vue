<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound,
  Collection,
  Compass,
  DataLine,
  Grid,
  HomeFilled,
  Reading,
  Refresh,
  Search,
  Share,
  Star,
  StarFilled,
  Timer,
  TrendCharts,
} from '@element-plus/icons-vue'
import * as feedApi from '@/api/feed'
import * as recApi from '@/api/recommendations'
import * as buddyApi from '@/api/buddyRequests'
import type { NewsItem } from '@/api/feed'
import type { RecommendationItem } from '@/types/recommendation'
import ReasonPanel from '@/components/buddy/ReasonPanel.vue'
import BuddyEmptyState from '@/components/buddy/BuddyEmptyState.vue'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'
import { loadFeedNewsPrefs, saveFeedNewsPrefs } from '@/utils/feedNewsPrefs'

const route = useRoute()
const tab = ref<'news' | 'rec'>('news')
const news = ref<NewsItem[]>([])
const recs = ref<RecommendationItem[]>([])
const loading = ref(false)
const page = ref(1)
const recError = ref(false)
const gameFilter = ref<'all' | 'honor_of_kings' | 'honor_esports'>('all')
const newsSearchQuery = ref('')
const syncHint = ref('')
const isWide = ref(false)

const _prefs = loadFeedNewsPrefs()
const likedNewsIds = ref<Set<string>>(new Set(_prefs.liked))
const savedNewsIds = ref<Set<string>>(new Set(_prefs.saved))

function persistNewsPrefs() {
  saveFeedNewsPrefs({
    liked: [...likedNewsIds.value],
    saved: [...savedNewsIds.value],
  })
}

const TRENDING_TOPICS = [
  { id: 'hot1', label: '新赛季环境', tag: 'Patch', heat: 982 },
  { id: 'hot2', label: '城市主场观赛攻略', tag: '文旅', heat: 812 },
  { id: 'hot3', label: 'KPL 复盘', tag: '电竞', heat: 641 },
  { id: 'hot4', label: 'AI 应援文案共创', tag: 'AI', heat: 598 },
  { id: 'hot5', label: '峡谷广场城市打卡', tag: 'UGC', heat: 556 },
] as const

let mq: MediaQueryList | null = null
function updateWide() {
  isWide.value = mq?.matches ?? false
}

const GAME_LABELS: Record<string, string> = {
  honor_of_kings: '王者荣耀',
  honor_esports: '王者电竞',
}

const filteredNews = computed(() => {
  const q = newsSearchQuery.value.trim().toLowerCase()
  const list = displayNews.value
  if (!q) return list
  return list.filter((n) => {
    const t = `${n.title} ${n.summary ?? ''} ${n.publisherDisplayName ?? ''}`.toLowerCase()
    return t.includes(q)
  })
})

const displayNews = computed(() => {
  if (gameFilter.value === 'all') return news.value
  return news.value.filter((n) => n.gameId === gameFilter.value)
})

function gameLabel(id?: string) {
  if (!id) return ''
  const mapped = GAME_LABELS[id]
  if (mapped) return mapped
  return ''
}

function newsChannelLabel(n: NewsItem) {
  if (n.publisherDisplayName) return n.publisherDisplayName
  return '资讯'
}

function isOfficialFeedTag(n: NewsItem) {
  const pub = n.publisherDisplayName ?? ''
  const label = newsChannelLabel(n)
  return /官方|赛训|KPL|赛事|公告|元流/.test(pub) || /官方|KPL|赛事/.test(label)
}

function fmtDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function touchSyncHint() {
  syncHint.value = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function toggleLikeNews(id: string) {
  const next = new Set(likedNewsIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  likedNewsIds.value = next
  persistNewsPrefs()
}

function toggleSaveNews(id: string) {
  const next = new Set(savedNewsIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  savedNewsIds.value = next
  persistNewsPrefs()
}

async function shareNews(n: NewsItem) {
  const url = `${window.location.origin}${window.location.pathname}#news-${n.id}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('资讯链接已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制链接')
  }
}

function applyTrendingSearch(label: string) {
  newsSearchQuery.value = label
}

async function loadNews() {
  loading.value = true
  try {
    const r = await feedApi.getNewsFeed({ page: page.value })
    news.value = r.list
    touchSyncHint()
  } finally {
    loading.value = false
  }
}

async function loadRecs() {
  loading.value = true
  recError.value = false
  try {
    const r = await recApi.getRecommendations({ page: page.value, size: 10 })
    recs.value = r.list
    touchSyncHint()
  } catch {
    recs.value = []
    recError.value = true
  } finally {
    loading.value = false
  }
}

async function applyBuddy(item: RecommendationItem) {
  try {
    await buddyApi.createBuddyRequest({
      targetUserId: item.userId,
      message: '看了你的名片，感觉很合拍，加个搭子吧！',
    })
    ElMessage.success('申请已发送')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '申请失败')
  }
}

function onSegChange(next: 'news' | 'rec') {
  tab.value = next
  if (next === 'news') void loadNews()
  else void loadRecs()
}

onMounted(() => {
  const q = route.query.tab
  if (q === 'rec' || q === 'news') tab.value = q
  mq = window.matchMedia('(min-width: 1100px)')
  updateWide()
  mq.addEventListener('change', updateWide)
  void loadNews()
  void loadRecs()
})

onBeforeUnmount(() => {
  mq?.removeEventListener('change', updateWide)
})

async function pullRefresh() {
  if (tab.value === 'news') await loadNews()
  else await loadRecs()
}

// ==========================================
// 🌟 3D 磁吸与动态流光追踪逻辑
// ==========================================
function handleMouseMove(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateX = ((y - centerY) / centerY) * -4 // 降低倾斜度，保证阅读性
  const rotateY = ((x - centerX) / centerX) * 4

  card.style.setProperty('--rx', `${rotateX}deg`)
  card.style.setProperty('--ry', `${rotateY}deg`)
  card.style.setProperty('--px', `${x}px`)
  card.style.setProperty('--py', `${y}px`)
}

function handleMouseLeave(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return

  card.style.setProperty('--rx', `0deg`)
  card.style.setProperty('--ry', `0deg`)
  card.style.setProperty('--px', `-1000px`)
}
</script>

<template>
  <div class="feed-layout app-page-stack">
    <header class="feed-hero" aria-label="版本速递概览">
      <div class="feed-hero__aurora">
        <span class="blob blob-a"></span>
        <span class="blob blob-b"></span>
        <span class="blob blob-c"></span>
      </div>

      <div class="feed-hero__content">
        <div class="hero-breadcrumbs">
          <RouterLink class="back-btn" to="/app/home">
            <el-icon><HomeFilled /></el-icon> 门户首页
          </RouterLink>
          <span class="hub-badge">MATRIX HUB</span>
        </div>
        <h1 class="hero-title">版本速递</h1>
        <p class="hero-desc">
          掌握前沿补丁动态，寻找同频竞技搭子。在这里，每一次版本更迭都与你的赛场息息相关。
        </p>
      </div>
    </header>

    <div class="feed-sticky-nav">
      <div class="sticky-nav__inner">
        <div class="segment-control" role="tablist">
          <button
            type="button"
            class="seg-btn"
            :class="{ 'is-active': tab === 'news' }"
            role="tab"
            @click="onSegChange('news')"
          >
            <el-icon><Reading /></el-icon> 资讯阵列
          </button>
          <button
            type="button"
            class="seg-btn"
            :class="{ 'is-active': tab === 'rec' }"
            role="tab"
            @click="onSegChange('rec')"
          >
            <el-icon><ChatDotRound /></el-icon> 搭子匹配
          </button>
          <span class="seg-indicator" :class="'is-' + tab"></span>
        </div>

        <div class="nav-actions">
          <div v-if="tab === 'news'" class="search-box">
            <el-icon class="search-icon"><Search /></el-icon>
            <input v-model="newsSearchQuery" type="text" placeholder="搜索版本情报..." />
          </div>
          <button class="sync-btn" :class="{ 'is-spinning': loading }" title="同步数据" @click="pullRefresh">
            <el-icon><Refresh /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <div class="feed-container">
      <main class="feed-main">
        <BuddyPullRefresh :plain="true" :refresh="pullRefresh" :reserved-top-extra="120" :disabled="false">
          <Transition name="fade-slide" mode="out-in">
            <div v-if="tab === 'news'" key="news-tab" class="news-grid" v-loading="loading && !!news.length">
              <article
                v-for="n in filteredNews"
                :id="'news-' + n.id"
                :key="n.id"
                class="glass-card news-card"
                :class="n.coverUrl ? 'has-cover' : 'no-cover'"
                @mousemove="handleMouseMove"
                @mouseleave="handleMouseLeave"
              >
                <div v-if="n.coverUrl" class="card-cover">
                  <img :src="n.coverUrl" alt="" loading="lazy" />
                  <div class="cover-overlay"></div>
                </div>

                <div class="card-body">
                  <div class="card-header">
                    <span class="pub-name">{{ newsChannelLabel(n) }}</span>
                    <span v-if="isOfficialFeedTag(n)" class="official-tag">OFFICIAL</span>
                  </div>

                  <h3 class="card-title">{{ n.title }}</h3>
                  <p v-if="n.summary" class="card-excerpt">{{ n.summary }}</p>

                  <div class="card-footer">
                    <div class="meta-info">
                      <span v-if="fmtDate(n.publishedAt)" class="date">
                        <el-icon><Timer /></el-icon> {{ fmtDate(n.publishedAt) }}
                      </span>
                      <span v-if="gameLabel(n.gameId)" class="game-tag">{{ gameLabel(n.gameId) }}</span>
                    </div>

                    <div class="action-bar">
                      <button
                        class="icon-btn"
                        :class="{ 'is-active': likedNewsIds.has(n.id) }"
                        @click.stop="toggleLikeNews(n.id)"
                      >
                        <el-icon><StarFilled v-if="likedNewsIds.has(n.id)" /><Star v-else /></el-icon>
                      </button>
                      <button
                        class="icon-btn"
                        :class="{ 'is-active': savedNewsIds.has(n.id) }"
                        @click.stop="toggleSaveNews(n.id)"
                      >
                        <el-icon><Collection /></el-icon>
                      </button>
                      <button class="icon-btn" @click.stop="shareNews(n)">
                        <el-icon><Share /></el-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              <BuddyEmptyState
                v-if="!loading && !filteredNews.length"
                title="暂无情报"
                description="尝试调整搜索关键词或清空过滤器"
              />
            </div>

            <div v-else key="rec-tab" class="rec-grid" v-loading="loading && !!recs.length">
              <div
                v-for="r in recs"
                :key="r.userId"
                class="glass-card rec-card"
                @mousemove="handleMouseMove"
                @mouseleave="handleMouseLeave"
              >
                <div class="rec-header">
                  <el-avatar :size="48" :src="r.avatarUrl || undefined" class="rec-avatar">{{
                    r.nickname.slice(0, 1)
                  }}</el-avatar>
                  <div class="rec-info">
                    <h3 class="rec-name">{{ r.nickname }}</h3>
                    <div class="match-score-wrap">
                      <span class="score-num">{{ r.matchScore }}</span>
                      <span class="score-label">MATCH</span>
                    </div>
                  </div>
                  <button class="connect-btn" @click.stop="applyBuddy(r)">搭一下</button>
                </div>
                <div class="rec-body">
                  <ReasonPanel :reasons="r.matchReasons" :conflict="r.conflict" :advice="r.advice" />
                </div>
              </div>
              <BuddyEmptyState
                v-if="!loading && !recs.length"
                title="信号丢失"
                description="暂无推荐搭子，请完善您的个人档案以提升匹配率"
              />
            </div>
          </Transition>
        </BuddyPullRefresh>
      </main>

      <aside v-if="isWide" class="feed-aside">
        <div v-if="tab === 'news'" class="glass-panel filter-panel">
          <h3 class="panel-title">
            <el-icon><DataLine /></el-icon> 频段过滤
          </h3>
          <div class="filter-group">
            <button class="filter-btn" :class="{ 'is-active': gameFilter === 'all' }" @click="gameFilter = 'all'">
              全频段
            </button>
            <button
              class="filter-btn"
              :class="{ 'is-active': gameFilter === 'honor_of_kings' }"
              @click="gameFilter = 'honor_of_kings'"
            >
              王者荣耀
            </button>
            <button
              class="filter-btn"
              :class="{ 'is-active': gameFilter === 'honor_esports' }"
              @click="gameFilter = 'honor_esports'"
            >
              赛事焦点
            </button>
          </div>
        </div>

        <div v-if="tab === 'news'" class="glass-panel hot-panel">
          <h3 class="panel-title">
            <el-icon><TrendCharts /></el-icon> 实时热搜
          </h3>
          <ul class="hot-list">
            <li v-for="(t, index) in TRENDING_TOPICS" :key="t.id" @click="applyTrendingSearch(t.label)">
              <span class="rank" :class="'rank-' + index">{{ index + 1 }}</span>
              <span class="hot-name">{{ t.label }}</span>
              <span class="hot-heat">{{ t.heat }}</span>
            </li>
          </ul>
        </div>

        <div class="glass-panel nav-panel">
          <h3 class="panel-title">
            <el-icon><Grid /></el-icon> 快速跃迁
          </h3>
          <div class="nav-links">
            <RouterLink to="/app/forum" class="nav-btn"><el-icon><Compass /></el-icon> 峡谷广场</RouterLink>
            <RouterLink to="/app/agent" class="nav-btn"><el-icon><ChatDotRound /></el-icon> 唤醒 AI 搭子</RouterLink>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================
   1. 基础布局与全息深空背景
   ========================================================== */
.feed-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #020617; /* 极致深黑基底 */
}

:global(html:not(.dark)) .feed-layout {
  background-color: #f8fafc;
}

/* ==========================================================
   2. 全息穹顶头图 (Holographic Hero)
   ========================================================== */
.feed-hero {
  position: relative;
  padding: 40px 5% 60px;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.feed-hero__aurora {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float-blob 15s ease-in-out infinite alternate;
}

.blob-a {
  width: 600px;
  height: 600px;
  background: rgba(56, 189, 248, 0.15);
  top: -300px;
  left: -100px;
}
.blob-b {
  width: 500px;
  height: 500px;
  background: rgba(168, 85, 247, 0.15);
  bottom: -200px;
  right: -50px;
  animation-delay: -5s;
}
.blob-c {
  width: 400px;
  height: 400px;
  background: rgba(14, 165, 233, 0.1);
  top: 50px;
  right: 30%;
  animation-delay: -10s;
}

@keyframes float-blob {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(50px, 30px) scale(1.1);
  }
}

.feed-hero__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #38bdf8;
  text-decoration: none;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  transition: all 0.3s ease;
}
.back-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  transform: translateY(-2px);
}

.hub-badge {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: #a855f7;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.hero-title {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 900;
  letter-spacing: 0.05em;
  margin: 0 0 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 32px rgba(255, 255, 255, 0.1);
}

:global(html:not(.dark)) .hero-title {
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-desc {
  font-size: 15px;
  color: #94a3b8;
  max-width: 600px;
  line-height: 1.6;
  margin: 0;
}
:global(html:not(.dark)) .hero-desc {
  color: #64748b;
}

/* ==========================================================
   3. 晶态悬浮中控 (Sticky Nav)
   ========================================================== */
.feed-sticky-nav {
  position: sticky;
  top: 16px;
  z-index: 100;
  margin: -30px auto 30px;
  width: 90%;
  max-width: 800px;
  border-radius: 100px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

:global(html:not(.dark)) .feed-sticky-nav {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 1);
}

.sticky-nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 16px;
}

.segment-control {
  position: relative;
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 100px;
  padding: 4px;
}
:global(html:not(.dark)) .segment-control {
  background: rgba(241, 245, 249, 0.8);
}

.seg-btn {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: color 0.3s ease;
}
:global(html:not(.dark)) .seg-btn {
  color: #64748b;
}

.seg-btn.is-active {
  color: #ffffff;
}
:global(html:not(.dark)) .seg-btn.is-active {
  color: #0f172a;
}

.seg-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  background: linear-gradient(135deg, #38bdf8, #8b5cf6);
  border-radius: 100px;
  z-index: 1;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.4);
}
.seg-indicator.is-rec {
  transform: translateX(100%);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: flex-end;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  padding: 8px 16px;
  flex: 1;
  max-width: 280px;
  transition: border-color 0.3s ease;
}
:global(html:not(.dark)) .search-box {
  background: #ffffff;
  border-color: rgba(203, 213, 225, 0.6);
}

.search-box:focus-within {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.search-icon {
  color: #94a3b8;
  margin-right: 8px;
}
.search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-size: 14px;
  width: 100%;
}
:global(html:not(.dark)) .search-box input {
  color: #0f172a;
}

.sync-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}
:global(html:not(.dark)) .sync-btn {
  background: #ffffff;
  border-color: rgba(203, 213, 225, 0.6);
  color: #475569;
}
.sync-btn:hover {
  background: #38bdf8;
  color: #fff;
  border-color: transparent;
}
.sync-btn.is-spinning .el-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* ==========================================================
   4. 主体双轨瀑布流 (Masonry Grid)
   ========================================================== */
.feed-container {
  display: flex;
  gap: 32px;
  width: 90%;
  max-width: 1280px;
  margin: 0 auto;
  align-items: flex-start;
}

.feed-main {
  flex: 1;
  min-width: 0;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.rec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

/* ==========================================================
   5. 3D 玻璃磁吸卡片 (Glassmorphism Cards)
   ========================================================== */
.glass-card {
  position: relative;
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top-color: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 24px;
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  color: #f8fafc;

  /* 3D 设置 */
  transform-style: preserve-3d;
  transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition:
    transform 0.2s ease-out,
    border-color 0.4s ease,
    box-shadow 0.4s ease;
  cursor: pointer;
  overflow: hidden;
}

:global(html:not(.dark)) .glass-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.05),
    inset 0 1px 1px rgba(255, 255, 255, 1);
  color: #0f172a;
}

/* 跟随光晕 */
.glass-card::after {
  content: '';
  position: absolute;
  top: var(--py, -1000px);
  left: var(--px, -1000px);
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 60%);
  mix-blend-mode: screen;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}
:global(html:not(.dark)) .glass-card::after {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 60%);
  mix-blend-mode: overlay;
}

.glass-card:hover {
  z-index: 10;
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.8),
    0 0 32px rgba(56, 189, 248, 0.1);
}
:global(html:not(.dark)) .glass-card:hover {
  border-color: #ffffff;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
}
.glass-card:hover::after {
  opacity: 1;
}

/* 提升内部元素层级产生视差 */
.card-body,
.rec-header,
.rec-body {
  position: relative;
  z-index: 2;
  transform: translateZ(10px);
}

/* 资讯卡特有样式 */
.news-card {
  padding: 0;
  display: flex;
  flex-direction: column;
}
.card-cover {
  width: 100%;
  height: 180px;
  position: relative;
  overflow: hidden;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.news-card:hover .card-cover img {
  transform: scale(1.05);
}
.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.9) 0%, transparent 100%);
}
:global(html:not(.dark)) .cover-overlay {
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.9) 0%, transparent 100%);
}

.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.pub-name {
  font-size: 13px;
  font-weight: 800;
  background: linear-gradient(135deg, #38bdf8, #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.official-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.card-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 10px;
  line-height: 1.4;
}
.card-excerpt {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 20px;
  flex: 1;
}
:global(html:not(.dark)) .card-excerpt {
  color: #475569;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  padding-top: 16px;
}
:global(html:not(.dark)) .card-footer {
  border-top-color: rgba(15, 23, 42, 0.1);
}
.meta-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
  align-items: center;
}
.game-tag {
  background: rgba(56, 189, 248, 0.1);
  padding: 4px 10px;
  border-radius: 100px;
  color: #38bdf8;
  font-weight: 700;
}
.action-bar {
  display: flex;
  gap: 8px;
}
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
:global(html:not(.dark)) .icon-btn {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}
.icon-btn:hover {
  background: #38bdf8;
  color: #fff;
  border-color: transparent;
}
.icon-btn.is-active {
  color: #f59e0b;
  border-color: #f59e0b;
}

/* 推荐卡特有样式 */
.rec-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.rec-avatar {
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.rec-info {
  flex: 1;
}
.rec-name {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 4px;
}
.match-score-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.score-num {
  font-size: 20px;
  font-weight: 900;
  color: #10b981;
}
.score-label {
  font-size: 10px;
  color: #64748b;
  letter-spacing: 0.1em;
}
.connect-btn {
  background: linear-gradient(135deg, #38bdf8, #8b5cf6);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 100px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.connect-btn:hover {
  transform: scale(1.05);
}

/* ==========================================================
   6. 侧栏 (Aside Panels)
   ========================================================== */
.feed-aside {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 100px;
}
@media (max-width: 1024px) {
  .feed-aside {
    display: none;
  }
}

.glass-panel {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
}
:global(html:not(.dark)) .glass-panel {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 1);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.03);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  margin: 0 0 16px;
  color: #f8fafc;
}
:global(html:not(.dark)) .panel-title {
  color: #0f172a;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-btn {
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}
:global(html:not(.dark)) .filter-btn {
  border-color: #cbd5e1;
  color: #64748b;
}
.filter-btn:hover,
.filter-btn.is-active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: #38bdf8;
}

.hot-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hot-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.2s ease;
}
.hot-list li:hover {
  background: rgba(255, 255, 255, 0.05);
}
:global(html:not(.dark)) .hot-list li:hover {
  background: rgba(15, 23, 42, 0.03);
}
.rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: #64748b;
}
.rank-0 {
  background: #ef4444;
}
.rank-1 {
  background: #f59e0b;
}
.rank-2 {
  background: #10b981;
}
.hot-name {
  flex: 1;
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 600;
}
:global(html:not(.dark)) .hot-name {
  color: #334155;
}
.hot-heat {
  font-size: 12px;
  color: #64748b;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #e2e8f0;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
:global(html:not(.dark)) .nav-btn {
  color: #334155;
  background: rgba(15, 23, 42, 0.02);
}
.nav-btn:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(4px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  filter: blur(4px);
}
</style>
