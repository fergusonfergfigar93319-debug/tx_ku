<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound,
  Collection,
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
  } catch {
    recError.value = true
    recs.value = []
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
    ElMessage.success('已发送搭子申请')
  } catch {
    ElMessage.error('发送失败，请稍后重试')
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
</script>

<template>
  <div class="discover-fixed">
    <!-- 简化的头部 -->
    <header class="discover-header">
      <div class="header-bar">
        <RouterLink class="back-link" to="/app/home">
          <el-icon :size="16"><HomeFilled /></el-icon>
          返回首页
        </RouterLink>
        <span class="header-tag">版本速递</span>
      </div>
      <div class="header-content">
        <h1 class="header-title">版本速递</h1>
        <p class="header-desc">补丁说明、活动与平衡调整聚合于此</p>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">资讯</span>
            <span class="stat-value">{{ newsStats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">王者</span>
            <span class="stat-value">{{ newsStats.hok }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">电竞</span>
            <span class="stat-value">{{ newsStats.es }}</span>
          </div>
          <div v-if="lastNewsDate" class="stat-item">
            <span class="stat-label">最新</span>
            <span class="stat-value">{{ lastNewsDate }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 标签切换 -->
    <section class="tab-section">
      <div class="tab-buttons">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: tab === 'news' }"
          @click="onSegChange('news')"
        >
          <el-icon><Reading /></el-icon>
          资讯流
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: tab === 'rec' }"
          @click="onSegChange('rec')"
        >
          <el-icon><ChatDotRound /></el-icon>
          推荐搭子
        </button>
      </div>
    </section>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 工具栏 -->
      <div v-if="tab === 'news'" class="toolbar">
        <el-input
          v-model="newsSearchQuery"
          clearable
          placeholder="搜索标题、摘要或来源"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="filter-buttons">
          <el-button
            :type="gameFilter === 'all' ? 'primary' : 'default'"
            size="small"
            @click="gameFilter = 'all'"
          >
            全部
          </el-button>
          <el-button
            :type="gameFilter === 'honor_of_kings' ? 'primary' : 'default'"
            size="small"
            @click="gameFilter = 'honor_of_kings'"
          >
            王者荣耀
          </el-button>
          <el-button
            :type="gameFilter === 'honor_esports' ? 'primary' : 'default'"
            size="small"
            @click="gameFilter = 'honor_esports'"
          >
            王者电竞
          </el-button>
        </div>
      </div>

      <BuddyPullRefresh
        :plain="isWide"
        :refresh="pullRefresh"
        :reserved-top-extra="isWide ? 0 : 148"
        :disabled="false"
      >
        <!-- 资讯列表 -->
        <div v-if="tab === 'news'">
          <div v-if="loading && !news.length" class="loading-state">
            <el-icon class="is-loading"><Refresh /></el-icon>
            <p>加载中...</p>
          </div>

          <div v-else class="news-list">
            <article
              v-for="(n, idx) in filteredNews"
              :id="'news-' + n.id"
              :key="n.id"
              class="news-card"
            >
              <div v-if="n.coverUrl" class="news-cover">
                <img :src="n.coverUrl" alt="" loading="lazy" />
              </div>
              <div class="news-content">
                <div class="news-meta">
                  <span class="news-publisher">{{ newsChannelLabel(n) }}</span>
                  <span v-if="isOfficialFeedTag(n)" class="official-tag">官方</span>
                </div>
                <h3 class="news-title">{{ n.title }}</h3>
                <p v-if="n.summary" class="news-summary">{{ n.summary }}</p>
                <div class="news-footer">
                  <span v-if="fmtDate(n.publishedAt)" class="news-date">
                    <el-icon :size="14"><Timer /></el-icon>
                    {{ fmtDate(n.publishedAt) }}
                  </span>
                  <span v-if="gameLabel(n.gameId)" class="news-game">{{ gameLabel(n.gameId) }}</span>
                </div>
                <div class="news-actions">
                  <el-button
                    size="small"
                    :type="likedNewsIds.has(n.id) ? 'primary' : 'default'"
                    @click.stop="toggleLikeNews(n.id)"
                  >
                    <el-icon>
                      <StarFilled v-if="likedNewsIds.has(n.id)" />
                      <Star v-else />
                    </el-icon>
                    {{ likedNewsIds.has(n.id) ? '已赞' : '点赞' }}
                  </el-button>
                  <el-button
                    size="small"
                    :type="savedNewsIds.has(n.id) ? 'primary' : 'default'"
                    @click.stop="toggleSaveNews(n.id)"
                  >
                    <el-icon><Collection /></el-icon>
                    {{ savedNewsIds.has(n.id) ? '已藏' : '收藏' }}
                  </el-button>
                  <el-button size="small" @click.stop="shareNews(n)">
                    <el-icon><Share /></el-icon>
                    分享
                  </el-button>
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
            />
          </div>
        </div>

        <!-- 推荐搭子列表 -->
        <div v-else>
          <div v-if="loading && !recs.length && !recError" class="loading-state">
            <el-icon class="is-loading"><Refresh /></el-icon>
            <p>加载中...</p>
          </div>

          <div v-else-if="recError" class="error-state">
            <p>加载失败，请稍后重试</p>
          </div>

          <div v-else class="rec-list">
            <el-card
              v-for="r in recs"
              :key="r.userId"
              class="rec-card"
              shadow="hover"
            >
              <div class="rec-header">
                <el-avatar :size="54" :src="r.avatarUrl || undefined">
                  {{ (r.nickname || '?').slice(0, 1) }}
                </el-avatar>
                <div class="rec-info">
                  <div class="rec-name">{{ r.nickname }}</div>
                  <div class="rec-score">匹配度: {{ r.matchScore }}</div>
                </div>
                <el-button type="primary" size="small" @click.stop="applyBuddy(r)">
                  搭一下
                </el-button>
              </div>
              <ReasonPanel v-if="r.matchReasons && r.matchReasons.length" :reasons="r.matchReasons" />
            </el-card>

            <BuddyEmptyState
              v-if="!loading && !recs.length"
              title="暂无推荐"
              description="稍后再试"
            />
          </div>
        </div>
      </BuddyPullRefresh>
    </div>
  </div>
</template>

<style scoped>
.discover-fixed {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding-bottom: 40px;
}

.discover-header {
  background: linear-gradient(165deg, #ffffff 0%, #f1f5fb 55%, #eef2ff 100%);
  border-radius: 0 0 20px 20px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #2563eb;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  color: #1d4ed8;
}

.header-tag {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.header-content {
  text-align: center;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.header-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 16px 0;
}

.header-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #2563eb;
}

.tab-section {
  padding: 0 16px;
  margin-bottom: 16px;
}

.tab-buttons {
  display: flex;
  gap: 8px;
  background: #ffffff;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f1f5f9;
}

.tab-btn.active {
  background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.main-content {
  padding: 0 16px;
}

.toolbar {
  background: #ffffff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input {
  margin-bottom: 12px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.loading-state .el-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.news-list,
.rec-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.news-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.news-cover {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.news-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.news-publisher {
  font-size: 12px;
  color: #64748b;
}

.official-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  border-radius: 4px;
  font-weight: 600;
}

.news-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.news-summary {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.news-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.news-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.news-actions {
  display: flex;
  gap: 8px;
}

.rec-card {
  transition: all 0.2s;
}

.rec-card:hover {
  transform: translateY(-2px);
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-info {
  flex: 1;
}

.rec-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.rec-score {
  font-size: 13px;
  color: #64748b;
}

@media (min-width: 768px) {
  .discover-fixed {
    max-width: 1200px;
    margin: 0 auto;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .search-input {
    flex: 1;
    margin-bottom: 0;
  }

  .filter-buttons {
    flex-shrink: 0;
  }
}
</style>
