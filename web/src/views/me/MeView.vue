<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Avatar,
  ArrowRight,
  Connection,
  Document,
  Edit,
  Medal,
} from '@element-plus/icons-vue'
import * as postsApi from '@/api/posts'

const router = useRouter()
const user = useUserStore()

const myPostsTotal = ref(0)

const statFollowing = computed(() => 0)
const statFollowers = computed(() => 0)

const displayNickname = computed(() => user.profile?.nickname || '未命名玩家')

const avatarSrc = computed(() => user.profile?.avatarUrl || undefined)

const hasGameIdentity = computed(() => {
  const p = user.profile
  if (!p) return false
  return Boolean((p.rank && p.rank.trim()) || (p.mainRoles?.length ?? 0) > 0)
})

const hasInterestRadar = computed(() => {
  const p = user.profile
  if (!p) return false
  return Boolean((p.preferredGames?.length ?? 0) > 0 || (p.gameIds?.length ?? 0) > 0)
})

const buddyPreview = computed(() => {
  const c = user.buddyCard
  if (!c) return ''
  const head = c.declaration?.trim() || c.tags?.slice(0, 2).join(' · ') || ''
  return head
})

onMounted(async () => {
  if (!user.profile) {
    await user.fetchProfile()
  }
  try {
    const r = await postsApi.getMyPosts({ page: 1 })
    myPostsTotal.value = r.total ?? r.list.length
  } catch {
    myPostsTotal.value = 0
  }
})

const goProfileEdit = () => void router.push({ name: 'profile-edit' })
const goGameInterest = () => void router.push({ name: 'game-interest' })
const goMyPosts = () => void router.push({ name: 'my-posts' })
const goFollowing = () => void router.push({ name: 'following' })
const goForum = () => void router.push({ name: 'forum' })

function handleMouseMove(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((y - centerY) / centerY) * -3
  const rotateY = ((x - centerX) / centerX) * 3

  card.style.setProperty('--rx', `${rotateX}deg`)
  card.style.setProperty('--ry', `${rotateY}deg`)
  card.style.setProperty('--px', `${x}px`)
  card.style.setProperty('--py', `${y}px`)
}

function handleMouseLeave(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return
  card.style.setProperty('--rx', `0deg`)
  card.style.setProperty('--ry', `0deg`)
  card.style.setProperty('--px', `-1000px`)
}
</script>

<template>
  <div class="profile-daylight-layout app-page-stack">
    <div class="ambient-glow" aria-hidden="true"></div>

    <div class="profile-container">
      <header class="profile-header">
        <h1 class="page-title">元流档案</h1>
        <p class="page-desc">检视你的高阶数字身份、游戏名片与元流关系网</p>
      </header>

      <section
        class="hero-id-card glass-panel"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <div class="hero-aurora" aria-hidden="true"></div>
        <div class="id-card-content">
          <div class="avatar-section">
            <div class="avatar-ring">
              <el-avatar :size="88" :src="avatarSrc" class="user-avatar">
                <el-icon :size="40"><Avatar /></el-icon>
              </el-avatar>
            </div>
            <div class="user-info">
              <h2 class="user-name">{{ displayNickname }}</h2>
              <div class="user-badges">
                <span class="badge level-badge">LV.1 见习</span>
                <span class="badge team-badge">暂无战队</span>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <button type="button" class="stat-box" @click="goFollowing">
              <span class="stat-num">{{ statFollowing }}</span>
              <span class="stat-label">关注</span>
            </button>
            <div class="stat-divider" aria-hidden="true"></div>
            <button type="button" class="stat-box" @click="goFollowing">
              <span class="stat-num">{{ statFollowers }}</span>
              <span class="stat-label">粉丝</span>
            </button>
            <button type="button" class="btn-edit-profile" @click.stop="goProfileEdit">
              <el-icon><Edit /></el-icon>
              编辑基础档案
            </button>
          </div>
        </div>
      </section>

      <div class="bento-grid">
        <div
          class="bento-card bento-game-card glass-panel"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
        >
          <div class="bento-header">
            <div class="bento-title"><el-icon><Medal /></el-icon> 游戏名片</div>
            <button type="button" class="bento-action" @click.stop="goProfileEdit">
              配置 <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <div class="bento-body">
            <div v-if="hasGameIdentity" class="game-identity">
              <p v-if="user.profile?.rank" class="identity-rank">{{ user.profile.rank }}</p>
              <div v-if="user.profile?.mainRoles?.length" class="role-chips">
                <span v-for="role in user.profile.mainRoles" :key="role" class="role-chip">{{ role }}</span>
              </div>
            </div>
            <div v-else class="empty-hint">
              <span class="hint-icon">🎮</span>
              <p>尚未绑定游戏大区</p>
              <button type="button" class="btn-ghost" @click.stop="goProfileEdit">立即绑定同步战绩</button>
            </div>
          </div>
        </div>

        <div
          class="bento-card bento-interest-card glass-panel is-clickable"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
          @click="goGameInterest"
        >
          <div class="bento-header">
            <div class="bento-title"><el-icon><Document /></el-icon> 电竞偏好</div>
          </div>
          <div class="bento-body">
            <div v-if="hasInterestRadar" class="interest-preview">
              <p v-if="user.profile?.preferredGames?.length" class="interest-line">
                {{ user.profile.preferredGames.slice(0, 4).join(' · ') }}
              </p>
              <p v-else-if="user.profile?.gameIds?.length" class="interest-line">
                已选 {{ user.profile.gameIds.length }} 款关注游戏
              </p>
              <span class="text-link">调整偏好 ➝</span>
            </div>
            <div v-else class="empty-hint">
              <span class="hint-icon">🎯</span>
              <p>未设置偏好雷达</p>
              <span class="text-link">去设置 ➝</span>
            </div>
          </div>
        </div>

        <div
          class="bento-card bento-buddy-card glass-panel"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
        >
          <div class="bento-header">
            <div class="bento-title"><el-icon><Connection /></el-icon> 搭子关系</div>
          </div>
          <div class="bento-body">
            <p v-if="buddyPreview" class="buddy-snippet">{{ buddyPreview }}</p>
            <div v-else class="buddy-list-empty">
              你目前还没有绑定的游戏搭子，前往 <strong @click.stop="goForum">峡谷广场</strong> 或
              <strong>推荐列表</strong> 结识新朋友吧。
            </div>
          </div>
        </div>

        <div
          class="bento-card bento-post-card glass-panel is-clickable"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
          @click="goMyPosts"
        >
          <div class="bento-header">
            <div class="bento-title"><el-icon><Document /></el-icon> 动态轨迹</div>
          </div>
          <div class="bento-body stats-huge">
            <span class="huge-num">{{ myPostsTotal }}</span>
            <span class="huge-label">条历史发布</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================
   1. 基础布局与明亮背景 (Daylight Base)
   ========================================================== */
.profile-daylight-layout {
  min-height: 100vh;
  background-color: #f8fafc;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  position: relative;
  padding: 40px 5%;
  padding-bottom: 72px;
  box-sizing: border-box;
}

.ambient-glow {
  position: absolute;
  top: 0;
  left: 20%;
  width: 60%;
  height: 400px;
  background: radial-gradient(ellipse at top, rgba(245, 158, 11, 0.15), transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.profile-container {
  max-width: 1080px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.profile-header {
  margin-bottom: 32px;
}
.page-title {
  font-size: 32px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}
.page-desc {
  font-size: 15px;
  color: #64748b;
  margin: 0;
}

/* ==========================================================
   2. 通用玻璃态面板与 3D 交互 (Glassmorphism 2.0)
   ========================================================== */
.glass-panel {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: 24px;
  box-shadow:
    0 12px 32px -8px rgba(15, 23, 42, 0.04),
    inset 0 1px 2px rgba(255, 255, 255, 1);
  overflow: hidden;

  transform-style: preserve-3d;
  transform: perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0);
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease;
}

.glass-panel.is-clickable {
  cursor: pointer;
}

.glass-panel::after {
  content: '';
  position: absolute;
  top: var(--py, -1000px);
  left: var(--px, -1000px);
  width: 500px;
  height: 500px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 60%);
  mix-blend-mode: overlay;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 10;
}

.glass-panel:hover {
  z-index: 10;
  background: #ffffff;
  box-shadow:
    0 24px 48px -12px rgba(15, 23, 42, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 1),
    0 0 0 1px rgba(245, 158, 11, 0.1) inset;
}

.glass-panel:hover::after {
  opacity: 1;
}

.hero-id-card.glass-panel {
  cursor: default;
}

.id-card-content,
.bento-header,
.bento-body {
  position: relative;
  z-index: 2;
  transform: translateZ(10px);
}

/* ==========================================================
   3. 全息 ID 主卡片 (Hero Card)
   ========================================================== */
.hero-id-card {
  padding: 40px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 247, 237, 0.8) 100%);
}

.hero-aurora {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 60%);
  border-radius: 50%;
  filter: blur(40px);
  z-index: 0;
}

.id-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 32px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-ring {
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
}

.user-avatar {
  border: 4px solid #fff;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 12px;
}
.user-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.badge {
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 100px;
  letter-spacing: 0.5px;
}
.level-badge {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.team-badge {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.stats-section {
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(255, 255, 255, 0.6);
  padding: 16px 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 1);
  flex-wrap: wrap;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
}
.stat-box:hover {
  transform: scale(1.05);
}
.stat-num {
  font-size: 24px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
.stat-divider {
  width: 1px;
  height: 32px;
  background: #e2e8f0;
}

.btn-edit-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  color: #334155;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 16px;
}
.btn-edit-profile:hover {
  background: #ea580c;
  color: #fff;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
}

/* ==========================================================
   4. Bento Grid (网格模块区)
   ========================================================== */
.bento-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(180px, auto);
}

@media (min-width: 900px) {
  .bento-game-card {
    grid-column: span 2;
  }
  .bento-interest-card {
    grid-column: span 1;
  }
  .bento-buddy-card {
    grid-column: span 2;
  }
  .bento-post-card {
    grid-column: span 1;
  }
}

@media (max-width: 899px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-game-card,
  .bento-interest-card,
  .bento-buddy-card,
  .bento-post-card {
    grid-column: span 1;
  }
}

.bento-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.bento-game-card.glass-panel,
.bento-buddy-card.glass-panel {
  cursor: default;
}

.bento-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.bento-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}
.bento-title .el-icon {
  color: #f59e0b;
  font-size: 18px;
}

.bento-action {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
  font: inherit;
}
.bento-card:hover .bento-action {
  color: #ea580c;
}

.bento-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.game-identity {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.identity-rank {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
}
.role-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.role-chip {
  font-size: 12px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 100px;
  background: #fffbeb;
  color: #b45309;
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.interest-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.interest-line {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  line-height: 1.5;
}

.buddy-snippet {
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}
.hint-icon {
  font-size: 32px;
  opacity: 0.8;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}
.empty-hint p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.btn-ghost {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fcd34d;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  font: inherit;
}
.btn-ghost:hover {
  background: #f59e0b;
  color: #fff;
}

.text-link {
  font-size: 13px;
  font-weight: 800;
  color: #38bdf8;
  transition: color 0.2s;
}
.bento-card:hover .text-link {
  color: #0284c7;
}

.buddy-list-empty {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  text-align: center;
}
.buddy-list-empty strong {
  color: #ea580c;
  cursor: pointer;
}

.stats-huge {
  align-items: flex-start;
  justify-content: flex-end;
  padding-bottom: 12px;
}
.huge-num {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
  color: #0f172a;
  margin-bottom: 4px;
}
.huge-label {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
}

@media (max-width: 720px) {
  .id-card-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-section {
    width: 100%;
  }

  .btn-edit-profile {
    width: 100%;
    margin-left: 0;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .glass-panel {
    transform: perspective(1200px) rotateX(0) rotateY(0) translateZ(0);
  }

  .glass-panel:hover {
    transform: none;
  }

  .stat-box:hover {
    transform: none;
  }
}
</style>
