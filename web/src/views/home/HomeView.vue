<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound, DataLine, Guide, Monitor } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import HomeCardSwiper from '@/components/home/HomeCardSwiper.vue'
import { buildHomeSwiperCards } from '@/data/homeSwiperCards'

const router = useRouter()
const user = useUserStore()

const homeSwiperCards = computed(() => buildHomeSwiperCards(user.agentChatUnlocked))

function goAgent() {
  void router.push('/app/agent')
}

function goForum() {
  void router.push('/app/forum')
}

function goFeed() {
  void router.push('/app/feed')
}

function goMe() {
  void router.push('/app/me')
}

/** 元流矩阵：3D 磁吸倾斜 + 玻璃内流光坐标 */
function handleMouseMove(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateX = ((y - centerY) / centerY) * -8
  const rotateY = ((x - centerX) / centerX) * 8

  card.style.setProperty('--rx', `${rotateX}deg`)
  card.style.setProperty('--ry', `${rotateY}deg`)
  card.style.setProperty('--px', `${x}px`)
  card.style.setProperty('--py', `${y}px`)
}

function handleMouseLeave(e: MouseEvent) {
  const card = e.currentTarget as HTMLElement
  if (!card) return

  card.style.setProperty('--rx', '0deg')
  card.style.setProperty('--ry', '0deg')
  card.style.setProperty('--px', '-1000px')
  card.style.setProperty('--py', '-1000px')
}
</script>

<template>
  <div class="home-view buddy-page app-page-stack nova-page-wrapper" aria-label="首页">
    <!-- 全寬沉浸展區：不受 .nova-container 1440px 限制 -->
    <section class="nova-hero-fullbleed" aria-label="主题精选展区">
      <div class="nova-hero-fullbleed__inner nova-hero-fullbleed__inner--frame">
        <div class="nova-spotlight-shell nova-spotlight-shell--fullscreen">
          <div class="nova-section-head nova-section-head--spotlight">
            <div class="nova-spotlight-head">
              <span class="nova-spotlight-kicker" aria-hidden="true">SPOTLIGHT</span>
              <h2 class="nova-title nova-title--spotlight">主题精选</h2>
            </div>
            <span class="nova-subtitle nova-subtitle--spotlight">SWIPE OR CLICK</span>
          </div>

          <div
            class="nova-carousel-stage"
            :style="{
              '--nova-swiper-dur': '760ms',
              '--nova-swiper-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
            }"
          >
            <HomeCardSwiper compact embed-in-parent :items="homeSwiperCards" :transition-ms="760" />
          </div>
        </div>
      </div>
    </section>

    <div class="nova-container">
      <section class="nova-matrix-section" aria-label="元流矩阵">
        <div class="nova-section-head">
          <h2 class="nova-title">元流矩阵 <span class="nova-tag">MATRIX</span></h2>
          <p class="nova-desc">快速跃迁至核心模块与沙箱功能</p>
        </div>

        <div class="nova-bento-grid">
          <div
            class="nova-bento-card theme-purple"
            role="button"
            tabindex="0"
            @click="goAgent"
            @keydown.enter.prevent="goAgent"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <div class="nova-card-glass">
              <div class="nova-icon-hub"><el-icon><ChatDotRound /></el-icon></div>
              <div class="nova-text-hub">
                <h3>AI 搭子工坊</h3>
                <p>定制专属电竞伙伴，赛后复盘与深度情感链接。</p>
              </div>
              <div class="nova-arrow">→</div>
            </div>
          </div>

          <div
            class="nova-bento-card theme-blue"
            role="button"
            tabindex="0"
            @click="goForum"
            @keydown.enter.prevent="goForum"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <div class="nova-card-glass">
              <div class="nova-icon-hub"><el-icon><Monitor /></el-icon></div>
              <div class="nova-text-hub">
                <h3>峡谷广场</h3>
                <p>潮流共创，组队开黑与社区高光互动。</p>
              </div>
            </div>
          </div>

          <div
            class="nova-bento-card theme-cyan"
            role="button"
            tabindex="0"
            @click="goFeed"
            @keydown.enter.prevent="goFeed"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <div class="nova-card-glass">
              <div class="nova-icon-hub"><el-icon><Guide /></el-icon></div>
              <div class="nova-text-hub">
                <h3>版本速递</h3>
                <p>全网最新电竞资讯与官方动态汇总。</p>
              </div>
            </div>
          </div>

          <div
            class="nova-bento-card theme-orange"
            role="button"
            tabindex="0"
            @click="goMe"
            @keydown.enter.prevent="goMe"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <div class="nova-card-glass">
              <div class="nova-icon-hub"><el-icon><DataLine /></el-icon></div>
              <div class="nova-text-hub">
                <h3>身份档案</h3>
                <p>管理沙箱凭证与个人数字身份数据。</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================
   NOVA AURORA V14 (臻享水晶重构版 - 极致清透，色彩映射)
   ========================================================== */

.home-view {
  box-sizing: border-box;
}

/* --- 1. 强制全屏破壁 (保持完美 V10 结构不动) --- */
.nova-page-wrapper {
  position: relative;
  width: 100vw !important;
  max-width: 100vw !important;
  margin-left: calc(50% - 50vw) !important;
  min-height: 100vh;
  box-sizing: border-box;

  background-color: #f8fafc;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.18) 0%, transparent 50%),
    radial-gradient(circle at 90% 30%, rgba(14, 165, 233, 0.18) 0%, transparent 50%),
    radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.15) 0%, transparent 60%),
    linear-gradient(rgba(15, 23, 42, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.02) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 100% 100%, 32px 32px, 32px 32px;
  background-attachment: fixed;
  overflow-x: hidden;
}

:global(html.dark) .nova-page-wrapper {
  background-color: #0f172a;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 90% 30%, rgba(14, 165, 233, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.18) 0%, transparent 60%),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
}

.nova-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px clamp(20px, 4vw, 48px) 56px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* --- 主題精選：全寬沉浸帶（不再強制大屏 min-height，避免輪播下方成片空白） --- */
.nova-hero-fullbleed {
  position: relative;
  z-index: 5;
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
  min-height: 0;
  padding: clamp(10px, 1.8vw, 18px) max(10px, env(safe-area-inset-left)) clamp(8px, 1.5vh, 20px)
    max(10px, env(safe-area-inset-right));
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.nova-hero-fullbleed__inner {
  width: 100%;
  max-width: none;
  margin: 0 auto;
}

/* 與下方矩陣欄寬對齊，減少超寬螢幕兩側死空 */
.nova-hero-fullbleed__inner--frame {
  max-width: min(1440px, 100%);
  margin-left: auto;
  margin-right: auto;
  padding-left: clamp(12px, 3vw, 32px);
  padding-right: clamp(12px, 3vw, 32px);
  box-sizing: border-box;
}

.nova-spotlight-shell {
  --nova-tr: var(--current-theme-rgb, 99 102 241);
  position: relative;
  padding: clamp(18px, 2.4vw, 28px);
  border-radius: 56px;
  isolation: isolate;
  overflow: visible;

  /* 基底：靛紫冰盒 + 主題色浸染，與頁面淺灰底形成強對比 */
  background:
    radial-gradient(ellipse 100% 88% at 50% 0%, rgb(var(--nova-tr) / 0.2) 0%, transparent 58%),
    linear-gradient(
      165deg,
      rgb(224 231 255 / 0.92) 0%,
      rgb(241 245 255 / 0.88) 38%,
      rgb(248 250 252 / 0.97) 72%,
      rgb(var(--nova-tr) / 0.06) 100%
    );
  border: 2px solid rgb(var(--nova-tr) / 0.32);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.65) inset,
    0 2px 0 rgb(var(--nova-tr) / 0.25) inset,
    0 36px 72px rgb(15 23 42 / 0.14),
    0 20px 48px rgb(var(--nova-tr) / 0.15),
    0 0 1px rgb(15 23 42 / 0.08);
  transition:
    background 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

.nova-spotlight-shell--fullscreen {
  width: 100%;
  max-width: none;
  border-radius: clamp(22px, 3.5vw, 40px);
  padding: clamp(14px, 1.8vw, 22px) clamp(14px, 2vw, 24px) clamp(12px, 1.6vw, 20px);
}

.nova-spotlight-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.72),
    inset 0 -1px 0 rgb(var(--nova-tr) / 0.12),
    inset 0 0 72px rgb(var(--nova-tr) / 0.1);
  transition: box-shadow 0.85s ease;
}

.nova-spotlight-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 8% 45%, rgb(56 189 248 / 0.12) 0%, transparent 38%),
    radial-gradient(circle at 92% 55%, rgb(168 85 247 / 0.12) 0%, transparent 40%);
  mix-blend-mode: multiply;
  opacity: 0.85;
}

:global(html.dark) .nova-spotlight-shell {
  background:
    radial-gradient(ellipse 100% 90% at 50% -5%, rgb(var(--nova-tr) / 0.28) 0%, transparent 55%),
    linear-gradient(
      165deg,
      rgb(30 41 59 / 0.95) 0%,
      rgb(15 23 42 / 0.92) 48%,
      rgb(15 23 42 / 0.88) 100%
    );
  border-color: rgb(var(--nova-tr) / 0.45);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.06) inset,
    0 32px 64px rgb(0 0 0 / 0.55),
    0 0 80px rgb(var(--nova-tr) / 0.22),
    0 1px 0 rgb(var(--nova-tr) / 0.2) inset;
}

:global(html.dark) .nova-spotlight-shell::before {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.1),
    inset 0 -1px 0 rgb(var(--nova-tr) / 0.2),
    inset 0 0 80px rgb(var(--nova-tr) / 0.12);
}

:global(html.dark) .nova-spotlight-shell::after {
  mix-blend-mode: screen;
  opacity: 0.5;
}

.nova-section-head--spotlight {
  position: relative;
  z-index: 1;
  margin-bottom: clamp(16px, 2vw, 22px);
  padding: 4px 4px 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.nova-spotlight-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.nova-spotlight-kicker {
  display: inline-block;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.22em;
  color: rgb(var(--nova-tr));
  text-shadow: 0 0 28px rgb(var(--nova-tr) / 0.35);
}

:global(html.dark) .nova-spotlight-kicker {
  color: rgb(186 230 253);
  text-shadow: 0 0 24px rgb(var(--nova-tr) / 0.45);
}

.nova-title--spotlight {
  font-size: clamp(26px, 3.6vw, 34px);
  margin: 0;
  letter-spacing: 0.02em;
  background: linear-gradient(
    100deg,
    #0f172a 12%,
    rgb(var(--nova-tr)) 160%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 1px 0 rgb(255 255 255 / 0.45));
}

:global(html.dark) .nova-title--spotlight {
  background: linear-gradient(100deg, #f8fafc 8%, rgb(var(--nova-tr)) 140%);
  -webkit-background-clip: text;
  background-clip: text;
  filter: drop-shadow(0 2px 8px rgb(0 0 0 / 0.45));
}

.nova-subtitle--spotlight {
  align-self: flex-end;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: rgb(51 65 85);
  background: rgb(255 255 255 / 0.55);
  border: 1px solid rgb(var(--nova-tr) / 0.22);
  box-shadow: 0 4px 14px rgb(15 23 42 / 0.06);
}

:global(html.dark) .nova-subtitle--spotlight {
  color: rgb(203 213 225);
  background: rgb(15 23 42 / 0.55);
  border-color: rgb(var(--nova-tr) / 0.35);
  box-shadow: 0 4px 20px rgb(0 0 0 / 0.35);
}

/* --- 2. 輪播區：NOVA AURORA V16 完美融合 --- */
.nova-section-head { margin-bottom: 32px; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.nova-title { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: 0.5px; }
:global(html.dark) .nova-title { color: #f8fafc; }
.nova-subtitle { font-size: 13px; font-weight: 800; color: #94a3b8; letter-spacing: 2px; }

/* 還原主題精選標題列：避免被上方通用 .nova-section-head 覆寫 */
.nova-section-head.nova-section-head--spotlight {
  margin-bottom: clamp(16px, 2vw, 22px);
  padding: 4px 4px 0;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

/* ==========================================================
   NOVA AURORA V16 (完美融合版 - 消除横向穿模，重塑比例)
   ========================================================== */

/* 核心 1：撤销全屏强行破壁，彻底透明化，完美融入外层玻璃框 */
.nova-carousel-stage {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px 0 40px;
  display: flex;
  justify-content: center;
  align-items: center;

  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 60%) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: none !important;
  box-shadow: none !important;
}

.nova-carousel-stage :deep(.home-card-swiper),
.nova-carousel-stage :deep(.swiper),
.nova-carousel-stage :deep(.swiper-wrapper) {
  width: 100% !important;
  max-width: 1040px !important;
  overflow: visible !important;
  background: transparent !important;
  margin: 0 auto !important;
}

.nova-carousel-stage :deep(.swiper-slide-shadow-left),
.nova-carousel-stage :deep(.swiper-slide-shadow-right),
.nova-carousel-stage :deep(.swiper-slide-shadow-top),
.nova-carousel-stage :deep(.swiper-slide-shadow-bottom) { display: none !important; }

/* 核心 2：层级交给 HomeCardSwiper 内 .qq-card（明暗/饱和度），slide 不再整体 blur 以免发糊 */
.nova-carousel-stage :deep(.swiper-slide) {
  transition: opacity 0.75s cubic-bezier(0.23, 1, 0.32, 1);
  pointer-events: none !important;
}

.nova-carousel-stage :deep(.swiper-slide-active) {
  z-index: 20 !important;
  pointer-events: auto !important;
}

.nova-carousel-stage :deep(.qq-card) {
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
  height: 100%;
  transition: box-shadow 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.nova-carousel-stage :deep(.swiper-slide-active .qq-card) {
  box-shadow:
    0 24px 56px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset,
    0 0 40px rgba(255, 255, 255, 0.2);
}

:global(html.dark) .nova-carousel-stage :deep(.swiper-slide-active .qq-card) {
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset,
    0 0 40px rgba(255, 255, 255, 0.05);
}

.nova-carousel-stage :deep(.qq-card__cover),
.nova-carousel-stage :deep(.qq-card__image-box img) {
  border-radius: 20px;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 核心 3：重新计算箭头位置，确保它们悬浮在主图两侧 */
.nova-carousel-stage :deep(.home-card-swiper-nav) {
  display: flex !important;
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 100 !important;
  width: 56px !important;
  height: 56px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 1) !important;
  color: #0f172a !important;
  border-radius: 50% !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
  cursor: pointer !important;
  margin: 0 !important;
  transition: all 0.3s ease !important;
}

.nova-carousel-stage :deep(.home-card-swiper-nav__ico) { width: 24px !important; height: 24px !important; }

.nova-carousel-stage :deep(.home-card-swiper-nav:hover) {
  background: #ffffff !important;
  color: #3b82f6 !important;
  box-shadow: 0 16px 40px rgba(59, 130, 246, 0.25) !important;
  transform: translateY(-50%) scale(1.1) !important;
}

.nova-carousel-stage :deep(.home-card-swiper-nav--prev) { left: calc(50% - 560px) !important; }
.nova-carousel-stage :deep(.home-card-swiper-nav--next) { right: calc(50% - 560px) !important; }

@media (max-width: 1200px) {
  .nova-carousel-stage :deep(.home-card-swiper-nav--prev) { left: 16px !important; }
  .nova-carousel-stage :deep(.home-card-swiper-nav--next) { right: 16px !important; }
}

/* --- 元流矩陣：與上方展映艙區隔 --- */
.nova-matrix-section {
  padding-top: 8px;
  margin-top: 0;
  border-top: 1px solid rgb(148 163 184 / 0.35);
}

:global(html.dark) .nova-matrix-section {
  border-top-color: rgb(255 255 255 / 0.08);
}

.nova-tag {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 1px;
  vertical-align: middle;
}
.nova-desc {
  font-size: 15px;
  color: #64748b;
  font-weight: 600;
  margin: 8px 0 0 0;
}

/* ==========================================================
   全息电竞矩阵：3D Parallax & Dynamic Glow
   ========================================================== */

.nova-bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 180px);
  gap: 24px;
  perspective: 1200px;
}
@media (max-width: 900px) {
  .nova-bento-grid {
    display: flex;
    flex-direction: column;
    perspective: none;
  }
}

.nova-bento-card {
  position: relative;
  border-radius: 32px;
  padding: 2px;
  cursor: pointer;
  transform-style: preserve-3d;
  transform: perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(1);
  transition:
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
}
.nova-bento-card:hover {
  z-index: 10;
  transform: perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(1.02);
}

.theme-purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(255, 255, 255, 0.95));
  grid-column: 1 / 2;
  grid-row: 1 / 3;
}
.theme-purple:hover {
  box-shadow: 0 20px 48px rgba(168, 85, 247, 0.15);
}
.theme-purple .nova-icon-hub {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
}

.theme-blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(255, 255, 255, 0.95));
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}
.theme-blue:hover {
  box-shadow: 0 20px 48px rgba(59, 130, 246, 0.15);
}
.theme-blue .nova-icon-hub {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.theme-cyan {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.35), rgba(255, 255, 255, 0.95));
  grid-column: 3 / 4;
  grid-row: 1 / 2;
}
.theme-cyan:hover {
  box-shadow: 0 20px 48px rgba(45, 212, 191, 0.15);
}
.theme-cyan .nova-icon-hub {
  background: linear-gradient(135deg, #2dd4bf, #0ea5e9);
}

.theme-orange {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(255, 255, 255, 0.95));
  grid-column: 2 / 4;
  grid-row: 2 / 3;
}
.theme-orange:hover {
  box-shadow: 0 20px 48px rgba(245, 158, 11, 0.15);
}
.theme-orange .nova-icon-hub {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
}

:global(html.dark) .theme-purple,
:global(html.dark) .theme-blue,
:global(html.dark) .theme-cyan,
:global(html.dark) .theme-orange {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.55));
}

.nova-card-glass {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border-radius: 30px;
  height: 100%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    inset 0 24px 48px rgba(255, 255, 255, 0.2);
  transform: translateZ(20px);
}

.nova-card-glass::before {
  content: '';
  position: absolute;
  top: var(--py, -1000px);
  left: var(--px, -1000px);
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: overlay;
}

.nova-bento-card:hover .nova-card-glass::before {
  opacity: 1;
}

.theme-purple .nova-card-glass {
  padding: 48px 40px;
}
:global(html.dark) .nova-card-glass {
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 24px 48px rgba(0, 0, 0, 0.4);
}
:global(html.dark) .nova-card-glass::before {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
  mix-blend-mode: screen;
}

.nova-icon-hub,
.nova-text-hub,
.nova-arrow {
  position: relative;
  z-index: 2;
  transform: translateZ(30px);
}

.nova-icon-hub {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin-bottom: auto;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
.nova-text-hub h3 {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 8px;
}
.theme-purple .nova-text-hub h3 {
  font-size: 32px;
  margin-top: 24px;
}
:global(html.dark) .nova-text-hub h3 {
  color: #f8fafc;
}
.nova-text-hub p {
  font-size: 14px;
  color: #475569;
  margin: 0;
  line-height: 1.6;
}

.nova-arrow {
  align-self: flex-start;
  font-size: 28px;
  font-weight: 900;
  color: #a855f7;
  margin-top: 32px;
  transition: transform 0.3s ease;
}
.theme-purple:hover .nova-arrow {
  transform: translateX(8px);
}

@media (prefers-reduced-motion: reduce) {
  .nova-bento-grid {
    perspective: none;
  }
  .nova-bento-card,
  .nova-bento-card:hover {
    transform: none !important;
  }
  .nova-card-glass,
  .nova-icon-hub,
  .nova-text-hub,
  .nova-arrow {
    transform: none !important;
  }
  .theme-purple:hover .nova-arrow {
    transform: none !important;
  }
}

@media (max-height: 720px) {
  .nova-hero-fullbleed {
    padding-bottom: 6px;
  }
}
</style>
