<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { NewsItem } from '@/types/feed'

const props = defineProps<{
  items: NewsItem[]
}>()

const router = useRouter()

function formatShortDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function openFeed() {
  void router.push({ name: 'feed' })
}
</script>

<template>
  <section id="home-news" class="dp-cl home-anchor-target" tabindex="-1" aria-labelledby="dp-cl-title">
    <div class="dp-cl__head">
      <h2 id="dp-cl-title" class="dp-cl__title">版本速递 / Changelog</h2>
      <button type="button" class="dp-cl__more" @click="openFeed">查看全部动态 →</button>
    </div>
    <p class="dp-cl__sub">以开发者门户常见的「发布说明」形式呈现产品更新；点击行将前往资讯流。</p>

    <div class="dp-cl__table-wrap">
      <table class="dp-cl__table">
        <thead>
          <tr>
            <th scope="col">日期</th>
            <th scope="col">类型</th>
            <th scope="col">摘要</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in items" :key="n.id" class="dp-cl__row" @click="openFeed">
            <td class="dp-cl__date">{{ formatShortDate(n.publishedAt) }}</td>
            <td>
              <span class="dp-cl__pill">产品</span>
            </td>
            <td class="dp-cl__title-cell">
              <span class="dp-cl__t">{{ n.title }}</span>
              <span class="dp-cl__d">{{ n.summary }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.home-anchor-target {
  scroll-margin-top: 88px;
}

.dp-cl {
  padding: 20px 16px 16px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: rgb(255 255 255 / 0.98);
  box-shadow: 0 2px 18px rgb(15 23 42 / 0.05);
}

.dp-cl__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.dp-cl__title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--buddy-text);
}

.dp-cl__more {
  border: none;
  background: none;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--buddy-primary);
  cursor: pointer;
  font-family: inherit;
}

.dp-cl__more:hover {
  text-decoration: underline;
}

.dp-cl__sub {
  margin: 0 0 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.dp-cl__table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid rgb(15 23 42 / 0.07);
}

.dp-cl__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.dp-cl__table thead {
  background: rgb(248 250 252);
  border-bottom: 1px solid rgb(15 23 42 / 0.08);
}

.dp-cl__table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}

.dp-cl__row {
  cursor: pointer;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
  transition: background 0.15s ease;
}

.dp-cl__row:hover {
  background: rgb(239 246 255 / 0.65);
}

.dp-cl__row:last-child {
  border-bottom: none;
}

.dp-cl__table td {
  padding: 12px;
  vertical-align: top;
}

.dp-cl__date {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--buddy-text-secondary);
  width: 1%;
}

.dp-cl__pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--buddy-primary);
  background: rgb(var(--buddy-rgb-brand) / 0.1);
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.2);
}

.dp-cl__title-cell {
  min-width: 200px;
}

.dp-cl__t {
  display: block;
  font-weight: 700;
  color: var(--buddy-text);
  margin-bottom: 4px;
  line-height: 1.35;
}

.dp-cl__d {
  display: block;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
