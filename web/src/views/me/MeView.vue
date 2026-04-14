<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  ArrowRight,
  ChatDotRound,
  Compass,
  EditPen,
  Grid,
  HomeFilled,
  Medal,
  Star,
  StarFilled,
  SwitchButton,
  UserFilled,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { FACTORY_AGENT_NAME, findAgentPreset } from '@/data/agentPresets'

const router = useRouter()
const user = useUserStore()

const gamesExpanded = ref(false)
const preferredGames = computed(() => user.profile?.preferredGames ?? [])
const visibleGames = computed(() =>
  gamesExpanded.value ? preferredGames.value : preferredGames.value.slice(0, 6)
)
const moreGameCount = computed(() => Math.max(0, preferredGames.value.length - 6))

const agentPersonaSummary = computed(() => {
  if (!user.profile?.agentPresetId) return `${FACTORY_AGENT_NAME}（出厂）`
  return (
    user.profile.agentBuddyDisplayName?.trim() ||
    findAgentPreset(user.profile.agentPresetId)?.name ||
    'AI搭子'
  )
})

async function confirmLogout() {
  try {
    await ElMessageBox.confirm('确定退出登录？', '提示')
    await user.logout()
    void router.replace('/login')
  } catch {
    /* cancel */
  }
}
</script>

<template>
  <div class="buddy-page me me--layout app-page-stack">
    <!-- 身份展示：标题与资料卡（与下方功能列表分离） -->
    <section class="app-layer app-layer--discover me-layer-identity" aria-labelledby="me-page-title">
      <div class="app-layer__inner me-layer-identity__inner">
    <header class="me-intro">
      <p class="me-intro__eyebrow">个人中心</p>
      <h1 id="me-page-title" class="me-intro__title">元流档案</h1>
      <p class="me-intro__sub">账户与关系中心：资料、社区资产与私信；与「资讯只读」「广场 UGC」并列一域</p>
    </header>

    <section class="profile-hero" aria-label="资料概览">
      <div class="profile-hero__mesh" aria-hidden="true" />
      <div class="profile-hero__grid" aria-hidden="true" />
      <div class="profile-hero__stripe" aria-hidden="true" />
      <div class="profile-hero__body">
        <div class="profile-hero__avatarCol">
          <div class="profile-hero__avatarRing">
            <el-avatar
              class="profile-hero__avatar"
              :size="80"
              :src="user.profile?.avatarUrl || undefined"
            >
              {{ user.profile?.nickname?.slice(0, 1) || '我' }}
            </el-avatar>
          </div>
          <span v-if="user.buddyCard" class="profile-hero__badge">AI 名片</span>
        </div>
        <div class="profile-hero__main">
          <h2 class="profile-hero__name">{{ user.profile?.nickname || '元流同频用户' }}</h2>
          <p v-if="user.account?.email" class="profile-hero__email">{{ user.account.email }}</p>
          <p v-if="user.profile?.bio" class="profile-hero__bio">{{ user.profile.bio }}</p>
          <RouterLink :to="{ name: 'agent' }" class="me-agent-sync">
            <span class="me-agent-sync__lab">AI搭子</span>
            <span class="me-agent-sync__name">{{ agentPersonaSummary }}</span>
            <el-icon class="me-agent-sync__ico" :size="16"><ArrowRight /></el-icon>
          </RouterLink>
          <p v-if="user.buddyCard?.declaration" class="profile-hero__decl">
            {{ user.buddyCard.declaration }}
          </p>

          <div v-if="preferredGames.length" class="profile-hero__games">
            <span class="profile-hero__gamesLabel">常玩</span>
            <div class="profile-hero__gameList">
              <span v-for="g in visibleGames" :key="g" class="game-pill">{{ g }}</span>
              <button
                v-if="moreGameCount > 0 && !gamesExpanded"
                type="button"
                class="game-pill game-pill--more"
                @click="gamesExpanded = true"
              >
                +{{ moreGameCount }}
              </button>
              <button
                v-if="moreGameCount > 0 && gamesExpanded"
                type="button"
                class="game-pill game-pill--more"
                @click="gamesExpanded = false"
              >
                收起
              </button>
            </div>
          </div>

          <div v-if="user.buddyCard?.tags?.length" class="profile-hero__cardTags">
            <div class="profile-hero__cardTagsHead">
              <span class="profile-hero__cardTagsIcon" aria-hidden="true">✦</span>
              <span class="profile-hero__cardTagsLabel">名片标签</span>
            </div>
            <div class="profile-hero__tagChips">
              <span
                v-for="(t, idx) in user.buddyCard.tags.slice(0, 5)"
                :key="t"
                class="tag-chip"
                :class="'tag-chip--' + (idx % 4)"
              >
                {{ t }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
      </div>
    </section>

    <!-- 功能入口：账号与业务操作 -->
    <section class="app-layer app-layer--content me-layer-actions" aria-label="功能与服务">
      <div class="app-layer__inner me-layer-actions__inner">
    <div class="me-modules">
      <h2 class="me-modules__heading">功能与服务</h2>

      <div class="me-modules__grid buddy-stagger-children">
        <section class="me-panel">
          <h3 class="me-panel__title">
            <span class="me-panel__dot me-panel__dot--a" aria-hidden="true" />
            快捷入口
          </h3>
          <div class="me-quick">
            <RouterLink class="me-quick__item is-interactive" to="/app/home">
              <span class="me-quick__icon"><el-icon :size="22"><HomeFilled /></el-icon></span>
              <span class="me-quick__text">
                <span class="me-quick__label">工作台首页</span>
                <span class="me-quick__hint">门户与模块总览</span>
              </span>
              <el-icon class="me-quick__arrow" :size="16"><ArrowRight /></el-icon>
            </RouterLink>
            <RouterLink class="me-quick__item is-interactive" to="/app/feed">
              <span class="me-quick__icon"><el-icon :size="22"><Compass /></el-icon></span>
              <span class="me-quick__text">
                <span class="me-quick__label">版本速递</span>
                <span class="me-quick__hint">资讯与推荐</span>
              </span>
              <el-icon class="me-quick__arrow" :size="16"><ArrowRight /></el-icon>
            </RouterLink>
            <RouterLink class="me-quick__item is-interactive" to="/app/forum">
              <span class="me-quick__icon"><el-icon :size="22"><Grid /></el-icon></span>
              <span class="me-quick__text">
                <span class="me-quick__label">峡谷广场</span>
                <span class="me-quick__hint">社区与帖子</span>
              </span>
              <el-icon class="me-quick__arrow" :size="16"><ArrowRight /></el-icon>
            </RouterLink>
          </div>
        </section>

        <section class="me-panel">
          <h3 class="me-panel__title">
            <span class="me-panel__dot me-panel__dot--b" aria-hidden="true" />
            数字身份与资料
          </h3>
          <ul class="me-list">
            <li>
              <RouterLink class="me-link" to="/app/me/profile-edit">
                <el-icon class="me-link__ico"><EditPen /></el-icon>
                <span class="me-link__label">编辑资料</span>
                <el-icon class="me-link__arrow" :size="16"><ArrowRight /></el-icon>
              </RouterLink>
            </li>
            <li>
              <RouterLink class="me-link" :to="{ name: 'me-flow' }">
                <el-icon class="me-link__ico"><Medal /></el-icon>
                <span class="me-link__label">数字身份档案</span>
                <el-icon class="me-link__arrow" :size="16"><ArrowRight /></el-icon>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="me-panel">
          <h3 class="me-panel__title">
            <span class="me-panel__dot me-panel__dot--c" aria-hidden="true" />
            社区与内容
          </h3>
          <ul class="me-list">
            <li>
              <RouterLink class="me-link" :to="{ name: 'my-posts' }">
                <el-icon class="me-link__ico"><Grid /></el-icon>
                <span class="me-link__label">我的帖子</span>
                <el-icon class="me-link__arrow" :size="16"><ArrowRight /></el-icon>
              </RouterLink>
            </li>
            <li>
              <RouterLink class="me-link" :to="{ name: 'forum-favorites' }">
                <el-icon class="me-link__ico"><Star /></el-icon>
                <span class="me-link__label">帖子收藏</span>
                <el-icon class="me-link__arrow" :size="16"><ArrowRight /></el-icon>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="me-panel">
          <h3 class="me-panel__title">
            <span class="me-panel__dot me-panel__dot--d" aria-hidden="true" />
            关系与消息
          </h3>
          <ul class="me-list">
            <li>
              <RouterLink class="me-link" to="/app/me/following">
                <el-icon class="me-link__ico"><StarFilled /></el-icon>
                <span class="me-link__label">关注列表</span>
                <el-icon class="me-link__arrow" :size="16"><ArrowRight /></el-icon>
              </RouterLink>
            </li>
            <li>
              <RouterLink class="me-link" to="/app/me/add-friend">
                <el-icon class="me-link__ico"><UserFilled /></el-icon>
                <span class="me-link__label">加好友 / 关注</span>
                <el-icon class="me-link__arrow" :size="16"><ArrowRight /></el-icon>
              </RouterLink>
            </li>
            <li>
              <RouterLink class="me-link" :to="{ name: 'user-dm', params: { peerUserId: 'demo' } }">
                <el-icon class="me-link__ico"><ChatDotRound /></el-icon>
                <span class="me-link__label">私信（示例）</span>
                <el-icon class="me-link__arrow" :size="16"><ArrowRight /></el-icon>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="me-panel me-panel--danger">
          <button type="button" class="me-logout is-interactive" @click="confirmLogout">
            <span class="me-logout__icon-wrap">
              <el-icon :size="18"><SwitchButton /></el-icon>
            </span>
            <span class="me-logout__text">退出登录</span>
          </button>
        </section>
      </div>
    </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.me--layout {
  max-width: min(960px, 100%);
  margin: 0 auto;
  padding-bottom: 40px;
}

/* =========================================
   页头标题区 (Header)
========================================= */
.me-intro {
  margin-bottom: 24px;
  padding-left: 4px;
}

.me-intro__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--buddy-primary);
}

.me-intro__title {
  margin: 0 0 8px;
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--buddy-text-primary, #0f172a);
}

.me-intro__sub {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--buddy-text-muted);
  max-width: 600px;
}

/* 暗黑模式标题渐变重写 */
html.dark .me-intro__title {
  background: linear-gradient(115deg, #f8fafc 0%, #60a5fa 42%, #c084fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* =========================================
   个人资料大卡片 (Hero Card)
========================================= */
.profile-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 32px;
  border-radius: 24px; /* 更大的圆角，现代感更强 */
  border: 1px solid rgba(37, 99, 235, 0.1);
  background: var(--buddy-surface-elevated, #ffffff);
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .profile-hero:hover {
    transform: none;
  }
}

.profile-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.12);
}

.profile-hero__mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(100% 80% at 100% -30%, rgba(37, 99, 235, 0.08) 0%, transparent 55%),
    radial-gradient(80% 70% at -10% 100%, rgba(124, 58, 237, 0.06) 0%, transparent 52%);
}

html.dark .profile-hero__mesh {
  opacity: 0.85;
}

.profile-hero__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgb(255 255 255 / 0.06) 0px,
      transparent 1px,
      transparent 36px,
      rgb(255 255 255 / 0.04) 37px
    ),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.05) 0px,
      transparent 1px,
      transparent 36px,
      rgb(255 255 255 / 0.04) 37px
    );
  mix-blend-mode: soft-light;
}

.profile-hero__stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
}

.profile-hero__body {
  position: relative;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 32px 28px;
}

@media (max-width: 640px) {
  .profile-hero__body {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 28px 20px;
  }

  .profile-hero__main {
    width: 100%;
  }

  .me-agent-sync {
    justify-content: center;
  }

  .profile-hero__gameList {
    justify-content: center;
  }
}

.profile-hero__avatarCol {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.profile-hero__avatarRing {
  position: relative;
  display: inline-flex;
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa 0%, #c084fc 100%);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
}

.profile-hero__avatar {
  border: 4px solid var(--buddy-surface-elevated, #fff) !important;
  font-weight: 800;
  font-size: 32px !important;
  color: var(--buddy-primary) !important;
  background: rgba(37, 99, 235, 0.08) !important;
}

.profile-hero__badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
  white-space: nowrap;
}

.profile-hero__main {
  min-width: 0;
  flex: 1;
}

.profile-hero__name {
  margin: 0 0 6px;
  font-size: clamp(22px, 5vw, 28px);
  font-weight: 800;
  color: var(--buddy-text, #0f172a);
}

.profile-hero__email {
  margin: 0 0 12px;
  color: var(--buddy-text-muted);
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.profile-hero__bio {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--buddy-text-secondary);
}

/* AI 搭子入口 */
.me-agent-sync {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.07) 0%, rgba(255, 255, 255, 0.5) 100%);
  border: 1px solid rgba(37, 99, 235, 0.14);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

html.dark .me-agent-sync {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(30, 41, 59, 0.45) 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

.me-agent-sync:hover {
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.12);
}

.me-agent-sync__lab {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--buddy-primary);
  text-transform: uppercase;
}

.me-agent-sync__name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--buddy-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.me-agent-sync__ico {
  flex-shrink: 0;
  color: var(--buddy-text-muted);
}

.profile-hero__decl {
  margin: 0 0 12px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--buddy-text-secondary);
  border-radius: 14px;
  background: var(--buddy-surface, #fff);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-left: 3px solid var(--buddy-primary);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

html.dark .profile-hero__decl {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(255, 255, 255, 0.1);
}

.profile-hero__games {
  margin-bottom: 12px;
}

.profile-hero__gamesLabel {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--buddy-text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.profile-hero__gameList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.game-pill--more {
  cursor: pointer;
  border-style: dashed !important;
  color: var(--buddy-text-secondary) !important;
}

.game-pill--more:hover {
  border-color: rgba(37, 99, 235, 0.45) !important;
  color: var(--buddy-primary) !important;
}

.profile-hero__cardTags {
  margin-top: 4px;
  padding: 14px 14px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

html.dark .profile-hero__cardTags {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.08);
}

.profile-hero__cardTagsHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.profile-hero__cardTagsIcon {
  font-size: 12px;
  color: #d97706;
}

.profile-hero__cardTagsLabel {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--buddy-text-secondary);
}

.profile-hero__tagChips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip--0 {
  color: #1d4ed8 !important;
  background: rgba(37, 99, 235, 0.1) !important;
  border-color: rgba(37, 99, 235, 0.25) !important;
}

.tag-chip--1 {
  color: #6d28d9 !important;
  background: rgba(124, 58, 237, 0.1) !important;
  border-color: rgba(124, 58, 237, 0.22) !important;
}

.tag-chip--2 {
  color: #0e7490 !important;
  background: rgba(8, 145, 178, 0.12) !important;
  border-color: rgba(8, 145, 178, 0.22) !important;
}

.tag-chip--3 {
  color: #b45309 !important;
  background: rgba(245, 158, 11, 0.14) !important;
  border-color: rgba(245, 158, 11, 0.28) !important;
}

html.dark .tag-chip--0,
html.dark .tag-chip--1,
html.dark .tag-chip--2,
html.dark .tag-chip--3 {
  color: inherit !important;
}

/* =========================================
   游戏标签与状态 (Pills & Tags)
========================================= */
.game-pill,
.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: var(--buddy-surface-2, #f8fafc);
  color: var(--buddy-text-secondary);
  transition: all 0.2s ease;
}

.game-pill:hover,
.tag-chip:hover {
  border-color: rgba(37, 99, 235, 0.4);
  color: var(--buddy-primary);
  transform: translateY(-2px);
  background: var(--buddy-surface-elevated);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

@media (prefers-reduced-motion: reduce) {
  .game-pill:hover,
  .tag-chip:hover {
    transform: none;
  }
}

html.dark .game-pill,
html.dark .tag-chip {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

/* =========================================
   Bento Box 小组件网格 (Widgets)
========================================= */
.me-modules__heading {
  margin: 0 0 16px 4px;
  font-size: 16px;
  font-weight: 800;
  color: var(--buddy-text);
}

.me-modules__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .me-modules__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.me-panel {
  display: flex;
  flex-direction: column;
  padding: 0;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: var(--buddy-surface-elevated, #ffffff);
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .me-panel:hover {
    transform: none;
  }
}

.me-panel:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px -10px rgba(37, 99, 235, 0.15);
  border-color: rgba(37, 99, 235, 0.2);
}

html.dark .me-panel {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: rgba(255, 255, 255, 0.08);
}

.me-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 16px 20px 12px;
  font-size: 14px;
  font-weight: 800;
  color: var(--buddy-text-secondary);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

html.dark .me-panel__title {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.me-panel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.me-panel__dot--a {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.me-panel__dot--b {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
}

.me-panel__dot--c {
  background: linear-gradient(135deg, #0891b2, #22d3ee);
  box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.15);
}

.me-panel__dot--d {
  background: linear-gradient(135deg, #ea580c, #fb923c);
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.12);
}

/* =========================================
   列表交互项 (Lists & Links)
========================================= */
.me-quick {
  padding: 8px;
}
.me-list {
  list-style: none;
  margin: 0;
  padding: 8px;
}

.me-list li + li {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

html.dark .me-list li + li {
  border-top-color: rgba(255, 255, 255, 0.06);
}

.me-quick__item,
.me-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  text-decoration: none;
  color: var(--buddy-text);
  transition: all 0.2s ease;
}

.me-quick__item:hover,
.me-link:hover {
  background: rgba(37, 99, 235, 0.06);
  transform: scale(1.01);
}

@media (prefers-reduced-motion: reduce) {
  .me-quick__item:hover,
  .me-link:hover {
    transform: none;
  }
}

html.dark .me-quick__item:hover,
html.dark .me-link:hover {
  background: rgba(255, 255, 255, 0.06);
}

.me-quick__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.me-quick__arrow {
  flex-shrink: 0;
  color: var(--buddy-text-muted);
  opacity: 0.7;
}

.me-quick__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.1);
  color: var(--buddy-primary);
}

.me-link__ico {
  font-size: 18px;
  color: var(--buddy-text-secondary);
  transition: color 0.2s ease;
}

.me-link:hover .me-link__ico {
  color: var(--buddy-primary);
}

.me-link__label {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
}

.me-link__arrow {
  flex-shrink: 0;
  color: var(--buddy-text-muted);
  opacity: 0.55;
}

.me-quick__label,
.me-link__label {
  font-size: 15px;
  font-weight: 600;
}

.me-quick__hint {
  display: block;
  font-size: 12px;
  color: var(--buddy-text-muted);
  margin-top: 2px;
}

/* =========================================
   注销按钮 (Logout Widget)
========================================= */
.me-panel--danger {
  grid-column: 1 / -1;
  background: transparent;
  border: none;
  box-shadow: none;
}

.me-panel--danger:hover {
  transform: none;
  box-shadow: none;
}

.me-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  border-radius: 20px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

html.dark .me-logout {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.me-logout:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -5px rgba(239, 68, 68, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .me-logout:hover {
    transform: none;
  }
}

.me-logout__icon-wrap {
  display: flex;
  align-items: center;
}
</style>
