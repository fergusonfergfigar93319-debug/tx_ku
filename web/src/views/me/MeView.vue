<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  ArrowRight,
  ChatDotRound,
  Compass,
  EditPen,
  Grid,
  HomeFilled,
  Lightning,
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
const pageReady = ref(false)

const preferredGames = computed(() => user.profile?.preferredGames ?? [])
const visibleGames = computed(() =>
  gamesExpanded.value ? preferredGames.value : preferredGames.value.slice(0, 6)
)
const moreGameCount = computed(() => Math.max(0, preferredGames.value.length - 6))

function stableHash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** 同频等级进度 10–98，随用户档案稳定变化，便于后续接真实段位 API */
const syncLevelProgress = computed(() => {
  const nick = user.profile?.nickname ?? 'guest'
  const rank = user.profile?.rank ?? ''
  const seed = stableHash(`${nick}|${rank}|${user.account?.email ?? ''}`)
  return 10 + (seed % 89)
})

const syncTierName = computed(() => {
  const p = syncLevelProgress.value
  if (p >= 85) return '巅峰同频 · 传说'
  if (p >= 70) return '星耀同频 · 核心'
  if (p >= 50) return '钻石同频 · 进阶'
  return '青铜同频 · 起步'
})

const agentPersonaSummary = computed(() => {
  if (!user.profile?.agentPresetId) return `${FACTORY_AGENT_NAME}（出厂）`
  return (
    user.profile.agentBuddyDisplayName?.trim() ||
    findAgentPreset(user.profile.agentPresetId)?.name ||
    'AI搭子'
  )
})

const MOODS = ['专注备战', '轻松闲聊', '高能输出', '温柔陪伴', '战术分析'] as const

const agentMoodLabel = computed(() => {
  const base =
    user.profile?.agentTuning?.tone ||
    user.profile?.agentTuning?.personaStyle ||
    user.profile?.personalityArchetype ||
    agentPersonaSummary.value
  const idx = stableHash(base) % MOODS.length
  return MOODS[idx]!
})

const agentIntimacy = computed(() => {
  const seed = stableHash(
    `${user.profile?.nickname ?? ''}|${user.profile?.agentPresetId ?? ''}|buddy`
  )
  let v = 32 + (seed % 52)
  if (user.agentChatUnlocked) v = Math.min(98, v + 12)
  if (user.buddyCard?.tags?.length) v = Math.min(98, v + Math.min(8, user.buddyCard.tags.length))
  return v
})

const achievementMedals = computed(() => {
  const tags = user.buddyCard?.tags ?? []
  const hasForum = true
  return [
    { id: 'onboard', title: '建档同频', sub: '完成元流档案', Icon: Medal, dim: false },
    {
      id: 'voice',
      title: '峡谷声线',
      sub: user.profile?.voicePref ? `偏好：${user.profile.voicePref}` : '语音偏好已点亮',
      Icon: Lightning,
      dim: !user.profile?.voicePref,
    },
    {
      id: 'tag',
      title: '名片高光',
      sub: tags.length ? `标签 ×${tags.length}` : '待补充名片标签',
      Icon: StarFilled,
      dim: tags.length === 0,
    },
    { id: 'forum', title: '广场先锋', sub: hasForum ? '社区已解锁' : '待探索广场', Icon: Grid, dim: false },
    {
      id: 'star',
      title: '同频星标',
      sub: '持续活跃加成',
      Icon: Star,
      dim: syncLevelProgress.value < 55,
    },
  ]
})

onMounted(() => {
  requestAnimationFrame(() => {
    pageReady.value = true
  })
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
  <div class="buddy-page me me--layout app-page-stack" :class="{ 'me--ready': pageReady }">
    <!-- 身份展示：标题与资料卡（与下方功能列表分离） -->
    <section class="app-layer app-layer--discover me-layer-identity" aria-labelledby="me-page-title">
      <div class="app-layer__inner me-layer-identity__inner">
    <header class="me-intro">
      <p class="me-intro__eyebrow">个人中心</p>
      <h1 id="me-page-title" class="me-intro__title">元流档案</h1>
      <p class="me-intro__sub">账户与关系中心：资料、社区资产与私信；与「资讯只读」「广场 UGC」并列一域</p>
    </header>

    <section class="profile-hero me-bento-tilt" aria-label="资料概览">
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

          <div
            class="profile-hero__rank"
            role="group"
            aria-label="同频等级与巅峰系数"
          >
            <div class="profile-hero__rankHead">
              <span class="profile-hero__rankLab">同频等级</span>
              <span class="profile-hero__rankTier">{{ syncTierName }}</span>
              <span class="profile-hero__rankPct">{{ syncLevelProgress }}%</span>
            </div>
            <div
              class="profile-hero__rankBar"
              role="progressbar"
              :aria-valuenow="syncLevelProgress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`同频进度 ${syncLevelProgress}%`"
            >
              <div
                class="profile-hero__rankFill"
                :style="{ width: `${syncLevelProgress}%` }"
              />
            </div>
            <p class="profile-hero__rankHint">
              巅峰系数 · 随档案完善与社区活跃成长；当前档案段位：{{ user.profile?.rank || '未填写' }}
            </p>
          </div>

          <p v-if="user.profile?.bio" class="profile-hero__bio">{{ user.profile.bio }}</p>

          <RouterLink :to="{ name: 'agent' }" class="me-agent-sync me-agent-sync--live">
            <div class="me-agent-sync__top">
              <span class="me-agent-sync__lab">AI 搭子同步</span>
              <span class="me-agent-sync__mood" :title="'当前情绪倾向：' + agentMoodLabel">{{
                agentMoodLabel
              }}</span>
            </div>
            <div class="me-agent-sync__mid">
              <span class="me-agent-sync__name">{{ agentPersonaSummary }}</span>
              <el-icon class="me-agent-sync__ico" :size="18"><ArrowRight /></el-icon>
            </div>
            <div class="me-agent-sync__bond">
              <span class="me-agent-sync__bondLab">亲密度</span>
              <div
                class="me-agent-sync__bondBar"
                role="progressbar"
                :aria-valuenow="agentIntimacy"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="me-agent-sync__bondFill"
                  :style="{ width: `${agentIntimacy}%` }"
                />
              </div>
              <span class="me-agent-sync__bondPct">{{ agentIntimacy }}%</span>
            </div>
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

      <div class="me-medals" aria-label="成就勋章">
        <div class="me-medals__head">
          <span class="me-medals__title">成就勋章</span>
          <span class="me-medals__hint">横向滑动 · 高光时刻</span>
        </div>
        <div class="me-medals__track">
          <div
            v-for="m in achievementMedals"
            :key="m.id"
            class="me-medal"
            :class="{ 'me-medal--dim': m.dim }"
          >
            <div class="me-medal__iconWrap" aria-hidden="true">
              <el-icon class="me-medal__icon" :size="22">
                <component :is="m.Icon" />
              </el-icon>
            </div>
            <div class="me-medal__text">
              <span class="me-medal__title">{{ m.title }}</span>
              <span class="me-medal__sub">{{ m.sub }}</span>
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

      <div class="me-modules__grid">
        <section class="me-panel me-bento-tilt">
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

        <section class="me-panel me-bento-tilt">
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

        <section class="me-panel me-bento-tilt">
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

        <section class="me-panel me-bento-tilt">
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
/* ==========================================================
   MeView.vue 終極美術重構：全息星雲 + 霓虹便當盒（高頻高光）
   ========================================================== */

.me {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box;
  padding-bottom: 60px;
  transition: background 0.8s ease;
  background: var(--buddy-page-bg);
}

:global(html:not(.dark)) .me {
  background:
    radial-gradient(ellipse 100% 380px at 50% 0%, rgba(37, 99, 235, 0.06) 0%, transparent 100%),
    linear-gradient(180deg, #f8fafc 0%, var(--buddy-page-bg) 420px);
}

:global(html.dark) .me {
  background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
}

/* 1. 動態背景光球（暗黑） */
:global(html.dark) .me::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  width: 70vw;
  height: 70vw;
  background: radial-gradient(circle, rgba(109, 75, 212, 0.15) 0%, transparent 70%);
  filter: blur(100px);
  animation: nebula-float 20s infinite alternate ease-in-out;
  pointer-events: none;
  z-index: 0;
}

@keyframes nebula-float {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(100px, 50px) scale(1.1);
  }
}

.me-layer-identity,
.me-layer-actions {
  position: relative;
  z-index: 1;
}

.me .app-layer {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  padding: 0 !important;
}

.me .app-layer__inner {
  padding: 0 !important;
}

.me--layout {
  max-width: min(960px, 100%);
  margin: 0 auto;
}

/* 2. 統一卡片：高透玻璃（排除登出區） */
.profile-hero,
.me-panel:not(.me-panel--danger) {
  position: relative;
  z-index: 1;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(30px) saturate(180%) !important;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  overflow: hidden;
}

:global(html:not(.dark)) .profile-hero,
:global(html:not(.dark)) .me-panel:not(.me-panel--danger) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(243, 244, 246, 0.7) 100%) !important;
  box-shadow:
    0 12px 30px -10px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset !important;
}

:global(html.dark) .profile-hero,
:global(html.dark) .me-panel:not(.me-panel--danger) {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%) !important;
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(99, 102, 241, 0.05),
    0 1px 1px rgba(255, 255, 255, 0.15) inset !important;
}

.me-bento-tilt {
  transform-style: preserve-3d;
  transition:
    transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.4s ease,
    border-color 0.35s ease;
}

/* 3. 磁懸浮 */
.me-panel:not(.me-panel--danger):hover,
.profile-hero:hover {
  transform: translateY(-8px) scale(1.01);
  z-index: 2;
}

:global(html.dark) .me-panel:not(.me-panel--danger):hover {
  border-color: rgba(99, 102, 241, 0.5) !important;
  box-shadow:
    0 32px 60px -15px rgba(0, 0, 0, 1),
    0 0 40px rgba(99, 102, 241, 0.25),
    0 1px 1px rgba(255, 255, 255, 0.3) inset !important;
}

:global(html:not(.dark)) .me-panel:not(.me-panel--danger):hover,
:global(html:not(.dark)) .profile-hero:hover {
  box-shadow:
    0 20px 36px -12px rgba(37, 99, 235, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.55) inset !important;
}

:global(html.dark) .profile-hero:hover {
  border-color: rgba(99, 102, 241, 0.48) !important;
  box-shadow:
    0 32px 60px -15px rgba(0, 0, 0, 1),
    0 0 40px rgba(99, 102, 241, 0.22),
    0 1px 1px rgba(255, 255, 255, 0.28) inset !important;
}

/* 4. 全息文字 */
.me-intro__title,
.profile-hero__name {
  background: linear-gradient(135deg, #1e3a8a 0%, #6d4bd4 50%, #0ea5e9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 900;
  filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.1));
}

:global(html.dark) .me-intro__title,
:global(html.dark) .profile-hero__name {
  background: linear-gradient(135deg, #93c5fd 0%, #c4b5fd 50%, #6ee7b7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 12px rgba(168, 85, 247, 0.4));
}

/* 5. 進場：Hero / 勳章 / 標題 + Bento 瀑布流（buddy-rise-in） */
@keyframes me-enter-pop {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes me-enter-rise {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes buddy-rise-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-hero,
.me-medals,
.me-modules__heading {
  opacity: 0;
}

.me--ready .profile-hero {
  animation: me-enter-pop 0.55s cubic-bezier(0.2, 0.85, 0.2, 1) both;
}

.me--ready .me-medals {
  animation: me-enter-rise 0.48s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
}

.me--ready .me-modules__heading {
  animation: me-enter-rise 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) 0.18s both;
}

.me--ready .me-modules__grid > .me-panel:not(.me-panel--danger) {
  animation: buddy-rise-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.me--ready .me-modules__grid > .me-panel:not(.me-panel--danger):nth-child(1) {
  animation-delay: 0.1s;
}
.me--ready .me-modules__grid > .me-panel:not(.me-panel--danger):nth-child(2) {
  animation-delay: 0.2s;
}
.me--ready .me-modules__grid > .me-panel:not(.me-panel--danger):nth-child(3) {
  animation-delay: 0.3s;
}
.me--ready .me-modules__grid > .me-panel:not(.me-panel--danger):nth-child(4) {
  animation-delay: 0.4s;
}

/* ==========================================================
   2. 頁頭標題區 (全息漸變文字)
   ========================================================== */
.me-intro {
  margin-bottom: 24px;
  padding-left: 4px;
}

.me-intro__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--buddy-primary);
}

.me-intro__title {
  margin: 0 0 8px;
  font-size: clamp(28px, 5vw, 36px);
  letter-spacing: 0.02em;
}

.me-intro__sub {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--buddy-text-muted);
  max-width: 600px;
}

/* ==========================================================
   3. 個人資料大卡片 (Profile Hero - Neon Bento)
   ========================================================== */
.profile-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 36px;
  padding: 32px;
}

.profile-hero__mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
  z-index: 0;
}

.profile-hero__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;
  mix-blend-mode: soft-light;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgb(255 255 255 / 0.05) 0px,
      transparent 1px,
      transparent 32px,
      rgb(255 255 255 / 0.03) 33px
    ),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.04) 0px,
      transparent 1px,
      transparent 32px,
      rgb(255 255 255 / 0.03) 33px
    );
  z-index: 0;
}

.profile-hero__stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  z-index: 2;
  pointer-events: none;
}

.profile-hero__body {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

@media (max-width: 640px) {
  .profile-hero__body {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-hero__main {
    width: 100%;
  }

  .me-agent-sync__top {
    justify-content: center;
    text-align: center;
  }

  .me-agent-sync__mid {
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
  background: linear-gradient(135deg, #38bdf8, #8b5cf6, #ec4899);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
  animation: me-ring-spin 6s linear infinite;
}

@keyframes me-ring-spin {
  100% {
    filter: hue-rotate(360deg);
  }
}

.profile-hero__avatar {
  border: 3px solid #fff !important;
  font-weight: 900;
  font-size: 32px !important;
}

:global(html.dark) .profile-hero__avatar {
  border-color: #0f172a !important;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.profile-hero__badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
  white-space: nowrap;
}

.profile-hero__main {
  min-width: 0;
  flex: 1;
}

.profile-hero__name {
  margin: 0 0 6px;
  font-size: clamp(24px, 5vw, 32px);
  letter-spacing: 0.02em;
}

.profile-hero__email {
  margin: 0 0 12px;
  color: var(--buddy-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.profile-hero__bio {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--buddy-text-secondary);
}

:global(html.dark) .profile-hero__bio {
  color: #cbd5e1;
}

/* 同频等级 · 巅峰系数进度条 */
.profile-hero__rank {
  margin: 0 0 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.06);
  border: 1px solid rgba(37, 99, 235, 0.14);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}

:global(html.dark) .profile-hero__rank {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(96, 165, 250, 0.22);
  box-shadow: 0 0 24px rgba(59, 130, 246, 0.08);
}

.profile-hero__rankHead {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 800;
}

.profile-hero__rankLab {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}

.profile-hero__rankTier {
  flex: 1;
  min-width: 0;
  color: var(--buddy-primary);
}

:global(html.dark) .profile-hero__rankTier {
  color: #93c5fd;
  text-shadow: 0 0 12px rgba(96, 165, 250, 0.35);
}

.profile-hero__rankPct {
  font-variant-numeric: tabular-nums;
  color: var(--buddy-text-secondary);
}

:global(html.dark) .profile-hero__rankPct {
  color: #e2e8f0;
}

.profile-hero__rankBar {
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.25);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
}

:global(html.dark) .profile-hero__rankBar {
  background: rgba(15, 23, 42, 0.85);
  box-shadow:
    inset 0 1px 4px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.profile-hero__rankFill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #6366f1, #c084fc);
  box-shadow: 0 0 16px rgba(96, 165, 250, 0.45);
  transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.profile-hero__rankHint {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
}

/* 成就勋章横向滑动 */
.me-medals {
  position: relative;
  z-index: 1;
  margin-top: 8px;
  padding-top: 4px;
}

.me-medals__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 0 2px;
}

.me-medals__title {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--buddy-text-secondary);
}

:global(html.dark) .me-medals__title {
  color: #e2e8f0;
}

.me-medals__hint {
  font-size: 11px;
  color: var(--buddy-text-muted);
}

.me-medals__track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.me-medals__track::-webkit-scrollbar {
  height: 6px;
}
.me-medals__track::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.35);
}

.me-medal {
  flex: 0 0 auto;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  max-width: 260px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

:global(html.dark) .me-medal {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
}

.me-medal--dim {
  opacity: 0.55;
  filter: grayscale(0.25);
}

.me-medal__iconWrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(124, 58, 237, 0.12));
  color: var(--buddy-primary);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.15);
}

:global(html.dark) .me-medal__iconWrap {
  color: #93c5fd;
  box-shadow: 0 0 18px rgba(59, 130, 246, 0.2);
}

.me-medal__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.me-medal__title {
  font-size: 13px;
  font-weight: 800;
  color: var(--buddy-text);
}

:global(html.dark) .me-medal__title {
  color: #f8fafc;
}

.me-medal__sub {
  font-size: 11px;
  line-height: 1.35;
  color: var(--buddy-text-muted);
}

.me-agent-sync {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  margin: 0 0 16px;
  padding: 12px 18px;
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  background: rgba(37, 99, 235, 0.05);
  border: 1px solid rgba(37, 99, 235, 0.15);
  transition: all 0.3s ease;
}

.me-agent-sync--live {
  position: relative;
  overflow: hidden;
}

.me-agent-sync--live::before {
  content: '';
  position: absolute;
  inset: -40% -20%;
  background: radial-gradient(
    circle at 30% 40%,
    rgba(96, 165, 250, 0.12),
    transparent 55%
  );
  pointer-events: none;
  opacity: 0.85;
}

.me-agent-sync__top,
.me-agent-sync__mid,
.me-agent-sync__bond {
  position: relative;
  z-index: 1;
}

.me-agent-sync__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.me-agent-sync__mood {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 999px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.2);
  animation: me-mood-pulse 2.8s ease-in-out infinite;
}

:global(html.dark) .me-agent-sync__mood {
  color: #a5b4fc;
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(129, 140, 248, 0.35);
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.25);
}

@keyframes me-mood-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
  50% {
    box-shadow: 0 0 14px rgba(99, 102, 241, 0.35);
  }
}

.me-agent-sync__mid {
  display: flex;
  align-items: center;
  gap: 10px;
}

.me-agent-sync__bond {
  display: flex;
  align-items: center;
  gap: 10px;
}

.me-agent-sync__bondLab {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--buddy-text-muted);
  text-transform: uppercase;
}

.me-agent-sync__bondBar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.25);
}

:global(html.dark) .me-agent-sync__bondBar {
  background: rgba(15, 23, 42, 0.9);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
}

.me-agent-sync__bondFill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #34d399, #38bdf8, #a78bfa);
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.35);
  transition: width 0.5s ease;
}

.me-agent-sync__bondPct {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--buddy-text-secondary);
}

:global(html.dark) .me-agent-sync__bondPct {
  color: #cbd5e1;
}

:global(html.dark) .me-agent-sync {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.05);
}

.me-agent-sync:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.4);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.15);
}

:global(html.dark) .me-agent-sync:hover {
  border-color: rgba(96, 165, 250, 0.6);
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
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
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-left: 3px solid var(--buddy-primary);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(html.dark) .profile-hero__decl {
  background: rgba(15, 23, 42, 0.55);
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

.game-pill,
.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: var(--buddy-surface-2, #f8fafc);
  color: var(--buddy-text-secondary);
  transition: all 0.2s ease;
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

.game-pill:hover,
.tag-chip:hover {
  border-color: rgba(37, 99, 235, 0.4);
  color: var(--buddy-primary);
  transform: translateY(-2px);
}

:global(html.dark) .game-pill,
:global(html.dark) .tag-chip {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.profile-hero__cardTags {
  margin-top: 4px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(248, 250, 252, 0.7) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

:global(html.dark) .profile-hero__cardTags {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(12px);
  border-color: rgba(255, 255, 255, 0.1);
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

:global(html.dark) .tag-chip--0,
:global(html.dark) .tag-chip--1,
:global(html.dark) .tag-chip--2,
:global(html.dark) .tag-chip--3 {
  color: inherit !important;
}

/* ==========================================================
   4. 小組件網格 (Bento Panels)
   ========================================================== */
.me-modules__heading {
  margin: 0 0 20px 4px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: var(--buddy-text);
}

:global(html.dark) .me-modules__heading {
  color: #f8fafc;
}

.me-modules__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
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
  position: relative;
}

.me-panel__title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 20px 24px 16px;
  font-size: 15px;
  font-weight: 900;
  color: var(--buddy-text-secondary);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

:global(html.dark) .me-panel__title {
  color: #f8fafc;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.me-panel__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.me-panel__dot--a {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}
.me-panel__dot--b {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  box-shadow: 0 0 12px rgba(167, 139, 250, 0.6);
}
.me-panel__dot--c {
  background: linear-gradient(135deg, #0891b2, #22d3ee);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.6);
}
.me-panel__dot--d {
  background: linear-gradient(135deg, #ea580c, #fb923c);
  box-shadow: 0 0 12px rgba(251, 146, 60, 0.6);
}

/* ==========================================================
   5. 列表項與連結交互 (List Links)
   ========================================================== */
.me-quick {
  padding: 12px;
}
.me-list {
  list-style: none;
  margin: 0;
  padding: 12px;
}
.me-list li + li {
  border-top: 1px dashed rgba(148, 163, 184, 0.15);
}
:global(html.dark) .me-list li + li {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.me-quick__item,
.me-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;
  text-decoration: none;
  color: var(--buddy-text);
  transition: all 0.3s ease;
}

.me-quick__item:hover,
.me-link:hover {
  background: rgba(37, 99, 235, 0.08);
  transform: translateX(4px);
}
:global(html.dark) .me-quick__item:hover,
:global(html.dark) .me-link:hover {
  background: rgba(255, 255, 255, 0.08);
}

.me-quick__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.me-quick__hint {
  display: block;
  font-size: 12px;
  color: var(--buddy-text-muted);
  margin-top: 2px;
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
  opacity: 0.95;
  transition: transform 0.3s ease;
}

:global(html.dark) .me-quick__icon {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
}

.me-link__ico {
  font-size: 18px;
  color: var(--buddy-primary);
  opacity: 0.9;
  transition: transform 0.3s ease;
}

:global(html.dark) .me-link__ico {
  color: #93c5fd;
}

.me-quick__item:hover .me-quick__icon,
.me-link:hover .me-link__ico {
  transform: scale(1.15) rotate(5deg);
  color: #2563eb;
}
:global(html.dark) .me-quick__item:hover .me-quick__icon,
:global(html.dark) .me-link:hover .me-link__ico {
  color: #60a5fa;
}

.me-quick__label,
.me-link__label {
  font-size: 15px;
  font-weight: 700;
  color: var(--buddy-text);
}
:global(html.dark) .me-quick__label,
:global(html.dark) .me-link__label {
  color: #f8fafc;
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

/* ==========================================================
   6. 退出登入按鈕 (危險動作)
   ========================================================== */
.me-panel--danger {
  grid-column: 1 / -1;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.me-panel--danger:hover {
  transform: none !important;
}

.me-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 18px;
  border-radius: 20px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
}

:global(html.dark) .me-logout {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.me-logout:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 12px 24px -6px rgba(239, 68, 68, 0.4);
}
:global(html.dark) .me-logout:hover {
  box-shadow: 0 0 24px rgba(239, 68, 68, 0.4);
}

.me-logout__icon-wrap {
  display: flex;
  align-items: center;
}

:global(html.dark) .me-logout .el-icon {
  color: inherit !important;
}

@media (prefers-reduced-motion: reduce) {
  :global(html.dark) .me::before {
    animation: none !important;
  }
  .profile-hero__avatarRing {
    animation: none !important;
  }
  .me-agent-sync__mood {
    animation: none !important;
  }
  .profile-hero,
  .me-medals,
  .me-modules__heading,
  .me--ready .me-modules__grid > .me-panel:not(.me-panel--danger) {
    animation: none !important;
    opacity: 1 !important;
  }
  .me-panel:not(.me-panel--danger):hover,
  .profile-hero:hover {
    transform: none !important;
  }
  .me-quick__item:hover,
  .me-link:hover {
    transform: none !important;
  }
  .me-quick__item:hover .me-quick__icon,
  .me-link:hover .me-link__ico {
    transform: none !important;
  }
  .me-logout:hover {
    transform: none !important;
  }
  .profile-hero__rankFill {
    animation: none !important;
  }
  .profile-hero:hover::after {
    animation: none !important;
    opacity: 0 !important;
  }
  .me-medal:hover {
    transform: none !important;
  }
  .game-pill:hover,
  .tag-chip:hover {
    transform: none !important;
    box-shadow: none !important;
    filter: none !important;
  }
}

/* MeView.vue 动效与色彩终极强化包 */

/* ==========================================================
   1. 强化段位进度条 (无限流动光效)
   ========================================================== */
.profile-hero__rankFill {
  /* 使用 5 段渐变色并拉长背景，配合动画形成流动感 */
  background: linear-gradient(90deg, #34d399, #38bdf8, #818cf8, #c084fc, #34d399) !important;
  background-size: 200% 100% !important;
  box-shadow: 0 0 16px rgba(96, 165, 250, 0.6) !important;
  animation: rank-flow 3s linear infinite !important;
}

@keyframes rank-flow {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* ==========================================================
   2. 勋章墙动效 (悬浮放大与霓虹点亮)
   ========================================================== */
.me-medal {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  cursor: pointer;
}

.me-medal:hover {
  transform: translateY(-6px) scale(1.05) !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(59, 130, 246, 0.4) !important;
  box-shadow: 0 16px 32px -8px rgba(37, 99, 235, 0.2) !important;
}

/* 暗色模式下，勋章悬停爆发紫蓝光芒 */
:global(html.dark) .me-medal:hover {
  background: rgba(30, 41, 59, 0.8) !important;
  border-color: rgba(96, 165, 250, 0.6) !important;
  box-shadow:
    0 16px 32px -8px rgba(0, 0, 0, 0.9),
    0 0 24px rgba(59, 130, 246, 0.3) !important;
}

:global(html.dark) .me-medal:hover .me-medal__iconWrap {
  color: #fff !important;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.6) !important;
}

/* ==========================================================
   3. 标签与常玩游戏 (全息微交互)
   ========================================================== */
.game-pill,
.tag-chip {
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

.game-pill:hover,
.tag-chip:hover {
  transform: translateY(-3px) scale(1.05) !important;
  /* 借用当前文本颜色作为发光色，极其自然 */
  box-shadow: 0 6px 16px currentColor !important;
  filter: brightness(1.2) !important;
}

/* ==========================================================
   4. Hero 个人名片全息流光边框
   ========================================================== */
.profile-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px; /* 边框粗细 */
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.8), rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.profile-hero:hover::after {
  opacity: 1;
  animation: hero-glow-pulse 2.5s ease-in-out infinite alternate !important;
}

@keyframes hero-glow-pulse {
  0% {
    opacity: 0.4;
    filter: hue-rotate(0deg);
  }
  100% {
    opacity: 1;
    filter: hue-rotate(60deg);
  }
}
</style>
