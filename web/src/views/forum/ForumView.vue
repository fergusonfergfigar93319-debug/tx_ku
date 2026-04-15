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
/* --- 广场整体布局容器优化，增强协调与自然感 --- */
.forum--dense {
  --buddy-space: 16px;
  --forum-stack-gap: 20px; /* 拉开各大板块的纵向间距，提升呼吸感 */
  padding-top: 12px;
  max-width: min(1280px, 98vw);
  margin-left: auto;
  margin-right: auto;
}

.forum--stack {
  display: flex;
  flex-direction: column;
  gap: var(--forum-stack-gap);
}

@media (min-width: 768px) {
  .forum--stack {
    --forum-stack-gap: 24px; /* 大屏下进一步释放空间 */
  }
}

/* 通用：功能分区卡片（层次 1～3） */
.forum-layer {
  position: relative;
  margin: 0 calc(-1 * var(--buddy-space));
  border-radius: var(--buddy-radius);
  overflow: hidden;
  border: 1px solid rgb(15 23 42 / 0.07);
  box-shadow: var(--buddy-shadow-card);
}

.forum-layer__inner {
  position: relative;
  z-index: 1;
  padding: 12px var(--buddy-space) 12px;
}

/* --- 顶部发现区：亮色系渐变，自然过渡 --- */
.forum-layer--discover {
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
  border: 1px solid rgba(15, 23, 42, 0.03);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.04);
}

.forum-layer__eyebrow {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(var(--buddy-rgb-brand) / 0.85);
}

.forum-discover-head {
  margin-bottom: 12px;
}

@media (min-width: 768px) {
  .forum-layer--discover .forum-layer__inner--discover {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 520px);
    gap: 12px 24px;
    align-items: end;
  }

  .forum-discover-head {
    grid-column: 1;
    margin-bottom: 0;
  }

  .forum-layer--discover .forum-search-wrap {
    grid-column: 2;
    grid-row: 1;
    margin-bottom: 0;
  }
}

/* --- 筛选与话题区域结构重构 --- */
.forum-layer--filters {
  background: #ffffff; /* 去除偏暗的渐变，使用纯净白底 */
  border: 1px solid rgba(15, 23, 42, 0.04);
  border-left: none; /* 移除原本有些厚重的左侧彩色粗边框 */
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
}

.forum-layer__inner--toolbar {
  padding-top: 14px;
  padding-bottom: 14px;
}

/* 帖子流 — 透明容器，仅列表卡片有实体感 */
.forum-layer--feed {
  margin: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}

.forum-layer__inner--feed {
  padding: 0;
}

.forum-toolbar-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

@media (min-width: 768px) {
  .forum-toolbar-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px 14px;
    margin-bottom: 2px;
    flex-wrap: wrap;
  }

  .forum-scenario-block {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .forum-mini-label {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .forum-scenario-scroll {
    flex: 1;
    min-width: 0;
    padding-bottom: 0;
  }

  .forum-sort {
    margin-bottom: 0;
    flex-shrink: 0;
  }
}

.forum-app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  color: #0f172a;
  font-size: clamp(22px, 4.5vw, 28px);
  letter-spacing: 0.03em;
  font-weight: 800;
}

.forum-app-title__bar {
  width: 4px;
  height: 1.15em;
  border-radius: 4px;
  background: linear-gradient(180deg, #0ea5e9 0%, #3b82f6 100%); /* 亮色系品牌蓝 */
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);
  flex-shrink: 0;
}

.forum-app-slogan {
  margin: 0;
  font-size: 12px;
  color: var(--buddy-text-muted);
  letter-spacing: 0.04em;
}

.forum-hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin: 10px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-text-secondary);
}

.forum-hero-meta strong {
  font-weight: 800;
  color: var(--buddy-text);
  font-variant-numeric: tabular-nums;
}

.forum-hero-meta__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgb(15 23 42 / 0.22);
  flex-shrink: 0;
}

.forum-hero-meta__item--pin strong {
  color: #7c3aed;
}

.forum-tags-row {
  display: flex;
  align-items: flex-start;
  gap: 4px 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(15, 23, 42, 0.04); /* 弱化分割线 */
}

.forum-tags-row__label {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--buddy-text-muted);
  text-transform: uppercase;
  padding-top: 7px;
}

.forum-tag-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
  padding-bottom: 4px;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.forum-tag-scroll::-webkit-scrollbar {
  height: 4px;
}

.forum-tags-empty {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--buddy-text-muted);
}

/* --- 帖子列表头部亮色重构 --- */
.forum-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(15, 23, 42, 0.04);
  border-radius: 18px;
  padding: 14px 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  margin-bottom: 16px;
}

.forum-feed-head__titles {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.forum-feed-head__title {
  margin: 0;
  color: #0f172a;
  font-size: clamp(16px, 3.5vw, 18px);
  font-weight: 800;
  letter-spacing: 0.03em;
}

.forum-feed-head__count {
  color: #64748b;
  font-weight: 600;
  font-size: 12px;
}

.forum-feed-head__post {
  flex-shrink: 0;
}

/* --- 搜索框亮色系自然融合 --- */
.forum-search-wrap {
  margin-top: 8px;
  margin-bottom: 6px;
}

.forum-search :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(14, 165, 233, 0.1);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  border-radius: 999px;
  padding: 4px 16px;
  min-height: 36px;
  transition: all 0.3s ease;
}

.forum-search :deep(.el-input__wrapper.is-focus) {
  background: #ffffff;
  border-color: rgba(14, 165, 233, 0.3);
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.1);
}

.forum-search__ico {
  color: #94a3b8;
}

.forum-scenario-block {
  margin-bottom: 6px;
}

.forum-mini-label {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--buddy-text-secondary);
  text-transform: uppercase;
}

.forum-scenario-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin: 0 -4px;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.forum-scenario-scroll::-webkit-scrollbar {
  height: 4px;
}

/* --- 场景快捷 (Scenario Chip) 减负 --- */
.forum-scenario-chip {
  flex-shrink: 0;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 999px;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid transparent;
  color: #64748b;
  font-weight: 600;
  transition: all 0.2s ease;
}

.forum-scenario-chip:hover {
  background: #f1f5f9;
  color: #334155;
}

.forum-scenario-chip.is-active {
  background: rgba(0, 110, 255, 0.06);
  color: #006eff;
  border-color: rgba(0, 110, 255, 0.15);
}

.forum-sort {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

/* --- 排序标签 (Sort Pill) 极简处理 --- */
.forum-sort-pill {
  border: none;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  cursor: pointer;
  background: transparent;
  color: #64748b;
  transition: color 0.2s ease, background 0.2s ease;
}

.forum-sort-pill:hover {
  color: #334155;
}

.forum-sort-pill.is-active {
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 700;
}

/* 单行横向滑动，避免多行宫格占用过高纵向空间 */
.forum-cat-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  margin: 0 -2px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.forum-cat-strip::-webkit-scrollbar {
  height: 4px;
}

/* --- 分区宫格卡片 (Category Card) 动态与质感提升 --- */
.forum-cat-card {
  flex: 0 0 auto;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 64px;
  max-width: 72px;
  padding: 10px 6px; /* 增加上下呼吸感 */
  background: #f8fafc; /* 统一浅底色 */
  border: 1px solid rgba(15, 23, 42, 0.03);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.forum-cat-card:hover {
  transform: translateY(-3px); /* 引入与下方帖子一致的轻微上浮 */
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  border-color: rgba(0, 110, 255, 0.12);
}

.forum-cat-card.is-active {
  background: linear-gradient(145deg, #ffffff 0%, #f0f6ff 100%);
  border-color: rgba(0, 110, 255, 0.2);
  box-shadow: 0 6px 16px rgba(0, 110, 255, 0.08);
}

/* 图标容器美化 */
.forum-cat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  color: #64748b;
  transition: all 0.3s ease;
}

.forum-cat-card.is-active .forum-cat-card__icon {
  color: #006eff;
  box-shadow: 0 4px 12px rgba(0, 110, 255, 0.15);
}

.forum-cat-card__label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-align: center;
  line-height: 1.2;
}

.forum-cat-card.is-active .forum-cat-card__label {
  color: #0f172a;
}

/* --- 底部话题 Tag (Tag Chip) 呼应亮色 --- */
.forum-tag-chip {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.05);
  color: #475569;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.02);
}

.forum-tag-chip:hover {
  background: #ffffff;
  border-color: rgba(0, 110, 255, 0.2);
  color: #006eff;
  box-shadow: 0 4px 12px rgba(0, 110, 255, 0.08);
  transform: translateY(-1px);
}

.forum-tag-chip:active {
  opacity: 0.92;
  transform: scale(0.98);
}

@media (max-width: 640px) {
  .forum-feed-head__post {
    margin-left: 0;
  }
}

.btn-ico {
  margin-right: 4px;
  vertical-align: middle;
}

.forum-post-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-items: start;
}

@media (min-width: 640px) {
  .forum-post-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
}

@media (min-width: 1100px) {
  .forum-post-list {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

.forum-feed-span-all {
  grid-column: 1 / -1;
}

.forum-feed-bottom {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0 32px;
  color: var(--buddy-text-muted);
  font-size: 13px;
  letter-spacing: 0.05em;
}

.forum-feed-bottom .is-loading {
  font-size: 16px;
}

/* =========================================
   广场帖子卡片：亮色高级毛玻璃与微纹理质感
========================================= */
.forum-post-card {
  position: relative;
  cursor: pointer;
  border-radius: 20px !important;
  overflow: hidden;
  /* 极致清透的白底渐变，替代原有的深色沉闷感 */
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 1) !important;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1) !important;
  display: flex;
  flex-direction: column;
}

.forum-post-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 20px 40px -10px rgba(14, 165, 233, 0.08),
    0 4px 12px rgba(15, 23, 42, 0.02) !important;
  border-color: rgba(14, 165, 233, 0.25) !important;
  z-index: 2;
}

/* 引入亮色系的微弱网格纹理，丰富卡片细节底噪，不抢夺视线 */
.forum-post-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  background-image:
    repeating-linear-gradient(0deg, rgba(14, 165, 233, 0.03) 0px, transparent 1px, transparent 24px, rgba(14, 165, 233, 0.015) 25px),
    repeating-linear-gradient(90deg, rgba(14, 165, 233, 0.03) 0px, transparent 1px, transparent 24px, rgba(14, 165, 233, 0.015) 25px);
  z-index: 0;
}

/* 左侧分类色条，采用高明度渐变 */
.forum-post-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  z-index: 2;
  pointer-events: none;
  transition: height 0.3s ease, top 0.3s ease, bottom 0.3s ease;
}

.forum-post-card:hover::before {
  top: 10px;
  bottom: 10px;
}

.forum-post-card--recruit::before {
  background: linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%);
  box-shadow: 2px 0 12px rgba(245, 158, 11, 0.2);
}
.forum-post-card--guide::before {
  background: linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%);
  box-shadow: 2px 0 12px rgba(59, 130, 246, 0.2);
}
.forum-post-card--social::before {
  background: linear-gradient(180deg, #f9a8d4 0%, #ec4899 100%);
  box-shadow: 2px 0 12px rgba(236, 72, 153, 0.2);
}
.forum-post-card--event::before {
  background: linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%);
  box-shadow: 2px 0 12px rgba(139, 92, 246, 0.2);
}

/* --- 内部排版空间 --- */
.forum-post-card :deep(.el-card__body) {
  padding: 0;
  height: 100%;
}

.forum-post-card__body {
  position: relative;
  z-index: 1; /* 确保内容在网格背景层之上 */
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 14px;
}

/* --- 1. 头部区域 --- */
.forum-post-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.forum-post-card__avatar {
  flex-shrink: 0;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.12);
  background-color: #f0f9ff;
  color: #0ea5e9;
}

.forum-post-card__avatar :deep(img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
  display: block;
}

.forum-post-card__author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.forum-post-card__name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.forum-post-card__name {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.forum-post-card__badge-pin {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.forum-post-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.forum-post-card__dot {
  color: #cbd5e1;
}

.forum-type-text {
  display: flex;
  align-items: center;
  gap: 4px;
}
.text-recruit {
  color: #d97706;
}
.text-guide {
  color: #2563eb;
}
.text-social {
  color: #db2777;
}
.text-event {
  color: #7c3aed;
}

/* --- 2. 正文内容区 --- */
.forum-post-card__content {
  flex-grow: 1;
}

.forum-post-card__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.4;
}

.forum-post-card__excerpt {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* --- 3. 多媒体展示区 --- */
.forum-post-card__media {
  position: relative;
  width: 100%;
  height: clamp(120px, 25vw, 160px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.04);
  background: #f8fafc;
}

.forum-post-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.forum-post-card__media-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* --- 4. 底部标签与操作栏 --- */
.forum-post-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.08); /* 细虚线分隔，更显轻盈 */
}

.forum-post-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.forum-post-tag {
  font-size: 12px;
  font-weight: 700;
  color: #0284c7;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.15);
  padding: 4px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.forum-post-tag:hover {
  background: rgba(14, 165, 233, 0.15);
  transform: translateY(-1px);
}

.forum-post-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.forum-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(241, 245, 249, 0.6);
  border: 1px solid transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.forum-action-btn:hover {
  background: #ffffff;
  border-color: rgba(14, 165, 233, 0.2);
  color: #0ea5e9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.08);
  transform: translateY(-2px);
}

.forum-action-btn--icon {
  padding: 6px 8px;
}

.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .forum-post-card:hover {
    transform: none;
  }
  .forum-action-btn:hover {
    transform: none;
  }
  .forum-post-tag:hover {
    transform: none;
  }
}

.forum-post-card--skeleton {
  cursor: default;
  pointer-events: none;
}

.forum-post-card--skeleton::before,
.forum-post-card--skeleton::after {
  display: none;
}

.forum-post-card--skeleton:hover {
  transform: none;
  border-color: rgba(99, 112, 140, 0.1) !important;
  box-shadow: var(--buddy-shadow-card) !important;
}

.forum-fab {
  display: none;
  position: fixed;
  right: 18px;
  z-index: 99;
  box-shadow: var(--buddy-shadow-float);
}

.forum-fab--star {
  bottom: calc(88px + env(safe-area-inset-bottom, 0));
}

.forum-fab--post {
  bottom: calc(20px + env(safe-area-inset-bottom, 0));
}

@media (max-width: 768px) {
  .forum-feed-head__post {
    display: none !important;
  }

  .forum-fab {
    display: inline-flex;
  }
}

@media (min-width: 900px) {
  .forum-fab {
    right: max(18px, calc(50vw - 640px));
  }
}
</style>
