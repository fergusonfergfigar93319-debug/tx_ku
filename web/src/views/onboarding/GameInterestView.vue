<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BuddyBackButton from '@/components/buddy/BuddyBackButton.vue'
import { ElMessage } from 'element-plus'
import * as profileApi from '@/api/profile'
import catalog from '../../../shared/follow-game-catalog.json'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const user = useUserStore()

const loading = ref(false)
const selected = ref<string[]>([])

async function done() {
  loading.value = true
  try {
    try {
      await profileApi.putProfileMe({
        gameInterestCompleted: true,
        gameIds: selected.value,
      } as Parameters<typeof profileApi.putProfileMe>[0])
    } catch {
      /* 后端若无该字段则仅本地标记 */
    }
    user.setGameInterestDone(true)
    void router.replace('/app/home')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="buddy-page gi">
    <div class="gi-head">
      <BuddyBackButton :fallback="{ name: 'onboarding' }" />
      <h2 class="gi-title">游戏兴趣（王者荣耀 / 王者电竞）</h2>
    </div>
    <p class="sub">本项目仅围绕王者荣耀与王者电竞；请选择你感兴趣的方向（可多选）。</p>
    <div class="grid">
      <button
        v-for="g in catalog.options"
        :key="g.id"
        type="button"
        class="tile"
        :class="{ on: selected.includes(g.id) }"
        @click="
          selected = selected.includes(g.id)
            ? selected.filter((x) => x !== g.id)
            : [...selected, g.id]
        "
      >
        {{ g.label }}
      </button>
    </div>
    <el-button type="primary" size="large" class="cta" :loading="loading" @click="done">进入版本速递</el-button>
  </div>
</template>

<style scoped>
.gi {
  max-width: 560px;
  padding-top: 32px;
}

.gi-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.gi-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--buddy-text);
}

.sub {
  color: var(--buddy-text-muted);
  margin-bottom: 20px;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.tile {
  padding: 16px 12px;
  border-radius: var(--buddy-radius-sm);
  border: 1px solid var(--buddy-border);
  background: var(--buddy-surface);
  color: var(--buddy-text);
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, background 0.15s;
}

.tile.on {
  border-color: var(--buddy-primary);
  background: var(--buddy-primary-dim);
  box-shadow: 0 0 0 1px rgba(0, 122, 255, 0.08);
}

.cta {
  margin-top: 24px;
  width: 100%;
  max-width: 280px;
}
</style>
