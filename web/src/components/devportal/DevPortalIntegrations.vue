<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ChatDotRound, Compass, Grid, HomeFilled, User } from '@element-plus/icons-vue'
import { APP_MODULES, type AppModuleId } from '@/config/appModules'
import type { Component } from 'vue'

const icons: Record<AppModuleId, Component> = {
  portal: HomeFilled,
  news: Compass,
  community: Grid,
  ai: ChatDotRound,
  account: User,
}
</script>

<template>
  <section class="dp-int" aria-labelledby="dp-int-title">
    <div class="dp-int__head">
      <h2 id="dp-int-title" class="dp-int__title">集成与能力域</h2>
      <p class="dp-int__sub">按域拆分职责，避免把「只读资讯」与「UGC 发帖」混在同一集成路径里。</p>
    </div>
    <div class="dp-int__grid" role="list">
      <article
        v-for="m in APP_MODULES"
        :key="m.id"
        class="dp-int__card"
        :class="'dp-int__card--' + m.id"
        role="listitem"
      >
        <div class="dp-int__card-head">
          <span class="dp-int__icon" aria-hidden="true">
            <el-icon :size="22"><component :is="icons[m.id]" /></el-icon>
          </span>
          <div>
            <h3 class="dp-int__name">{{ m.label }}</h3>
            <p class="dp-int__desc">{{ m.description }}</p>
          </div>
        </div>
        <RouterLink class="dp-int__cta" :to="{ name: m.primaryRouteName }">
          进入 {{ m.shortLabel }}
          <span aria-hidden="true">›</span>
        </RouterLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dp-int__head {
  margin-bottom: 14px;
}

.dp-int__title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--buddy-text);
}

.dp-int__sub {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
  max-width: 62ch;
}

.dp-int__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 640px) {
  .dp-int__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .dp-int__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.dp-int__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 14px 14px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.07);
  background: rgb(255 255 255 / 0.95);
  box-shadow: 0 2px 14px rgb(15 23 42 / 0.04);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.dp-int__card:hover {
  border-color: rgb(var(--buddy-rgb-brand) / 0.2);
  box-shadow: 0 10px 28px rgb(37 99 235 / 0.1);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .dp-int__card:hover {
    transform: none;
  }
}

.dp-int__card--portal {
  border-top: 3px solid #6366f1;
}

.dp-int__card--news {
  border-top: 3px solid #2563eb;
}

.dp-int__card--community {
  border-top: 3px solid #7c3aed;
}

.dp-int__card--ai {
  border-top: 3px solid #0891b2;
}

.dp-int__card--account {
  border-top: 3px solid #d97706;
}

.dp-int__card-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.dp-int__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 6px 16px rgb(37 99 235 / 0.25);
}

.dp-int__card--community .dp-int__icon {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  box-shadow: 0 6px 16px rgb(124 58 237 / 0.25);
}

.dp-int__card--ai .dp-int__icon {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  box-shadow: 0 6px 16px rgb(8 145 178 / 0.28);
}

.dp-int__card--account .dp-int__icon {
  background: linear-gradient(135deg, #d97706, #eab308);
  box-shadow: 0 6px 16px rgb(217 119 6 / 0.28);
}

.dp-int__card--portal .dp-int__icon {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.dp-int__name {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 800;
  color: var(--buddy-text);
}

.dp-int__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
}

.dp-int__cta {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--buddy-primary);
  text-decoration: none;
}

.dp-int__cta:hover {
  text-decoration: underline;
}
</style>
