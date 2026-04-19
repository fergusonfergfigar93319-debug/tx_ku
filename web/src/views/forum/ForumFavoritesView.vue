<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { Calendar, Collection, Delete, StarFilled } from '@element-plus/icons-vue'
import * as postsApi from '@/api/posts'
import { useFavoritePostsStore } from '@/stores/favoritePosts'
import type { ForumCategory, Post } from '@/types/post'
import BuddyEmptyState from '@/components/buddy/BuddyEmptyState.vue'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'

const router = useRouter()
const favorites = useFavoritePostsStore()
const { postIds } = storeToRefs(favorites)

const items = ref<Post[]>([])
const loading = ref(false)

const CATEGORY_LABEL: Record<ForumCategory, string> = {
  recruit: '招募组队',
  guide: '攻略心得',
  social: '闲聊',
  event: '活动',
}

function categoryLabel(c: ForumCategory) {
  return CATEGORY_LABEL[c] ?? c
}

function fmtSavedAt(iso?: string) {
  if (!iso) return '已收藏'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '已收藏'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function excerptOf(p: Post) {
  const raw = p.content ?? ''
  if (raw.length <= 100) return raw || '（无正文预览）'
  return raw.slice(0, 100) + '…'
}

async function load(opts?: { silent?: boolean }) {
  const silent = opts?.silent === true
  if (!silent) loading.value = true
  try {
    const ids = [...favorites.postIds]
    if (!ids.length) {
      items.value = []
      return
    }
    const settled = await Promise.all(
      ids.map(async (id) => {
        try {
          return await postsApi.getPost(id)
        } catch {
          favorites.removeFavorite(id)
          return null
        }
      })
    )
    const ok = settled.filter((p): p is Post => p != null)
    const rank = new Map(ids.map((id, i) => [id, i]))
    ok.sort((a, b) => (rank.get(a.postId) ?? 0) - (rank.get(b.postId) ?? 0))
    items.value = ok
  } finally {
    if (!silent) loading.value = false
  }
}

function open(p: Post) {
  void router.push({ name: 'post-detail', params: { postId: p.postId } })
}

function handleRemove(postId: string, e: Event) {
  e.stopPropagation()
  favorites.removeFavorite(postId)
  items.value = items.value.filter((p) => p.postId !== postId)
}

watch(
  postIds,
  () => {
    void load({ silent: true })
  },
  { deep: true }
)

onMounted(() => {
  void load()
})

async function pullRefresh() {
  await load({ silent: true })
}
</script>

<template>
  <div class="archive-layout buddy-page app-page-stack">
    <div class="ambient-glow" aria-hidden="true" />

    <BuddyPullRefresh :plain="true" :refresh="pullRefresh" :reserved-top-extra="120" :disabled="false">
      <header class="archive-header">
        <div class="header-content">
          <div class="title-row">
            <el-icon class="title-icon"><Collection /></el-icon>
            <h1 class="archive-title">收藏档案</h1>
          </div>
          <p class="archive-desc">
            你保存的战术灵感、招募帖与高光记录，都会集中在这座私人陈列室里。
          </p>
        </div>
        <div class="stats-badge">
          <span class="stats-num">{{ items.length }}</span>
          <span class="stats-label">ITEMS</span>
        </div>
      </header>

      <section class="archive-body" aria-label="收藏列表">
        <div v-if="loading && !items.length" v-loading="true" class="loading-state" element-loading-text="正在同步档案…" />

        <template v-else>
          <div v-if="items.length > 0" class="archive-grid">
            <article
              v-for="post in items"
              :key="post.postId"
              class="glass-post-card"
              :class="{ 'has-cover': !!post.mediaAttachments?.length }"
              role="button"
              tabindex="0"
              @click="open(post)"
              @keydown.enter.prevent="open(post)"
            >
              <div class="category-stripe" :data-category="post.category" aria-hidden="true" />

              <div v-if="post.mediaAttachments?.length" class="card-cover">
                <img :src="post.mediaAttachments[0]" alt="" loading="lazy" />
                <div class="card-cover-shade" aria-hidden="true" />
              </div>

              <div class="card-inner">
                <div class="card-top">
                  <span class="author-name">{{ post.authorNickname || '玩家' }}</span>
                  <span class="category-tag">{{ categoryLabel(post.category) }}</span>
                </div>

                <h3 class="post-title">{{ post.title }}</h3>
                <p class="post-excerpt">{{ excerptOf(post) }}</p>

                <div class="card-bottom">
                  <div class="meta-info">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ fmtSavedAt(post.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="hover-overlay">
                <button type="button" class="btn-remove" @click.stop="handleRemove(post.postId, $event)">
                  <el-icon><Delete /></el-icon>
                  取消收藏
                </button>
              </div>
            </article>
          </div>

          <div v-else class="empty-container">
            <BuddyEmptyState
              title="档案库空空如也"
              description="在峡谷广场或帖子详情中点击收藏，即可把内容收入这座陈列室。"
              action-label="前往峡谷广场"
              :action-to="{ name: 'forum' }"
            >
              <template #icon>
                <el-icon :size="28"><StarFilled /></el-icon>
              </template>
            </BuddyEmptyState>
          </div>
        </template>
      </section>
    </BuddyPullRefresh>
  </div>
</template>

<style scoped>
/* ==========================================================
   收藏档案 · Daylight + Glassmorphism Lite（与广场宇宙观一致）
   ========================================================== */
.archive-layout {
  min-height: 100vh;
  position: relative;
  padding: clamp(16px, 3vw, 32px);
  padding-bottom: 96px;
  box-sizing: border-box;
  background-color: #f8fafc;
  background-image:
    radial-gradient(circle at 18% 0%, rgba(251, 146, 60, 0.06) 0%, transparent 45%),
    radial-gradient(circle at 82% 12%, rgba(56, 189, 248, 0.07) 0%, transparent 42%),
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size:
    100% 100%,
    100% 100%,
    24px 24px,
    24px 24px;
}

:global(html.dark) .archive-layout {
  background-color: #020617;
  background-image:
    radial-gradient(circle at 20% 0%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 80% 10%, rgba(168, 85, 247, 0.1) 0%, transparent 40%),
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size:
    100% 100%,
    100% 100%,
    24px 24px,
    24px 24px;
}

.ambient-glow {
  position: absolute;
  top: 0;
  left: 15%;
  width: 70%;
  height: 280px;
  background: radial-gradient(ellipse at top, rgba(56, 189, 248, 0.18), transparent 72%);
  filter: blur(56px);
  pointer-events: none;
  z-index: 0;
}

:global(html.dark) .ambient-glow {
  background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.22), transparent 70%);
  opacity: 0.85;
}

.archive-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  padding: clamp(20px, 3vw, 32px) clamp(20px, 3vw, 40px);
  margin-bottom: clamp(20px, 3vw, 28px);
  max-width: min(1480px, 100%);
  margin-left: auto;
  margin-right: auto;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(241, 245, 249, 0.82) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow:
    0 10px 32px rgba(15, 23, 42, 0.06),
    inset 0 2px 4px rgba(255, 255, 255, 0.65);
}

:global(html.dark) .archive-header {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.88) 100%);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.06);
}

.header-content {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.title-icon {
  font-size: 28px;
  color: #38bdf8;
  padding: 10px;
  background: rgba(56, 189, 248, 0.12);
  border-radius: 14px;
}

:global(html.dark) .title-icon {
  background: rgba(56, 189, 248, 0.15);
  color: #7dd3fc;
}

.archive-title {
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 900;
  color: #0f172a;
  margin: 0;
  letter-spacing: 0.02em;
}

:global(html.dark) .archive-title {
  color: #f8fafc;
}

.archive-desc {
  font-size: 15px;
  color: #64748b;
  margin: 0;
  max-width: 520px;
  line-height: 1.6;
}

:global(html.dark) .archive-desc {
  color: #94a3b8;
}

.stats-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 16px 26px;
  border-radius: 20px;
  box-shadow: inset 0 2px 5px rgba(15, 23, 42, 0.04);
  flex-shrink: 0;
}

:global(html.dark) .stats-badge {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(255, 255, 255, 0.1);
}

.stats-num {
  font-size: 30px;
  font-weight: 900;
  color: #0ea5e9;
  line-height: 1;
}

:global(html.dark) .stats-num {
  color: #38bdf8;
}

.stats-label {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.18em;
  margin-top: 6px;
}

.archive-body {
  position: relative;
  z-index: 1;
  max-width: min(1480px, 100%);
  margin: 0 auto;
}

.loading-state {
  min-height: 200px;
  border-radius: 24px;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px 22px;
}

@media (min-width: 900px) {
  .archive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1320px) {
  .archive-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.glass-post-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  min-height: 200px;
  transition:
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.35s ease,
    border-color 0.3s ease;
  box-shadow:
    0 4px 18px rgba(15, 23, 42, 0.05),
    inset 0 2px 4px rgba(255, 255, 255, 0.65);
}

:global(html.dark) .glass-post-card {
  background: rgba(30, 41, 59, 0.55);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.06);
}

.category-stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 2;
  background: #94a3b8;
}

.category-stripe[data-category='recruit'] {
  background: linear-gradient(90deg, #f59e0b, #ea580c);
}
.category-stripe[data-category='guide'] {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}
.category-stripe[data-category='social'] {
  background: linear-gradient(90deg, #ec4899, #db2777);
}
.category-stripe[data-category='event'] {
  background: linear-gradient(90deg, #10b981, #059669);
}

.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 200px;
  flex-shrink: 0;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-cover-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.35) 100%);
  pointer-events: none;
}

:global(html.dark) .card-cover-shade {
  background: linear-gradient(180deg, transparent 35%, rgba(15, 23, 42, 0.55) 100%);
}

.card-inner {
  padding: 20px 22px 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.author-name {
  font-size: 13px;
  font-weight: 800;
  color: #475569;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(html.dark) .author-name {
  color: #cbd5e1;
}

.category-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.95);
  color: #64748b;
  flex-shrink: 0;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

:global(html.dark) .category-tag {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.post-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(html.dark) .post-title {
  color: #f8fafc;
}

.post-excerpt {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 18px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(html.dark) .post-excerpt {
  color: #94a3b8;
}

.card-bottom {
  border-top: 1px dashed rgba(203, 213, 225, 0.75);
  padding-top: 14px;
  margin-top: auto;
}

:global(html.dark) .card-bottom {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.hover-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  background: rgba(248, 250, 252, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}

:global(html.dark) .hover-overlay {
  background: rgba(15, 23, 42, 0.82);
}

.glass-post-card:hover {
  transform: translateY(-5px);
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 0.75);
}

:global(html.dark) .glass-post-card:hover {
  border-color: rgba(56, 189, 248, 0.25);
  box-shadow:
    0 22px 48px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(56, 189, 248, 0.12);
}

.glass-post-card:hover .hover-overlay,
.glass-post-card:focus-within .hover-overlay {
  opacity: 1;
  pointer-events: auto;
}

.glass-post-card:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 3px;
}

.btn-remove {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.18);
}

.btn-remove:hover {
  background: #ef4444;
  color: #ffffff;
  transform: scale(1.04);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
}

.empty-container {
  padding: 48px 24px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
}

:global(html.dark) .empty-container {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(255, 255, 255, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .glass-post-card:hover {
    transform: none;
  }
  .btn-remove:hover {
    transform: none;
  }
}
</style>
