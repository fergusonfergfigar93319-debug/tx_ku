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
} from '@element-plus/icons-vue'
import * as feedApi from '@/api/feed'
import * as recApi from '@/api/recommendations'
import * as buddyApi from '@/api/buddyRequests'
import type { NewsItem } from '@/api/feed'
import type { RecommendationItem } from '@/types/recommendation'
import BuddyEmptyState from '@/components/buddy/BuddyEmptyState.vue'
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

const GAME_LABELS: Record<string, string> = {
  honor_of_kings: '王者荣耀',
  honor_esports: '王者电竞',
}

const feedCapTitle = computed(() => (tab.value === 'news' ? '版本资讯流' : '推荐搭子'))

const displayNews = computed(() => {
  if (gameFilter.value === 'all') return news.value
  return news.value.filter((n) => n.gameId === gameFilter.value)
})

const filteredNews = computed(() => {
  const q = newsSearchQuery.value.trim().toLowerCase()
  const list = displayNews.value
  if (!q) return list
  return list.filter((n) => {
    const t = `${n.title} ${n.summary ?? ''} ${n.publisherDisplayName ?? ''}`.toLowerCase()
    return t.includes(q)
  })
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

function gameLabel(id?: string) {
  if (!id) return ''
  return GAME_LABELS[id] || ''
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
  } catch {
    news.value = []
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

let mq: MediaQueryList | null = null
function updateWide() {
  isWide.value = mq?.matches ?? false
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
</script>

<template>
  <div class="discover-debug" style="padding: 20px; min-height: 100vh;">
    <header style="margin-bottom: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
      <RouterLink to="/app/home" style="display: inline-flex; align-items: center; gap: 8px;">
        <el-icon :size="16"><HomeFilled /></el-icon>
        返回首页
      </RouterLink>
      <h1 style="margin: 10px 0;">版本速递（调试版）</h1>
      <p>资讯: {{ newsStats.total }} | 王者: {{ newsStats.hok }} | 电竞: {{ newsStats.es }}</p>
    </header>

    <div style="margin-bottom: 20px;">
      <el-button :type="tab === 'news' ? 'primary' : 'default'" @click="onSegChange('news')">
        资讯流
      </el-button>
      <el-button :type="tab === 'rec' ? 'primary' : 'default'" @click="onSegChange('rec')">
        推荐搭子
      </el-button>
    </div>

    <div v-if="tab === 'news'">
      <div v-if="loading && !news.length" style="padding: 20px; text-align: center;">
        <p>加载中...</p>
      </div>

      <div v-else style="display: flex; flex-direction: column; gap: 16px;">
        <article
          v-for="(n, idx) in filteredNews"
          :key="n.id"
          style="padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;"
        >
          <h3 style="margin: 0 0 8px 0;">{{ n.title }}</h3>
          <p v-if="n.summary" style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            {{ n.summary }}
          </p>
          <div style="display: flex; gap: 12px; font-size: 12px; color: #999;">
            <span>{{ newsChannelLabel(n) }}</span>
            <span v-if="n.publishedAt">{{ fmtDate(n.publishedAt) }}</span>
            <span v-if="gameLabel(n.gameId)">{{ gameLabel(n.gameId) }}</span>
          </div>
          <div style="margin-top: 8px; display: flex; gap: 8px;">
            <el-button size="small" @click="toggleLikeNews(n.id)">
              {{ likedNewsIds.has(n.id) ? '已赞' : '点赞' }}
            </el-button>
            <el-button size="small" @click="toggleSaveNews(n.id)">
              {{ savedNewsIds.has(n.id) ? '已藏' : '收藏' }}
            </el-button>
            <el-button size="small" @click="shareNews(n)">分享</el-button>
          </div>
        </article>

        <BuddyEmptyState
          v-if="!loading && !filteredNews.length"
          title="暂无匹配资讯"
          description="尝试调整筛选，或稍后再试"
        />
      </div>
    </div>

    <div v-else>
      <div v-if="loading && !recs.length" style="padding: 20px; text-align: center;">
        <p>加载中...</p>
      </div>

      <div v-else-if="recError" style="padding: 20px; text-align: center; color: red;">
        <p>加载失败</p>
      </div>

      <div v-else style="display: flex; flex-direction: column; gap: 16px;">
        <div
          v-for="r in recs"
          :key="r.userId"
          style="padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;"
        >
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <el-avatar :size="48" :src="r.avatarUrl || undefined">
              {{ (r.nickname || '?').slice(0, 1) }}
            </el-avatar>
            <div style="flex: 1;">
              <div style="font-weight: bold;">{{ r.nickname }}</div>
              <div style="font-size: 12px; color: #666;">匹配度: {{ r.matchScore }}</div>
            </div>
            <el-button type="primary" size="small" @click="applyBuddy(r)">搭一下</el-button>
          </div>
          <div v-if="r.matchReasons && r.matchReasons.length" style="font-size: 13px; color: #666;">
            <div v-for="(reason, i) in r.matchReasons" :key="i">• {{ reason }}</div>
          </div>
        </div>

        <BuddyEmptyState
          v-if="!loading && !recs.length"
          title="暂无推荐"
          description="稍后再试"
        />
      </div>
    </div>
  </div>
</template>
