<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Brush, Picture, StarFilled, TrendCharts, View } from '@element-plus/icons-vue'
import BuddyModuleSection from '@/components/buddy/BuddyModuleSection.vue'

const themes = [
  { key: 'cn', label: '国风表达', sub: '纹样 · 台词 · 应援文案', accent: '#be185d' },
  { key: 'vt', label: '虚拟偶像', sub: '二创人设与短评', accent: '#7c3aed' },
  { key: 'fit', label: '穿搭应援', sub: '队服配色与现场穿搭', accent: '#db2777' },
  { key: 'meme', label: '梗图共创', sub: '短评与表情包', accent: '#ec4899' },
] as const

const gallery = [
  { key: 'g1', title: '应援海报 · 霓虹峡谷', heat: '1.2k 浏览' },
  { key: 'g2', title: '同人短漫 · 中路团宠', heat: '986 浏览' },
  { key: 'g3', title: '城市打卡 · 文旅联动', heat: '842 浏览' },
] as const
</script>

<template>
  <div class="buddy-page trend-studio app-page-stack" aria-label="潮流共创">
    <header class="trend-hero buddy-card-surface">
      <div class="trend-hero__mesh" aria-hidden="true" />
      <p class="trend-hero__eyebrow">UGC · 年轻文化</p>
      <h1 class="trend-hero__title">潮流共创工作室</h1>
      <p class="trend-hero__lead">
        灵感、二次元与虚拟偶像表达；用梗图、短评与同人作品连接峡谷内外，中华文化与电竞叙事一站打磨。
      </p>
      <div class="trend-hero__actions">
        <RouterLink class="trend-btn trend-btn--primary" :to="{ name: 'post-editor' }">
          <el-icon :size="16"><Brush /></el-icon>
          发布共创
        </RouterLink>
        <RouterLink class="trend-btn trend-btn--ghost" to="/app/forum">
          <el-icon :size="16"><View /></el-icon>
          浏览峡谷广场
        </RouterLink>
      </div>
    </header>

    <section class="app-layer app-layer--content trend-studio-body" aria-label="共创工具与展示">
      <div class="app-layer__inner trend-studio-body__inner">
    <BuddyModuleSection
      title="主题模板"
      subtitle="选择叙事方向，发帖时可带话题标签"
      :more="{ label: '发帖', to: { name: 'post-editor' } }"
    >
      <div class="theme-grid">
        <article
          v-for="t in themes"
          :key="t.key"
          class="theme-tile buddy-card-surface"
          :style="{ '--t-accent': t.accent }"
        >
          <span class="theme-tile__label">{{ t.label }}</span>
          <span class="theme-tile__sub">{{ t.sub }}</span>
        </article>
      </div>
    </BuddyModuleSection>

    <BuddyModuleSection
      title="灵感画廊"
      subtitle="演示占位卡片，正式环境可接广场热帖或瀑布流"
      :more="{ label: '更多热帖', to: '/app/forum' }"
    >
      <ul class="gallery-list">
        <li v-for="g in gallery" :key="g.key">
          <div class="gallery-card buddy-card-surface">
            <div class="gallery-card__thumb" aria-hidden="true">
              <el-icon :size="28"><Picture /></el-icon>
            </div>
            <div class="gallery-card__body">
              <span class="gallery-card__title">{{ g.title }}</span>
              <span class="gallery-card__meta">
                <el-icon :size="12"><TrendCharts /></el-icon>
                {{ g.heat }}
              </span>
            </div>
            <RouterLink class="gallery-card__go" :to="'/app/forum'" aria-label="前往广场">
              ›
            </RouterLink>
          </div>
        </li>
      </ul>
    </BuddyModuleSection>

    <BuddyModuleSection title="与同频结合" :more="{ label: 'AI 搭子', to: '/app/agent' }">
      <div class="trend-hint buddy-card-surface">
        <el-icon class="trend-hint__ico" :size="20"><StarFilled /></el-icon>
        <p>
          需要文案与话题润色时，可在 <strong>AI 搭子</strong> 中完成人设与提示，再回到此处发布到峡谷广场。
        </p>
      </div>
    </BuddyModuleSection>
      </div>
    </section>
  </div>
</template>

<style scoped>
.trend-studio {
  padding-bottom: 28px;
  max-width: min(768px, 100%);
  margin: 0 auto;
}

.trend-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 18px;
  padding: 22px 18px 20px;
  border-radius: var(--buddy-radius);
  border: 1px solid rgb(190 24 93 / 0.22);
  background: linear-gradient(
    132deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(253 242 248 / 0.95) 40%,
    rgb(250 245 255 / 0.96) 100%
  );
}

.trend-hero__mesh {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background:
    radial-gradient(ellipse 80% 50% at 100% 0%, rgb(236 72 153 / 0.2) 0%, transparent 55%),
    radial-gradient(ellipse 60% 40% at 0% 100%, rgb(124 58 237 / 0.14) 0%, transparent 50%);
  pointer-events: none;
}

.trend-hero__eyebrow {
  position: relative;
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #be185d;
}

.trend-hero__title {
  position: relative;
  margin: 0 0 10px;
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--buddy-text);
}

.trend-hero__lead {
  position: relative;
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--buddy-text-muted);
}

.trend-hero__actions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.trend-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}

.trend-btn--primary {
  border: 1px solid rgb(190 24 93 / 0.35);
  background: linear-gradient(155deg, rgb(255 241 248) 0%, rgb(255 255 255) 100%);
  color: #9d174d;
  box-shadow: 0 4px 16px rgb(190 24 93 / 0.12);
}

.trend-btn--primary:hover {
  box-shadow: 0 8px 22px rgb(190 24 93 / 0.2);
  transform: translateY(-1px);
}

.trend-btn--ghost {
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.2);
  background: rgb(255 255 255 / 0.95);
  color: var(--buddy-primary);
}

.theme-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 520px) {
  .theme-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.theme-tile {
  padding: 14px 14px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.06);
  border-left: 3px solid var(--t-accent, #db2777);
  text-align: left;
}

.theme-tile__label {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: var(--buddy-text);
  margin-bottom: 4px;
}

.theme-tile__sub {
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
}

.gallery-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gallery-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 14px;
}

.gallery-card__thumb {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgb(236 72 153 / 0.15), rgb(124 58 237 / 0.12));
  color: #be185d;
}

.gallery-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gallery-card__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--buddy-text);
}

.gallery-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--buddy-text-muted);
}

.gallery-card__go {
  flex-shrink: 0;
  font-size: 22px;
  font-weight: 700;
  color: rgb(190 24 93 / 0.65);
  text-decoration: none;
  line-height: 1;
}

.trend-hint {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--buddy-text-secondary);
  border-radius: var(--buddy-radius-sm);
}

.trend-hint__ico {
  flex-shrink: 0;
  color: #db2777;
  margin-top: 1px;
}

.trend-hint strong {
  font-weight: 800;
  color: var(--buddy-text);
}

@media (prefers-reduced-motion: reduce) {
  .trend-btn--primary:hover {
    transform: none;
  }
}
</style>
