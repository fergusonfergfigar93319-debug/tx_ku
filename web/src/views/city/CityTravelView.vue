<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Location, MapLocation, Share } from '@element-plus/icons-vue'
import BuddyModuleSection from '@/components/buddy/BuddyModuleSection.vue'

const routes = [
  {
    key: 'sh',
    city: '上海',
    title: '主场观赛 · 黄浦滨江线',
    desc: '赛事日联动展陈、主题市集与夜景打卡；适合赛前集合与赛后复盘。',
    tags: ['主场', '夜景', '市集'],
    tone: 'gold',
  },
  {
    key: 'cd',
    city: '成都',
    title: '火锅城开黑动线',
    desc: '同城招募高频区；线下观赛与漫展联动资讯聚合在版本速递。',
    tags: ['招募', '同城', '美食'],
    tone: 'orange',
  },
  {
    key: 'hz',
    city: '杭州',
    title: '文旅打卡 × 电竞主题展',
    desc: '城市文化表达与应援创作灵感；可跳转峡谷广场分享游记。',
    tags: ['展陈', '打卡', 'UGC'],
    tone: 'cyan',
  },
] as const

const tips = [
  '出发前在「版本速递」确认当日活动与交通封路信息。',
  '同城话题带上城市标签，更容易被主队粉丝看到。',
  '线下合影注意场馆秩序与版权提示，二创请标注来源。',
]
</script>

<template>
  <div class="buddy-page city-travel app-page-stack" aria-label="城市文旅线">
    <header class="city-hero buddy-card-surface">
      <div class="city-hero__glow" aria-hidden="true" />
      <p class="city-hero__eyebrow">文旅 · 主场与城市</p>
      <h1 class="city-hero__title">城市文旅线</h1>
      <p class="city-hero__lead">
        主场观赛、联动展陈与同城打卡一站串联；将地标与开黑动线写进你的峡谷故事。
      </p>
      <div class="city-hero__actions">
        <RouterLink class="city-btn city-btn--primary" to="/app/feed">
          打开版本速递
        </RouterLink>
        <RouterLink class="city-btn city-btn--ghost" to="/app/forum">
          去峡谷广场
        </RouterLink>
      </div>
    </header>

    <section class="app-layer app-layer--content city-travel-body" aria-label="路线与提示">
      <div class="app-layer__inner city-travel-body__inner">
    <BuddyModuleSection
      title="精选动线"
      subtitle="示例路线，可接运营配置或 LBS 能力"
      :more="{ label: '全部资讯', to: '/app/feed' }"
    >
      <ul class="route-list">
        <li v-for="r in routes" :key="r.key">
          <article class="route-card buddy-card-surface" :data-tone="r.tone">
            <div class="route-card__head">
              <span class="route-card__city">
                <el-icon :size="16"><MapLocation /></el-icon>
                {{ r.city }}
              </span>
              <span class="route-card__share" aria-hidden="true">
                <el-icon :size="14"><Share /></el-icon>
              </span>
            </div>
            <h2 class="route-card__title">{{ r.title }}</h2>
            <p class="route-card__desc">{{ r.desc }}</p>
            <div class="route-card__tags">
              <span v-for="t in r.tags" :key="t" class="route-card__tag">{{ t }}</span>
            </div>
          </article>
        </li>
      </ul>
    </BuddyModuleSection>

    <BuddyModuleSection title="出行提示" :more="{ label: '峡谷广场', to: '/app/forum' }">
      <ul class="tip-list buddy-card-surface">
        <li v-for="(line, i) in tips" :key="i" class="tip-list__item">
          <span class="tip-list__idx">{{ i + 1 }}</span>
          <span>{{ line }}</span>
        </li>
      </ul>
    </BuddyModuleSection>
      </div>
    </section>

    <p class="city-footnote">
      <el-icon class="city-footnote__ico" :size="14"><Location /></el-icon>
      与首页轮播「城市文旅线」卡片对应；深度内容可在版本速递筛选活动类资讯。
    </p>
  </div>
</template>

<style scoped>
.city-travel {
  padding-bottom: 28px;
  max-width: min(768px, 100%);
  margin: 0 auto;
}

.city-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 18px;
  padding: 22px 18px 20px;
  border-radius: var(--buddy-radius);
  border: 1px solid rgb(var(--buddy-rgb-honor-gold) / 0.35);
  background: linear-gradient(
    145deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(255 248 235 / 0.92) 45%,
    rgb(246 250 255 / 0.96) 100%
  );
}

.city-hero__glow {
  position: absolute;
  inset: -40% -20% auto auto;
  width: min(320px, 80vw);
  height: min(320px, 80vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgb(245 158 11 / 0.22) 0%, transparent 65%);
  pointer-events: none;
}

.city-hero__eyebrow {
  position: relative;
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--buddy-rgb-honor-gold));
}

.city-hero__title {
  position: relative;
  margin: 0 0 10px;
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--buddy-text);
}

.city-hero__lead {
  position: relative;
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--buddy-text-muted);
}

.city-hero__actions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.city-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.city-btn--primary {
  border: 1px solid rgb(var(--buddy-rgb-honor-gold) / 0.45);
  background: linear-gradient(155deg, rgb(255 251 235) 0%, rgb(255 255 255) 100%);
  color: var(--buddy-text);
  box-shadow: 0 4px 16px rgb(194 120 3 / 0.15);
}

.city-btn--primary:hover {
  box-shadow: 0 8px 22px rgb(194 120 3 / 0.22);
  transform: translateY(-1px);
}

.city-btn--ghost {
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.2);
  background: rgb(255 255 255 / 0.9);
  color: var(--buddy-primary);
}

.route-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-card {
  padding: 16px 14px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.06);
  text-align: left;
}

.route-card[data-tone='gold'] {
  border-left: 3px solid #f59e0b;
}

.route-card[data-tone='orange'] {
  border-left: 3px solid #ea580c;
}

.route-card[data-tone='cyan'] {
  border-left: 3px solid #06b6d4;
}

.route-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.route-card__city {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  color: var(--buddy-text-secondary);
}

.route-card__share {
  color: var(--buddy-text-muted);
  opacity: 0.6;
}

.route-card__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: var(--buddy-text);
}

.route-card__desc {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

.route-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.route-card__tag {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  background: rgb(var(--buddy-rgb-brand) / 0.06);
  color: var(--buddy-text-secondary);
}

.tip-list {
  margin: 0;
  padding: 14px 14px 12px;
  list-style: none;
  border-radius: var(--buddy-radius-sm);
}

.tip-list__item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-secondary);
  padding: 8px 0;
  border-bottom: 1px solid var(--buddy-border);
}

.tip-list__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.tip-list__idx {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  background: linear-gradient(135deg, rgb(var(--buddy-rgb-brand) / 0.12), rgb(var(--buddy-rgb-accent) / 0.1));
  color: var(--buddy-primary);
}

.city-footnote {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 16px 4px 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.city-footnote__ico {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--buddy-primary);
}

@media (prefers-reduced-motion: reduce) {
  .city-btn--primary:hover {
    transform: none;
  }
}
</style>
