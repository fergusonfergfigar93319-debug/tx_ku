<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as followsApi from '@/api/follows'
import type { FollowUser } from '@/api/follows'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'

const list = ref<FollowUser[]>([])
const loading = ref(false)

async function load(opts?: { silent?: boolean }) {
  const silent = opts?.silent === true
  if (!silent) loading.value = true
  try {
    const r = await followsApi.getMyFollowing()
    list.value = r.list
  } catch {
    if (!silent) list.value = []
  } finally {
    if (!silent) loading.value = false
  }
}

async function pullRefresh() {
  await load({ silent: true })
}

async function unfollow(u: FollowUser) {
  await followsApi.unfollow(u.userId)
  void load()
}

onMounted(() => void load())
</script>

<template>
  <div class="buddy-page">
    <h2 class="page-heading">关注列表</h2>
    <BuddyPullRefresh :refresh="pullRefresh" :reserved-top-extra="56">
      <div v-loading="loading && !list.length" class="list">
        <el-card v-for="u in list" :key="u.userId" class="buddy-card-surface row" shadow="never">
          <el-avatar :size="40" :src="u.avatarUrl || undefined">{{ u.nickname.slice(0, 1) }}</el-avatar>
          <span class="name">{{ u.nickname }}</span>
          <el-button size="small" text type="danger" @click="unfollow(u)">取消关注</el-button>
        </el-card>
        <el-empty v-if="!loading && !list.length" description="暂无关注" />
      </div>
    </BuddyPullRefresh>
  </div>
</template>

<style scoped>
.page-heading {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--buddy-text);
}

.list {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name {
  flex: 1;
}
</style>
