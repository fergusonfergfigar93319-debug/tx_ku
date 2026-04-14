<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChatDotRound, Key, Medal, Timer, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import BuddyModuleSection from '@/components/buddy/BuddyModuleSection.vue'

const user = useUserStore()

const syncScore = computed(() => {
  const base = 60
  const cardBonus = user.buddyCard ? 18 : 0
  const agentBonus = user.agentChatUnlocked ? 12 : 0
  return Math.min(99, base + cardBonus + agentBonus)
})

const privileges = computed(() => [
  {
    key: 'chat',
    title: '智能体多轮对话',
    desc: user.agentChatUnlocked ? '已解锁，可与场景化智能体共创' : '完成名片创作后在 AI 搭子中解锁',
    ok: user.agentChatUnlocked,
    to: user.agentChatUnlocked ? '/app/agent/chat' : '/app/agent',
  },
  {
    key: 'card',
    title: '对外展示 AI 名片',
    desc: user.buddyCard ? '名片已激活，档案页同步展示' : '待完善搭子名片',
    ok: Boolean(user.buddyCard),
    to: '/app/me/profile-edit',
  },
  {
    key: 'forum',
    title: '峡谷广场发帖与互动',
    desc: '发布招募、攻略与潮流话题',
    ok: true,
    to: '/app/forum',
  },
])

const activities = [
  { key: 'a1', time: '今天', action: '登录工作台', detail: '元流同频 Web 端' },
  { key: 'a2', time: '近期', action: '浏览版本速递', detail: '赛事与城市活动资讯' },
  { key: 'a3', time: '近期', action: '档案与偏好', detail: '名片标签与游戏兴趣' },
]
</script>

<template>
  <div class="buddy-page meta-flow app-page-stack" aria-label="元流档案">
    <section class="app-layer app-layer--discover meta-flow-identity" aria-label="数字身份卡">
      <div class="app-layer__inner meta-flow-identity__inner">
    <header class="meta-hero">
      <div class="id-card buddy-card-surface">
        <div class="id-card__glow" aria-hidden="true" />
        <div class="id-card__top">
          <div class="id-card__avatarWrap">
            <el-avatar class="id-card__avatar" :size="72" :src="user.profile?.avatarUrl || undefined">
              {{ user.profile?.nickname?.slice(0, 1) || '我' }}
            </el-avatar>
            <span class="id-card__chip">数字身份</span>
          </div>
          <div class="id-card__main">
            <h1 class="id-card__name">{{ user.profile?.nickname || '元流同频用户' }}</h1>
            <p v-if="user.account?.email" class="id-card__email">{{ user.account.email }}</p>
            <div class="id-card__stats">
              <span class="id-card__stat">
                <el-icon :size="14"><Medal /></el-icon>
                同频值 {{ syncScore }}
              </span>
              <span class="id-card__stat">
                <el-icon :size="14"><Timer /></el-icon>
                档案随时展示
              </span>
            </div>
          </div>
        </div>
        <p v-if="user.profile?.bio" class="id-card__bio">{{ user.profile.bio }}</p>
        <div class="id-card__actions">
          <RouterLink class="id-btn id-btn--gold" to="/app/me/profile-edit">
            <el-icon :size="16"><UserFilled /></el-icon>
            编辑资料
          </RouterLink>
          <RouterLink class="id-btn id-btn--ghost" to="/app/me">
            完整个人中心
          </RouterLink>
        </div>
      </div>
    </header>
      </div>
    </section>

    <section class="app-layer app-layer--topics meta-flow-priv" aria-label="特权与解锁">
      <div class="app-layer__inner meta-flow-priv__inner">
    <BuddyModuleSection title="特权与解锁" subtitle="随名片与 AI 能力逐步开放" :more="{ label: 'AI 搭子', to: '/app/agent' }">
      <ul class="priv-list">
        <li v-for="p in privileges" :key="p.key">
          <RouterLink class="priv-row buddy-card-surface" :class="{ 'is-ok': p.ok }" :to="p.to">
            <span class="priv-row__icon" aria-hidden="true">
              <el-icon v-if="p.key === 'chat'" :size="20"><ChatDotRound /></el-icon>
              <el-icon v-else-if="p.key === 'card'" :size="20"><UserFilled /></el-icon>
              <el-icon v-else :size="20"><Key /></el-icon>
            </span>
            <span class="priv-row__body">
              <span class="priv-row__title">{{ p.title }}</span>
              <span class="priv-row__desc">{{ p.desc }}</span>
            </span>
            <span class="priv-row__badge">{{ p.ok ? '可用' : '待开通' }}</span>
          </RouterLink>
        </li>
      </ul>
    </BuddyModuleSection>
      </div>
    </section>

    <section class="app-layer app-layer--content meta-flow-timeline" aria-label="活动档案">
      <div class="app-layer__inner meta-flow-timeline__inner">
    <BuddyModuleSection title="活动档案" subtitle="演示时间线，可接埋点或后端流水" :more="{ label: '我的帖子', to: { name: 'my-posts' } }">
      <ol class="timeline buddy-card-surface">
        <li v-for="a in activities" :key="a.key" class="timeline__item">
          <span class="timeline__dot" aria-hidden="true" />
          <div class="timeline__content">
            <span class="timeline__time">{{ a.time }}</span>
            <span class="timeline__action">{{ a.action }}</span>
            <span class="timeline__detail">{{ a.detail }}</span>
          </div>
        </li>
      </ol>
    </BuddyModuleSection>
      </div>
    </section>

    <section class="app-layer app-layer--plain meta-flow-foot" aria-label="说明">
      <div class="app-layer__inner">
        <p class="meta-note">
          对应首页轮播「元流档案」卡片；完整账号与社交能力请使用上方入口进入个人中心。
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.meta-flow {
  padding-bottom: 28px;
  max-width: min(768px, 100%);
  margin: 0 auto;
}

.meta-hero {
  margin-bottom: 18px;
}

.id-card {
  position: relative;
  overflow: hidden;
  padding: 20px 16px 18px;
  border-radius: var(--buddy-radius);
  border: 1px solid rgb(var(--buddy-rgb-honor-gold) / 0.38);
  background: linear-gradient(
    155deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(255 251 235 / 0.88) 42%,
    rgb(246 248 255 / 0.96) 100%
  );
}

.id-card__glow {
  position: absolute;
  right: -20%;
  top: -30%;
  width: min(280px, 70vw);
  height: min(280px, 70vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgb(251 191 36 / 0.2) 0%, transparent 65%);
  pointer-events: none;
}

.id-card__top {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.id-card__avatarWrap {
  position: relative;
  flex-shrink: 0;
}

.id-card__avatar {
  border: 2px solid rgb(var(--buddy-rgb-honor-gold) / 0.45);
  box-shadow: 0 8px 24px rgb(194 120 3 / 0.15);
}

.id-card__chip {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  border-radius: 999px;
  background: linear-gradient(90deg, #0f766e, #0891b2);
  color: #fff;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgb(15 118 110 / 0.35);
}

.id-card__main {
  flex: 1;
  min-width: 0;
}

.id-card__name {
  margin: 0 0 4px;
  font-size: clamp(20px, 4vw, 24px);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--buddy-text);
}

.id-card__email {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--buddy-text-muted);
}

.id-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.id-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--buddy-text-secondary);
}

.id-card__bio {
  position: relative;
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

.id-card__actions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.id-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.id-btn--gold {
  border: 1px solid rgb(var(--buddy-rgb-honor-gold) / 0.45);
  background: linear-gradient(160deg, rgb(255 253 248) 0%, rgb(255 255 255) 100%);
  color: var(--buddy-text);
  box-shadow: 0 4px 14px rgb(194 120 3 / 0.12);
}

.id-btn--gold:hover {
  box-shadow: 0 8px 22px rgb(194 120 3 / 0.2);
  transform: translateY(-1px);
}

.id-btn--ghost {
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.2);
  background: rgb(255 255 255 / 0.95);
  color: var(--buddy-primary);
}

.priv-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.priv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  border: 1px solid rgb(15 23 42 / 0.06);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.priv-row:hover {
  border-color: rgb(var(--buddy-rgb-honor-gold) / 0.35);
  box-shadow: 0 6px 18px rgb(15 23 42 / 0.06);
}

.priv-row.is-ok .priv-row__badge {
  background: rgb(34 197 94 / 0.12);
  color: #15803d;
}

.priv-row:not(.is-ok) .priv-row__badge {
  background: rgb(148 163 184 / 0.15);
  color: var(--buddy-text-muted);
}

.priv-row__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgb(var(--buddy-rgb-brand) / 0.1), rgb(var(--buddy-rgb-accent) / 0.08));
  color: var(--buddy-primary);
}

.priv-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.priv-row__title {
  font-size: 14px;
  font-weight: 800;
  color: var(--buddy-text);
}

.priv-row__desc {
  font-size: 11px;
  line-height: 1.4;
  color: var(--buddy-text-muted);
}

.priv-row__badge {
  flex-shrink: 0;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 800;
  border-radius: 8px;
}

.timeline {
  margin: 0;
  padding: 16px 16px 14px;
  list-style: none;
  border-radius: var(--buddy-radius-sm);
}

.timeline__item {
  position: relative;
  padding-left: 22px;
  padding-bottom: 16px;
}

.timeline__item:last-child {
  padding-bottom: 0;
}

.timeline__item::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 10px;
  bottom: -6px;
  width: 2px;
  background: linear-gradient(180deg, rgb(var(--buddy-rgb-honor-gold) / 0.45), rgb(var(--buddy-rgb-brand) / 0.15));
  border-radius: 2px;
}

.timeline__item:last-child::before {
  bottom: auto;
  height: 0;
}

.timeline__dot {
  position: absolute;
  left: 0;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fbbf24, #ea580c);
  box-shadow: 0 0 0 3px rgb(251 191 36 / 0.2);
}

.timeline__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline__time {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--buddy-text-muted);
  text-transform: uppercase;
}

.timeline__action {
  font-size: 14px;
  font-weight: 700;
  color: var(--buddy-text);
}

.timeline__detail {
  font-size: 11px;
  color: var(--buddy-text-muted);
}

.meta-note {
  margin: 18px 4px 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .id-btn--gold:hover,
  .priv-row:hover {
    transform: none;
  }
}
</style>
