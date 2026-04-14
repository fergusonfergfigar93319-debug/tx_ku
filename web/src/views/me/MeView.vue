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

    <section class="profile-hero buddy-card-surface" aria-label="资料概览">
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
        <section class="me-panel buddy-card-surface">
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

        <section class="me-panel buddy-card-surface">
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

        <section class="me-panel buddy-card-surface">
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

        <section class="me-panel buddy-card-surface">
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

        <section class="me-panel me-panel--danger buddy-card-surface">
          <button type="button" class="me-logout" @click="confirmLogout">
            <el-icon :size="20"><SwitchButton /></el-icon>
            <span>退出登录</span>
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
  max-width: min(920px, 100%);
  margin: 0 auto;
}

/* 页头 */
.me-intro {
  margin-bottom: 18px;
  padding-bottom: 4px;
}

.me-intro__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--buddy-primary);
}

.me-intro__title {
  margin: 0 0 8px;
  font-size: clamp(22px, 4.5vw, 28px);
  font-weight: 800;
  letter-spacing: 0.03em;
  line-height: 1.2;
  background: linear-gradient(115deg, #0f172a 0%, #2563eb 42%, #7c3aed 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.me-intro__sub {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

/* 资料卡：亮色层次 */
.profile-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 22px;
  padding: 0;
  border: 1px solid rgba(37, 99, 235, 0.12);
  background: var(--buddy-surface);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 12px 40px rgba(15, 23, 42, 0.06);
}

.profile-hero__mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(100% 80% at 100% -30%, rgba(37, 99, 235, 0.09) 0%, transparent 55%),
    radial-gradient(80% 70% at -10% 100%, rgba(124, 58, 237, 0.07) 0%, transparent 52%),
    radial-gradient(60% 50% at 90% 90%, rgba(8, 145, 178, 0.05) 0%, transparent 45%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%);
}

/* 渐变网格纹理（优化方案 2.5） */
.profile-hero__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.45;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgb(255 255 255 / 0.06) 0px,
      transparent 1px,
      transparent 36px,
      rgb(255 255 255 / 0.05) 37px
    ),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.05) 0px,
      transparent 1px,
      transparent 36px,
      rgb(255 255 255 / 0.05) 37px
    );
  mix-blend-mode: soft-light;
}

.profile-hero__stripe {
  position: relative;
  height: 4px;
  background: var(--buddy-gradient-brand);
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.2);
}

.profile-hero__body {
  position: relative;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 22px 20px 24px;
}

@media (max-width: 520px) {
  .profile-hero__body {
    flex-direction: column;
    align-items: center;
    text-align: center;
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
  gap: 10px;
}

.profile-hero__avatarRing {
  position: relative;
  display: inline-flex;
  padding: 3px;
  border-radius: 50%;
  z-index: 0;
  box-shadow:
    0 8px 24px rgba(37, 99, 235, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
}

/* 旋转光环（优化方案 2.5；静态 conic 改为伪元素动画） */
.profile-hero__avatarRing::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #fbbf24,
    #f59e0b,
    #ec4899,
    #a855f7,
    #2563eb,
    #0891b2,
    #fbbf24
  );
  z-index: -1;
}

@media (prefers-reduced-motion: no-preference) {
  .profile-hero__avatarRing::before {
    animation: buddy-profile-avatar-ring 5s linear infinite;
  }
}

@keyframes buddy-profile-avatar-ring {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-hero__avatarRing::before {
    background: conic-gradient(
      from 200deg,
      #2563eb,
      #7c3aed,
      #0891b2,
      #16a34a,
      #2563eb
    );
  }
}

.profile-hero__avatar {
  display: block;
  border: 3px solid #fff !important;
  font-weight: 700;
  font-size: 28px !important;
  background: linear-gradient(145deg, #f1f5f9 0%, #ffffff 100%) !important;
  color: var(--buddy-primary) !important;
}

.profile-hero__badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 5px 10px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 2px 10px rgba(124, 58, 237, 0.22);
  white-space: nowrap;
}

.profile-hero__main {
  min-width: 0;
  flex: 1;
}

.profile-hero__name {
  margin: 0 0 6px;
  font-size: clamp(20px, 4.5vw, 24px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--buddy-text);
}

.profile-hero__email {
  margin: 0 0 8px;
  color: var(--buddy-text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.profile-hero__bio {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--buddy-text-secondary);
}

.me-agent-sync {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(255, 255, 255, 0.95) 100%);
  border: 1px solid rgba(37, 99, 235, 0.14);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.me-agent-sync:hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, #ffffff 100%);
  border-color: rgba(37, 99, 235, 0.22);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.1);
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
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--buddy-border);
  border-left: 3px solid var(--buddy-primary);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.game-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-primary);
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.2);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.game-pill--more {
  cursor: pointer;
  border-style: dashed;
  color: var(--buddy-text-secondary);
  background: var(--buddy-surface-elevated);
}

.game-pill--more:hover {
  border-color: var(--buddy-primary);
  color: var(--buddy-primary);
  background: #fff;
}

.profile-hero__cardTags {
  margin-top: 4px;
  padding: 14px 14px 16px;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid var(--buddy-border);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
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

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid transparent;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.tag-chip:hover {
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .tag-chip:hover {
    transform: none;
  }
}

.tag-chip--0 {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.2);
}

.tag-chip--1 {
  color: #6d28d9;
  background: rgba(124, 58, 237, 0.08);
  border-color: rgba(124, 58, 237, 0.2);
}

.tag-chip--2 {
  color: #0e7490;
  background: rgba(8, 145, 178, 0.1);
  border-color: rgba(8, 145, 178, 0.22);
}

.tag-chip--3 {
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.28);
}

/* 功能区块 */
.me-modules__heading {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--buddy-text);
}

.me-modules__grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (min-width: 640px) {
  .me-modules__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: start;
  }

  .me-panel--danger {
    grid-column: 1 / -1;
  }
}

.me-panel {
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.07);
  transition: box-shadow 0.2s ease;
}

.me-panel:hover {
  box-shadow: var(--buddy-shadow-card-hover);
}

.me-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 12px 16px 10px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--buddy-text-secondary);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, rgba(255, 255, 255, 0.5) 100%);
  border-bottom: 1px solid var(--buddy-border);
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

.me-quick {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 8px 10px;
}

.me-quick__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.me-quick__item:hover {
  background: rgba(37, 99, 235, 0.06);
}

.me-quick__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%);
  color: var(--buddy-primary);
  flex-shrink: 0;
}

.me-quick__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.me-quick__label {
  font-size: 15px;
  font-weight: 700;
  color: var(--buddy-text);
}

.me-quick__hint {
  font-size: 12px;
  color: var(--buddy-text-muted);
}

.me-quick__arrow {
  flex-shrink: 0;
  color: var(--buddy-text-muted);
  opacity: 0.65;
}

.me-list {
  list-style: none;
  margin: 0;
  padding: 6px 8px 10px;
}

.me-list li + li {
  border-top: 1px solid rgba(15, 23, 42, 0.05);
}

.me-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--buddy-text);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s ease;
}

.me-link:hover {
  background: rgba(37, 99, 235, 0.05);
}

.me-link__ico {
  flex-shrink: 0;
  color: var(--buddy-primary);
}

.me-link__label {
  flex: 1;
  min-width: 0;
}

.me-link__arrow {
  flex-shrink: 0;
  color: var(--buddy-text-muted);
  opacity: 0.55;
}

.me-panel--danger {
  padding: 10px 12px 12px;
}

.me-panel--danger:hover {
  box-shadow: var(--buddy-shadow-card);
}

.me-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  background: rgba(254, 242, 242, 0.6);
  color: #dc2626;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.me-logout:hover {
  background: rgba(254, 226, 226, 0.95);
  border-color: rgba(239, 68, 68, 0.4);
}
</style>
