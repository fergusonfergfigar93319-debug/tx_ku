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
const loading = ref(true)
const page = ref(1)
const recError = ref(false)
const gameFilter = ref<'all' | 'honor_of_kings' | 'honor_esports'>('all')
const newsSearchQuery = ref('')
const syncHint = ref('')
const isWide = ref(false)

/** 本地演示：点赞 / 收藏（会话内 + localStorage 持久化） */
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
  { id: 'hot6', label: '开黑耳机与外设讨论', tag: '装备', heat: 521 },
  { id: 'hot7', label: '中路工具人与挂边节奏', tag: '攻略', heat: 498 },
  { id: 'hot8', label: '漫展王者 cos 约拍', tag: '潮流', heat: 467 },
  { id: 'hot9', label: '赛季末冲分车队', tag: '招募', heat: 442 },
  { id: 'hot10', label: '网页端多标签工作台', tag: 'Web', heat: 389 },
] as const

let mq: MediaQueryList | null = null
function updateWide() {
  isWide.value = mq?.matches ?? false
}

const GAME_LABELS: Record<string, string> = {
  honor_of_kings: '王者荣耀',
  honor_esports: '王者电竞',
}

const feedCapTitle = computed(() => (tab.value === 'news' ? '版本资讯流' : '推荐搭子'))
const filteredNews = computed(() => {
  const q = newsSearchQuery.value.trim().toLowerCase()
  const list = displayNews.value
  if (!q) return list
  return list.filter((n) => {
    const t = `${n.title} ${n.summary ?? ''} ${n.publisherDisplayName ?? ''}`.toLowerCase()
    return t.includes(q)
  })
})

const feedCapMeta = computed(() =>
  tab.value === 'news'
    ? `共 ${filteredNews.value.length} 条${
        gameFilter.value !== 'all' || newsSearchQuery.value.trim() ? '（已筛选）' : ''
      }`
    : `共 ${recs.value.length} 位`
)
const feedCapDesc = computed(() =>
  tab.value === 'news'
    ? '补丁说明、活动与平衡调整聚合于此；有封面的条目会展示缩略图。'
    : '基于资料与游戏兴趣的匹配推荐，点击「搭一下」发起申请。'
)

const displayNews = computed(() => {
  if (gameFilter.value === 'all') return news.value
  return news.value.filter((n) => n.gameId === gameFilter.value)
})

const newsStats = computed(() => {
  const list = news.value
  let hok = 0
  let es = 0
  for (const n of list) {
    if (n.gameId === 'honor_of_kings') hok++
    else if (n.gameId === 'honor_esports') es++
  }
  return { total: list.length, hok, es }
})

const lastNewsDate = computed(() => {
  const times = news.value
    .map((n) => (n.publishedAt ? new Date(n.publishedAt).getTime() : 0))
    .filter((t) => t > 0)
  if (!times.length) return ''
  const max = Math.max(...times)
  return new Date(max).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
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

/** 霓虹標籤「官方」：來源名含官方／賽事／KPL 等 */
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

/** 避免后端缺字段导致渲染期抛错（如 nickname 缺失时 .slice） */
function normalizeNewsItem(n: NewsItem, index: number): NewsItem {
  return {
    ...n,
    id: n.id != null && String(n.id).length ? String(n.id) : `news-${index}`,
    title: n.title?.trim() || '未命名资讯',
  }
}

function normalizeRecommendationItem(raw: RecommendationItem, index: number): RecommendationItem {
  const card = raw.card
    ? {
        ...raw.card,
        tags: Array.isArray(raw.card.tags)
          ? raw.card.tags.filter((t): t is string => typeof t === 'string')
          : [],
      }
    : raw.card
  return {
    ...raw,
    userId:
      raw.userId != null && String(raw.userId).length ? String(raw.userId) : `rec-unknown-${index}`,
    nickname: raw.nickname?.trim() || '搭子',
    matchScore: Number.isFinite(raw.matchScore) ? raw.matchScore : 0,
    matchReasons: Array.isArray(raw.matchReasons) ? raw.matchReasons : [],
    card,
  }
}

async function loadNews() {
  loading.value = true
  try {
    const r = await feedApi.getNewsFeed({ page: page.value })
    const list = Array.isArray(r.list) ? r.list : []
    news.value = list.map(normalizeNewsItem)
    touchSyncHint()
  } catch {
    news.value = []
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
    const list = Array.isArray(r.list) ? r.list : []
    recs.value = list.map(normalizeRecommendationItem)
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

/** 资讯 / 推荐卡：3D 磁吸倾斜 + 流光坐标（--rx/--ry/--px/--py） */
function handleMouseMove(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return
  const rect = card.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((y - centerY) / Math.max(centerY, 1e-6)) * -6
  const rotateY = ((x - centerX) / Math.max(centerX, 1e-6)) * 6
  card.style.setProperty('--rx', `${rotateX}deg`)
  card.style.setProperty('--ry', `${rotateY}deg`)
  card.style.setProperty('--px', `${x}px`)
  card.style.setProperty('--py', `${y}px`)
}

function handleMouseLeave(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return
  card.style.setProperty('--rx', '0deg')
  card.style.setProperty('--ry', '0deg')
  card.style.setProperty('--px', '-1000px')
  card.style.setProperty('--py', '-1000px')
}
</script>

<template>
  <div class="buddy-page discover discover--feed feed-view app-page-stack">
    <!-- 频道说明与数据摘要（与下方「主频道切换」分离） -->
    <header class="discover-channel discover-channel--hero" aria-label="版本速递频道">
      <div class="discover-channel__aurora" aria-hidden="true">
        <span class="discover-channel__blob discover-channel__blob--a" />
        <span class="discover-channel__blob discover-channel__blob--b" />
        <span class="discover-channel__blob discover-channel__blob--c" />
      </div>
      <div class="discover-channel__bar">
        <RouterLink class="discover-channel__back" to="/app/home">
          <el-icon :size="16"><HomeFilled /></el-icon>
          门户首页
        </RouterLink>
        <span class="discover-channel__tag" title="本页为资讯工作台，非首页主题轮播">PATCH · MATCH</span>
      </div>
      <div class="discover-channel__body">
        <div class="discover-channel__pattern" aria-hidden="true" />
        <div class="discover-channel__scene discover-channel__scene--rift" aria-hidden="true">
          <svg
            class="discover-channel__svg"
            viewBox="0 0 360 240"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="rift-surface" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#2563eb" stop-opacity="0.22" />
                <stop offset="45%" stop-color="#6d4bd4" stop-opacity="0.14" />
                <stop offset="100%" stop-color="#0891b2" stop-opacity="0.18" />
              </linearGradient>
              <linearGradient id="rift-glow" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stop-color="#c27803" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#2563eb" stop-opacity="0.02" />
              </linearGradient>
              <radialGradient id="rift-orb" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fff" stop-opacity="0.45" />
                <stop offset="55%" stop-color="#93c5fd" stop-opacity="0.12" />
                <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
              </radialGradient>
            </defs>
            <path
              opacity="0.55"
              d="M0 195 Q 100 130 200 155 T 360 115 L 360 240 L 0 240 Z"
              fill="url(#rift-surface)"
            />
            <path
              opacity="0.4"
              d="M0 215 Q 140 165 240 178 T 360 138 L 360 240 L 0 240 Z"
              fill="url(#rift-glow)"
            />
            <path
              d="M 42 88 L 318 42"
              stroke="#2563eb"
              stroke-opacity="0.28"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-dasharray="6 10"
            />
            <path
              d="M 52 108 Q 180 72 298 58"
              stroke="#6d4bd4"
              stroke-opacity="0.2"
              stroke-width="1"
              fill="none"
            />
            <circle cx="288" cy="52" r="62" stroke="#2563eb" stroke-opacity="0.1" fill="none" />
            <circle cx="288" cy="52" r="78" stroke="#6d4bd4" stroke-opacity="0.07" fill="none" />
            <circle cx="288" cy="52" r="22" fill="url(#rift-orb)" />
            <g opacity="0.5" fill="#2563eb">
              <circle cx="72" cy="38" r="2.2" />
              <circle cx="98" cy="52" r="1.6" />
              <circle cx="118" cy="34" r="1.8" />
              <circle cx="210" cy="28" r="2" />
              <circle cx="232" cy="44" r="1.4" />
            </g>
          </svg>
        </div>
        <div class="discover-channel__intro">
          <p class="discover-eyebrow">资讯工作台</p>
          <h1 class="discover-channel__title">版本速递</h1>
          <p class="discover-channel__lead">
            左侧为<strong>资讯流</strong>（补丁 / 活动 / 平衡），右侧为<strong>推荐搭子</strong>匹配；与首页「主题精选轮播」分流，专注阅读与筛选效率。
          </p>
        </div>
        <dl class="discover-channel__stats" aria-label="速递摘要">
          <div class="disc-stat">
            <dt>资讯</dt>
            <dd>{{ newsStats.total }}</dd>
          </div>
          <div class="disc-stat">
            <dt>王者</dt>
            <dd>{{ newsStats.hok }}</dd>
          </div>
          <div class="disc-stat">
            <dt>电竞</dt>
            <dd>{{ newsStats.es }}</dd>
          </div>
          <div v-if="lastNewsDate" class="disc-stat">
            <dt>最新</dt>
            <dd>{{ lastNewsDate }}</dd>
          </div>
        </dl>
      </div>
      <p v-if="isWide" class="discover-channel__hint">
        宽屏：下方主栏阅读列表，右侧为筛选与热门；可按 <kbd class="discover-kbd">刷新</kbd> 同步当前频道。
      </p>
      <p v-else class="discover-channel__hint discover-channel__hint--touch">
        下拉页面即可刷新当前标签内容。
      </p>
    </header>

    <!-- 主频道切换（工具条，与频道说明区分） -->
    <section class="app-layer app-layer--tools discover-channel-tools" aria-labelledby="discover-tab-label">
      <div class="app-layer__inner discover-channel-tools__inner">
        <h2 id="discover-tab-label" class="app-layer__title">主内容频道</h2>
        <p class="app-layer__hint">在「资讯列表」与「推荐搭子」之间切换；与侧栏游戏筛选、热门话题独立。</p>
        <div
          class="buddy-segment buddy-segment--channel discover-segment"
          :data-active-tab="tab"
          role="tablist"
        >
          <span class="discover-segment__pill" aria-hidden="true" />
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'news'"
            @click="onSegChange('news')"
          >
            <span class="discover-segment__ico" aria-hidden="true">
              <el-icon :size="17"><Reading /></el-icon>
            </span>
            版本资讯
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'rec'"
            @click="onSegChange('rec')"
          >
            <span class="discover-segment__ico" aria-hidden="true">
              <el-icon :size="17"><ChatDotRound /></el-icon>
            </span>
            推荐搭子
          </button>
        </div>
      </div>
    </section>

    <div class="discover-grid">
      <div class="discover-main-col">
        <div v-if="!isWide && tab === 'news'" class="discover-mobile-tools buddy-card-surface">
          <el-input
            v-model="newsSearchQuery"
            clearable
            placeholder="搜索标题、摘要或来源"
            class="discover-search"
          >
            <template #prefix>
              <el-icon class="discover-search__ico"><Search /></el-icon>
            </template>
          </el-input>
          <div class="aside-filters discover-mobile-filters" role="group" aria-label="游戏筛选">
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-on': gameFilter === 'all' }"
              @click="gameFilter = 'all'"
            >
              全部
            </button>
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-on': gameFilter === 'honor_of_kings' }"
              @click="gameFilter = 'honor_of_kings'"
            >
              王者荣耀
            </button>
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-on': gameFilter === 'honor_esports' }"
              @click="gameFilter = 'honor_esports'"
            >
              王者电竞
            </button>
          </div>
        </div>

        <div v-if="!isWide && tab === 'news'" class="trend-strip" aria-label="热门话题">
          <span class="trend-strip__label">
            <el-icon :size="14"><TrendCharts /></el-icon>
            热门
          </span>
          <div class="trend-strip__scroll">
            <button
              v-for="t in TRENDING_TOPICS"
              :key="'m-' + t.id"
              type="button"
              class="trend-chip"
              @click="applyTrendingSearch(t.label)"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <BuddyPullRefresh
          :plain="isWide"
          :refresh="pullRefresh"
          :reserved-top-extra="isWide ? 0 : 148"
          :disabled="false"
        >
          <div v-if="isWide" class="feed-toolbar buddy-card-surface" :class="{ 'is-syncing': loading }">
            <div class="feed-toolbar__start">
              <el-input
                v-if="tab === 'news'"
                v-model="newsSearchQuery"
                clearable
                placeholder="搜索资讯…"
                class="feed-toolbar__search"
              >
                <template #prefix>
                  <el-icon class="discover-search__ico"><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" :loading="loading" round class="feed-toolbar__sync" @click="pullRefresh">
                <el-icon class="feed-toolbar__ico"><Refresh /></el-icon>
                刷新当前频道
              </el-button>
            </div>
            <span class="feed-toolbar__meta">
              <el-icon :size="14"><Timer /></el-icon>
              最近同步 {{ syncHint || '—' }}
            </span>
          </div>

          <div class="buddy-feed-cap buddy-feed-cap--lux">
            <span class="buddy-feed-cap__accent" aria-hidden="true" />
            <h2 class="buddy-feed-cap__title">{{ feedCapTitle }}</h2>
            <span class="buddy-feed-cap__meta">{{ feedCapMeta }}</span>
            <p class="buddy-feed-cap__desc">{{ feedCapDesc }}</p>
          </div>

          <Transition name="discover-feed-tab" mode="out-in">
            <div v-if="tab === 'news'" key="feed-news" class="discover-tab-panel">
              <div v-if="loading && !news.length" class="discover-skeleton-list" aria-busy="true">
                <div v-for="si in 4" :key="'sk-n-' + si" class="discover-skeleton-card buddy-card-surface">
                  <div class="discover-skeleton__shine" aria-hidden="true" />
                  <div class="discover-skeleton__media" />
                  <div class="discover-skeleton__body">
                    <div class="discover-skeleton__line discover-skeleton__line--lg" />
                    <div class="discover-skeleton__line" />
                    <div class="discover-skeleton__line discover-skeleton__line--short" />
                  </div>
                </div>
              </div>
              <div
                v-else
                v-loading="loading && !!news.length"
                class="list list--news buddy-stagger-children"
              >
            <article
              v-for="(n, idx) in filteredNews"
              :id="'news-' + n.id"
              :key="n.id"
              class="feed-item news-item buddy-card-surface"
              :class="['news-item--tone-' + (idx % 4), n.coverUrl ? 'news-item--has-cover' : 'news-item--no-cover']"
              @mousemove="handleMouseMove"
              @mouseleave="handleMouseLeave"
            >
              <div v-if="n.coverUrl" class="news-item__media">
                <img :src="n.coverUrl" alt="" loading="lazy" />
              </div>
              <div v-else class="news-item__visual" aria-hidden="true">
                <div class="news-item__visual-mesh" />
                <el-icon class="news-item__visual-ico" :size="36"><Reading /></el-icon>
                <span
                  class="news-item__visual-badge feed-tag"
                  :class="{ 'feed-tag--official': isOfficialFeedTag(n) }"
                >{{ gameLabel(n.gameId) || '资讯' }}</span>
              </div>
              <div class="news-item__body">
                <div class="news-item__eyebrow">
                  <span class="news-item__dot" aria-hidden="true" />
                  <span class="feed-publisher">{{ newsChannelLabel(n) }}</span>
                  <span v-if="isOfficialFeedTag(n)" class="feed-tag feed-tag--official">官方</span>
                </div>
                <h3 class="news-item__title feed-title">{{ n.title }}</h3>
                <p v-if="n.summary" class="news-item__summary feed-excerpt">{{ n.summary }}</p>
                <div v-if="n.publishedAt || n.gameId" class="news-item__foot">
                  <span v-if="fmtDate(n.publishedAt)" class="news-item__date feed-date">
                    <el-icon class="news-item__ico" :size="14"><Timer /></el-icon>
                    {{ fmtDate(n.publishedAt) }}
                  </span>
                  <span v-if="gameLabel(n.gameId)" class="news-item__game">{{ gameLabel(n.gameId) }}</span>
                </div>
                <div class="news-item__actions">
                  <button
                    type="button"
                    class="news-act"
                    :class="{ 'is-on': likedNewsIds.has(n.id) }"
                    aria-label="点赞"
                    @click.stop="toggleLikeNews(n.id)"
                  >
                    <el-icon :size="18">
                      <StarFilled v-if="likedNewsIds.has(n.id)" />
                      <Star v-else />
                    </el-icon>
                    <span>{{ likedNewsIds.has(n.id) ? '已赞' : '点赞' }}</span>
                  </button>
                  <button
                    type="button"
                    class="news-act"
                    :class="{ 'is-on': savedNewsIds.has(n.id) }"
                    aria-label="收藏"
                    @click.stop="toggleSaveNews(n.id)"
                  >
                    <el-icon :size="18"><Collection /></el-icon>
                    <span>{{ savedNewsIds.has(n.id) ? '已藏' : '收藏' }}</span>
                  </button>
                  <button type="button" class="news-act" aria-label="分享" @click.stop="shareNews(n)">
                    <el-icon :size="18"><Share /></el-icon>
                    <span>分享</span>
                  </button>
                </div>
              </div>
            </article>
            <BuddyEmptyState
              v-if="!loading && !filteredNews.length"
              title="暂无匹配资讯"
              :description="
                newsSearchQuery.trim()
                  ? '未找到相关内容，试试清空搜索或切换游戏筛选'
                  : '尝试调整筛选，或稍后再试'
              "
            >
              <template #icon>
                <el-icon :size="28">
                  <Reading />
                </el-icon>
              </template>
            </BuddyEmptyState>
              </div>
            </div>

            <div v-else key="feed-rec" class="discover-tab-panel">
              <div
                v-if="loading && !recs.length && !recError"
                class="discover-skeleton-list discover-skeleton-list--rec"
                aria-busy="true"
              >
                <div v-for="ri in 3" :key="'sk-r-' + ri" class="discover-skeleton-rec buddy-card-surface">
                  <div class="discover-skeleton__shine" aria-hidden="true" />
                  <div class="discover-skeleton-rec__row">
                    <div class="discover-skeleton-rec__avatar" />
                    <div class="discover-skeleton-rec__text">
                      <div class="discover-skeleton__line discover-skeleton__line--lg" />
                      <div class="discover-skeleton__line discover-skeleton__line--short" />
                    </div>
                  </div>
                  <div class="discover-skeleton__line" />
                  <div class="discover-skeleton__line" />
                </div>
              </div>
              <div
                v-else
                v-loading="loading && !!recs.length"
                class="list list--rec buddy-stagger-children"
              >
            <el-card
              v-for="(r, idx) in recs"
              :key="r.userId"
              class="item rec-card recommendation-card buddy-card-surface is-interactive"
              :class="'rec-card--tone-' + (idx % 3)"
              shadow="never"
              @mousemove="handleMouseMove"
              @mouseleave="handleMouseLeave"
            >
              <div class="rec-card__accent" aria-hidden="true" />
              <div class="rec-top">
                <div class="rec-avatar-wrap">
                  <el-avatar :size="54" :src="r.avatarUrl || undefined">
                    {{ (r.nickname || '?').slice(0, 1) }}
                  </el-avatar>
                </div>
                <div class="rec-meta">
                  <div class="name-row">
                    <span class="name">{{ r.nickname }}</span>
                    <span class="buddy-match-score buddy-match-score--vivid">{{ r.matchScore }}</span>
                    <span class="score-label">匹配度</span>
                  </div>
                  <p class="rec-hint">系统根据作息、位置与风格生成以下说明</p>
                </div>
                <el-button type="primary" round size="small" @click.stop="applyBuddy(r)">搭一下</el-button>
              </div>
              <div class="rec-reason-block">
                <span class="rec-reason-label">匹配解读</span>
                <ReasonPanel :reasons="r.matchReasons" :conflict="r.conflict" :advice="r.advice" />
              </div>
              <div v-if="r.card?.tags?.length" class="tags">
                <el-tag v-for="t in r.card.tags" :key="t" size="small" class="buddy-tag" effect="plain">
                  {{ t }}
                </el-tag>
              </div>
            </el-card>

            <BuddyEmptyState
              v-if="!loading && recError"
              title="推荐加载失败"
              description="网络或接口异常，可稍后重试"
              action-label="重试"
              @action="loadRecs"
            >
              <template #icon>
                <el-icon :size="28">
                  <Compass />
                </el-icon>
              </template>
            </BuddyEmptyState>
            <BuddyEmptyState
              v-else-if="!loading && !recs.length"
              title="暂无推荐搭子"
              description="完善个人资料与游戏兴趣后，匹配会更准"
              action-label="去完善资料"
              :action-to="{ name: 'profile-edit' }"
            >
              <template #icon>
                <el-icon :size="28">
                  <Compass />
                </el-icon>
              </template>
            </BuddyEmptyState>
              </div>
            </div>
          </Transition>
        </BuddyPullRefresh>
      </div>

      <aside v-if="isWide" class="discover-aside" aria-label="侧栏">
        <div class="aside-card aside-card--portal buddy-card-surface">
          <p class="aside-portal-note">首页看全站主题轮播与模块入口；本页专注资讯与搭子列表。</p>
          <h3 class="aside-title">
            <el-icon><Grid /></el-icon>
            快捷入口
          </h3>
          <nav class="aside-nav">
            <RouterLink class="aside-link" to="/app/home">
              <el-icon><HomeFilled /></el-icon>
              <span>门户首页</span>
              <span class="aside-chev">→</span>
            </RouterLink>
            <RouterLink class="aside-link" to="/app/forum">
              <el-icon><Compass /></el-icon>
              <span>峡谷广场</span>
              <span class="aside-chev">→</span>
            </RouterLink>
            <RouterLink class="aside-link" :to="tab === 'rec' ? '/app/agent/chat' : '/app/agent'">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ tab === 'rec' ? 'AI 搭子聊天' : 'AI 搭子创作' }}</span>
              <span class="aside-chev">→</span>
            </RouterLink>
          </nav>
        </div>

        <div v-if="tab === 'news'" class="aside-card buddy-card-surface">
          <h3 class="aside-title">
            <el-icon><DataLine /></el-icon>
            按游戏筛选
          </h3>
          <div class="aside-filters" role="group" aria-label="游戏筛选">
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-on': gameFilter === 'all' }"
              @click="gameFilter = 'all'"
            >
              全部
            </button>
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-on': gameFilter === 'honor_of_kings' }"
              @click="gameFilter = 'honor_of_kings'"
            >
              王者荣耀
            </button>
            <button
              type="button"
              class="filter-chip"
              :class="{ 'is-on': gameFilter === 'honor_esports' }"
              @click="gameFilter = 'honor_esports'"
            >
              王者电竞
            </button>
          </div>
          <p class="aside-note">筛选仅作用于资讯列表，可随时切换。</p>
        </div>

        <div class="aside-card aside-card--stat buddy-card-surface">
          <h3 class="aside-title aside-title--compact">速递摘要</h3>
          <ul class="stat-list">
            <li>
              <span class="stat-k">资讯</span>
              <span class="stat-v">{{ newsStats.total }} 条</span>
            </li>
            <li>
              <span class="stat-k">王者</span>
              <span class="stat-v">{{ newsStats.hok }} 条</span>
            </li>
            <li>
              <span class="stat-k">电竞</span>
              <span class="stat-v">{{ newsStats.es }} 条</span>
            </li>
            <li v-if="lastNewsDate">
              <span class="stat-k">最新</span>
              <span class="stat-v">{{ lastNewsDate }}</span>
            </li>
          </ul>
        </div>

        <div v-if="tab === 'news'" class="aside-card aside-card--trend buddy-card-surface">
          <h3 class="aside-title">
            <el-icon><TrendCharts /></el-icon>
            热门话题
          </h3>
          <p class="aside-note aside-note--tight">点击话题可填入搜索框，快速筛选资讯。</p>
          <ul class="trend-list" role="list">
            <li v-for="(t, ti) in TRENDING_TOPICS" :key="t.id">
              <button type="button" class="trend-row" @click="applyTrendingSearch(t.label)">
                <span class="trend-rank" :class="'trend-rank--' + ti">{{ ti + 1 }}</span>
                <span class="trend-main">
                  <span class="trend-label">{{ t.label }}</span>
                  <span class="trend-tag">{{ t.tag }}</span>
                </span>
                <span class="trend-heat">{{ t.heat }}</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.discover {
  max-width: min(1180px, 100%);
  width: 100%;
  margin-inline: auto;
  box-sizing: border-box;
}

/* 版面層級保留；深空天際線背景改由 .feed-view（見檔末 Neon Bento） */
.discover--feed {
  position: relative;
  isolation: isolate;
  padding-top: 4px;
  border-radius: 0 0 20px 20px;
}

.discover--feed > * {
  position: relative;
  z-index: 1;
}

/* 频道顶栏（替代首页同源轮播） */
.discover-channel {
  margin-bottom: 22px;
  border-radius: 20px;
  border: 1px solid rgb(37 99 235 / 0.14);
  background: linear-gradient(165deg, #ffffff 0%, #f1f5fb 55%, #eef2ff 100%);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.9) inset,
    0 12px 36px rgb(30 58 138 / 0.07);
  overflow: hidden;
  position: relative;
}

.discover-channel--hero {
  margin-bottom: 0;
}

.discover-channel__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
  background: linear-gradient(90deg, rgb(37 99 235 / 0.06) 0%, transparent 55%);
}

.discover-channel__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--buddy-primary);
  text-decoration: none;
  padding: 6px 10px;
  margin: -6px -10px;
  border-radius: 10px;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.discover-channel__back:hover {
  background: rgb(var(--buddy-rgb-brand) / 0.08);
}

.discover-channel__tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: rgb(71 85 105);
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: rgb(255 255 255 / 0.75);
}

.discover-channel__body {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 18px 18px 8px;
}

@media (min-width: 720px) {
  .discover-channel__body {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }
}

.discover-channel__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background: radial-gradient(ellipse 80% 60% at 100% 0%, rgb(37 99 235 / 0.12) 0%, transparent 55%);
  pointer-events: none;
}

/* 峡谷意象：抽象地形 + 信号环（与首页轮播同品牌色谱） */
.discover-channel__scene--rift {
  position: absolute;
  right: -12px;
  bottom: -4px;
  width: min(82vw, 300px);
  height: min(42vw, 172px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.9;
  animation: discover-scene-float 10s ease-in-out infinite;
}

@media (min-width: 720px) {
  .discover-channel__scene--rift {
    right: 4px;
    width: min(42%, 300px);
    height: 168px;
  }
}

.discover-channel__svg {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 12px 32px rgb(30 58 138 / 0.11));
}

@keyframes discover-scene-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-5px) scale(1.01);
  }
}

@media (prefers-reduced-motion: reduce) {
  .discover-channel__scene--rift {
    animation: none;
  }
}

.discover-channel__intro {
  position: relative;
  z-index: 1;
}

.discover-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #4338ca;
}

.discover-channel__title {
  margin: 0 0 10px;
  font-size: clamp(26px, 4.2vw, 32px);
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--buddy-text);
  line-height: 1.15;
}

.discover-channel__lead {
  margin: 0;
  max-width: 40rem;
  font-size: 13px;
  line-height: 1.65;
  color: var(--buddy-text-secondary);
}

.discover-channel__lead strong {
  color: var(--buddy-primary);
  font-weight: 700;
}

.discover-channel__stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgb(37 99 235 / 0.12);
  background: linear-gradient(
      180deg,
      rgb(255 255 255 / 0.94) 0%,
      rgb(248 250 252 / 0.9) 100%
    ),
    radial-gradient(ellipse 120% 80% at 50% 0%, rgb(var(--buddy-rgb-brand) / 0.07) 0%, transparent 55%);
  box-shadow:
    0 2px 12px rgb(15 23 42 / 0.04),
    inset 0 1px 0 rgb(255 255 255 / 0.85);
}

@media (min-width: 480px) {
  .discover-channel__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .discover-channel__stats {
    display: none;
  }
}

.disc-stat {
  text-align: center;
  position: relative;
}

.disc-stat::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(var(--buddy-rgb-brand) / 0.35),
    rgb(var(--buddy-rgb-accent) / 0.25),
    transparent
  );
  opacity: 0.65;
}

.disc-stat dt {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}

.disc-stat dd {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--buddy-text);
  background: linear-gradient(115deg, #1e40af 0%, #7c3aed 70%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.discover-channel__hint {
  margin: 0;
  padding: 0 18px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.discover-channel__hint--touch {
  padding-bottom: 10px;
}

.discover-kbd {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid rgb(15 23 42 / 0.12);
  background: rgb(255 255 255 / 0.9);
}

.buddy-segment--channel {
  margin: 0 12px 12px;
  max-width: calc(100% - 24px);
}

@media (min-width: 640px) {
  .buddy-segment--channel {
    margin-inline: 18px;
    max-width: min(420px, calc(100% - 36px));
  }
}

.aside-portal-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
  border-radius: 10px;
  border: 1px dashed rgb(37 99 235 / 0.22);
  background: linear-gradient(100deg, rgb(37 99 235 / 0.05) 0%, rgb(255 255 255 / 0.9) 100%);
}

.aside-card--portal {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.14);
  background: linear-gradient(
    168deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(247 249 255 / 0.96) 52%,
    rgb(250 245 255 / 0.92) 100%
  );
}

.aside-card--portal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--buddy-gradient-brand);
  opacity: 0.88;
  pointer-events: none;
}

.aside-card--portal .aside-title {
  margin-top: 0;
}

.discover-grid {
  display: grid;
  gap: 22px;
  align-items: start;
  width: 100%;
  max-width: 100%;
}

.discover-main-col {
  min-width: 0;
}

@media (min-width: 1100px) {
  .discover-grid {
    grid-template-columns: 1fr minmax(268px, 300px);
    gap: 28px;
  }

  .discover-aside {
    position: sticky;
    top: 68px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.feed-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px 12px 18px;
  margin-bottom: 14px;
  border-radius: var(--buddy-radius);
  border: 1px solid rgba(37, 99, 235, 0.12);
  overflow: hidden;
  background:
    radial-gradient(ellipse 85% 140% at 0% 48%, rgb(var(--buddy-rgb-brand) / 0.07) 0%, transparent 58%),
    linear-gradient(165deg, #ffffff 0%, #f1f5f9 100%);
}

.feed-toolbar::after {
  content: '';
  position: absolute;
  left: 0;
  top: 11px;
  bottom: 11px;
  width: 3px;
  z-index: 2;
  border-radius: 0 5px 5px 0;
  background: var(--buddy-gradient-brand);
  opacity: 0.48;
  pointer-events: none;
}

.feed-toolbar__start {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.feed-toolbar__search {
  flex: 1;
  min-width: 200px;
  max-width: 360px;
}

.feed-toolbar__search :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.feed-toolbar__ico {
  margin-right: 4px;
}

.feed-toolbar__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-text-secondary);
}

.discover-search__ico {
  color: var(--buddy-primary);
}

.discover-mobile-tools {
  padding: 12px 14px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  background: linear-gradient(165deg, #ffffff 0%, #f8fafc 100%);
}

.discover-search :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.14);
}

.discover-mobile-filters {
  padding-top: 2px;
}

.trend-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: var(--buddy-radius);
  border: 1px solid rgba(37, 99, 235, 0.14);
  background: linear-gradient(105deg, rgba(37, 99, 235, 0.06) 0%, #ffffff 55%, rgba(124, 58, 237, 0.05) 100%);
  box-shadow: var(--buddy-shadow-card);
}

.trend-strip__label {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
}

.trend-strip__scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.trend-strip__scroll::-webkit-scrollbar {
  height: 3px;
}

.trend-strip__scroll::-webkit-scrollbar-thumb {
  background: rgba(37, 99, 235, 0.35);
  border-radius: 4px;
}

.trend-chip {
  flex-shrink: 0;
  border: 1px solid rgba(124, 58, 237, 0.22);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.07) 0%, rgba(255, 255, 255, 0.95) 100%);
  color: var(--buddy-text);
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.trend-chip:hover {
  border-color: rgba(37, 99, 235, 0.4);
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.12);
}

/* 侧栏 */
.aside-card {
  padding: 16px 16px 14px;
  border-radius: var(--buddy-radius);
}

.aside-card--stat {
  background: linear-gradient(165deg, #ffffff 0%, #f8fafc 100%);
}

.aside-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--buddy-text);
}

.aside-title--compact {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--buddy-text-secondary);
}

.aside-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.aside-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--buddy-text);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.15s;
}

.aside-link:hover {
  background: linear-gradient(100deg, rgba(37, 99, 235, 0.06) 0%, rgba(255, 255, 255, 0.95) 100%);
  border-color: rgba(37, 99, 235, 0.15);
}

.aside-link .el-icon {
  color: var(--buddy-primary);
  flex-shrink: 0;
}

.aside-chev {
  margin-left: auto;
  font-size: 13px;
  color: var(--buddy-text-muted);
  opacity: 0.7;
}

.aside-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  border: 1px solid var(--buddy-border);
  background: var(--buddy-surface-elevated);
  color: var(--buddy-text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}

.filter-chip:hover {
  border-color: rgba(37, 99, 235, 0.25);
  color: var(--buddy-text);
}

.filter-chip.is-on {
  color: #1e3a8a;
  border-color: rgba(37, 99, 235, 0.42);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14) 0%, rgba(124, 58, 237, 0.1) 100%);
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.14);
}

.aside-note {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
}

.stat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--buddy-border);
}

.stat-list li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-k {
  color: var(--buddy-text-muted);
  font-weight: 600;
}

.stat-v {
  font-weight: 800;
  color: var(--buddy-text);
  font-variant-numeric: tabular-nums;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 资讯卡 */
.news-item {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  transition:
    box-shadow 0.2s,
    border-color 0.2s,
    transform 0.2s;
}

.news-item:hover {
  border-color: rgba(37, 99, 235, 0.22);
  box-shadow: var(--buddy-shadow-card-hover);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .news-item:hover {
    transform: none;
  }
}

.news-item--tone-0 {
  border-left: 4px solid #2563eb;
}

.news-item--tone-1 {
  border-left: 4px solid #7c3aed;
}

.news-item--tone-2 {
  border-left: 4px solid #0891b2;
}

.news-item--tone-3 {
  border-left: 4px solid #f59e0b;
}

@media (min-width: 520px) {
  .news-item--has-cover {
    flex-direction: row;
    align-items: stretch;
  }
}

.news-item__media {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  max-height: 168px;
  overflow: hidden;
  border-radius: var(--buddy-radius-sm) var(--buddy-radius-sm) 0 0;
  background: linear-gradient(145deg, #e8eef7 0%, #f1f5f9 55%, #e0e7ff 100%);
}

@media (min-width: 520px) {
  .news-item--has-cover .news-item__media {
    width: 148px;
    max-height: none;
    min-height: 100%;
    border-radius: var(--buddy-radius-sm) 0 0 var(--buddy-radius-sm);
  }
}

.news-item__media::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.42),
    inset 0 0 0 2px rgb(var(--buddy-rgb-brand) / 0.09);
  pointer-events: none;
}

.news-item__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.news-item__body {
  padding: 16px 18px 18px;
  flex: 1;
  min-width: 0;
}

.news-item__eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--buddy-primary);
}

.news-item__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--buddy-gradient-brand);
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.35);
}

.news-item__title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.38;
  color: var(--buddy-text);
  letter-spacing: 0.01em;
}

.news-item__summary {
  margin: 0 0 12px;
  color: var(--buddy-text-secondary);
  font-size: 13px;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-item__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.07);
}

.news-item__date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-text-muted);
}

.news-item__ico {
  opacity: 0.75;
}

.news-item__game {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%);
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.22);
}

/* 推荐卡（优化方案 2.2 · Glass + 网格 + 悬停光效） */
.recommendation-card {
  border-radius: 18px !important;
  background: linear-gradient(
    145deg,
    rgb(255 255 255 / 0.96) 0%,
    rgb(248 250 252 / 0.9) 100%
  ) !important;
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.35s ease;
}

.recommendation-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image:
    linear-gradient(rgb(var(--buddy-rgb-brand) / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--buddy-rgb-brand) / 0.04) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.45s ease;
  z-index: 0;
}

.recommendation-card::after {
  content: '';
  position: absolute;
  top: -40%;
  left: -30%;
  width: 80%;
  height: 120%;
  background: radial-gradient(
    circle at 40% 40%,
    rgb(var(--buddy-rgb-brand) / 0.12) 0%,
    transparent 65%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
  z-index: 0;
}

.recommendation-card:hover {
  transform: translateY(-6px);
  border-color: rgb(var(--buddy-rgb-brand) / 0.22) !important;
  box-shadow:
    0 18px 48px rgb(var(--buddy-rgb-brand) / 0.12),
    0 0 0 1px rgb(255 255 255 / 0.45) inset !important;
}

.recommendation-card:hover::before,
.recommendation-card:hover::after {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .recommendation-card:hover {
    transform: none;
  }
}

.recommendation-card :deep(.el-card__body) {
  position: relative;
  z-index: 1;
}

.rec-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.rec-card :deep(.el-card__body) {
  padding: 0;
}

.rec-card__accent {
  height: 3px;
  background: var(--buddy-gradient-brand);
  opacity: 0.95;
}

.rec-card--tone-0 .rec-card__accent {
  background: linear-gradient(90deg, #2563eb, #38bdf8);
}

.rec-card--tone-1 .rec-card__accent {
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
}

.rec-card--tone-2 .rec-card__accent {
  background: linear-gradient(90deg, #0891b2, #34d399);
}

.rec-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 16px 12px;
}

.rec-avatar-wrap {
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(124, 58, 237, 0.28));
  flex-shrink: 0;
}

.rec-avatar-wrap :deep(.el-avatar) {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.rec-meta {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.name {
  font-weight: 700;
  font-size: 17px;
  color: var(--buddy-text);
}

.score-label {
  font-size: 12px;
  color: var(--buddy-text-muted);
  font-weight: 600;
}

.rec-hint {
  margin: 0;
  font-size: 11px;
  color: var(--buddy-text-muted);
  line-height: 1.4;
}

.rec-reason-block {
  padding: 0 16px 12px;
}

.rec-reason-label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--buddy-text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 16px 16px;
}

/* 资讯卡操作条 */
.news-item__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.1);
}

.news-act {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 999px;
  border: 1px solid var(--buddy-border-strong);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-text-secondary);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}

.news-act:hover {
  border-color: rgba(37, 99, 235, 0.28);
  color: #1d4ed8;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.news-act.is-on {
  border-color: rgba(245, 158, 11, 0.45);
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.65) 0%, #fffbeb 100%);
  color: #b45309;
}

.news-act.is-on .el-icon {
  color: #d97706;
}

/* 侧栏：热门话题 */
.aside-card--trend {
  position: relative;
  overflow: hidden;
  background: linear-gradient(165deg, #ffffff 0%, #f0f4ff 100%);
  border-color: rgba(37, 99, 235, 0.14);
}

.aside-card--trend::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #2563eb, #7c3aed, #0891b2);
  opacity: 0.72;
  pointer-events: none;
}

.aside-note--tight {
  margin: -4px 0 10px;
}

.trend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.15s;
}

.trend-row:hover {
  border-color: rgba(37, 99, 235, 0.2);
  background: #fff;
  transform: translateX(2px);
}

@media (prefers-reduced-motion: reduce) {
  .trend-row:hover {
    transform: none;
  }
}

.trend-rank {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #64748b, #94a3b8);
}

.trend-rank--0 {
  background: linear-gradient(135deg, #ea580c, #f97316);
}

.trend-rank--1 {
  background: linear-gradient(135deg, #ca8a04, #eab308);
}

.trend-rank--2 {
  background: linear-gradient(135deg, #16a34a, #22c55e);
}

.trend-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trend-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--buddy-text);
  line-height: 1.3;
}

.trend-tag {
  font-size: 10px;
  font-weight: 700;
  color: #1d4ed8;
  letter-spacing: 0.04em;
}

.trend-heat {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--buddy-text-muted);
}

/* —— 首页同源：极光光晕 + 英雄区层次 —— */
.discover-channel--hero {
  position: relative;
  isolation: isolate;
}

.discover-channel__aurora {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

.discover-channel__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.55;
  animation: discover-blob-drift 14s ease-in-out infinite alternate;
}

.discover-channel__blob--a {
  width: min(280px, 55vw);
  height: min(220px, 42vw);
  top: -12%;
  right: -8%;
  background: radial-gradient(circle, rgb(var(--buddy-rgb-brand) / 0.35) 0%, transparent 68%);
}

.discover-channel__blob--b {
  width: min(200px, 40vw);
  height: min(180px, 36vw);
  bottom: -5%;
  left: -5%;
  background: radial-gradient(circle, rgb(var(--buddy-rgb-accent) / 0.28) 0%, transparent 65%);
  animation-delay: -4s;
}

.discover-channel__blob--c {
  width: min(160px, 32vw);
  height: min(140px, 28vw);
  top: 35%;
  left: 40%;
  opacity: 0.35;
  background: radial-gradient(circle, rgb(var(--buddy-rgb-honor-gold) / 0.22) 0%, transparent 70%);
  animation-delay: -7s;
}

@keyframes discover-blob-drift {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(-3%, 4%) scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .discover-channel__blob {
    animation: none;
    opacity: 0.38;
  }
}

.discover-channel__bar,
.discover-channel__body,
.discover-channel__hint {
  position: relative;
  z-index: 1;
}

.discover-channel__pattern {
  opacity: 0.5;
}

/* 滑块式主频道切换（与首页轮播同系渐变） */
.discover-segment {
  position: relative;
  overflow: hidden;
}

.discover-segment__pill {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 6px);
  border-radius: var(--buddy-radius-sm);
  background: linear-gradient(
    135deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(224 231 255 / 0.95) 45%,
    rgb(237 233 254 / 0.92) 100%
  );
  box-shadow:
    0 4px 18px rgb(var(--buddy-rgb-brand) / 0.12),
    0 0 0 1px rgb(var(--buddy-rgb-brand) / 0.18) inset;
  z-index: 0;
  transition:
    transform 0.42s cubic-bezier(0.33, 0.9, 0.32, 1),
    box-shadow 0.35s ease;
  pointer-events: none;
}

.discover-segment[data-active-tab='rec'] .discover-segment__pill {
  transform: translateX(calc(100% + 4px));
}

.discover-segment.buddy-segment button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.discover-segment.buddy-segment button[aria-selected='true'] {
  background: transparent;
  box-shadow: none;
  color: #1d4ed8;
}

.discover-segment.buddy-segment button[aria-selected='false'] {
  color: var(--buddy-text-secondary);
}

.discover-segment__ico {
  display: inline-flex;
  opacity: 0.92;
  transition: transform 0.3s var(--buddy-ease-spring, cubic-bezier(0.2, 0.75, 0.25, 1));
}

.discover-segment.buddy-segment button[aria-selected='true'] .discover-segment__ico {
  transform: scale(1.06);
  color: var(--buddy-primary);
}

@media (prefers-reduced-motion: reduce) {
  .discover-segment__pill {
    transition: none;
  }

  .discover-segment__ico {
    transition: none;
  }
}

/* 列表区块切换动效（不使用 filter: blur，部分 GPU/浏览器下易导致整块内容不可见） */
.discover-feed-tab-enter-active,
.discover-feed-tab-leave-active {
  transition:
    opacity 0.32s var(--buddy-ease-out, ease),
    transform 0.38s cubic-bezier(0.33, 0.9, 0.32, 1);
}

.discover-feed-tab-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.discover-feed-tab-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .discover-feed-tab-enter-active,
  .discover-feed-tab-leave-active {
    transition: opacity 0.14s ease;
  }

  .discover-feed-tab-enter-from,
  .discover-feed-tab-leave-to {
    transform: none;
    filter: none;
  }
}

.buddy-feed-cap--lux {
  position: relative;
  padding: 12px 14px 12px 16px;
  border-radius: var(--buddy-radius);
  border: 1px solid rgb(15 23 42 / 0.06);
  background: linear-gradient(
    118deg,
    rgb(255 255 255 / 0.97) 0%,
    rgb(248 250 252 / 0.92) 42%,
    rgb(239 246 255 / 0.88) 100%
  );
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.9) inset,
    0 8px 28px rgb(30 58 138 / 0.05);
  overflow: hidden;
}

.buddy-feed-cap--lux::after {
  content: '';
  position: absolute;
  right: -20%;
  top: -40%;
  width: 55%;
  height: 160%;
  background: radial-gradient(
    circle at 30% 50%,
    rgb(var(--buddy-rgb-brand) / 0.07) 0%,
    transparent 62%
  );
  pointer-events: none;
}

.buddy-feed-cap--lux .buddy-feed-cap__title,
.buddy-feed-cap--lux .buddy-feed-cap__meta,
.buddy-feed-cap--lux .buddy-feed-cap__desc {
  position: relative;
  z-index: 1;
}

/* 骨架屏 */
.discover-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.discover-skeleton-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 120px;
}

@media (min-width: 520px) {
  .discover-skeleton-card {
    flex-direction: row;
    align-items: stretch;
  }
}

.discover-skeleton__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgb(255 255 255 / 0.55) 45%,
    transparent 88%
  );
  transform: translateX(-100%);
  animation: discover-shimmer 1.35s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes discover-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .discover-skeleton__shine {
    animation: none;
    opacity: 0;
  }
}

.discover-skeleton__media {
  flex-shrink: 0;
  width: 100%;
  height: 120px;
  border-radius: var(--buddy-radius-sm);
  background: linear-gradient(145deg, rgb(226 232 240 / 0.9) 0%, rgb(241 245 249 / 0.95) 100%);
}

@media (min-width: 520px) {
  .discover-skeleton__media {
    width: 148px;
    height: auto;
    min-height: 100%;
  }
}

.discover-skeleton__body {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.discover-skeleton__line {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgb(226 232 240 / 0.95) 0%, rgb(241 245 249 / 0.85) 100%);
}

.discover-skeleton__line--lg {
  height: 14px;
  width: 72%;
}

.discover-skeleton__line--short {
  width: 42%;
}

.discover-skeleton-list--rec {
  gap: 12px;
}

.discover-skeleton-rec {
  position: relative;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.discover-skeleton-rec__row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.discover-skeleton-rec__avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(145deg, rgb(224 231 255) 0%, rgb(241 245 249) 100%);
}

.discover-skeleton-rec__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 资讯卡：玻璃 + 无封面视觉位 */
.news-item {
  position: relative;
  backdrop-filter: saturate(160%) blur(8px);
  -webkit-backdrop-filter: saturate(160%) blur(8px);
}

.news-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
  background-image:
    linear-gradient(rgb(var(--buddy-rgb-brand) / 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--buddy-rgb-brand) / 0.035) 1px, transparent 1px);
  background-size: 22px 22px;
}

.news-item:hover::before {
  opacity: 1;
}

.news-item__media::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.35s ease;
  background: linear-gradient(
    160deg,
    transparent 40%,
    rgb(var(--buddy-rgb-brand) / 0.12) 100%
  );
  pointer-events: none;
}

.news-item:hover .news-item__media::after {
  opacity: 1;
}

.news-item__media img {
  transition: transform 0.55s cubic-bezier(0.33, 0.9, 0.32, 1);
}

.news-item:hover .news-item__media img {
  transform: scale(1.05);
}

@media (prefers-reduced-motion: reduce) {
  .news-item:hover .news-item__media img {
    transform: none;
  }
}

.news-item__visual {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  min-height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgb(239 246 255 / 0.98) 0%,
    rgb(250 245 255 / 0.92) 48%,
    rgb(224 231 255 / 0.88) 100%
  );
}

.news-item__visual-mesh {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background-image:
    radial-gradient(circle at 20% 30%, rgb(var(--buddy-rgb-brand) / 0.2) 0%, transparent 45%),
    radial-gradient(circle at 80% 70%, rgb(124 58 237 / 0.14) 0%, transparent 50%);
}

.news-item__visual-ico {
  position: relative;
  z-index: 1;
  color: rgb(var(--buddy-rgb-brand) / 0.55);
  filter: drop-shadow(0 2px 12px rgb(var(--buddy-rgb-brand) / 0.2));
}

.news-item__visual-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 1;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 999px;
  color: #1e40af;
  background: rgb(255 255 255 / 0.82);
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.22);
  box-shadow: 0 2px 10px rgb(15 23 42 / 0.06);
}

.news-item--tone-0 .news-item__visual {
  background: linear-gradient(150deg, #eff6ff 0%, #e0e7ff 52%, #faf5ff 100%);
}

.news-item--tone-1 .news-item__visual {
  background: linear-gradient(152deg, #f5f3ff 0%, #ede9fe 48%, #e0f2fe 100%);
}

.news-item--tone-2 .news-item__visual {
  background: linear-gradient(148deg, #ecfeff 0%, #e0f2fe 50%, #f0fdf4 100%);
}

.news-item--tone-3 .news-item__visual {
  background: linear-gradient(150deg, #fffbeb 0%, #fef3c7 42%, #fff7ed 100%);
}

.news-item--tone-1 .news-item__visual-mesh {
  opacity: 0.55;
  background-image:
    radial-gradient(circle at 25% 35%, rgb(124 58 237 / 0.18) 0%, transparent 48%),
    radial-gradient(circle at 75% 65%, rgb(14 165 233 / 0.12) 0%, transparent 52%);
}

.news-item--tone-2 .news-item__visual-mesh {
  opacity: 0.5;
  background-image:
    radial-gradient(circle at 30% 40%, rgb(8 145 178 / 0.2) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgb(52 211 153 / 0.12) 0%, transparent 48%);
}

.news-item--tone-3 .news-item__visual-mesh {
  opacity: 0.48;
  background-image:
    radial-gradient(circle at 22% 28%, rgb(245 158 11 / 0.22) 0%, transparent 46%),
    radial-gradient(circle at 78% 72%, rgb(251 191 36 / 0.14) 0%, transparent 50%);
}

@media (min-width: 520px) {
  .news-item--no-cover {
    flex-direction: row;
    align-items: stretch;
  }

  .news-item--no-cover .news-item__visual {
    width: 148px;
    min-height: 0;
  }
}

/* 工具栏：刷新时轻量扫描线 */
.feed-toolbar.is-syncing {
  border-color: rgb(var(--buddy-rgb-brand) / 0.22);
}

.feed-toolbar.is-syncing::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgb(var(--buddy-rgb-brand) / 0.06) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: discover-toolbar-scan 1.1s ease-in-out infinite;
}

.feed-toolbar__start,
.feed-toolbar__meta {
  position: relative;
  z-index: 3;
}

@keyframes discover-toolbar-scan {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feed-toolbar.is-syncing::before {
    animation: none;
  }
}

/* 侧栏卡片微抬升 */
.aside-card.buddy-card-surface {
  transition:
    transform 0.35s cubic-bezier(0.33, 0.9, 0.32, 1),
    box-shadow 0.35s ease,
    border-color 0.25s ease;
}

@media (min-width: 1100px) {
  .discover-aside .aside-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--buddy-shadow-card-hover);
    border-color: rgb(var(--buddy-rgb-brand) / 0.16);
  }
}

@media (prefers-reduced-motion: reduce) {
  .discover-aside .aside-card:hover {
    transform: none;
  }
}

.news-act {
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.18s var(--buddy-ease-spring, cubic-bezier(0.2, 0.75, 0.25, 1));
}

.news-act:hover {
  transform: translateY(-1px);
}

.news-act:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .news-act:hover,
  .news-act:active {
    transform: none;
  }
}

/* ==========================================================
   1. 深空底座 + 赛博网格（Glassmorphism 2.0）
   ========================================================== */
.feed-view {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 40px;
  position: relative;
  transition: background 0.6s ease;
}

:global(html:not(.dark)) .feed-view {
  background:
    radial-gradient(ellipse 100% 400px at 50% 0%, rgba(37, 99, 235, 0.06) 0%, transparent 100%),
    linear-gradient(rgba(15, 23, 42, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.02) 1px, transparent 1px),
    linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%);
  background-size: 100% 100%, 32px 32px, 32px 32px, 100% 100%;
}

:global(html.dark) .feed-view {
  background:
    radial-gradient(ellipse 100% 500px at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 100%),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(180deg, #0f172a 0%, #020617 100%);
  background-size: 100% 100%, 32px 32px, 32px 32px, 100% 100%;
}

/* ==========================================================
   2. 仅推荐卡 el-card：去掉默认灰盒（勿动 .app-layer，避免主频道条被抹平）
       不在 .list 上使用 perspective：与 v-loading 遮罩叠加可能异常铺满视口
   ========================================================== */
:global(.feed-view .rec-card.el-card) {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

:global(.feed-view .rec-card .el-card__body) {
  padding: 0 !important;
}

:global(.feed-view .list) {
  gap: 24px !important;
}

/* ==========================================================
   3. 资讯卡 + 推荐卡：3D 玻璃便当盒 + 动态流光层
   ========================================================== */
:global(.feed-view .feed-item),
:global(.feed-view .news-item) {
  margin-bottom: 0 !important;
  border-radius: 24px !important;
  padding: 0 !important;
  position: relative;
  overflow: hidden;
  border-left: none !important;
  isolation: isolate;
  /* flat：避免 backdrop-filter + preserve-3d 在部分环境下白屏/图层异常 */
  transform-style: flat;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0);
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease !important;
  cursor: pointer;
}

:global(.feed-view .rec-card.el-card) {
  margin-bottom: 0 !important;
  border-radius: 24px !important;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transform-style: flat;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0);
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease !important;
  cursor: pointer;
}

:global(html:not(.dark)) .feed-view .feed-item,
:global(html:not(.dark)) .feed-view .rec-card.el-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.6) 100%) !important;
  backdrop-filter: blur(28px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(160%) !important;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  box-shadow:
    0 16px 36px -10px rgba(15, 23, 42, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 1) !important;
}

:global(html.dark) .feed-view .feed-item,
:global(html.dark) .feed-view .rec-card.el-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow:
    0 20px 48px -12px rgba(0, 0, 0, 0.8),
    inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
  color: #f8fafc !important;
}

/* 流光扫掠：置于内容下方，避免压住正文 */
:global(.feed-view .feed-item::after),
:global(.feed-view .rec-card.el-card::after) {
  content: '';
  position: absolute;
  top: var(--py, -1000px);
  left: var(--px, -1000px);
  width: 400px;
  height: 400px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

:global(html:not(.dark)) .feed-view .feed-item::after,
:global(html:not(.dark)) .feed-view .rec-card.el-card::after {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 60%);
  mix-blend-mode: overlay;
}

:global(html.dark) .feed-view .feed-item::after,
:global(html.dark) .feed-view .rec-card.el-card::after {
  background: radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 60%);
  mix-blend-mode: screen;
}

:global(.feed-view .feed-item:hover::after),
:global(.feed-view .rec-card.el-card:hover::after) {
  opacity: 1;
}

:global(.feed-view .feed-item .news-item__body) {
  padding: 22px 24px 24px !important;
  transform: translateZ(20px);
  position: relative;
  z-index: 2;
}

:global(.feed-view .rec-card .rec-top),
:global(.feed-view .rec-card .rec-reason-block),
:global(.feed-view .rec-card .tags) {
  transform: translateZ(20px);
  position: relative;
  z-index: 2;
}

:global(.feed-view .feed-item .news-item__media) {
  border-right: 1px solid rgba(15, 23, 42, 0.05);
  z-index: 2;
  position: relative;
}
:global(.feed-view .feed-item .news-item__visual) {
  z-index: 2;
  position: relative;
}
:global(html.dark) .feed-view .feed-item .news-item__media {
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

/* Hover：由 3D 倾斜承担位移，仅加深光感与层级 */
:global(.feed-view .feed-item:hover),
:global(.feed-view .rec-card.el-card:hover) {
  z-index: 20;
}

:global(html:not(.dark)) .feed-view .feed-item:hover,
:global(html:not(.dark)) .feed-view .rec-card.el-card:hover {
  box-shadow:
    0 24px 56px -12px rgba(37, 99, 235, 0.12),
    0 8px 16px rgba(15, 23, 42, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 1) !important;
}

:global(html.dark) .feed-view .feed-item:hover,
:global(html.dark) .feed-view .rec-card.el-card:hover {
  border-color: rgba(96, 165, 250, 0.4) !important;
  box-shadow:
    0 32px 64px -12px rgba(0, 0, 0, 0.9),
    0 0 48px rgba(59, 130, 246, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.3) !important;
}

/* ==========================================================
   5. 标签与发布者 (全息极光色)
   ========================================================== */
/* 发佈者 (如：元流同频官方) */
:global(.feed-view .feed-publisher) {
  font-weight: 800 !important;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #38bdf8 0%, #a855f7 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}

:global(html.dark) .feed-view .feed-publisher {
  filter: drop-shadow(0 2px 8px rgba(168, 85, 247, 0.4)) !important;
}

/* 官方/赛事 标签 */
:global(.feed-view .feed-tag) {
  border-radius: 999px !important;
  padding: 4px 12px !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* 眉角内标签与圆点拉开（避免影响封面角标） */
:global(.feed-view .news-item__eyebrow .feed-tag) {
  margin-left: 8px;
}

/* 针对「官方公告」的特殊胶囊发光 */
:global(.feed-view .feed-tag--official) {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.2) 100%) !important;
  color: #d97706 !important;
  border: 1px solid rgba(245, 158, 11, 0.3) !important;
}

:global(html.dark) .feed-view .feed-tag--official {
  background: rgba(245, 158, 11, 0.15) !important;
  color: #fbbf24 !important;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.3) !important;
}

/* 暗色模式下标题与摘要的色彩提亮 */
:global(html.dark) .feed-view .feed-title {
  color: #f8fafc !important;
  font-weight: 800 !important;
}

:global(html.dark) .feed-view .feed-excerpt,
:global(html.dark) .feed-view .feed-date {
  color: #94a3b8 !important;
}

/* 覆盖原来 tone-X 产生的左侧色条 */
:global(.feed-view .news-item--tone-0),
:global(.feed-view .news-item--tone-1),
:global(.feed-view .news-item--tone-2),
:global(.feed-view .news-item--tone-3) {
  border-left: none !important;
}

:global(.feed-view .news-item__eyebrow) {
  flex-wrap: wrap !important;
  row-gap: 8px !important;
}

/* ==========================================================
   6. 同步美化右侧边栏卡片 (Aside) 和 顶部工具栏 (Toolbar)
   ========================================================== */
:global(html:not(.dark)) .feed-view .aside-card,
:global(html:not(.dark)) .feed-view .feed-toolbar,
:global(html:not(.dark)) .feed-view .buddy-feed-cap {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%) !important;
  backdrop-filter: blur(20px) saturate(150%) !important;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.05) !important;
  border-radius: 20px !important;
}

:global(html.dark) .feed-view .aside-card,
:global(html.dark) .feed-view .feed-toolbar,
:global(html.dark) .feed-view .buddy-feed-cap {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
  backdrop-filter: blur(20px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-top-color: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.8), 0 0 16px rgba(59, 130, 246, 0.05) !important;
  border-radius: 20px !important;
}

@media (prefers-reduced-motion: reduce) {
  :global(.feed-view .feed-item),
  :global(.feed-view .feed-item:hover),
  :global(.feed-view .rec-card.el-card),
  :global(.feed-view .rec-card.el-card:hover) {
    transform: none !important;
    transition: none !important;
  }
  :global(.feed-view .feed-item::after),
  :global(.feed-view .rec-card.el-card::after) {
    opacity: 0 !important;
  }
}
</style>
