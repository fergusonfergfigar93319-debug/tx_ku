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
              <div class="forum-post-card__author">
                <el-avatar class="forum-post-card__avatar" :size="36" :src="p.authorAvatarUrl || undefined">
                  {{ (p.authorNickname || '玩').slice(0, 1) }}
                </el-avatar>
                <div class="forum-post-card__who">
                  <div class="forum-post-card__name-row">
                    <span class="forum-post-card__name">{{ p.authorNickname || '玩家' }}</span>
                    <span v-if="p.pinned" class="forum-post-card__pin">置顶</span>
                  </div>
                  <div class="forum-post-card__meta-line">
                    <span class="forum-type-pill">
                      <el-icon class="forum-type-pill__ico" :size="14">
                        <component :is="categoryMeta(p.category).icon" />
                      </el-icon>
                      {{ categoryMeta(p.category).label }}
                    </span>
                    <span v-if="fmtPostDate(p.createdAt)" class="forum-post-card__date">{{
                      fmtPostDate(p.createdAt)
                    }}</span>
                  </div>
                </div>
              </div>

              <h3 class="forum-post-card__title clamp-2">{{ p.title }}</h3>
              <p class="forum-post-card__excerpt">
                {{ excerptPreview(p.content) }}
              </p>

              <div v-if="p.mediaAttachments?.[0]" class="forum-post-card__media">
                <div class="forum-post-card__media-frame">
                  <img :src="p.mediaAttachments[0]" alt="" loading="lazy" decoding="async" />
                  <span
                    v-if="(p.mediaAttachments?.length ?? 0) > 1"
                    class="forum-post-card__media-more"
                    aria-label="更多配图"
                    >+{{ (p.mediaAttachments?.length ?? 0) - 1 }}</span
                  >
                </div>
              </div>

              <div v-if="p.tags?.length" class="forum-post-card__tags">
                <span v-for="tag in p.tags" :key="tag" class="forum-post-tag">{{ tag }}</span>
              </div>

              <div class="forum-post-card__actions" @click.stop>
                <button type="button" class="forum-action" @click="onLike($event, p)">
                  <el-icon :size="18"><Star /></el-icon>
                  <span>{{ p.likeCount ?? 0 }}</span>
                </button>
                <button type="button" class="forum-action" @click="openComments($event, p)">
                  <el-icon :size="18"><ChatLineRound /></el-icon>
                  <span>{{ p.commentCount ?? 0 }}</span>
                </button>
                <button type="button" class="forum-action" @click="sharePost($event, p)">
                  <el-icon :size="18"><Share /></el-icon>
                  <span>分享</span>
                </button>
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
.forum--dense {
  --buddy-space: 12px;
  --forum-stack-gap: 12px;
  padding-top: 4px;
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
    --forum-stack-gap: 16px;
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

/* 层次 1：发现 — 高亮品牌渐变 */
.forum-layer--discover {
  border-color: rgb(var(--buddy-rgb-brand) / 0.14);
  background: linear-gradient(
    145deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(239 246 255 / 0.94) 52%,
    rgb(250 245 255 / 0.92) 100%
  );
}

.forum-layer--discover::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.38;
  background:
    radial-gradient(80% 55% at 100% 0%, rgb(var(--buddy-rgb-brand) / 0.14) 0%, transparent 55%),
    radial-gradient(65% 50% at 0% 100%, rgb(var(--buddy-rgb-accent) / 0.1) 0%, transparent 50%);
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
  margin-bottom: 8px;
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

/* 筛选 + 话题：单卡工具区 */
.forum-layer--filters {
  background: linear-gradient(188deg, rgb(252 252 254) 0%, rgb(241 245 249) 100%);
  border-left: 3px solid rgb(var(--buddy-rgb-brand) / 0.38);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.95) inset,
    0 8px 28px rgb(15 23 42 / 0.04);
}

.forum-layer__inner--toolbar {
  padding-top: 10px;
  padding-bottom: 11px;
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
  font-size: clamp(19px, 4.5vw, 24px);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--buddy-text);
}

.forum-app-title__bar {
  width: 4px;
  height: 1.15em;
  border-radius: 4px;
  background: linear-gradient(180deg, #0d9488 0%, #14b8a6 55%, #2dd4bf 100%);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.35);
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
  border-top: 1px solid rgb(15 23 42 / 0.07);
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

.forum-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: linear-gradient(125deg, rgb(255 255 255 / 0.99) 0%, rgb(248 250 252 / 0.97) 100%);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.9) inset,
    0 6px 24px rgb(15 23 42 / 0.06);
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
  font-size: clamp(16px, 3.5vw, 18px);
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--buddy-text);
}

.forum-feed-head__count {
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-text-muted);
}

.forum-feed-head__post {
  flex-shrink: 0;
}

.forum-search-wrap {
  margin-bottom: 6px;
}

.forum-search :deep(.el-input__wrapper) {
  border-radius: 999px;
  padding-top: 1px;
  padding-bottom: 1px;
  min-height: 36px;
  padding-left: 14px;
  box-shadow: 0 1px 0 rgba(13, 148, 136, 0.08), 0 2px 12px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(99, 112, 140, 0.12);
  background: rgba(255, 255, 255, 0.95);
}

.forum-search__ico {
  color: var(--buddy-text-muted);
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

.forum-scenario-chip {
  flex-shrink: 0;
  border: 1px solid var(--buddy-border);
  background: rgba(255, 255, 255, 0.9);
  color: var(--buddy-text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.forum-scenario-chip.is-active {
  border-color: #0f766e;
  color: #0f766e;
  box-shadow: 0 0 0 1px rgba(15, 118, 110, 0.2);
  background: rgba(13, 148, 136, 0.06);
}

.forum-sort {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.forum-sort-pill {
  border: none;
  background: rgba(99, 112, 140, 0.08);
  color: var(--buddy-text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.forum-sort-pill.is-active {
  background: rgba(0, 110, 255, 0.12);
  color: var(--buddy-primary);
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

.forum-cat-card {
  flex: 0 0 auto;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 60px;
  max-width: 68px;
  padding: 6px 5px;
  border: 1px solid var(--buddy-border);
  border-radius: 10px;
  background: var(--buddy-surface-2);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.forum-cat-card:active {
  transform: scale(0.98);
}

.forum-cat-card.is-active {
  border-color: rgba(0, 110, 255, 0.35);
  box-shadow: 0 2px 10px rgba(0, 110, 255, 0.1);
  background: linear-gradient(145deg, #ffffff 0%, #f0f6ff 100%);
}

.forum-cat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--buddy-primary);
}

.forum-cat-card.is-active .forum-cat-card__icon {
  background: rgba(37, 99, 235, 0.2);
}

.forum-cat-card__label {
  font-size: 10px;
  font-weight: 700;
  color: var(--buddy-text);
  text-align: center;
  line-height: 1.2;
}

.forum-tag-chip {
  flex-shrink: 0;
  border: 1px solid rgba(0, 110, 255, 0.22);
  background: rgba(0, 110, 255, 0.07);
  color: var(--buddy-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;
}

.forum-tag-chip:hover {
  background: rgba(0, 110, 255, 0.11);
  border-color: rgba(0, 110, 255, 0.35);
}

.forum-tag-chip:active {
  opacity: 0.9;
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

.forum-post-card--skeleton {
  cursor: default;
  pointer-events: none;
}

.forum-post-card--skeleton::before {
  display: none;
}

.forum-post-card--skeleton:hover {
  transform: none;
  border-color: rgba(99, 112, 140, 0.1) !important;
  box-shadow: var(--buddy-shadow-card) !important;
}

.forum-post-card {
  position: relative;
  cursor: pointer;
  border-radius: 14px !important;
  overflow: hidden;
  border: 1px solid rgba(99, 112, 140, 0.1) !important;
  box-shadow: var(--buddy-shadow-card) !important;
  transition:
    transform var(--buddy-duration-sm) cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow var(--buddy-duration-sm) cubic-bezier(0.4, 0, 0.2, 1),
    border-color var(--buddy-duration-sm) ease;
}

.forum-post-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  z-index: 2;
  pointer-events: none;
}

.forum-post-card--recruit::before {
  background: linear-gradient(180deg, #f59e0b 0%, #f97316 100%);
  box-shadow: 0 0 14px rgb(245 158 11 / 0.45);
}

.forum-post-card--guide::before {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 0 14px rgb(37 99 235 / 0.35);
}

.forum-post-card--social::before {
  background: linear-gradient(180deg, #ec4899 0%, #db2777 100%);
  box-shadow: 0 0 14px rgb(236 72 153 / 0.35);
}

.forum-post-card--event::before {
  background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);
  box-shadow: 0 0 14px rgb(251 191 36 / 0.4);
}

.forum-post-card:hover {
  transform: translateX(3px);
  border-color: rgb(var(--buddy-rgb-brand) / 0.22) !important;
  box-shadow: var(--buddy-shadow-card-hover) !important;
}

@media (prefers-reduced-motion: reduce) {
  .forum-post-card:hover {
    transform: none;
  }
}

.forum-post-card :deep(.el-card__body) {
  padding: 0;
}

.forum-post-card__body {
  position: relative;
  z-index: 1;
  padding: 10px 12px 8px 14px;
}

@media (min-width: 900px) {
  .forum-post-card__body {
    padding: 12px 16px 10px 16px;
  }
}

.forum-post-card__author {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.forum-post-card__avatar {
  flex-shrink: 0;
}

.forum-post-card__who {
  min-width: 0;
  flex: 1;
}

.forum-post-card__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.forum-post-card__name {
  font-size: 14px;
  font-weight: 700;
  color: var(--buddy-text);
}

.forum-post-card__pin {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(124, 58, 237, 0.12);
  color: #6d28d9;
}

.forum-post-card__meta-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.forum-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 110, 255, 0.1);
  color: var(--buddy-primary);
}

.forum-type-pill__ico {
  flex-shrink: 0;
}

.forum-post-card__date {
  font-size: 12px;
  color: var(--buddy-text-muted);
}

.forum-post-card__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.4;
  color: var(--buddy-text);
}

@media (min-width: 900px) {
  .forum-post-card__title {
    font-size: 16px;
    margin-bottom: 8px;
  }
}

.forum-post-card__excerpt {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--buddy-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 640px) {
  .forum-post-card__excerpt {
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }
}

@media (min-width: 1100px) {
  .forum-post-card__excerpt {
    -webkit-line-clamp: 4;
    line-clamp: 4;
    font-size: 14px;
    line-height: 1.55;
  }
}

.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.forum-post-card__media {
  margin-top: 8px;
}

/* 列表页：限制配图高度，避免单帖占满一屏；封面资源为横向窄条（covers-wide） */
.forum-post-card__media-frame {
  position: relative;
  width: 100%;
  height: clamp(88px, 22vw, 124px);
  max-height: 124px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(145deg, rgb(241 245 255 / 0.9) 0%, rgb(226 232 240 / 0.5) 100%);
  border: 1px solid rgb(15 23 42 / 0.06);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.9) inset,
    0 4px 16px rgb(15 23 42 / 0.05);
}

.forum-post-card__media-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.forum-post-card__media-more {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #fff;
  background: rgb(15 23 42 / 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgb(255 255 255 / 0.2);
  pointer-events: none;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.2);
}

.forum-post-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.forum-post-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 110, 255, 0.08);
  color: var(--buddy-primary);
  border: 1px solid rgba(0, 110, 255, 0.12);
}

.forum-post-card__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(99, 112, 140, 0.08);
}

.forum-action {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: none;
  background: transparent;
  color: var(--buddy-text-muted);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.forum-action:hover {
  background: rgba(99, 112, 140, 0.06);
  color: var(--buddy-text-secondary);
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
