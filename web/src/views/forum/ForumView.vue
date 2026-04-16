<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound,
  ChatLineRound,
  Loading,
  Menu,
  Monitor,
  Picture,
  Plus,
  Reading,
  Search,
  Share,
  Star,
  Trophy,
} from '@element-plus/icons-vue'
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

async function sharePost(e: Event, p: Post) {
  e.stopPropagation()
  const path = router.resolve({ name: 'post-detail', params: { postId: p.postId } }).href
  const url = `${window.location.origin}${path}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.info(url)
  }
}

function goFavorites() {
  void router.push({ name: 'forum-favorites' })
}

onBeforeUnmount(() => {
  excerptMq?.removeEventListener('change', updateExcerptLen)
})
</script>

<template>
  <div class="buddy-page forum forum--dense forum--stack">
    <!-- 发现：标题 + 搜索 + 一行数据摘要 -->
    <section class="forum-layer forum-layer--discover" aria-labelledby="forum-discover-heading">
      <div class="forum-layer__inner forum-layer__inner--discover">
        <header class="forum-discover-head">
          <p class="forum-layer__eyebrow">发现</p>
          <h1 id="forum-discover-heading" class="forum-app-title">
            <span class="forum-app-title__bar" aria-hidden="true" />
            峡谷广场
          </h1>
          <p class="forum-app-slogan">开黑招募 · 攻略 · 赛评唠局</p>
          <p v-if="list.length" class="forum-hero-meta" aria-label="广场数据摘要">
            <span class="forum-hero-meta__item"
              ><strong>{{ squareStats.posts }}</strong> 帖</span
            >
            <span class="forum-hero-meta__dot" aria-hidden="true" />
            <span class="forum-hero-meta__item"
              ><strong>{{ squareStats.tags }}</strong> 话题</span
            >
            <template v-if="squareStats.pinned">
              <span class="forum-hero-meta__dot" aria-hidden="true" />
              <span class="forum-hero-meta__item forum-hero-meta__item--pin"
                ><strong>{{ squareStats.pinned }}</strong> 置顶</span
              >
            </template>
          </p>
        </header>
        <div class="forum-search-wrap">
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
    </section>

    <!-- 筛选与分区、话题：单卡工具条，减少纵向堆叠 -->
    <section class="forum-layer forum-layer--filters" aria-label="筛选与话题">
      <div class="forum-layer__inner forum-layer__inner--toolbar">
        <div class="forum-toolbar-row">
          <div class="forum-scenario-block">
            <span class="forum-mini-label">场景</span>
            <div class="forum-scenario-scroll" role="toolbar" aria-label="场景快捷">
              <button
                v-for="s in SCENARIOS"
                :key="s.id"
                type="button"
                class="forum-scenario-chip"
                :class="{ 'is-active': scenarioId === s.id }"
                @click="toggleScenario(s.id)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
          <div class="forum-sort" role="tablist" aria-label="排序">
            <button
              type="button"
              class="forum-sort-pill"
              :class="{ 'is-active': sortMode === 'recommend' }"
              role="tab"
              :aria-selected="sortMode === 'recommend'"
              @click="sortMode = 'recommend'"
            >
              推荐
            </button>
            <button
              type="button"
              class="forum-sort-pill"
              :class="{ 'is-active': sortMode === 'latest' }"
              role="tab"
              :aria-selected="sortMode === 'latest'"
              @click="sortMode = 'latest'"
            >
              最新
            </button>
            <button
              type="button"
              class="forum-sort-pill"
              :class="{ 'is-active': sortMode === 'hot' }"
              role="tab"
              :aria-selected="sortMode === 'hot'"
              @click="sortMode = 'hot'"
            >
              热门
            </button>
          </div>
        </div>

        <nav class="forum-cat-strip" aria-label="分区">
          <button
            v-for="c in CAT_GRID"
            :key="c.label"
            type="button"
            class="forum-cat-card"
            :class="{ 'is-active': forum.category === c.value }"
            @click="setCategory(c.value)"
          >
            <span class="forum-cat-card__icon" aria-hidden="true">
              <el-icon :size="17"><component :is="c.icon" /></el-icon>
            </span>
            <span class="forum-cat-card__label">{{ c.label }}</span>
          </button>
        </nav>

        <div v-if="allTags.length" class="forum-tags-row">
          <span class="forum-tags-row__label">话题</span>
          <div class="forum-tag-scroll" role="list">
            <button
              v-for="t in allTags"
              :key="t"
              type="button"
              class="forum-tag-chip"
              role="listitem"
              :title="'搜索「' + t + '」'"
              @click="applyTagAsQuery(t)"
            >
              {{ t }}
            </button>
          </div>
        </div>
        <p v-else class="forum-tags-empty">暂无话题标签 · 发帖时可添加标签便于检索</p>
      </div>
    </section>

    <BuddyPullRefresh :refresh="load" :reserved-top-extra="140">
      <section class="forum-layer forum-layer--feed" aria-labelledby="forum-feed-heading">
        <div class="forum-layer__inner forum-layer__inner--feed">
          <div class="forum-feed-head">
            <div class="forum-feed-head__titles">
              <h2 id="forum-feed-heading" class="forum-feed-head__title">帖子</h2>
              <span class="forum-feed-head__count">{{ displayedPosts.length }} 条</span>
            </div>
            <el-button class="forum-feed-head__post" type="primary" round size="small" @click="goEdit">
              <el-icon class="btn-ico"><Plus /></el-icon>
              发帖
            </el-button>
          </div>

      <div
        class="forum-post-list buddy-stagger-children"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="loading || loadingMore || finished"
        :infinite-scroll-distance="100"
      >
        <template v-if="loading && !list.length">
          <el-card
            v-for="i in 4"
            :key="'skel-' + i"
            class="forum-post-card buddy-card-surface forum-post-card--skeleton"
            shadow="never"
          >
            <div style="padding: 14px">
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
          </el-card>
        </template>

        <template v-else>
          <el-card
            v-for="p in displayedPosts"
            :key="p.postId"
            class="forum-post-card buddy-card-surface is-interactive"
            :class="'forum-post-card--' + categoryMeta(p.category).tone"
            :data-category="p.category"
            shadow="never"
            @click="open(p)"
          >
            <div class="forum-post-card__body">
              <div class="forum-post-card__header">
                <el-avatar class="forum-post-card__avatar" :size="42" :src="p.authorAvatarUrl || undefined">
                  {{ (p.authorNickname || '玩').slice(0, 1) }}
                </el-avatar>
                <div class="forum-post-card__author-info">
                  <div class="forum-post-card__name-wrap">
                    <span class="forum-post-card__name">{{ p.authorNickname || '玩家' }}</span>
                    <span v-if="p.pinned" class="forum-post-card__badge-pin">置顶</span>
                  </div>
                  <div class="forum-post-card__meta">
                    <span class="forum-post-card__date">{{ fmtPostDate(p.createdAt) }}</span>
                    <span class="forum-post-card__dot">·</span>
                    <span class="forum-type-text" :class="'text-' + categoryMeta(p.category).tone">
                      <el-icon><component :is="categoryMeta(p.category).icon" /></el-icon>
                      {{ categoryMeta(p.category).label }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="forum-post-card__content">
                <h3 class="forum-post-card__title clamp-2">{{ p.title }}</h3>
                <p class="forum-post-card__excerpt">
                  {{ excerptPreview(p.content) }}
                </p>
              </div>

              <div v-if="p.mediaAttachments?.[0]" class="forum-post-card__media">
                <img :src="p.mediaAttachments[0]" alt="帖子配图" loading="lazy" decoding="async" />
                <div v-if="(p.mediaAttachments?.length ?? 0) > 1" class="forum-post-card__media-count">
                  <el-icon><Picture /></el-icon>
                  +{{ (p.mediaAttachments?.length ?? 0) - 1 }}
                </div>
              </div>

              <div class="forum-post-card__footer">
                <div class="forum-post-card__tags" v-if="p.tags?.length">
                  <span v-for="tag in p.tags" :key="tag" class="forum-post-tag"># {{ tag }}</span>
                </div>
                <div class="forum-post-card__tags" v-else></div> <div class="forum-post-card__actions" @click.stop>
                  <button type="button" class="forum-action-btn" @click="onLike($event, p)">
                    <el-icon :size="16"><Star /></el-icon>
                    <span>{{ p.likeCount ?? 0 }}</span>
                  </button>
                  <button type="button" class="forum-action-btn" @click="openComments($event, p)">
                    <el-icon :size="16"><ChatLineRound /></el-icon>
                    <span>{{ p.commentCount ?? 0 }}</span>
                  </button>
                  <button type="button" class="forum-action-btn forum-action-btn--icon" @click="sharePost($event, p)">
                    <el-icon :size="16"><Share /></el-icon>
                  </button>
                </div>
              </div>
            </div>
          </el-card>
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

        <div v-if="loadingMore" class="forum-feed-bottom">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载更多帖子...</span>
        </div>
        <div v-if="finished && list.length && !loading" class="forum-feed-bottom">
          <span>— 已经到底啦 —</span>
        </div>
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
   ✨ 峽谷廣場：極致協調版 (Refined Holographic UI)
   ========================================================== */

.forum {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-shadow: 0 8px 32px rgba(37, 99, 235, 0.05);

  min-height: 100vh; box-sizing: border-box; padding-bottom: 80px; position: relative; overflow-x: hidden;
  background: var(--buddy-page-bg); transition: background 0.8s ease;
}

/* 暗黑模式變數切換 */
:global(html.dark) .forum {
  --glass-bg: rgba(30, 41, 59, 0.45);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  background: #020617;
}

/* 統一抹除原生白底 */
.forum :deep(.app-layer), .forum :deep(.forum-layer), .forum :deep(.app-layer__inner), .forum :deep(.forum-layer__inner) {
  background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important;
}

/* --- 1. 統一的高透玻璃面板 (統一視覺基調) --- */
.forum-layer--discover :deep(.forum-layer__inner),
.forum-layer--filters :deep(.forum-layer__inner) {
  padding: 24px !important; border-radius: 28px !important;
  background: var(--glass-bg) !important;
  backdrop-filter: blur(32px) saturate(180%) !important; -webkit-backdrop-filter: blur(32px) saturate(180%) !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow), 0 1px 1px rgba(255, 255, 255, 0.3) inset !important;
  margin-bottom: 24px !important;
}
:global(html.dark) .forum-layer--discover :deep(.forum-layer__inner),
:global(html.dark) .forum-layer--filters :deep(.forum-layer__inner) {
  box-shadow: var(--glass-shadow), 0 1px 1px rgba(255, 255, 255, 0.1) inset !important;
}

/* 面板內部的微排版 */
.forum-discover-head { margin-bottom: 16px !important; }
.forum-layer--filters :deep(.forum-layer__inner) { display: flex !important; flex-direction: column !important; gap: 20px !important; }
.forum-toolbar-row { display: flex !important; flex-wrap: wrap !important; justify-content: space-between !important; align-items: center !important; gap: 16px !important; }

/* --- 2. 標題與文字提純 --- */
.forum-app-title {
  font-size: 32px !important; font-weight: 900 !important; margin: 4px 0 8px !important;
  background: linear-gradient(135deg, #1e3a8a, #7c3aed); -webkit-background-clip: text; color: transparent;
}
:global(html.dark) .forum-app-title { background: linear-gradient(135deg, #93c5fd, #d8b4fe); -webkit-background-clip: text; color: transparent; }

/* 搜尋框：乾淨通透 */
.forum-search :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.4) !important; border-radius: 999px !important; padding: 4px 20px !important;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.3) inset !important; backdrop-filter: blur(12px) !important;
}
:global(html.dark) .forum-search :deep(.el-input__wrapper) { background: rgba(15, 23, 42, 0.4) !important; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important; }
.forum-search :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 2px #8b5cf6 inset, 0 4px 16px rgba(139, 92, 246, 0.2) !important; background: rgba(255, 255, 255, 0.9) !important; }

/* --- 3. 分類膠囊與按鈕：邊緣發光美學 (Rim Light) --- */
/* 基礎膠囊 (場景、排序、話題) */
.forum-scenario-chip, .forum-sort-pill, .forum-tag-chip {
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  height: 34px !important; padding: 0 18px !important; border-radius: 999px !important; font-size: 13px !important; font-weight: 700 !important;
  background: rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(203, 213, 225, 0.6) !important; color: #64748b !important;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important; cursor: pointer !important;
}
:global(html.dark) .forum-scenario-chip, :global(html.dark) .forum-sort-pill, :global(html.dark) .forum-tag-chip {
  background: rgba(30, 41, 59, 0.5) !important; border-color: rgba(255, 255, 255, 0.08) !important; color: #94a3b8 !important;
}

.forum-scenario-chip:hover, .forum-sort-pill:hover, .forum-tag-chip:hover {
  transform: translateY(-2px) !important; background: rgba(255, 255, 255, 0.9) !important; border-color: #38bdf8 !important; color: #0284c7 !important;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2) !important;
}
:global(html.dark) .forum-scenario-chip:hover, :global(html.dark) .forum-sort-pill:hover, :global(html.dark) .forum-tag-chip:hover {
  background: rgba(30, 41, 59, 0.9) !important; border-color: #7dd3fc !important; color: #bae6fd !important;
}

/* 啟動狀態：深邃的純色發光，而非複雜漸變 */
.forum-scenario-chip.is-active, .forum-sort-pill.is-active {
  background: #8b5cf6 !important; color: #fff !important; border-color: transparent !important;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3) !important; transform: translateY(1px) !important;
}

/* --- 4. 圓形大分類卡 (精緻化) --- */
.forum-cat-strip { display: flex !important; gap: 12px !important; flex-wrap: wrap !important; padding-bottom: 20px !important; border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important; }
:global(html.dark) .forum-cat-strip { border-bottom-color: rgba(255, 255, 255, 0.1) !important; }

.forum-cat-card {
  display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important;
  width: 76px !important; height: 76px !important; border-radius: 22px !important; gap: 8px !important;
  background: rgba(255, 255, 255, 0.3) !important; border: 1px solid transparent !important;
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.5) !important; cursor: pointer !important; transition: all 0.3s ease !important;
}
:global(html.dark) .forum-cat-card { background: rgba(15, 23, 42, 0.3) !important; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08) !important; }

.forum-cat-card__icon {
  display: flex !important; align-items: center !important; justify-content: center !important;
  width: 32px !important; height: 32px !important; border-radius: 50% !important;
  background: #f1f5f9 !important; color: #64748b !important; transition: all 0.3s ease !important;
}
:global(html.dark) .forum-cat-card__icon { background: #1e293b !important; color: #94a3b8 !important; }

.forum-cat-card__label { font-size: 12px !important; font-weight: 700 !important; color: #64748b !important; transition: color 0.3s ease !important; }
:global(html.dark) .forum-cat-card__label { color: #94a3b8 !important; }

/* 懸停與啟動：運用主色調 (Primary) 進行點綴，不破壞整體和諧 */
.forum-cat-card:hover { transform: translateY(-3px) !important; box-shadow: inset 0 0 0 1px #38bdf8, 0 8px 20px rgba(56, 189, 248, 0.15) !important; background: rgba(255, 255, 255, 0.8) !important; }
:global(html.dark) .forum-cat-card:hover { box-shadow: inset 0 0 0 1px #7dd3fc, 0 8px 20px rgba(56, 189, 248, 0.15) !important; background: rgba(30, 41, 59, 0.8) !important; }

.forum-cat-card:hover .forum-cat-card__icon { background: #e0f2fe !important; color: #0284c7 !important; transform: scale(1.1) !important; }
.forum-cat-card:hover .forum-cat-card__label { color: #0284c7 !important; }

.forum-cat-card.is-active {
  background: #38bdf8 !important; box-shadow: 0 8px 24px rgba(56, 189, 248, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-2px) !important;
}
.forum-cat-card.is-active .forum-cat-card__icon { background: rgba(255, 255, 255, 0.2) !important; color: #fff !important; }
.forum-cat-card.is-active .forum-cat-card__label { color: #fff !important; }

/* --- 5. 貼文卡片：統一色調的高級排版 --- */
.forum-post-list { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important; gap: 24px !important; align-items: start !important; padding-top: 12px !important; }

.forum-post-card {
  display: flex !important; flex-direction: column !important;
  background: var(--glass-bg) !important; backdrop-filter: blur(24px) saturate(180%) !important; -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid var(--glass-border) !important; border-radius: 24px !important; overflow: hidden !important;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(255, 255, 255, 0.4) inset !important;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.4s ease !important;
}
:global(html.dark) .forum-post-card { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 1px 1px rgba(255, 255, 255, 0.1) inset !important; }

/* 取消原本粗暴的頂部粗色條，改用更優雅的細線高光 */
.forum-post-card[data-category] { border-top-width: 1px !important; }
.forum-post-card[data-category='recruit'] { border-top-color: #f59e0b !important; }
.forum-post-card[data-category='guide'] { border-top-color: #6366f1 !important; }
.forum-post-card[data-category='social'] { border-top-color: #ec4899 !important; }
.forum-post-card[data-category='event'] { border-top-color: #10b981 !important; }

.forum-post-card:hover {
  transform: translateY(-6px) scale(1.01) !important; z-index: 10 !important;
  border-color: #38bdf8 !important; box-shadow: 0 16px 40px -10px rgba(56, 189, 248, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.6) inset !important;
}
:global(html.dark) .forum-post-card:hover { border-color: #8b5cf6 !important; box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.9), 0 0 32px rgba(139, 92, 246, 0.25) !important; }

/* 卡片內部排版 */
.forum-post-card :deep(.el-card__body) { padding: 24px !important; display: flex !important; flex-direction: column !important; flex: 1 !important; }
.forum-post-card__header { display: flex !important; align-items: center !important; gap: 12px !important; margin-bottom: 16px !important; }
.forum-post-card__avatar { border: 2px solid rgba(255, 255, 255, 0.8) !important; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1) !important; }
.forum-post-card__name { font-weight: 800 !important; font-size: 15px !important; color: var(--buddy-text) !important; }
:global(html.dark) .forum-post-card__name { color: #f8fafc !important; }
.forum-post-card__content { flex: 1 !important; margin-bottom: 20px !important; }
.forum-post-card__title { font-size: 18px !important; font-weight: 800 !important; margin-bottom: 8px !important; line-height: 1.4 !important; color: var(--buddy-text) !important; }
:global(html.dark) .forum-post-card__title { color: #f8fafc !important; }

/* 底部操作區 */
.forum-post-card__footer { margin-top: auto !important; padding-top: 16px !important; border-top: 1px solid rgba(148, 163, 184, 0.2) !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }
:global(html.dark) .forum-post-card__footer { border-top-color: rgba(255, 255, 255, 0.1) !important; }
.forum-post-tag { background: rgba(148, 163, 184, 0.1) !important; color: #64748b !important; font-size: 11px !important; font-weight: 700 !important; padding: 4px 10px !important; border-radius: 8px !important; }
:global(html.dark) .forum-post-tag { color: #94a3b8 !important; }

@media (min-width: 680px) { .forum-post-card:has(.forum-post-card__badge-pin) { grid-column: span 2 !important; } }
</style>
