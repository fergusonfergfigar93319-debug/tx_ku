<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as usersApi from '@/api/users'
import type { UserSummary } from '@/api/users'
import * as followsApi from '@/api/follows'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'

const q = ref('')
const loading = ref(false)
const results = ref<UserSummary[]>([])

async function search(opts?: { silent?: boolean }) {
  if (!q.value.trim()) return
  const silent = opts?.silent === true
  if (!silent) loading.value = true
  try {
    const r = await usersApi.searchUsers(q.value.trim())
    results.value = r.list
  } catch {
    if (!silent) results.value = []
  } finally {
    if (!silent) loading.value = false
  }
}

async function pullRefresh() {
  await search({ silent: true })
}

async function followUser(u: UserSummary) {
  try {
    await followsApi.follow(u.userId)
    ElMessage.success('已关注')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <div class="buddy-page">
    <h2 class="page-heading">加好友 / 关注</h2>
    <el-input v-model="q" placeholder="搜索用户昵称或 ID" clearable @keyup.enter="search">
      <template #append>
        <el-button :loading="loading" @click="search">搜索</el-button>
      </template>
    </el-input>
    <BuddyPullRefresh :refresh="pullRefresh" :reserved-top-extra="88">
      <div v-loading="loading && !results.length && !!q.trim()" class="list">
        <el-card v-for="u in results" :key="u.userId" class="buddy-card-surface row" shadow="never">
          <el-avatar :size="40" :src="u.avatarUrl || undefined">{{ u.nickname.slice(0, 1) }}</el-avatar>
          <span class="name">{{ u.nickname }}</span>
          <el-button size="small" type="primary" @click="followUser(u)">关注</el-button>
        </el-card>
        <el-empty v-if="!loading && !results.length && q.trim()" description="无结果" />
        <p v-if="!q.trim() && !results.length" class="hint">输入关键词搜索后，可下拉结果列表刷新</p>
      </div>
    </BuddyPullRefresh>
  </div>
</template>

<style scoped>
.page-heading {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--buddy-text);
}

.list {
  margin-top: 16px;
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

.hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--buddy-text-muted);
  text-align: center;
}
</style>
