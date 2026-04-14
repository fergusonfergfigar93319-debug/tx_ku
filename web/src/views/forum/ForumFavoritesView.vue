<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { Delete, StarFilled } from '@element-plus/icons-vue'
import * as postsApi from '@/api/posts'
import { useFavoritePostsStore } from '@/stores/favoritePosts'
import type { Post } from '@/types/post'
import BuddyEmptyState from '@/components/buddy/BuddyEmptyState.vue'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'

const router = useRouter()
const favorites = useFavoritePostsStore()
const { postIds } = storeToRefs(favorites)

const items = ref<Post[]>([])
const loading = ref(false)

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

function remove(p: Post, e: Event) {
  e.stopPropagation()
  favorites.removeFavorite(p.postId)
  items.value = items.value.filter((x) => x.postId !== p.postId)
}

watch(
  postIds,
  () => {
    void load({ silent: true })
  },
  { deep: true }
)

onMounted(() => void load())

async function pullRefresh() {
  await load({ silent: true })
}
</script>

<template>
  <div class="buddy-page forum-favorites app-page-stack">
    <section class="app-layer app-layer--discover" aria-label="页面说明">
      <div class="app-layer__inner">
        <header class="ff-head">
          <h1 class="ff-title">我的收藏</h1>
          <p class="ff-sub">保存在本设备浏览器，换设备需重新收藏</p>
        </header>
      </div>
    </section>

    <BuddyPullRefresh :refresh="pullRefresh" :reserved-top-extra="108">
      <section class="app-layer app-layer--content" aria-label="收藏列表">
        <div class="app-layer__inner">
      <div v-loading="loading && !items.length" class="ff-list">
        <el-card
          v-for="p in items"
          :key="p.postId"
          class="ff-card buddy-card-surface is-interactive"
          shadow="never"
          @click="open(p)"
        >
          <div class="ff-card__inner">
            <div class="ff-card__top">
              <el-icon class="ff-card__star" :size="18"><StarFilled /></el-icon>
              <h2 class="ff-card__title clamp-2">{{ p.title }}</h2>
            </div>
            <p class="ff-card__excerpt clamp-2">
              {{ p.content?.slice(0, 120) }}{{ (p.content?.length || 0) > 120 ? '…' : '' }}
            </p>
            <div class="ff-card__foot">
              <span class="ff-card__meta">{{ p.authorNickname || '玩家' }}</span>
              <el-button
                type="danger"
                text
                size="small"
                class="ff-card__remove"
                @click="remove(p, $event)"
              >
                <el-icon :size="16"><Delete /></el-icon>
                移除
              </el-button>
            </div>
          </div>
        </el-card>

        <BuddyEmptyState
          v-if="!loading && !items.length"
          title="暂无收藏"
          description="在帖子详情页点击「收藏」即可加入列表"
          action-label="去峡谷广场"
          :action-to="{ name: 'forum' }"
        >
          <template #icon>
            <el-icon :size="28"><StarFilled /></el-icon>
          </template>
        </BuddyEmptyState>
      </div>
        </div>
      </section>
    </BuddyPullRefresh>
  </div>
</template>

<style scoped>
.ff-head {
  margin: 0;
}

.ff-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
  color: var(--buddy-text);
}

.ff-sub {
  margin: 0;
  font-size: 13px;
  color: var(--buddy-text-muted);
  line-height: 1.45;
}

.ff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ff-card {
  cursor: pointer;
  border-radius: var(--buddy-radius) !important;
  border: 1px solid var(--buddy-border) !important;
}

.ff-card :deep(.el-card__body) {
  padding: 0;
}

.ff-card__inner {
  padding: 14px 16px;
}

.ff-card__top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.ff-card__star {
  flex-shrink: 0;
  margin-top: 2px;
  color: #f59e0b;
}

.ff-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--buddy-text);
}

.ff-card__excerpt {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--buddy-text-secondary);
}

.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ff-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ff-card__meta {
  font-size: 12px;
  color: var(--buddy-text-muted);
}

.ff-card__remove {
  flex-shrink: 0;
}
</style>
