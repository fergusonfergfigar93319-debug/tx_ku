<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChatLineRound,
  Collection,
  Edit,
  MagicStick,
  Odometer,
  Search,
  Star,
  StarFilled,
  TrendCharts,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as postsApi from '@/api/posts'
import * as aiApi from '@/api/ai'
import type { ForumCategory, Post } from '@/types/post'
import { useFavoritePostsStore } from '@/stores/favoritePosts'
import { isVisibleInPublicForum } from '@/utils/forum'
import ForumPostAiShimmer from '@/components/buddy/ForumPostAiShimmer.vue'
import BuddyEmptyState from '@/components/buddy/BuddyEmptyState.vue'

const router = useRouter()
const favorites = useFavoritePostsStore()

const posts = ref<Post[]>([])
const loading = ref(false)
const generating = ref(false)
const query = ref('')
/** 与顶部胶囊一致；`赛事` 对应后端 `event` */
const CATEGORIES = ['全部动态', '招募', '攻略', '闲聊', '赛事'] as const

const currentCategory = ref<(typeof CATEGORIES)[number]>('全部动态')

const CATEGORY_TO_FILTER: Record<string, ForumCategory | null> = {
  全部动态: null,
  招募: 'recruit',
  攻略: 'guide',
  闲聊: 'social',
  赛事: 'event',
}

const CATEGORY_DISPLAY: Record<ForumCategory, string> = {
  recruit: '招募',
  guide: '攻略',
  social: '闲聊',
  event: '赛事',
}

const MOCK_CATEGORIES: ForumCategory[] = ['recruit', 'guide', 'social', 'event']

const TRENDING_TOPICS = [
  { id: 't1', label: '新赛季环境解析', heat: '9.8w' },
  { id: 't2', label: '城市主场观赛指南', heat: '8.5w' },
  { id: 't3', label: '寻找国服辅王搭子', heat: '7.2w' },
  { id: 't4', label: 'AI 应援文案共创', heat: '6.5w' },
]

function excerptText(content: string, max = 140) {
  const raw = content ?? ''
  if (raw.length <= max) return raw
  return raw.slice(0, max) + '...'
}

const filteredPosts = computed(() => {
  const catKey = CATEGORY_TO_FILTER[currentCategory.value]
  let result = catKey == null ? posts.value : posts.value.filter((p) => p.category === catKey)

  const q = query.value.trim().toLowerCase()
  if (q) {
    result = result.filter((p) => {
      const author = (p.authorNickname ?? '').toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        author.includes(q)
      )
    })
  }
  return result
})

async function load() {
  loading.value = true
  try {
    const res = await postsApi.getPosts({ page: 1, size: 50 })
    posts.value = res.list.filter(isVisibleInPublicForum)
  } finally {
    loading.value = false
  }
}

async function generateSimulatedPost() {
  if (loading.value || generating.value) return
  generating.value = true
  try {
    const d = await aiApi.postAiPostDraft({
      expectedRole: '打野',
      extraDemand: '峡谷广场模拟动态',
    })
    const cat = MOCK_CATEGORIES[Math.floor(Math.random() * MOCK_CATEGORIES.length)]
    const res = await postsApi.createPost({
      title: d.title,
      content: d.content,
      category: cat,
    })
    posts.value.unshift(res)
    ElMessage.success('成功从元流捕获一条新动态！')
  } catch {
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}

const toggleFavorite = (id: string) => {
  if (favorites.isFavorite(id)) favorites.removeFavorite(id)
  else favorites.addFavorite(id)
}

const goDetail = (id: string) => {
  void router.push({ name: 'post-detail', params: { postId: id } })
}

const goEditor = () => {
  void router.push({ name: 'post-editor' })
}

const goFavorites = () => {
  void router.push({ name: 'forum-favorites' })
}

const applyTrending = (label: string) => {
  query.value = label
}

const setCategory = (cat: (typeof CATEGORIES)[number]) => {
  currentCategory.value = cat
}

const getCategoryClass = (cat: ForumCategory) => {
  if (cat === 'guide') return 'tag-blue'
  if (cat === 'recruit') return 'tag-orange'
  if (cat === 'social') return 'tag-pink'
  return 'tag-default'
}

const fmtDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function handleMouseMove(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((y - centerY) / centerY) * -4
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

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="forum-layout app-page-stack">
    <header class="forum-hero daylight-hero">
      <div class="hero-content">
        <h1 class="hero-title">峡谷广场</h1>
        <p class="hero-desc">在此分享你的战术理解、寻找默契车队，或记录每一次的高光时刻。</p>
      </div>
      <div class="hero-aurora-light" aria-hidden="true"></div>
    </header>

    <div class="forum-nav-bar">
      <div class="category-chips">
        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          type="button"
          class="chip"
          :class="{ 'is-active': currentCategory === cat }"
          @click="setCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div class="forum-grid">
      <main class="forum-main" v-loading="loading && !generating">
        <ForumPostAiShimmer v-if="generating" />

        <div v-if="filteredPosts.length > 0" class="post-list">
          <article
            v-for="post in filteredPosts"
            :key="post.postId"
            class="post-card daylight-card"
            @click="goDetail(post.postId)"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <div class="card-header">
              <div class="user-info">
                <div class="avatar">{{ (post.authorNickname || '漫').slice(0, 1) }}</div>
                <div class="meta-texts">
                  <span class="author">{{ post.authorNickname || '漫游者' }}</span>
                  <span class="time">{{ fmtDate(post.createdAt) }}</span>
                </div>
              </div>
              <span class="tag" :class="getCategoryClass(post.category)">{{
                CATEGORY_DISPLAY[post.category] ?? post.category
              }}</span>
            </div>

            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ excerptText(post.content) }}</p>

            <div class="card-footer" @click.stop>
              <div class="stats-group">
                <span class="action-btn"
                  ><el-icon><ChatLineRound /></el-icon> {{ post.commentCount ?? 0 }}</span
                >
                <span class="action-btn"
                  ><el-icon><Odometer /></el-icon> {{ post.viewCount ?? 0 }}</span
                >
              </div>
              <button
                type="button"
                class="fav-btn"
                :class="{ 'is-active': favorites.isFavorite(post.postId) }"
                @click.stop="toggleFavorite(post.postId)"
              >
                <el-icon><StarFilled v-if="favorites.isFavorite(post.postId)" /><Star v-else /></el-icon>
                {{ favorites.isFavorite(post.postId) ? '已收藏' : '收藏' }}
              </button>
            </div>
          </article>
        </div>

        <BuddyEmptyState
          v-else-if="!loading && !generating"
          title="暂无动态"
          description="当前分类或搜索条件下没有找到相关帖子"
          action-label="发布帖子"
          :action-to="{ name: 'post-editor' }"
        />
      </main>

      <aside class="forum-aside">
        <div class="widget search-widget daylight-card">
          <el-icon class="search-icon"><Search /></el-icon>
          <input v-model="query" placeholder="搜索帖子、作者或内容..." />
        </div>

        <button type="button" class="btn-publish-massive" @click="goEditor">
          <el-icon><Edit /></el-icon> 发布新动态
          <span class="btn-glow-effect" aria-hidden="true"></span>
        </button>

        <button
          type="button"
          class="btn-secondary-massive"
          @click="generateSimulatedPost"
          :disabled="loading || generating"
        >
          <el-icon><MagicStick /></el-icon> 捕获 AI 动态 (Mock)
        </button>

        <button type="button" class="btn-secondary-massive btn-favorites" @click="goFavorites">
          <el-icon><Collection /></el-icon> 我的收藏夹 ➝
        </button>

        <div class="widget daylight-card trend-widget">
          <h4 class="widget-title"><el-icon><TrendCharts /></el-icon> 🔥 实时热议榜</h4>
          <ul class="trend-list">
            <li v-for="(t, index) in TRENDING_TOPICS" :key="t.id" @click="applyTrending(t.label)">
              <span class="rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
              <span class="trend-label">{{ t.label }}</span>
              <span class="trend-heat">{{ t.heat }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================
   1. 基础布局与明亮背景 (Daylight Base)
   ========================================================== */
.forum-layout {
  min-height: 100vh;
  background-color: #f8fafc;
  background-image:
    radial-gradient(circle at 15% 10%, rgba(251, 146, 60, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.04) 0%, transparent 40%),
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 28px 28px, 28px 28px;
  padding-bottom: 60px;
}

/* ==========================================================
   2. 顶部重深色 Banner
   ========================================================== */
.daylight-hero {
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  border-radius: 24px;
  padding: 48px;
  overflow: hidden;
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.25);
  margin-bottom: 24px;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 40px;
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
}

.hero-desc {
  color: #94a3b8;
  font-size: 15px;
  max-width: 600px;
  margin: 0;
  line-height: 1.6;
}

.hero-aurora-light {
  position: absolute;
  right: -5%;
  top: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(50px);
  z-index: 0;
}

/* ==========================================================
   3. 分类胶囊导航
   ========================================================== */
.forum-nav-bar {
  margin-bottom: 28px;
}
.category-chips {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
}
.chip {
  padding: 10px 22px;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  flex-shrink: 0;
  font: inherit;
}
.chip:hover {
  border-color: #cbd5e1;
  color: #334155;
  transform: translateY(-2px);
}
.chip.is-active {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(234, 88, 12, 0.35);
  transform: translateY(-2px);
}

/* ==========================================================
   4. 双轨布局架构 (Dual-Column)
   ========================================================== */
.forum-grid {
  display: grid;
  gap: 32px;
  align-items: start;
}
@media (min-width: 1024px) {
  .forum-grid {
    grid-template-columns: 1fr 340px;
  }
  .forum-aside {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
}

.forum-aside .btn-favorites {
  margin-top: 12px;
}

/* ==========================================================
   5. 高密度明亮卡片质感与 3D 悬浮
   ========================================================== */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  perspective: 1200px;
}

.daylight-card {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    0 8px 24px -8px rgba(15, 23, 42, 0.05),
    inset 0 1px 2px rgba(255, 255, 255, 1);
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.3s ease;
  overflow: hidden;

  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0);
}

.daylight-card::after {
  content: '';
  position: absolute;
  top: var(--py, -1000px);
  left: var(--px, -1000px);
  width: 400px;
  height: 400px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 60%);
  mix-blend-mode: overlay;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 10;
}

.post-card {
  cursor: pointer;
}
.post-card:hover {
  z-index: 10;
  background: #ffffff;
  box-shadow:
    0 24px 48px -12px rgba(15, 23, 42, 0.1),
    0 0 0 1px rgba(245, 158, 11, 0.1) inset;
}
.post-card:hover::after {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  transform: translateZ(10px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #475569;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #fff;
}
.meta-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.author {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
}
.time {
  font-size: 12px;
  color: #94a3b8;
}

.tag {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 100px;
}
.tag-blue {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}
.tag-orange {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}
.tag-pink {
  background: #fdf2f8;
  color: #db2777;
  border: 1px solid #fbcfe8;
}
.tag-default {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.post-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
  transform: translateZ(15px);
}
.post-excerpt {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 20px;
  transform: translateZ(10px);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px dashed rgba(203, 213, 225, 0.6);
  transform: translateZ(10px);
}
.stats-group {
  display: flex;
  gap: 12px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}
.fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font: inherit;
}
.fav-btn:hover {
  background: #f8fafc;
  color: #38bdf8;
  border-color: #38bdf8;
}
.fav-btn.is-active {
  background: #fffbeb;
  color: #d97706;
  border-color: #fcd34d;
}

/* ==========================================================
   6. 右侧面版与发布按钮
   ========================================================== */
.widget {
  margin-bottom: 20px;
}

.search-widget {
  display: flex;
  align-items: center;
  padding: 16px 20px;
}
.search-icon {
  font-size: 18px;
  color: #94a3b8;
  margin-right: 12px;
  flex-shrink: 0;
}
.search-widget input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  color: #0f172a;
}

.btn-publish-massive {
  width: 100%;
  padding: 18px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  border: none;
  box-shadow: 0 12px 32px -8px rgba(234, 88, 12, 0.4);
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  font: inherit;
}
.btn-publish-massive:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 40px -8px rgba(234, 88, 12, 0.5);
}
.btn-glow-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: skewX(-20deg);
}
.btn-publish-massive:hover .btn-glow-effect {
  animation: button-sweep 1.5s ease infinite;
}
@keyframes button-sweep {
  100% {
    left: 200%;
  }
}

.btn-secondary-massive {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(203, 213, 225, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font: inherit;
}
.btn-secondary-massive:hover:not(:disabled) {
  background: #ffffff;
  color: #ea580c;
  border-color: #fcd34d;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.widget-title {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.trend-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.2s;
}
.trend-list li:hover {
  background: rgba(15, 23, 42, 0.03);
}

.rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: #94a3b8;
}
.rank-1 {
  background: #ef4444;
}
.rank-2 {
  background: #f59e0b;
}
.rank-3 {
  background: #10b981;
}

.trend-label {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}
.trend-heat {
  font-size: 12px;
  color: #64748b;
}

@media (prefers-reduced-motion: reduce) {
  .post-card,
  .daylight-card {
    transform: none;
  }
  .post-card:hover {
    transform: none;
  }
  .chip:hover,
  .chip.is-active {
    transform: none;
  }
  .btn-publish-massive:hover {
    transform: none;
  }
  .btn-publish-massive:hover .btn-glow-effect {
    animation: none;
  }
}
</style>
