<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Loading, Menu, Monitor, Plus, Reading, Search, Star, Trophy } from '@element-plus/icons-vue'
import * as postsApi from '@/api/posts'
import { useForumStore } from '@/stores/forum'
import { useFavoritePostsStore } from '@/stores/favoritePosts'
import type { ForumCategory, Post } from '@/types/post'
import { isVisibleInPublicForum } from '@/utils/forum'
import BuddyEmptyState from '@/components/buddy/BuddyEmptyState.vue'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'

const router = useRouter()
const forum = useForumStore()
const favoritePosts = useFavoritePostsStore()

const favoriteCount = computed(() => favoritePosts.postIds.length)

const excerptLen = ref(260)
let excerptMq: MediaQueryList | null = null
function updateExcerptLen() {
  excerptLen.value = window.matchMedia('(min-width: 1100px)').matches ? 300 : 200
}

function excerptPreview(content?: string) {
  const raw = content ?? ''
  const max = excerptLen.value
  if (raw.length <= max) return raw
  return raw.slice(0, max) + '…'
}

const list = ref<Post[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const page = ref(1)

/** 与 postsApi.getPosts 默认 size 一致，用于判断是否还有下一页 */
const FORUM_PAGE_SIZE = 20

const sortMode = ref<'recommend' | 'latest' | 'hot'>('recommend')
const scenarioId = ref<string>('')

const SCENARIOS: { id: string; label: string; needles: string[] }[] = [
  { id: 'team', label: '组队招募', needles: ['组队', '招募', '开黑', '双排', '五排'] },
  { id: 'guide', label: '攻略心得', needles: ['攻略', '英雄', '出装', '版本'] },
  { id: 'esports', label: '赛评唠局', needles: ['赛事', 'KPL', '复盘', '观赛'] },
  { id: 'mindset', label: '心态沟通', needles: ['心态', '压力', '沟通'] },
]

const CAT_GRID: {
  label: string
  value: ForumCategory | ''
  icon: Component
}[] = [
  { label: '全部', value: '', icon: Menu },
  { label: '招募组队', value: 'recruit', icon: Monitor },
  { label: '攻略心得', value: 'guide', icon: Reading },
  { label: '闲聊', value: 'social', icon: ChatDotRound },
  { label: '活动', value: 'event', icon: Trophy },
]

const CAT_META: Record<ForumCategory, { label: string; icon: Component; tone: string }> = {
  recruit: { label: '招募组队', icon: Monitor, tone: 'recruit' },
  guide: { label: '攻略心得', icon: Reading, tone: 'guide' },
  social: { label: '闲聊', icon: ChatDotRound, tone: 'social' },
  event: { label: '赛事活动', icon: Trophy, tone: 'event' },
}

function categoryMeta(c: ForumCategory) {
  return CAT_META[c] ?? CAT_META.social
}

function fmtPostDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 社區感相對時間：7 天內相對表述，之後回落到日期 */
function fmtPostTimeAgo(iso?: string) {
  if (!iso) return '刚刚'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  if (diff < 0) return fmtPostDate(iso)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时前`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}天前`
  return fmtPostDate(iso) || ''
}

function postMatchesScenario(p: Post, needles: string[]) {
  const blob = `${p.title}${p.content}${(p.tags ?? []).join('')}`
  return needles.some((n) => blob.includes(n))
}

const displayedPosts = computed(() => {
  let rows = [...list.value]
  if (scenarioId.value) {
    const s = SCENARIOS.find((x) => x.id === scenarioId.value)
    if (s?.needles?.length) {
      rows = rows.filter((p) => postMatchesScenario(p, s.needles))
    }
  }

  const byPinnedThen = (a: Post, b: Post) => {
    const pd = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    if (pd !== 0) return pd
    if (sortMode.value === 'latest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    }
    if (sortMode.value === 'hot') {
      const ld = (b.likeCount ?? 0) - (a.likeCount ?? 0)
      if (ld !== 0) return ld
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    }
    const ia = list.value.findIndex((x) => x.postId === a.postId)
    const ib = list.value.findIndex((x) => x.postId === b.postId)
    return ia - ib
  }

  rows.sort(byPinnedThen)
  return rows
})

const allTags = computed(() => {
  const set = new Set<string>()
  for (const p of list.value) {
    for (const t of p.tags ?? []) {
      if (t.trim()) set.add(t.trim())
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

/** 顶部英雄区数据摘要（随列表刷新） */
const squareStats = computed(() => ({
  posts: list.value.length,
  tags: allTags.value.length,
  pinned: list.value.filter((p) => p.pinned).length,
}))

async function load(isAppend = false) {
  if (!isAppend) {
    loading.value = true
    finished.value = false
    page.value = 1
  } else {
    loadingMore.value = true
  }

  try {
    const r = await postsApi.getPosts({
      category: forum.category as ForumCategory | '',
      page: page.value,
      size: FORUM_PAGE_SIZE,
      q: forum.keyword || undefined,
    })
    const visible = r.list.filter(isVisibleInPublicForum)

    if (isAppend) {
      list.value.push(...visible)
    } else {
      list.value = visible
    }

    if (visible.length < FORUM_PAGE_SIZE) {
      finished.value = true
    }
  } catch {
    if (!isAppend) list.value = []
    finished.value = true
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (loading.value || loadingMore.value || finished.value) return
  page.value++
  void load(true)
}

watch(
  () => forum.category,
  () => {
    page.value = 1
    void load()
  }
)

onMounted(() => {
  updateExcerptLen()
  excerptMq = window.matchMedia('(min-width: 1100px)')
  excerptMq.addEventListener('change', updateExcerptLen)
  void load()
})

function open(p: Post) {
  void router.push({ name: 'post-detail', params: { postId: p.postId } })
}

function goEdit() {
  void router.push({ name: 'post-editor' })
}

function setCategory(v: ForumCategory | '') {
  forum.setCategory(v)
}

function toggleScenario(id: string) {
  scenarioId.value = scenarioId.value === id ? '' : id
}

function onSearch() {
  page.value = 1
  void load()
}

function applyTagAsQuery(tag: string) {
  forum.setKeyword(tag)
  page.value = 1
  void load()
}

async function onLike(e: Event, p: Post) {
  e.stopPropagation()
  try {
    const r = await postsApi.likePost(p.postId)
    const idx = list.value.findIndex((x) => x.postId === p.postId)
    if (idx >= 0) {
      list.value[idx] = {
        ...list.value[idx],
        likeCount: (r as { likeCount?: number }).likeCount ?? (list.value[idx].likeCount ?? 0) + 1,
      }
    }
    ElMessage.success('已点赞')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '点赞失败')
  }
}

function openComments(e: Event, p: Post) {
  e.stopPropagation()
  void router.push({ name: 'post-detail', params: { postId: p.postId } })
}

function goFavorites() {
  void router.push({ name: 'forum-favorites' })
}

/** 帖子卡片左侧语义色带（与 tokens.css --color-* 对齐） */
const CATEGORY_COLOR: Record<ForumCategory, string> = {
  recruit: 'var(--color-recruit)',
  guide: 'var(--color-guide)',
  social: 'var(--color-social)',
  event: 'var(--color-event)',
}

function postCategoryStyle(p: Post): Record<string, string> {
  const c = p.category as ForumCategory
  return { '--category-color': CATEGORY_COLOR[c] ?? 'var(--color-social)' }
}

onBeforeUnmount(() => {
  excerptMq?.removeEventListener('change', updateExcerptLen)
})
</script>

<template>
  <div class="buddy-page forum forum-view-container forum--dense forum--stack">
    <!-- 發現區 + 篩選台：同一玻璃外殼，避免雙重卡片割裂 -->
    <div class="forum-hero-stack">
    <section class="forum-layer forum-layer--discover" aria-labelledby="forum-discover-heading">
      <div class="forum-layer__inner forum-layer__inner--discover">
        <div class="forum-discover-card">
          <div class="forum-discover-card__main">
            <p class="forum-layer__eyebrow forum-layer__eyebrow--discover">发现</p>
            <div class="forum-discover-headline">
              <span class="forum-discover-headline__accent" aria-hidden="true" />
              <div class="forum-discover-headline__body">
                <h1 id="forum-discover-heading" class="forum-discover-title">峡谷广场</h1>
                <p class="forum-discover__subtitle">开黑招募 · 攻略 · 赛评唠局</p>
              </div>
            </div>
            <p v-if="list.length" class="forum-hero-meta forum-hero-meta--discover" aria-label="广场数据摘要">
              <span class="forum-hero-meta__item"><strong>{{ squareStats.posts }}</strong> 帖</span>
              <span class="forum-hero-meta__dot" aria-hidden="true" />
              <span class="forum-hero-meta__item"><strong>{{ squareStats.tags }}</strong> 话题</span>
              <template v-if="squareStats.pinned">
                <span class="forum-hero-meta__dot" aria-hidden="true" />
                <span class="forum-hero-meta__item forum-hero-meta__item--pin"
                  ><strong>{{ squareStats.pinned }}</strong> 置顶</span
                >
              </template>
            </p>
            <div class="forum-search-wrap forum-search-wrap--discover">
              <el-input
                v-model="forum.keyword"
                class="forum-search"
                round
                clearable
                placeholder="搜帖子、话题标签…"
                @clear="onSearch"
                @keyup.enter="onSearch"
              >
                <template #prefix>
                  <el-icon class="forum-search__ico"><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cy-console-wrapper" aria-label="篩選與話題">
      <div class="cy-console">
        <nav class="cy-main-tabs">
          <button
            v-for="c in CAT_GRID"
            :key="c.label"
            type="button"
            class="cy-tab"
            :class="{ 'is-active': forum.category === c.value }"
            :data-category="c.value || 'all'"
            @click="setCategory(c.value)"
          >
            <el-icon class="cy-tab-icon"><component :is="c.icon" /></el-icon>
            <span>{{ c.label }}</span>
          </button>
        </nav>

        <div class="cy-sub-filters">
          <div class="cy-filter-group">
            <span class="cy-label">场景探测</span>
            <div class="cy-chips">
              <button
                v-for="s in SCENARIOS"
                :key="s.id"
                type="button"
                class="cy-chip"
                :class="{ 'is-active': scenarioId === s.id }"
                @click="toggleScenario(s.id)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <div class="cy-filter-group">
            <span class="cy-label">信息流排序</span>
            <div class="cy-chips">
              <button type="button" class="cy-chip" :class="{ 'is-active': sortMode === 'recommend' }" @click="sortMode = 'recommend'">
                推荐
              </button>
              <button type="button" class="cy-chip" :class="{ 'is-active': sortMode === 'latest' }" @click="sortMode = 'latest'">
                最新
              </button>
              <button type="button" class="cy-chip" :class="{ 'is-active': sortMode === 'hot' }" @click="sortMode = 'hot'">
                热门
              </button>
            </div>
          </div>
        </div>

        <div v-if="allTags.length" class="cy-filter-group cy-tags-group">
          <span class="cy-label">热门协议</span>
          <div class="cy-tags">
            <button v-for="t in allTags" :key="t" type="button" class="cy-tag" @click="applyTagAsQuery(t)">
              # {{ t }}
            </button>
          </div>
        </div>
      </div>
    </section>
    </div>

    <BuddyPullRefresh :refresh="load" :reserved-top-extra="140">
      <section class="cy-feed-section" aria-labelledby="forum-feed-heading">
        <div class="cy-feed-header">
          <h2 id="forum-feed-heading" class="cy-feed-title">
            元流动态 <span class="cy-feed-count">{{ displayedPosts.length }}</span>
          </h2>
          <button type="button" class="cy-post-btn" @click="goEdit">
            <el-icon><Plus /></el-icon> 建立连接
          </button>
        </div>

        <div
          class="cy-feed-grid buddy-stagger-children"
          v-infinite-scroll="loadMore"
          :infinite-scroll-disabled="loading || loadingMore || finished"
          :infinite-scroll-distance="100"
        >
          <template v-if="loading && !list.length">
            <div
              v-for="i in 4"
              :key="'skel-' + i"
              class="cy-card cy-card--skeleton"
              aria-hidden="true"
            >
              <el-skeleton animated>
                <template #template>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
                    <el-skeleton-item variant="circle" style="width: 36px; height: 36px" />
                    <div style="display: flex; flex-direction: column; gap: 4px; flex: 1">
                      <el-skeleton-item variant="text" style="width: 30%" />
                      <el-skeleton-item variant="text" style="width: 20%" />
                    </div>
                  </div>
                  <el-skeleton-item variant="h3" style="width: 60%; margin-bottom: 8px" />
                  <el-skeleton-item variant="text" style="margin-bottom: 4px" />
                  <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 12px" />
                  <el-skeleton-item variant="image" style="width: 100%; height: 120px; border-radius: 10px" />
                </template>
              </el-skeleton>
            </div>
          </template>

          <template v-else>
            <div
              v-for="p in displayedPosts"
              :key="p.postId"
              class="cy-card"
              :style="postCategoryStyle(p)"
              role="button"
              tabindex="0"
              @click="open(p)"
              @keydown.enter.prevent="open(p)"
            >
              <div class="cy-card-orb" aria-hidden="true" />

              <div class="cy-card-header">
                <div class="cy-author">
                  <div class="cy-avatar-wrap">
                    <el-avatar class="cy-avatar-el" :size="44" :src="p.authorAvatarUrl || undefined">
                      {{ (p.authorNickname || '漫').slice(0, 1) }}
                    </el-avatar>
                    <div class="cy-avatar-glow" aria-hidden="true" />
                  </div>
                  <div class="cy-meta">
                    <div class="cy-name-row">
                      <span class="cy-name">{{ p.authorNickname || '漫游者' }}</span>
                      <span v-if="p.pinned" class="cy-badge cy-badge--pin">TOP</span>
                    </div>
                    <span class="cy-time">{{ fmtPostTimeAgo(p.createdAt) }}</span>
                  </div>
                </div>
                <div class="cy-category">{{ categoryMeta(p.category).label }}</div>
              </div>

              <div class="cy-card-body">
                <h3 class="cy-title">{{ p.title }}</h3>
                <p class="cy-excerpt">{{ excerptPreview(p.content) }}</p>
              </div>

              <div
                v-if="p.mediaAttachments?.length"
                class="cy-media-grid"
                :data-count="Math.min(p.mediaAttachments.length, 3)"
              >
                <div v-for="(img, idx) in p.mediaAttachments.slice(0, 3)" :key="idx" class="cy-media-item">
                  <img :src="img" alt="配图" loading="lazy" />
                  <div v-if="idx === 2 && p.mediaAttachments.length > 3" class="cy-media-overlay">
                    +{{ p.mediaAttachments.length - 3 }}
                  </div>
                </div>
              </div>

              <div class="cy-card-footer">
                <div class="cy-card-tags">
                  <span v-for="tag in p.tags || []" :key="tag" class="cy-foot-tag"># {{ tag }}</span>
                </div>
                <div class="cy-stats">
                  <button type="button" class="cy-stat-btn" @click.stop="onLike($event, p)">
                    <span class="icon">⭐</span> {{ p.likeCount ?? 0 }}
                  </button>
                  <button type="button" class="cy-stat-btn" @click.stop="openComments($event, p)">
                    <span class="icon">💬</span> {{ p.commentCount ?? 0 }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <BuddyEmptyState
            v-if="!loading && !displayedPosts.length"
            class="forum-feed-span-all"
            :title="list.length ? '当前筛选下暂无帖子' : '暂无帖子'"
            :description="
              list.length
                ? '试试清空场景快捷或更换分区、关键词'
                : '做第一个发帖的人，或换个关键词试试'
            "
            action-label="发帖"
            :action-to="{ name: 'post-editor' }"
          >
            <template #icon>
              <el-icon :size="28">
                <Plus />
              </el-icon>
            </template>
          </BuddyEmptyState>

          <div v-if="loadingMore" class="cy-feed-bottom">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载更多帖子...</span>
          </div>
          <div v-if="finished && list.length && !loading" class="cy-feed-bottom">
            <span>— 已经到底啦 —</span>
          </div>
        </div>
      </section>
    </BuddyPullRefresh>

    <el-button
      class="forum-fab forum-fab--star"
      type="primary"
      circle
      size="large"
      aria-label="我的收藏"
      @click="goFavorites"
    >
      <el-badge
        :value="favoriteCount"
        :hidden="favoriteCount === 0"
        :max="99"
        :offset="[10, 6]"
      >
        <el-icon :size="20"><Star /></el-icon>
      </el-badge>
    </el-button>

    <el-button class="forum-fab forum-fab--post" type="primary" circle size="large" aria-label="发帖" @click="goEdit">
      <el-icon :size="22"><Plus /></el-icon>
    </el-button>
  </div>
</template>

<style scoped>
/* ==========================================================
   峽谷廣場：王者情感色 · Hero / 分區 Chip / 貼文語義色帶
   ========================================================== */

.forum.forum-view-container {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-shadow: 0 8px 32px rgba(37, 99, 235, 0.05);

  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 80px;
  position: relative;
  overflow-x: hidden;
  /* 暖霧亮底 + 峽谷氛圍：Light-first 空間感，與 tokens 情感色呼應 */
  background:
    radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.02) 0%, transparent 50%),
    radial-gradient(ellipse 90% 55% at 0% 0%, rgba(56, 189, 248, 0.12) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 100% 8%, rgba(168, 85, 247, 0.1) 0%, transparent 52%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(251, 191, 36, 0.06) 0%, transparent 48%),
    var(--buddy-surface-bg, var(--buddy-page-bg, #f8fafc));
  transition: background 0.8s ease;
}

:global(html.dark) .forum.forum-view-container {
  --glass-bg: rgba(30, 41, 59, 0.45);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  background:
    radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 85% 50% at 10% 0%, rgba(56, 189, 248, 0.14) 0%, transparent 52%),
    radial-gradient(ellipse 80% 45% at 90% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
    #020617;
}

/* 僅剝除可能嵌套的 app-layer 白底；勿對 forum-layer__inner 全量透明，否則易與下方玻璃規則打架 */
.forum :deep(.app-layer),
.forum :deep(.app-layer__inner) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

/* 玻璃面板：僅「發現區」沿用原 token 玻璃 */
.forum .forum-layer--discover .forum-layer__inner {
  padding: 24px !important;
  border-radius: 28px !important;
  background: var(--glass-bg) !important;
  backdrop-filter: blur(32px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(32px) saturate(180%) !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow), 0 1px 1px rgba(255, 255, 255, 0.3) inset !important;
  margin-bottom: 24px !important;
}
:global(html.dark) .forum .forum-layer--discover .forum-layer__inner {
  box-shadow: var(--glass-shadow), 0 1px 1px rgba(255, 255, 255, 0.1) inset !important;
}

/* 發現 + 篩選：合併為單一玻璃外輪廓（與頂欄主色一致） */
.forum .forum-hero-stack {
  width: 100%;
  max-width: min(1280px, 100%);
  margin: 0 auto 20px;
  padding: 0 clamp(12px, 3vw, 24px);
  box-sizing: border-box;
}

.forum .forum-hero-stack .forum-layer--discover .forum-layer__inner {
  margin-bottom: 0 !important;
  border-radius: 28px 28px 0 0 !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18) !important;
  /* 緊湊內邊距，減少發現區中空感 */
  padding: 16px 18px 16px !important;
}

:global(html.dark) .forum .forum-hero-stack .forum-layer--discover .forum-layer__inner {
  border-bottom-color: rgba(255, 255, 255, 0.08) !important;
}

.forum .forum-hero-stack .cy-console-wrapper {
  padding: 0 !important;
  margin-bottom: 0 !important;
}

.forum .forum-hero-stack .cy-console {
  border-radius: 0 0 28px 28px !important;
  border-top: none !important;
  padding-top: 18px !important;
}

:global(html.dark) .forum .forum-hero-stack .cy-console {
  border-top: none !important;
}

.forum-layer__eyebrow {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}

/* 發現卡：單欄緊湊 + 背景氛圍（取消右側空景欄，避免中間空洞） */
.forum-layer__eyebrow--discover {
  margin: 0;
  text-transform: none;
  letter-spacing: 0.1em;
  font-size: 11px;
  font-weight: 800;
  color: #2563eb;
}

:global(html.dark) .forum-layer__eyebrow--discover {
  color: #60a5fa;
}

.forum-discover-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
}

/* 全景漸層僅作底紋，不佔版面寬欄 */
.forum-discover-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 85% 100% at 100% 0%, rgba(147, 197, 253, 0.38) 0%, transparent 55%),
    radial-gradient(ellipse 60% 80% at 0% 100%, rgba(199, 210, 254, 0.28) 0%, transparent 50%),
    linear-gradient(115deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0) 65%);
}

:global(html.dark) .forum-discover-card::before {
  background:
    radial-gradient(ellipse 80% 90% at 95% 5%, rgba(59, 130, 246, 0.22) 0%, transparent 52%),
    radial-gradient(ellipse 55% 70% at 5% 95%, rgba(79, 70, 229, 0.12) 0%, transparent 48%),
    linear-gradient(120deg, rgba(30, 41, 59, 0.35) 0%, transparent 60%);
}

.forum-discover-card__main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
}

.forum-discover-headline {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.forum-discover-headline__accent {
  width: 4px;
  border-radius: 999px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #3b82f6 0%, #6366f1 70%, #38bdf8 100%);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.18);
}

.forum-discover-headline__body {
  flex: 1;
  min-width: 0;
}

.forum-discover-title {
  margin: 0 0 4px;
  font-size: clamp(24px, 3.8vw, 32px);
  font-weight: 900;
  color: #0f172a;
  letter-spacing: 0.02em;
  line-height: 1.22;
}

:global(html.dark) .forum-discover-title {
  color: #f8fafc;
}

.forum-discover__subtitle {
  margin: 0;
  font-size: clamp(12px, 1.6vw, 14px);
  font-weight: 600;
  color: #64748b;
  line-height: 1.45;
  max-width: 42em;
}

:global(html.dark) .forum-discover__subtitle {
  color: #94a3b8;
}

.forum-hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--buddy-text-secondary);
}

/* 發現區：數據列與上下間距收斂 */
.forum-hero-meta--discover {
  margin: 0;
  gap: 6px 12px;
  font-size: 12px;
}

.forum-hero-meta strong {
  font-weight: 800;
  color: var(--buddy-text);
}
.forum-hero-meta__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-guide), var(--color-social));
  opacity: 0.85;
}

.forum-search-wrap {
  margin-top: 4px;
}

.forum-search-wrap--discover {
  margin-top: 0;
  width: 100%;
  padding-top: 4px;
}

/* 參考稿：搜尋為實白膠囊；其餘版面仍可用半透明 */
.forum-search-wrap--discover .forum-search :deep(.el-input__wrapper) {
  background: #ffffff !important;
  border-radius: 100px !important;
  padding: 6px 22px !important;
  border: none !important;
  box-shadow:
    0 4px 18px rgba(15, 23, 42, 0.07),
    0 0 0 1px rgba(226, 232, 240, 0.95) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:global(html.dark) .forum-search-wrap--discover .forum-search :deep(.el-input__wrapper) {
  background: rgba(15, 23, 42, 0.92) !important;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) !important;
}

.forum-search-wrap--discover .forum-search :deep(.el-input__wrapper.is-focus) {
  background: #ffffff !important;
  box-shadow:
    0 0 0 2px rgba(59, 130, 246, 0.45),
    0 10px 28px rgba(59, 130, 246, 0.12) !important;
  transform: translateY(-1px);
}

:global(html.dark) .forum-search-wrap--discover .forum-search :deep(.el-input__wrapper.is-focus) {
  background: rgba(30, 41, 59, 0.95) !important;
  box-shadow:
    0 0 0 2px rgba(96, 165, 250, 0.45),
    0 10px 28px rgba(59, 130, 246, 0.15) !important;
}

.forum-search-wrap--discover .forum-search :deep(.el-input__prefix .el-icon),
.forum-search-wrap--discover .forum-search :deep(.forum-search__ico) {
  color: #3b82f6;
}

:global(html.dark) .forum-search-wrap--discover .forum-search :deep(.el-input__prefix .el-icon),
:global(html.dark) .forum-search-wrap--discover .forum-search :deep(.forum-search__ico) {
  color: #60a5fa;
}

/* 其他頁若復用 .forum-search 仍保留毛玻璃 */
.forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.6) !important;
  border-radius: 100px !important;
  padding: 4px 20px !important;
  border: none !important;
  box-shadow:
    0 4px 16px rgba(15, 23, 42, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset !important;
  backdrop-filter: saturate(180%) blur(16px) !important;
  -webkit-backdrop-filter: saturate(180%) blur(16px) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:global(html.dark) .forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.el-input__wrapper) {
  background: rgba(15, 23, 42, 0.55) !important;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;
}

.forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.9) !important;
  box-shadow:
    0 0 0 2px rgba(59, 130, 246, 0.4),
    0 8px 24px rgba(59, 130, 246, 0.1) !important;
  transform: translateY(-1px);
}

:global(html.dark) .forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.el-input__wrapper.is-focus) {
  background: rgba(30, 41, 59, 0.85) !important;
  box-shadow:
    0 0 0 2px rgba(96, 165, 250, 0.45),
    0 10px 28px rgba(59, 130, 246, 0.18) !important;
}

.forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.el-input__prefix .el-icon),
.forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.forum-search__ico) {
  color: #3b82f6;
}

:global(html.dark) .forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.el-input__prefix .el-icon),
:global(html.dark) .forum-search-wrap:not(.forum-search-wrap--discover) .forum-search :deep(.forum-search__ico) {
  color: #60a5fa;
}

/* ==========================================================
   1. 筛选与分区导航栏 (控制台) 终极玻璃态
   ========================================================== */
.forum .forum-layer--filters .forum-layer__inner {
  display: flex !important;
  flex-direction: column !important;
  gap: 20px !important;
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(24px) saturate(150%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(150%) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
  border-radius: 24px !important;
  padding: 24px 32px !important;
  margin-bottom: 24px !important;
  transition: all 0.3s ease !important;
}

:global(html.dark) .forum .forum-layer--filters .forum-layer__inner {
  background: rgba(15, 23, 42, 0.5) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
}

.forum-toolbar-row {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: space-between !important;
  align-items: center !important;
  gap: 16px !important;
}

.forum-scenario-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.forum-scenario-scroll {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.forum-sort {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.forum-mini-label,
.forum-tags-row__label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}
.forum-tags-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.forum-tag-scroll {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.forum-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.forum-feed-head__titles {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.forum-feed-head__title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--buddy-text);
}
.forum-feed-head__count {
  font-size: 13px;
  font-weight: 700;
  color: var(--buddy-text-muted);
}

/* 場景 / 排序 / 話題膠囊 */
.forum-scenario-chip,
.forum-sort-pill,
.forum-tag-chip {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 34px !important;
  padding: 0 18px !important;
  border-radius: 999px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(203, 213, 225, 0.6) !important;
  color: #64748b !important;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  cursor: pointer !important;
}
:global(html.dark) .forum-scenario-chip,
:global(html.dark) .forum-sort-pill,
:global(html.dark) .forum-tag-chip {
  background: rgba(30, 41, 59, 0.5) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #94a3b8 !important;
}

.forum-scenario-chip:hover,
.forum-sort-pill:hover,
.forum-tag-chip:hover {
  transform: translateY(-2px) !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: #38bdf8 !important;
  color: #0284c7 !important;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2) !important;
}
:global(html.dark) .forum-scenario-chip:hover,
:global(html.dark) .forum-sort-pill:hover,
:global(html.dark) .forum-tag-chip:hover {
  background: rgba(30, 41, 59, 0.9) !important;
  border-color: #7dd3fc !important;
  color: #bae6fd !important;
}

.forum-scenario-chip.is-active,
.forum-sort-pill.is-active {
  background: #8b5cf6 !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow:
    0 4px 16px rgba(139, 92, 246, 0.5),
    inset 0 2px 4px rgba(255, 255, 255, 0.3) !important;
  transform: translateY(1px) !important;
}

/* 导航栏分区 Chip (胶囊化) */
.forum-categories {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
  overflow-x: auto;
  padding-bottom: 12px;
  flex-wrap: wrap;
  align-items: stretch;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  scrollbar-width: none;
}
.forum-categories::-webkit-scrollbar {
  display: none;
}
:global(html.dark) .forum-categories {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.forum-category-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 100px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-size: 14px;
  font-weight: 700;
  color: var(--buddy-text-secondary);
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

:global(html.dark) .forum-category-chip {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(30, 41, 59, 0.75);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.forum-category-chip:hover {
  transform: translateY(-2px);
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

:global(html.dark) .forum-category-chip:hover {
  background: rgba(51, 65, 85, 0.9);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.forum-category-chip__icon {
  display: flex;
  align-items: center;
  color: inherit;
  opacity: 0.9;
}

.forum-category-chip.is-active {
  background: var(--category-gradient);
  color: #fff;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px var(--category-shadow),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
}

.forum-category-chip[data-category='all'].is-active {
  --category-gradient: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  --category-shadow: rgba(168, 85, 247, 0.42);
}

.forum-category-chip[data-category='recruit'].is-active {
  --category-gradient: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  --category-shadow: rgba(245, 158, 11, 0.42);
}

.forum-category-chip[data-category='guide'].is-active {
  --category-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  --category-shadow: rgba(37, 99, 235, 0.42);
}

.forum-category-chip[data-category='social'].is-active {
  --category-gradient: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  --category-shadow: rgba(236, 72, 153, 0.42);
}

.forum-category-chip[data-category='event'].is-active {
  --category-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --category-shadow: rgba(16, 185, 129, 0.42);
}

/* --- 貼文卡片：純 div（無 el-card 裁切）+ 左側語義色帶 + Hover 加強版 --- */
.forum-post-list {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
  gap: 24px !important;
  align-items: start !important;
  padding-top: 12px !important;
}

/* ==========================================================
   2. 帖子卡片 (Post Card) 3D悬浮与边缘光效
   ========================================================== */
.forum .post-card.forum-post-card {
  --category-color: var(--color-guide);
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 0;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 8px 24px rgba(15, 23, 42, 0.04),
    0 1px 1px rgba(255, 255, 255, 0.5) inset;
}

:global(html.dark) .forum .post-card.forum-post-card {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 1px 1px rgba(255, 255, 255, 0.05) inset;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.forum .post-card.forum-post-card--skeleton {
  --category-color: rgba(59, 130, 246, 0.45);
  pointer-events: none;
  background: linear-gradient(
    90deg,
    var(--buddy-surface-2, #f8fafc) 0%,
    rgba(226, 232, 240, 0.85) 20%,
    var(--buddy-surface-2, #f8fafc) 40%,
    var(--buddy-surface-2, #f8fafc) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border: 1px solid rgba(59, 130, 246, 0.08);
}
.forum .post-card.forum-post-card--skeleton::before {
  opacity: 0.35;
}

.forum .post-card.forum-post-card--skeleton :deep(.el-skeleton__item) {
  background: linear-gradient(
    90deg,
    rgba(37, 99, 235, 0.06) 0%,
    rgba(124, 58, 237, 0.08) 50%,
    rgba(37, 99, 235, 0.06) 100%
  ) !important;
  background-size: 200% 100% !important;
  animation: skeleton-shimmer 2s linear infinite;
  border-radius: 8px;
}

:global(html.dark) .forum .post-card.forum-post-card--skeleton {
  background: linear-gradient(
    90deg,
    rgba(30, 41, 59, 0.95) 0%,
    rgba(51, 65, 85, 0.75) 22%,
    rgba(30, 41, 59, 0.95) 44%,
    rgba(30, 41, 59, 0.95) 100%
  );
  border-color: rgba(96, 165, 250, 0.12);
}
:global(html.dark) .forum .post-card.forum-post-card--skeleton :deep(.el-skeleton__item) {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(59, 130, 246, 0.08) 100%
  ) !important;
}

/* 左侧光晕色带 (紧贴边缘) */
.forum .post-card.forum-post-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--category-color);
  box-shadow: 4px 0 24px var(--category-color);
  pointer-events: none;
  z-index: 1;
  transition: all 0.4s ease;
  opacity: 0.8;
}

.forum .post-card.forum-post-card.is-interactive {
  cursor: pointer;
}

.forum .post-card.forum-post-card.is-interactive:focus-visible {
  outline: 2px solid var(--category-color, #3b82f6);
  outline-offset: 3px;
}

.forum .post-card.forum-post-card:hover {
  transform: translateY(-6px) scale(1.01);
  z-index: 10;
  background: #ffffff;
  border-color: color-mix(in srgb, var(--category-color) 30%, transparent);
  box-shadow:
    0 20px 48px color-mix(in srgb, var(--category-color) 12%, rgba(15, 23, 42, 0.1)),
    0 0 0 1px color-mix(in srgb, var(--category-color) 10%, transparent) inset;
}

.forum .post-card.forum-post-card:hover::before {
  width: 6px;
  opacity: 1;
  box-shadow: 8px 0 32px var(--category-color);
}

:global(html.dark) .forum .post-card.forum-post-card:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: color-mix(in srgb, var(--category-color) 40%, transparent);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.8),
    0 0 32px color-mix(in srgb, var(--category-color) 15%, transparent);
}

.forum .post-card.forum-post-card .forum-post-card__body {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
}

/* 卡片內部：頭像光環 + 分區徽標 + 社區化資訊層級 */
.forum-post-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.forum-post-card__author-block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.forum-post-card__avatar-ring {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  padding: 2px;
  box-sizing: border-box;
  background: linear-gradient(135deg, var(--category-color), transparent);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--category-color) 30%, transparent);
  transition: transform 0.4s ease;
}

.forum .post-card.forum-post-card:hover .forum-post-card__avatar-ring {
  transform: rotate(15deg) scale(1.05);
}

.forum-post-card__avatar-ring :deep(.forum-post-card__avatar) {
  display: block;
  border: 2px solid #fff !important;
  box-shadow: none !important;
}

:global(html.dark) .forum-post-card__avatar-ring :deep(.forum-post-card__avatar) {
  border-color: #0f172a !important;
}

.forum-post-card__meta-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.forum-post-card__name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.forum-post-card__badge-pin {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 6px;
  color: #b45309;
  background: rgba(251, 191, 36, 0.22);
  border: 1px solid rgba(245, 158, 11, 0.35);
}

:global(html.dark) .forum-post-card__badge-pin {
  color: #fcd34d;
  background: rgba(251, 191, 36, 0.12);
  border-color: rgba(251, 191, 36, 0.28);
}

.forum-post-card__name {
  font-weight: 800 !important;
  font-size: 14px !important;
  color: var(--buddy-text) !important;
  letter-spacing: 0.01em;
}

:global(html.dark) .forum-post-card__name {
  color: #f8fafc !important;
}

.forum-post-card__time {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

:global(html.dark) .forum-post-card__time {
  color: #64748b;
}

.forum-post-card__category-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--category-color);
  flex-shrink: 0;
  background-color: color-mix(in srgb, var(--category-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--category-color) 20%, transparent);
}

.forum-post-card__category-ico {
  font-size: 14px;
}

.forum-post-card__content {
  flex: 1 !important;
  margin-bottom: 16px !important;
}

.forum-post-card__title {
  font-size: 16px !important;
  font-weight: 800 !important;
  margin-bottom: 6px !important;
  line-height: 1.4 !important;
  color: var(--buddy-text) !important;
}

:global(html.dark) .forum-post-card__title {
  color: #f8fafc !important;
}

.forum-post-card__excerpt {
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: var(--buddy-text-secondary, #475569) !important;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(html.dark) .forum-post-card__excerpt {
  color: #94a3b8 !important;
}

/* 三段式：話題標籤行 + 數據互動帶（瀏覽 / 點讚 / 評論 / 分享） */
.forum-post-card__footer {
  margin-top: auto !important;
  padding-top: 14px !important;
  border-top: 1px solid rgba(0, 0, 0, 0.04) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 12px !important;
}

:global(html.dark) .forum-post-card__footer {
  border-top-color: rgba(255, 255, 255, 0.1) !important;
}

.forum-post-card__footer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.forum-post-card__footer-tags--empty {
  min-height: 0;
}

.forum-post-card__footer-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
}

.forum-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  user-select: none;
}

:global(html.dark) .forum-stat {
  color: #64748b;
}

.forum-post-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: auto;
}

.forum-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  transition:
    color 0.25s ease,
    background 0.25s ease;
}

.forum-action-btn:hover {
  color: var(--category-color);
  background: color-mix(in srgb, var(--category-color) 8%, transparent);
}

.forum-action-btn--icon {
  padding: 6px 8px;
}

:global(html.dark) .forum-action-btn {
  color: #64748b;
}

.forum-post-tag {
  background: rgba(148, 163, 184, 0.12) !important;
  color: #64748b !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  padding: 4px 10px !important;
  border-radius: 8px !important;
}

:global(html.dark) .forum-post-tag {
  color: #94a3b8 !important;
}

@media (prefers-reduced-motion: reduce) {
  .forum .post-card.forum-post-card:hover,
  .forum-category-chip.is-active {
    transform: none !important;
  }
  .forum .post-card.forum-post-card:hover .forum-post-card__avatar-ring {
    transform: none !important;
  }
  .forum .post-card.forum-post-card--skeleton,
  .forum .post-card.forum-post-card--skeleton :deep(.el-skeleton__item) {
    animation: none !important;
  }
  .forum .post-card.forum-post-card--skeleton {
    background: var(--buddy-surface-2, #f8fafc);
  }
  :global(html.dark) .forum .post-card.forum-post-card--skeleton {
    background: rgba(30, 41, 59, 0.92);
  }
}

@media (min-width: 680px) {
  .forum .post-card.forum-post-card:has(.forum-post-card__badge-pin) {
    grid-column: span 2 !important;
  }
}

/* ==========================================================
   CYBER-GLASS V3 (全息重构版)
   ========================================================== */

/* 1. 控制台 (Cyber Console) */
.cy-console-wrapper {
  padding: 0 24px;
  margin-bottom: 32px;
}
.cy-console {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  padding: 24px 32px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(255, 255, 255, 0.6) inset;
}
:global(html.dark) .cy-console {
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 1px 1px rgba(255, 255, 255, 0.05) inset;
}

/* 导航 Tabs */
.cy-main-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 18px;
  margin-bottom: 18px;
  overflow-x: auto;
  scrollbar-width: thin;
}
:global(html.dark) .cy-main-tabs {
  border-color: rgba(255, 255, 255, 0.05);
}
.cy-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.04);
  font-size: 15px;
  font-weight: 800;
  color: #64748b;
  cursor: pointer;
  transition: all 0.4s ease;
}
.cy-tab:hover {
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
}
:global(html.dark) .cy-tab:hover {
  background: rgba(51, 65, 85, 0.85);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}
.cy-tab.is-active {
  color: #fff;
  border-color: transparent;
  transform: translateY(-1px);
}
/* 「全部」與頂欄 Tab 同一套藍紫漸層，避免紫/藍雙語系 */
.cy-tab[data-category='all'].is-active {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 8px 22px rgba(59, 130, 246, 0.38);
}
.cy-tab[data-category='recruit'].is-active {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  box-shadow: 0 12px 24px rgba(245, 158, 11, 0.4);
}
.cy-tab[data-category='guide'].is-active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
}
.cy-tab[data-category='social'].is-active {
  background: linear-gradient(135deg, #ec4899, #db2777);
  box-shadow: 0 12px 24px rgba(236, 72, 153, 0.4);
}
.cy-tab[data-category='event'].is-active {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
}

/* 子筛选与芯片 */
.cy-sub-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 14px;
}

@media (min-width: 960px) {
  .forum .forum-hero-stack .cy-sub-filters {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px 24px;
  }

  .forum .forum-hero-stack .cy-sub-filters .cy-filter-group {
    flex: 1 1 auto;
    min-width: min(100%, 320px);
  }
}
.cy-filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.cy-tags-group {
  width: 100%;
  align-items: flex-start;
}
.cy-label {
  font-size: 11px;
  font-weight: 900;
  color: #94a3b8;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.cy-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.cy-chip {
  padding: 6px 16px;
  border-radius: 100px;
  background: rgba(241, 245, 249, 0.8);
  border: none;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}
.cy-chip:hover {
  background: #fff;
  color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}
.cy-chip.is-active {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

/* 话题标签（控制台） */
.cy-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.cy-console .cy-tag {
  padding: 4px 12px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}
.cy-console .cy-tag:hover {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

/* 2. 帖子列表区头部 */
.cy-feed-section {
  padding: 0 clamp(12px, 3vw, 24px);
  max-width: min(1280px, 100%);
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}
.cy-feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.cy-feed-title {
  font-size: 24px;
  font-weight: 900;
  color: var(--buddy-text-primary, #0f172a);
  margin: 0;
}
.cy-feed-count {
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  margin-left: 8px;
}
.cy-post-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 100px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  font-weight: 800;
  border: none;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}
.cy-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.4);
}

/* 3. 核心：全息卡片 (Hologram Card) */
.cy-feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.cy-feed-grid > .forum-feed-span-all {
  grid-column: 1 / -1;
}

.cy-feed-bottom {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

.cy-card {
  position: relative;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 20px;
  padding: 22px 22px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  box-shadow:
    0 8px 28px rgba(15, 23, 42, 0.05),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.35s ease,
    background 0.35s ease;
}
:global(html.dark) .cy-card {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

/* 悬停：克制上浮，與上方控制台同一套光感 */
.cy-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.94);
  border-color: color-mix(in srgb, var(--category-color) 35%, rgba(255, 255, 255, 0.6));
  box-shadow:
    0 16px 40px color-mix(in srgb, var(--category-color) 14%, rgba(15, 23, 42, 0.08)),
    0 0 0 1px color-mix(in srgb, var(--category-color) 18%, transparent) inset;
}
:global(html.dark) .cy-card:hover {
  background: rgba(15, 23, 42, 0.8);
}

/* 灵魂设计：内部环境光球 (Ambient Orb) */
.cy-card-orb {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: var(--category-color);
  filter: blur(50px);
  opacity: 0.12;
  z-index: 0;
  pointer-events: none;
  transition: all 0.5s ease;
}
.cy-card:hover .cy-card-orb {
  opacity: 0.25;
  transform: scale(1.2);
}

/* 卡片内部层级 (置于光球之上) */
.cy-card-header,
.cy-card-body,
.cy-media-grid,
.cy-card-footer {
  position: relative;
  z-index: 1;
}

.cy-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.cy-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 动态发光头像 */
.cy-avatar-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}
.cy-avatar-wrap :deep(.el-avatar) {
  width: 100% !important;
  height: 100% !important;
  position: relative;
  z-index: 2;
}
.cy-avatar-wrap :deep(.el-avatar img) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}
.cy-avatar-glow {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--category-color), transparent);
  z-index: 1;
  filter: blur(4px);
  opacity: 0.5;
  transition: all 0.4s ease;
}
.cy-card:hover .cy-avatar-glow {
  transform: scale(1.15);
  opacity: 0.8;
}

.cy-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cy-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cy-name {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}
:global(html.dark) .cy-name {
  color: #f8fafc;
}
.cy-badge--pin {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  font-size: 10px;
  font-weight: 900;
}
.cy-time {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

/* 智能主题色标签 */
.cy-category {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  color: var(--category-color);
  background: color-mix(in srgb, var(--category-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--category-color) 20%, transparent);
}

.cy-card-body {
  margin-bottom: 16px;
}
.cy-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
  line-height: 1.4;
}
:global(html.dark) .cy-title {
  color: #f8fafc;
}
.cy-excerpt {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 媒体宫格 */
.cy-media-grid {
  display: grid;
  gap: 8px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}
.cy-media-grid[data-count='1'] {
  grid-template-columns: 1fr;
  aspect-ratio: 16 / 9;
}
.cy-media-grid[data-count='2'] {
  grid-template-columns: 1fr 1fr;
  aspect-ratio: 2 / 1;
}
.cy-media-grid[data-count='3'] {
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  aspect-ratio: 16 / 9;
}
.cy-media-grid[data-count='3'] .cy-media-item:first-child {
  grid-row: 1 / span 2;
}
.cy-media-item {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.cy-media-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.cy-card:hover .cy-media-item img {
  transform: scale(1.05);
}
.cy-media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
}

/* 底部交互 */
.cy-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: auto;
}
:global(html.dark) .cy-card-footer {
  border-color: rgba(255, 255, 255, 0.05);
}
.cy-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.cy-foot-tag {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--category-color) 78%, #000);
  background: color-mix(in srgb, var(--category-color) 10%, transparent);
}
:global(html.dark) .cy-foot-tag {
  color: color-mix(in srgb, var(--category-color) 78%, #fff);
}
.cy-stats {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.cy-stat-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s ease;
}
.cy-stat-btn:hover {
  color: var(--category-color);
  transform: translateY(-2px);
}

.cy-card--skeleton {
  pointer-events: none;
  min-height: 220px;
}
.cy-card--skeleton :deep(.el-skeleton__item) {
  background: linear-gradient(
    90deg,
    rgba(226, 232, 240, 0.6) 0%,
    rgba(241, 245, 249, 0.95) 50%,
    rgba(226, 232, 240, 0.6) 100%
  );
}

@media (min-width: 680px) {
  .cy-feed-grid .cy-card:has(.cy-badge--pin) {
    grid-column: span 2;
  }
}
</style>
