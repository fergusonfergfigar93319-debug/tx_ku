<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { ArrowRight, Key, Link, Reading, Setting } from '@element-plus/icons-vue'

type Step = {
  n: string
  title: string
  desc: string
  to: RouteLocationRaw
  icon: typeof Reading
}

const steps: Step[] = [
  {
    n: '01',
    title: '浏览功能地图',
    desc: '弄清资讯、社区、AI 与账户的职责边界。',
    to: { name: 'app-modules' },
    icon: Reading,
  },
  {
    n: '02',
    title: '获取访问凭证',
    desc: '在控制台查看 API Key，并配置到客户端或自动化脚本。',
    to: { name: 'home', hash: '#dp-credentials' },
    icon: Key,
  },
  {
    n: '03',
    title: '调用沙箱环境',
    desc: '在 AI 工作台验证场景化集成，再切换生产流量。',
    to: { name: 'agent' },
    icon: Setting,
  },
  {
    n: '04',
    title: '订阅变更与社区',
    desc: '跟进版本速递与开发者讨论，获取迁移提示。',
    to: { name: 'feed' },
    icon: Link,
  },
]
</script>

<template>
  <section class="dp-qs" aria-labelledby="dp-qs-title">
    <div class="dp-qs__head">
      <h2 id="dp-qs-title" class="dp-qs__title">快速开始</h2>
      <p class="dp-qs__sub">按顺序完成集成，通常 &lt; 30 分钟即可跑通第一条请求（演示数据）。</p>
    </div>
    <ol class="dp-qs__list">
      <li v-for="s in steps" :key="s.n" class="dp-qs__item">
        <span class="dp-qs__n">{{ s.n }}</span>
        <div class="dp-qs__body">
          <span class="dp-qs__ico" aria-hidden="true">
            <el-icon :size="20"><component :is="s.icon" /></el-icon>
          </span>
          <div>
            <h3 class="dp-qs__item-title">{{ s.title }}</h3>
            <p class="dp-qs__item-desc">{{ s.desc }}</p>
            <RouterLink :to="s.to" class="dp-qs__link">
              前往
              <el-icon :size="14"><ArrowRight /></el-icon>
            </RouterLink>
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.dp-qs {
  padding: 20px 18px 18px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.07);
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98) 0%, rgb(248 250 252 / 0.96) 100%);
  box-shadow: 0 2px 16px rgb(15 23 42 / 0.04);
}

.dp-qs__head {
  margin-bottom: 16px;
}

.dp-qs__title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--buddy-text);
}

.dp-qs__sub {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.dp-qs__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

@media (min-width: 768px) {
  .dp-qs__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.dp-qs__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgb(15 23 42 / 0.06);
  background: rgb(255 255 255 / 0.9);
  transition: box-shadow 0.2s ease;
}

.dp-qs__item:hover {
  box-shadow: 0 8px 22px rgb(37 99 235 / 0.08);
}

.dp-qs__n {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--buddy-rgb-brand) / 0.55);
  letter-spacing: 0.06em;
}

.dp-qs__body {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.dp-qs__ico {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--buddy-primary);
  background: linear-gradient(
    145deg,
    rgb(var(--buddy-rgb-brand) / 0.1) 0%,
    rgb(124 58 237 / 0.08) 100%
  );
}

.dp-qs__item-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 800;
  color: var(--buddy-text);
}

.dp-qs__item-desc {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.dp-qs__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--buddy-primary);
  text-decoration: none;
}

.dp-qs__link:hover {
  text-decoration: underline;
}
</style>
