<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ChatDotRound,
  Compass,
  Grid,
  HomeFilled,
  Link,
  User,
} from '@element-plus/icons-vue'
import { APP_MODULES, type AppModuleDef, type AppModuleId } from '@/config/appModules'

type HubLink = { label: string; to: { name: string }; hint?: string }

const moduleLinks: Record<AppModuleId, HubLink[]> = {
  portal: [
    { label: '工作台首页', to: { name: 'home' }, hint: '轮播与模块总览' },
    { label: '功能地图', to: { name: 'app-modules' }, hint: '当前页' },
  ],
  news: [
    { label: '版本速递', to: { name: 'feed' }, hint: '资讯与推荐' },
    { label: '城市文旅线', to: { name: 'feed-city' }, hint: '主场与同城' },
  ],
  community: [
    { label: '峡谷广场', to: { name: 'forum' }, hint: '帖子流' },
    { label: '潮流共创', to: { name: 'trend-studio' }, hint: '模板与发帖' },
    { label: '帖子收藏', to: { name: 'forum-favorites' }, hint: '本地收藏夹' },
  ],
  ai: [
    { label: 'AI 搭子创作台', to: { name: 'agent' }, hint: '人设与解锁' },
    { label: '智能体对话', to: { name: 'agent-chat' }, hint: '需解锁' },
  ],
  account: [
    { label: '元流档案', to: { name: 'me' }, hint: '个人中心' },
    { label: '数字身份档案', to: { name: 'me-flow' }, hint: '特权与时间线' },
    { label: '编辑资料', to: { name: 'profile-edit' } },
    { label: '我的帖子', to: { name: 'my-posts' } },
    { label: '关注与好友', to: { name: 'following' } },
  ],
}

const moduleIcon = computed(
  (): Record<AppModuleId, typeof HomeFilled> => ({
    portal: HomeFilled,
    news: Compass,
    community: Grid,
    ai: ChatDotRound,
    account: User,
  }),
)

function linksFor(m: AppModuleDef): HubLink[] {
  return moduleLinks[m.id] ?? []
}
</script>

<template>
  <div class="buddy-page app-modules-hub app-page-stack" aria-label="全站功能地图">
    <section class="app-layer app-layer--discover hub-hero" aria-labelledby="hub-title">
      <div class="app-layer__inner">
        <p class="app-layer__eyebrow">信息架构</p>
        <h1 id="hub-title" class="hub-title">功能地图</h1>
        <p class="hub-lead">
          五大功能域彼此独立：<strong>门户</strong>负责总览；<strong>资讯</strong>只读消费；<strong>社区</strong>承载
          UGC；<strong>AI 搭子</strong>专注人设与对话；<strong>账户</strong>管理资料与关系。底栏 Tab
          对应主入口，子页随域变色（见顶栏左侧提示条）。
        </p>
      </div>
    </section>

    <div class="hub-grid" role="list">
      <section
        v-for="m in APP_MODULES"
        :key="m.id"
        class="hub-card"
        :class="'hub-card--' + m.id"
        role="listitem"
      >
        <div class="hub-card__inner">
          <div class="hub-card__head">
            <span class="hub-card__icon" aria-hidden="true">
              <el-icon :size="22"><component :is="moduleIcon[m.id]" /></el-icon>
            </span>
            <div>
              <h2 class="hub-card__title">{{ m.label }}</h2>
              <p class="hub-card__desc">{{ m.description }}</p>
            </div>
          </div>
          <RouterLink class="hub-card__primary" :to="{ name: m.primaryRouteName }">
            进入主界面
            <span class="hub-card__primary-arr" aria-hidden="true">›</span>
          </RouterLink>
          <ul class="hub-card__links">
            <li v-for="l in linksFor(m)" :key="l.label">
              <RouterLink
                class="hub-card__link"
                :class="{ 'is-current': l.to.name === 'app-modules' }"
                :to="l.to"
              >
                <el-icon class="hub-card__link-ico" :size="14"><Link /></el-icon>
                <span>{{ l.label }}</span>
                <span v-if="l.hint" class="hub-card__hint">{{ l.hint }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.app-modules-hub {
  max-width: min(1040px, 100%);
  margin: 0 auto;
  padding-bottom: 24px;
}

.hub-title {
  margin: 0 0 10px;
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--buddy-text);
}

.hub-lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--buddy-text-muted);
}

.hub-lead strong {
  color: var(--buddy-text-secondary);
  font-weight: 700;
}

.hub-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--app-stack-gap, 14px);
}

@media (min-width: 720px) {
  .hub-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .hub-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .hub-card--portal {
    grid-column: span 3;
  }
}

.hub-card {
  border-radius: var(--app-layer-radius, 14px);
  overflow: hidden;
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: var(--buddy-shadow-card);
  background: linear-gradient(168deg, rgb(255 255 255 / 0.98) 0%, rgb(248 250 252 / 0.95) 100%);
}

.hub-card--portal {
  border-color: rgb(var(--buddy-rgb-brand) / 0.2);
  background: linear-gradient(
    145deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(239 246 255 / 0.94) 100%
  );
}

.hub-card--news {
  border-left: 3px solid #2563eb;
}

.hub-card--community {
  border-left: 3px solid #7c3aed;
}

.hub-card--ai {
  border-left: 3px solid #0891b2;
}

.hub-card--account {
  border-left: 3px solid #d97706;
}

.hub-card__inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hub-card__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.hub-card__icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgb(var(--buddy-rgb-brand) / 0.08);
  color: var(--buddy-primary);
}

.hub-card--news .hub-card__icon {
  background: rgb(37 99 235 / 0.1);
  color: #2563eb;
}

.hub-card--community .hub-card__icon {
  background: rgb(124 58 237 / 0.1);
  color: #7c3aed;
}

.hub-card--ai .hub-card__icon {
  background: rgb(8 145 178 / 0.12);
  color: #0891b2;
}

.hub-card--account .hub-card__icon {
  background: rgb(217 119 6 / 0.12);
  color: #d97706;
}

.hub-card__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: var(--buddy-text);
}

.hub-card__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

.hub-card__primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--buddy-primary);
  text-decoration: none;
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.22);
  background: rgb(255 255 255 / 0.9);
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.hub-card__primary:hover {
  background: rgb(var(--buddy-rgb-brand) / 0.08);
  box-shadow: 0 4px 14px rgb(37 99 235 / 0.12);
}

.hub-card__primary-arr {
  font-weight: 800;
  opacity: 0.85;
}

.hub-card__links {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hub-card__link {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px 8px;
  margin: 0 -8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--buddy-text-secondary);
  text-decoration: none;
  transition: background 0.12s ease;
}

.hub-card__link:hover {
  background: rgb(15 23 42 / 0.04);
  color: var(--buddy-primary);
}

.hub-card__link.is-current {
  opacity: 0.65;
  pointer-events: none;
}

.hub-card__link-ico {
  flex-shrink: 0;
  opacity: 0.55;
}

.hub-card__hint {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: var(--buddy-text-muted);
}
</style>
