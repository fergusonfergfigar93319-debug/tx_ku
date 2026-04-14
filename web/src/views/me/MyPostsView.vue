<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as postsApi from '@/api/posts'
import type { Post } from '@/types/post'
import BuddyBackButton from '@/components/buddy/BuddyBackButton.vue'
import BuddyEmptyState from '@/components/buddy/BuddyEmptyState.vue'

const router = useRouter()
const list = ref<Post[]>([])
const loading = ref(false)

function statusLabel(p: Post) {
  if (p.reviewStatus === 'pending') return '待审核'
  if (p.reviewStatus === 'rejected') return '未通过'
  if (p.reviewStatus === 'approved') return '已过审'
  return '已发布'
}

function statusType(p: Post): 'warning' | 'danger' | 'success' | 'info' {
  if (p.reviewStatus === 'pending') return 'warning'
  if (p.reviewStatus === 'rejected') return 'danger'
  if (p.reviewStatus === 'approved') return 'success'
  return 'info'
}

function open(p: Post) {
  void router.push({ name: 'post-detail', params: { postId: p.postId } })
}

onMounted(async () => {
  loading.value = true
  try {
    const r = await postsApi.getMyPosts({ page: 1 })
    list.value = r.list
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="buddy-page my-posts app-page-stack">
    <section class="app-layer app-layer--discover" aria-label="页面说明">
      <div class="app-layer__inner">
        <header class="mp-head">
          <BuddyBackButton :fallback="{ name: 'me' }" />
          <div class="mp-titles">
            <h1 class="mp-title">峡谷广场 · 我的帖子</h1>
            <p class="mp-sub">含待审核与已过审；公域列表仅展示审核通过帖</p>
          </div>
        </header>
      </div>
    </section>

    <section class="app-layer app-layer--content" aria-label="帖子列表">
      <div class="app-layer__inner">
    <div v-loading="loading" class="mp-list">
      <button
        v-for="p in list"
        :key="p.postId"
        type="button"
        class="mp-row buddy-card-surface"
        @click="open(p)"
      >
        <div class="mp-row__top">
          <span class="mp-row__title">{{ p.title }}</span>
          <el-tag size="small" :type="statusType(p)" effect="plain">{{ statusLabel(p) }}</el-tag>
        </div>
        <p class="mp-row__excerpt">{{ p.content?.slice(0, 80) }}{{ (p.content?.length || 0) > 80 ? '…' : '' }}</p>
        <span class="mp-row__meta">{{ p.category }} · {{ p.commentCount ?? 0 }} 评</span>
      </button>

      <BuddyEmptyState
        v-if="!loading && !list.length"
        title="暂无帖子"
        description="可到峡谷广场发帖，提交后在此查看审核状态"
        action-label="去峡谷广场"
        :action-to="{ name: 'forum' }"
      />
    </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.my-posts {
  max-width: 640px;
  margin: 0 auto;
}

.mp-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
}

.mp-titles {
  flex: 1;
  min-width: 0;
}

.mp-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  color: var(--buddy-text);
}

.mp-sub {
  margin: 0;
  font-size: 12px;
  color: var(--buddy-text-muted);
  line-height: 1.45;
}

.mp-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 120px;
}

.mp-row {
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px 14px;
  border: 1px solid var(--buddy-border);
  border-radius: var(--buddy-radius-sm);
  cursor: pointer;
  background: var(--buddy-surface);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.mp-row:hover {
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: var(--buddy-shadow-card-hover);
}

.mp-row__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.mp-row__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--buddy-text);
  line-height: 1.35;
}

.mp-row__excerpt {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-secondary);
}

.mp-row__meta {
  font-size: 11px;
  color: var(--buddy-text-muted);
}
</style>
