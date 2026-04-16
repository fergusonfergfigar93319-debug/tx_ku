<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Connection, Document, Promotion } from '@element-plus/icons-vue'

defineProps<{
  greeting: string
  lead: string
}>()
</script>

<template>
  <section class="dp-hero" aria-labelledby="dp-hero-title">
    <div class="dp-hero__grid" aria-hidden="true" />
    <div class="dp-hero__glow" aria-hidden="true" />
    <div class="dp-hero__inner">
      <div class="dp-hero__copy">
        <p class="dp-hero__eyebrow">
          <el-icon class="dp-hero__eyebrow-ico" :size="14"><Promotion /></el-icon>
          Developer Portal
        </p>
        <h1 id="dp-hero-title" class="dp-hero__title">{{ greeting }}</h1>
        <p class="dp-hero__lead">{{ lead }}</p>
        <div class="dp-hero__actions">
          <RouterLink :to="{ name: 'app-modules' }" class="dp-btn dp-btn--primary">
            <el-icon :size="16"><Document /></el-icon>
            打开文档与功能地图
          </RouterLink>
          <RouterLink :to="{ name: 'feed' }" class="dp-btn dp-btn--ghost"> 查看产品动态 </RouterLink>
        </div>
        <p class="dp-hero__note">
          聚合<strong>集成资源</strong>、<strong>沙箱环境</strong>与<strong>账户凭证</strong>，降低从了解到上线的摩擦。
        </p>
      </div>
      <aside class="dp-hero__aside" aria-label="门户亮点">
        <div class="dp-hero__card">
          <span class="dp-hero__card-k">API 优先</span>
          <span class="dp-hero__card-v">REST · 场景化 AI</span>
        </div>
        <div class="dp-hero__card">
          <span class="dp-hero__card-k">多域隔离</span>
          <span class="dp-hero__card-v">资讯 / 社区 / AI / 账户</span>
        </div>
        <div class="dp-hero__card dp-hero__card--accent">
          <el-icon :size="18"><Connection /></el-icon>
          <span class="dp-hero__card-k">工作台</span>
          <span class="dp-hero__card-v">宽屏 · 搜索 · 命令面板</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.dp-hero {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: linear-gradient(
    145deg,
    rgb(255 255 255 / 0.99) 0%,
    rgb(239 246 255 / 0.96) 42%,
    rgb(250 245 255 / 0.94) 100%
  );
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.9) inset,
    0 24px 56px rgb(15 23 42 / 0.07);
}

.dp-hero__grid {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background-image:
    linear-gradient(rgb(37 99 235 / 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgb(37 99 235 / 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 20%, transparent 70%);
}

.dp-hero__glow {
  position: absolute;
  width: min(420px, 90vw);
  height: min(420px, 90vw);
  top: -40%;
  right: -15%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgb(var(--buddy-rgb-brand) / 0.18) 0%,
    rgb(124 58 237 / 0.08) 40%,
    transparent 68%
  );
  filter: blur(2px);
  pointer-events: none;
}

.dp-hero__inner {
  position: relative;
  display: grid;
  gap: 20px;
  padding: 24px 20px 22px;
}

@media (min-width: 900px) {
  .dp-hero__inner {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
    align-items: stretch;
    gap: 24px;
    padding: 28px 28px 26px;
  }
}

.dp-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--buddy-rgb-brand) / 0.85);
}

.dp-hero__eyebrow-ico {
  color: var(--buddy-primary);
}

.dp-hero__title {
  margin: 0 0 10px;
  font-size: clamp(24px, 4.5vw, 34px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--buddy-text);
}

.dp-hero__lead {
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--buddy-text-muted);
  max-width: 52ch;
}

.dp-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.dp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.dp-btn--primary {
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #6366f1 100%);
  box-shadow:
    0 4px 16px rgb(37 99 235 / 0.35),
    0 0 0 1px rgb(255 255 255 / 0.12) inset;
}

.dp-btn--primary:hover {
  box-shadow:
    0 8px 24px rgb(37 99 235 / 0.4),
    0 0 0 1px rgb(255 255 255 / 0.15) inset;
  transform: translateY(-1px);
}

.dp-btn--ghost {
  color: var(--buddy-text-secondary);
  border: 1px solid rgb(15 23 42 / 0.1);
  background: rgb(255 255 255 / 0.75);
}

.dp-btn--ghost:hover {
  border-color: rgb(var(--buddy-rgb-brand) / 0.35);
  color: var(--buddy-primary);
}

@media (prefers-reduced-motion: reduce) {
  .dp-btn--primary:hover {
    transform: none;
  }
}

.dp-hero__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

.dp-hero__note strong {
  color: var(--buddy-text-secondary);
  font-weight: 700;
}

.dp-hero__aside {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dp-hero__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 76px;
  justify-content: center;
  padding: 15px 16px 14px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.07);
  background: rgb(255 255 255 / 0.82);
  box-shadow: 0 2px 12px rgb(15 23 42 / 0.04);
}

.dp-hero__card--accent {
  border-color: rgb(var(--buddy-rgb-brand) / 0.2);
  background: linear-gradient(125deg, rgb(255 255 255 / 0.95) 0%, rgb(239 246 255 / 0.9) 100%);
}

.dp-hero__card-k {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}

.dp-hero__card-v {
  font-size: 13px;
  font-weight: 700;
  color: var(--buddy-text);
  line-height: 1.35;
}
</style>
