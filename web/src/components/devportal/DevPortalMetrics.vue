<script setup lang="ts">
import { useRouter } from 'vue-router'

export type MetricItem = {
  label: string
  value: string
  hint: string
  to: string
}

defineProps<{
  items: MetricItem[]
}>()

const router = useRouter()

function go(to: string) {
  void router.push(to)
}
</script>

<template>
  <div class="dp-metrics" role="navigation" aria-label="用量与资源概览">
    <button
      v-for="(m, i) in items"
      :key="m.label"
      type="button"
      class="dp-metrics__card"
      :class="'dp-metrics__card--' + i"
      @click="go(m.to)"
    >
      <span class="dp-metrics__v">{{ m.value }}</span>
      <span class="dp-metrics__k">{{ m.label }}</span>
      <span class="dp-metrics__hint">{{ m.hint }}</span>
    </button>
  </div>
</template>

<style scoped>
/* ==========================================================
   1. 網格佈局 (Bento Box 基礎)
   ========================================================== */
.dp-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px; /* 加大間距，讓卡片更有呼吸感 */
}

@media (max-width: 640px) {
  .dp-metrics {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* ==========================================================
   2. 卡片核心質感：霜化玻璃 (亮色模式)
   ========================================================== */
.dp-metrics__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 20px 20px 18px; /* 增加內邊距，看起來更大氣 */
  cursor: pointer;
  text-align: left;
  font: inherit;
  overflow: hidden;

  /* 圓角與玻璃態基礎 */
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.6) 100%);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);

  /* 物理邊緣高光與柔和陰影 */
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-bottom-color: rgba(226, 232, 240, 0.6);
  box-shadow:
    0 12px 28px -6px rgba(15, 23, 42, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;

  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 頂部裝飾條 (改為更現代的細線) */
.dp-metrics__card::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 4px;
  opacity: 0.85;
}

.dp-metrics__card--0::before {
  background: linear-gradient(90deg, #2563eb, #38bdf8);
}
.dp-metrics__card--1::before {
  background: linear-gradient(90deg, #7c3aed, #c084fc);
}
.dp-metrics__card--2::before {
  background: linear-gradient(90deg, #0891b2, #22d3ee);
}

/* 亮色模式 Hover 懸浮效果 */
.dp-metrics__card:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: rgba(255, 255, 255, 1);
  box-shadow:
    0 24px 48px -12px rgba(37, 99, 235, 0.08),
    0 8px 16px rgba(15, 23, 42, 0.03),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
}

/* ==========================================================
   3. 暗黑模式：霓虹玻璃態 (Neon Glass)
   ========================================================== */
:global(html.dark) .dp-metrics__card {
  /* 微弱的藍紫底光 */
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  /* 外部物理邊框 + 內部切邊高光 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 16px 32px -8px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(59, 130, 246, 0.08), /* 藍色彌散光暈 */
    0 1px 1px rgba(255, 255, 255, 0.15) inset;
}

/* 暗黑模式 Hover 發光爆發 */
:global(html.dark) .dp-metrics__card:hover {
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.9),
    0 0 36px rgba(59, 130, 246, 0.25),
    0 1px 1px rgba(255, 255, 255, 0.3) inset;
}

/* ==========================================================
   4. 數據排版與色彩爆改：全息漸變文字
   ========================================================== */
.dp-metrics__v {
  font-size: 28px; /* 放大數字，更具衝擊力 */
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  /* 注入極光漸變色 */
  background: linear-gradient(135deg, #38bdf8 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

:global(html.dark) .dp-metrics__v {
  /* 暗黑模式下，大數字自帶霓虹發光 */
  filter: drop-shadow(0 2px 8px rgba(168, 85, 247, 0.4));
}

.dp-metrics__k {
  font-size: 13px; /* 稍微放大標籤 */
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--buddy-text-secondary);
}

:global(html.dark) .dp-metrics__k {
  color: #f8fafc;
}

.dp-metrics__hint {
  font-size: 11px;
  font-weight: 700;
  color: var(--buddy-primary);
  margin-top: 4px;
}

:global(html.dark) .dp-metrics__hint {
  color: #60a5fa; /* 暗黑模式下的亮藍色提示 */
}

@media (prefers-reduced-motion: reduce) {
  .dp-metrics__card,
  .dp-metrics__card:hover {
    transform: none;
    transition: none;
  }
}
</style>
