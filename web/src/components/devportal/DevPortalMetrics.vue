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
.dp-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 520px) {
  .dp-metrics {
    grid-template-columns: 1fr;
  }
}

.dp-metrics__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 14px 12px;
  border-radius: 12px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: linear-gradient(168deg, rgb(255 255 255 / 0.98) 0%, rgb(248 250 252 / 0.95) 100%);
  cursor: pointer;
  text-align: left;
  font: inherit;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.dp-metrics__card::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  border-radius: 12px 12px 0 0;
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

.dp-metrics__card:hover {
  border-color: rgb(var(--buddy-rgb-brand) / 0.22);
  box-shadow: 0 12px 28px rgb(15 23 42 / 0.08);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .dp-metrics__card:hover {
    transform: none;
  }
}

.dp-metrics__v {
  font-size: 22px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  background: linear-gradient(120deg, #2563eb, #6366f1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.dp-metrics__k {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--buddy-text-secondary);
}

.dp-metrics__hint {
  font-size: 11px;
  font-weight: 600;
  color: var(--buddy-primary);
}
</style>
