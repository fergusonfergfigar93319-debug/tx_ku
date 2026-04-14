<script setup lang="ts">
import { onMounted, ref, useId } from 'vue'
import { useRoute } from 'vue-router'
import BuddyBackButton from '@/components/buddy/BuddyBackButton.vue'
import { ElMessage } from 'element-plus'
import * as aiApi from '@/api/ai'

const route = useRoute()
const gradId = useId()

const relationId = ref(route.params.relationId as string)
const loading = ref(false)
const data = ref<{
  relationId: string
  communicationRules: string[]
  commonGoal: string
} | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await aiApi.postConsensusCard({ relationId: relationId.value })
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="buddy-page room">
    <BuddyBackButton class="room-back" :fallback="{ name: 'home' }" />
    <div v-if="loading" class="contract buddy-card-surface loading-card" aria-busy="true">
      <div class="shimmer-block title buddy-shimmer-fill" />
      <div class="shimmer-block line buddy-shimmer-fill" />
      <div class="shimmer-block line short buddy-shimmer-fill" />
      <div class="shimmer-block line buddy-shimmer-fill" />
    </div>

    <div v-else-if="data" class="contract buddy-card-surface consensus">
      <div class="avatars enter-a">
        <div class="avatar-pill" aria-hidden="true">
          <span>我</span>
        </div>
        <svg class="link-curve" viewBox="0 0 120 40" aria-hidden="true">
          <path
            class="link-path"
            d="M 8 28 Q 60 4 112 28"
            fill="none"
            :stroke="`url(#${gradId})`"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <defs>
            <linearGradient :id="gradId" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color: var(--buddy-primary); stop-opacity: 0.35" />
              <stop offset="50%" style="stop-color: var(--buddy-primary); stop-opacity: 1" />
              <stop offset="100%" style="stop-color: var(--buddy-secondary); stop-opacity: 0.45" />
            </linearGradient>
          </defs>
        </svg>
        <div class="avatar-pill alt" aria-hidden="true">
          <span>Ta</span>
        </div>
      </div>

      <h1 class="enter-b">共识卡</h1>
      <p class="rel-id enter-c">关系 ID: {{ data.relationId }}</p>

      <div class="goal enter-d">
        <span class="label">共同目标</span>
        <p>{{ data.commonGoal }}</p>
      </div>

      <div class="rules enter-e">
        <span class="label">沟通契约</span>
        <ul>
          <li v-for="(r, i) in data.communicationRules" :key="i" class="rule-item" :style="{ animationDelay: `${0.45 + i * 0.08}s` }">
            <span class="badge">{{ i + 1 }}</span>
            <span class="rule-text">{{ r }}</span>
          </li>
        </ul>
      </div>
    </div>

    <el-empty v-else description="暂无数据" />
  </div>
</template>

<style scoped>
.room {
  max-width: 520px;
  padding-top: 24px;
}

.room-back {
  margin-bottom: 12px;
}

.contract {
  padding: 28px 24px;
  border: 2px solid transparent;
  background:
    linear-gradient(var(--buddy-surface), var(--buddy-surface)) padding-box,
    linear-gradient(135deg, var(--buddy-primary), #5ac8fa) border-box;
}

.loading-card .shimmer-block {
  border-radius: 10px;
  margin-bottom: 12px;
}

.loading-card .title {
  height: 26px;
  max-width: 45%;
}

.loading-card .line {
  height: 14px;
}

.loading-card .line.short {
  max-width: 70%;
}

.consensus {
  overflow: hidden;
}

.avatars {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

.avatar-pill {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--buddy-primary);
  background: var(--buddy-primary-dim);
  border: 2px solid rgba(0, 122, 255, 0.25);
  box-shadow: var(--buddy-shadow-card);
}

.avatar-pill.alt {
  color: var(--buddy-secondary);
  background: rgba(24, 144, 255, 0.1);
  border-color: rgba(24, 144, 255, 0.28);
}

.link-curve {
  flex: 1;
  min-width: 72px;
  height: 40px;
}

.link-path {
  stroke-dasharray: 140;
  stroke-dashoffset: 140;
  animation: draw-consensus-line 0.85s cubic-bezier(0.33, 1, 0.68, 1) 0.4s forwards;
}

@keyframes draw-consensus-line {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes consensus-fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.enter-a {
  animation: consensus-fade-up 0.5s ease-out both;
}

.enter-b {
  animation: consensus-fade-up 0.52s ease-out 0.1s both;
  margin: 0 0 8px;
  font-size: 22px;
  color: var(--buddy-text);
  text-align: center;
}

.enter-c {
  animation: consensus-fade-up 0.5s ease-out 0.18s both;
}

.rel-id {
  font-size: 12px;
  color: var(--buddy-text-muted);
  margin-bottom: 20px;
  text-align: center;
}

.enter-d {
  animation: consensus-fade-up 0.55s ease-out 0.26s both;
}

.label {
  display: block;
  font-size: 12px;
  color: var(--buddy-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.goal p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
}

.rules {
  margin-top: 24px;
}

.enter-e {
  animation: consensus-fade-up 0.55s ease-out 0.34s both;
}

.rules ul {
  margin: 0;
  padding: 0;
  list-style: none;
  line-height: 1.65;
}

.rule-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 12px;
  opacity: 0;
  animation: consensus-fade-up 0.45s ease-out both;
}

.badge {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--buddy-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.rule-text {
  font-size: 14px;
  color: var(--buddy-text-secondary);
}
</style>
