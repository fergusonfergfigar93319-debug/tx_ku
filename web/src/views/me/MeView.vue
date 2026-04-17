<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Edit, Guide, House, Monitor, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const user = useUserStore()

const activeTab = ref<'posts' | 'cards'>('posts')

/** 關係與獲贊：後端擴展 Profile 後可改為真實欄位 */
const statFollowing = computed(() => 0)
const statFollowers = computed(() => 0)
const statLikes = computed(() => 0)

const avatarSrc = computed(
  () => user.profile?.avatarUrl || '/forum/avatars/a01.svg'
)

function goToEdit() {
  void router.push({ name: 'profile-edit' })
}
</script>

<template>
  <div class="gl-page-wrapper">
    <div class="gl-ambient-orb orb-1"></div>
    <div class="gl-ambient-orb orb-2"></div>

    <div class="gl-container">
      <header class="gl-hero">
        <div class="gl-hero-foil"></div>
        <div class="gl-hero-glass">
          <div class="gl-avatar-zone">
            <div class="gl-avatar-ring"></div>
            <img class="gl-avatar" :src="avatarSrc" alt="头像" />
          </div>

          <div class="gl-info-zone">
            <div class="gl-name-row">
              <h1 id="me-page-title" class="gl-name">{{ user.profile?.nickname || '峡谷超神者' }}</h1>
              <span class="gl-badge bg-gradient-amber">Lv.3</span>
              <span class="gl-badge bg-glass-purple">BETA 创世者</span>
            </div>
            <p class="gl-uid">ID: {{ user.account?.email || 'dev@local.test' }}</p>

            <div class="gl-stats-bar">
              <div class="gl-stat">
                <span class="gl-stat-val text-gradient-blue">{{ statFollowing }}</span>
                <span class="gl-stat-label">关注</span>
              </div>
              <div class="gl-divider"></div>
              <div class="gl-stat">
                <span class="gl-stat-val text-gradient-purple">{{ statFollowers }}</span>
                <span class="gl-stat-label">粉丝</span>
              </div>
              <div class="gl-divider"></div>
              <div class="gl-stat">
                <span class="gl-stat-val text-gradient-cyan">{{ statLikes }}</span>
                <span class="gl-stat-label">获赞</span>
              </div>
            </div>
          </div>

          <div class="gl-action-zone">
            <button type="button" class="gl-btn-edit" @click="goToEdit">
              <el-icon><Edit /></el-icon> 编辑档案
            </button>
          </div>
        </div>
      </header>

      <section class="gl-dashboard">
        <div class="gl-card gl-assets-card">
          <div class="gl-card-header">
            <h3 class="gl-card-title">电竞生涯资产</h3>
            <span class="gl-live-tag">LIVE 更新</span>
          </div>

          <div class="gl-rank-row">
            <div class="gl-rank-icon">👑</div>
            <div class="gl-rank-info">
              <div class="gl-rank-name text-gradient-gold">最强王者</div>
              <div class="gl-rank-sub">25 星 · 巅峰 1850</div>
            </div>
          </div>

          <div class="gl-data-grid">
            <div class="gl-data-item">
              <span class="gl-data-num">68.5%</span>
              <span class="gl-data-desc">综合胜率</span>
            </div>
            <div class="gl-data-item">
              <span class="gl-data-num">82.4</span>
              <span class="gl-data-desc">场均评分</span>
            </div>
            <div class="gl-data-item">
              <div class="gl-tags">
                <span class="gl-mini-tag">打野</span>
                <span class="gl-mini-tag">刺客</span>
              </div>
              <span class="gl-data-desc">本命分路</span>
            </div>
          </div>
        </div>

        <div class="gl-card gl-modules-card">
          <h3 class="gl-card-title">战术终端</h3>
          <div class="gl-bento-grid">
            <div class="gl-bento-item" @click="router.push('/app/home')">
              <div class="gl-b-icon bg-gradient-blue"><el-icon><House /></el-icon></div>
              <span class="gl-b-text">指挥中心</span>
            </div>
            <div class="gl-bento-item" @click="router.push('/app/feed')">
              <div class="gl-b-icon bg-gradient-purple"><el-icon><Guide /></el-icon></div>
              <span class="gl-b-text">情报速递</span>
            </div>
            <div class="gl-bento-item" @click="goToEdit">
              <div class="gl-b-icon bg-gradient-cyan"><el-icon><User /></el-icon></div>
              <span class="gl-b-text">身份密钥</span>
            </div>
            <div class="gl-bento-item" @click="router.push('/app/forum')">
              <div class="gl-b-icon bg-gradient-orange"><el-icon><Monitor /></el-icon></div>
              <span class="gl-b-text">元流矩阵</span>
            </div>
          </div>
        </div>
      </section>

      <section class="gl-feed-section">
        <nav class="gl-tabs" aria-label="档案分区">
          <button
            type="button"
            class="gl-tab"
            :class="{ 'is-active': activeTab === 'posts' }"
            @click="activeTab = 'posts'"
          >
            输出日志 (我的帖子)
          </button>
          <button
            type="button"
            class="gl-tab"
            :class="{ 'is-active': activeTab === 'cards' }"
            @click="activeTab = 'cards'"
          >
            共识协议 (我的卡片)
          </button>
        </nav>

        <div class="gl-feed-content">
          <div class="gl-empty-state">
            <div class="gl-empty-icon">✨</div>
            <p class="gl-empty-text">系统日志暂无数据。前往矩阵中心发布你的第一份协议吧。</p>
            <button type="button" class="gl-btn-primary" @click="router.push('/app/forum')">
              建立连接
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================
   GLOSSY LIGHT (极昼幻彩玻璃态) - 高端亮色电竞风
   ========================================================== */

/* --- 页面级环境与背景 --- */
.gl-page-wrapper {
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 72px;
  background: #f4f7f9; /* 极其干净的极地灰白 */
  overflow-x: hidden;
  font-family: 'Inter', system-ui, sans-serif;
}

/* 环境弥散光球：营造呼吸感，拒绝死白 */
.gl-ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}
.orb-1 {
  top: -10%;
  left: -5%;
  width: 50vw;
  height: 50vw;
  background: rgba(124, 58, 237, 0.15);
  animation: float 10s ease-in-out infinite;
}
.orb-2 {
  bottom: 20%;
  right: -10%;
  width: 40vw;
  height: 40vw;
  background: rgba(56, 189, 248, 0.15);
  animation: float 12s ease-in-out infinite reverse;
}
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(5%, 5%);
  }
}

.gl-container {
  position: relative;
  z-index: 10;
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* --- 1. 全息幻彩横幅 (Hero Banner) --- */
.gl-hero {
  position: relative;
  border-radius: 32px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.4));
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

/* 镭射全息箔片质感 */
.gl-hero-foil {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
  opacity: 0.15;
  z-index: 0;
}

.gl-hero-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(40px) saturate(200%);
  border-radius: 30px;
  padding: 40px 48px;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 40px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

/* 头像组 */
.gl-avatar-zone {
  position: relative;
  width: 112px;
  height: 112px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.gl-avatar-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  /* 炫彩旋转边框 */
  background: conic-gradient(from 0deg, #38bdf8, #818cf8, #c084fc, #38bdf8);
  animation: gl-spin 4s linear infinite;
  filter: blur(3px);
  opacity: 0.8;
}
.gl-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  z-index: 2;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
@keyframes gl-spin {
  100% {
    transform: rotate(360deg);
  }
}

/* 信息区 (深色字体保证可读性) */
.gl-info-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.gl-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.gl-name {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: 0.5px;
}

/* 渐变与磨砂徽章 */
.gl-badge {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.5px;
}
.bg-gradient-amber {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #fff;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}
.bg-glass-purple {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.2);
  backdrop-filter: blur(8px);
}
.gl-uid {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  font-family: monospace;
}

/* 渐变数据条 */
.gl-stats-bar {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.6);
  padding: 12px 24px;
  border-radius: 16px;
  border: 1px solid #fff;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}
.gl-stat {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.gl-stat-val {
  font-size: 24px;
  font-weight: 900;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
.gl-stat-label {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}
.text-gradient-blue {
  background-image: linear-gradient(135deg, #2563eb, #38bdf8);
}
.text-gradient-purple {
  background-image: linear-gradient(135deg, #7c3aed, #c084fc);
}
.text-gradient-cyan {
  background-image: linear-gradient(135deg, #0d9488, #2dd4bf);
}
.gl-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  transform: rotate(15deg);
}

/* 编辑按钮 */
.gl-btn-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 12px 28px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}
.gl-btn-edit:hover {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3);
}

/* --- 2. 核心控制台 (Bento Dashboard) --- */
.gl-dashboard {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}
@media (max-width: 860px) {
  .gl-dashboard {
    grid-template-columns: 1fr;
  }
}

/* 通用白金卡片基座 */
.gl-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid #ffffff;
  border-radius: 24px;
  padding: 32px;
  box-shadow:
    0 16px 40px rgba(15, 23, 42, 0.04),
    0 1px 1px inset rgba(255, 255, 255, 1);
  transition: all 0.3s ease;
}
.gl-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.06);
}

.gl-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.gl-card-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: 0.5px;
}
.gl-modules-card .gl-card-title {
  margin-bottom: 24px;
}
.gl-live-tag {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 900;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* 资产数据 */
.gl-rank-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}
.gl-rank-icon {
  font-size: 56px;
  filter: drop-shadow(0 8px 16px rgba(245, 158, 11, 0.3));
}
.text-gradient-gold {
  font-size: 28px;
  font-weight: 900;
  background: linear-gradient(135deg, #d97706, #fbbf24);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 4px;
}
.gl-rank-sub {
  font-size: 14px;
  color: #64748b;
  font-weight: 700;
}

.gl-data-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  background: rgba(248, 250, 252, 0.8);
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}
.gl-data-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gl-data-num {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
}
.gl-data-desc {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 700;
}
.gl-tags {
  display: flex;
  gap: 6px;
}
.gl-mini-tag {
  background: #fff;
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
}

/* 快捷模块宫格 */
.gl-bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.gl-bento-item {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}
.gl-bento-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.gl-b-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
.bg-gradient-blue {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}
.bg-gradient-purple {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}
.bg-gradient-cyan {
  background: linear-gradient(135deg, #0ea5e9, #2dd4bf);
}
.bg-gradient-orange {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.gl-b-text {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
}

/* --- 3. 数据流展示区 --- */
.gl-feed-section {
  margin-top: 16px;
}
.gl-tabs {
  display: flex;
  gap: 32px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
  margin-bottom: 32px;
}
.gl-tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  font-weight: 800;
  padding: 0 0 8px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}
.gl-tab:hover {
  color: #475569;
}
.gl-tab.is-active {
  color: #0f172a;
}
.gl-tab.is-active::after {
  content: '';
  position: absolute;
  bottom: -18px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px 4px 0 0;
}

/* 空状态 */
.gl-empty-state {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: 1px dashed rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.gl-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
}
.gl-empty-text {
  font-size: 15px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 24px;
  max-width: 400px;
  line-height: 1.6;
}
.gl-btn-primary {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
.gl-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
}

@media (max-width: 720px) {
  .gl-hero-glass {
    flex-direction: column;
    align-items: flex-start;
    padding: 28px 24px;
  }

  .gl-action-zone {
    width: 100%;
  }

  .gl-btn-edit {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb-1,
  .orb-2 {
    animation: none;
  }

  .gl-avatar-ring {
    animation: none;
  }

  .gl-card:hover,
  .gl-bento-item:hover,
  .gl-btn-edit:hover,
  .gl-btn-primary:hover {
    transform: none !important;
  }
}
</style>
