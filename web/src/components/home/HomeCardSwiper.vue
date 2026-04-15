<!--
  HomeCardSwiper — EffectCreative 堆叠/3D 覆盖 + 视差 + 首页氛围色联动

  依赖：npm install swiper@11
  说明：同目录 HomeCardSwiper-使用说明.md
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, EffectCreative, Pagination, Parallax } from 'swiper/modules'
import type { Swiper as SwiperClass } from 'swiper/types'

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-creative'

import { Reading } from '@element-plus/icons-vue'

import type { HomeCardSwiperItem } from './homeCardSwiper.types'

const props = withDefaults(
  defineProps<{
    items: HomeCardSwiperItem[]
    /** 视口全宽横条（相对父级居中栏突破至 100vw），大屏沉浸感 */
    fullBleed?: boolean
    /** 压低高度与主卡放大倍数，避免遮挡下方主内容 */
    compact?: boolean
    autoplayDelay?: number
    transitionMs?: number
  }>(),
  {
    fullBleed: false,
    compact: false,
    autoplayDelay: 6000,
    transitionMs: 600,
  },
)

const modules = [EffectCreative, Autoplay, Pagination, Parallax]

/**
 * EffectCreative：左右滑入纵深 + 轻微旋转（堆叠 / 3D 覆盖，slidesPerView>1 露边）
 * 非 compact：translate ±120%、z≈-500，与 Swiper 文档「潮流卡片」配置一致。
 */
const creativeEffectOpts = computed(() => {
  const z = props.compact ? 380 : 500
  const x = props.compact ? '88%' : '120%'
  return {
    prev: {
      shadow: true,
      translate: [`-${x}`, 0, -z],
      rotate: [0, 0, props.compact ? -14 : -20],
    },
    next: {
      shadow: true,
      translate: [x, 0, -z],
      rotate: [0, 0, props.compact ? 14 : 20],
    },
  }
})

const slidesPerViewCreative = computed(() => (props.compact ? 1.12 : 1.2))

/** 系统偏好减少动效时关闭视差，避免眩晕 */
const motionOk = ref(true)
onMounted(() => {
  motionOk.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

/** 实例由 @swiper 注入；左右箭头改为手动调用 slidePrev/slideNext，避免 Navigation+loop+auto 下偶发不响应 */
const swiperRef = ref<SwiperClass | null>(null)

/** 大屏「两侧露边」需 loop 克隆片：首张左侧也能看到上一张，与 rewind 首张左侧空白不同 */
const enableLoop = computed(() => props.items.length >= 3)

/**
 * slidesPerView:auto + centered 时，loop 需足够多附加克隆，否则滑到末张时右侧无衔接（空白）。
 * 取 max(n,8) 封顶 16，避免 DOM 过多。
 */
const loopAdditionalSlidesCount = computed(() => {
  const n = props.items.length
  if (n < 3) return 0
  return Math.min(Math.max(n, 8), 16)
})

const router = useRouter()

const activeItemId = ref(props.items[0]?.id ?? '')

/** 仅当条目 id 集合或顺序变化时校正，避免对 items 做 deep 监听导致与 Swiper 内态打架 */
const itemsIdKey = computed(() => props.items.map((x) => x.id).join('\0'))

watch(itemsIdKey, () => {
  const list = props.items
  if (list.length && !list.some((x) => x.id === activeItemId.value)) {
    activeItemId.value = list[0].id
  }
})

onBeforeUnmount(() => {
  applyHomeThemeFromItem(null)
})

function applyHomeThemeFromItem(item: HomeCardSwiperItem | null) {
  const root = document.documentElement
  if (!item) {
    root.style.removeProperty('--current-theme-color')
    root.style.removeProperty('--current-theme-rgb')
    root.style.removeProperty('--home-bg-gradient')
    return
  }
  const rgb = item.themeRgb ?? '99 102 241'
  root.style.setProperty('--current-theme-color', item.themeColor ?? '#6366f1')
  root.style.setProperty('--current-theme-rgb', rgb)
  const dark = root.classList.contains('dark')
  root.style.setProperty(
    '--home-bg-gradient',
    dark
      ? `radial-gradient(circle at 20% 30%, rgb(${rgb} / 0.16) 0%, #0f172a 52%)`
      : `radial-gradient(circle at 20% 30%, rgb(${rgb} / 0.07) 0%, #ffffff 50%)`,
  )
}

function syncActiveFromSwiper(swiper: SwiperClass) {
  if (!props.items.length) return
  const idx = swiper.realIndex
  if (idx < 0 || idx >= props.items.length) return
  const cur = props.items[idx]
  if (cur) {
    activeItemId.value = cur.id
    applyHomeThemeFromItem(cur)
  }
}

/**
 * loop 时勿开 centeredSlidesBounds / centerInsufficientSlides（与 Swiper 说明一致）。
 * 少量条数回退 rewind，避免 loop 条件不足。
 */
function onSwiper(swiper: SwiperClass) {
  swiperRef.value = swiper
  requestAnimationFrame(() => {
    syncActiveFromSwiper(swiper)
    swiper.update()
    requestAnimationFrame(() => {
      syncActiveFromSwiper(swiper)
    })
  })
}

function goPrev(e?: MouseEvent) {
  e?.preventDefault()
  e?.stopPropagation()
  const s = swiperRef.value
  if (!s || props.items.length < 2) return
  const speed = props.transitionMs
  const n = props.items.length
  if (enableLoop.value) {
    const idx = (s.realIndex - 1 + n) % n
    s.slideToLoop(idx, speed)
  } else {
    s.slidePrev(speed)
  }
}

function goNext(e?: MouseEvent) {
  e?.preventDefault()
  e?.stopPropagation()
  const s = swiperRef.value
  if (!s || props.items.length < 2) return
  const speed = props.transitionMs
  const n = props.items.length
  if (enableLoop.value) {
    const idx = (s.realIndex + 1) % n
    s.slideToLoop(idx, speed)
  } else {
    s.slideNext(speed)
  }
}

/** loop 模式下以 realIndex 为准，比 slideChange 更可靠 */
function onRealIndexChange(swiper: SwiperClass) {
  syncActiveFromSwiper(swiper)
}

/** 与文档示例一致：任意 slide 切换即同步主题（含触摸/拖拽中途） */
function onSlideChange(swiper: SwiperClass) {
  syncActiveFromSwiper(swiper)
}

function onSlideChangeTransitionEnd(swiper: SwiperClass) {
  syncActiveFromSwiper(swiper)
}

function onCardClick(item: HomeCardSwiperItem) {
  if (item.id !== activeItemId.value) return
  if (item.to) void router.push(item.to)
}

const activeItem = computed(
  () => props.items.find((x) => x.id === activeItemId.value) ?? null,
)

const autoplaySec = computed(() => Math.max(1, Math.round(props.autoplayDelay / 1000)))

const themeRibbon = [
  { key: 'ip', label: '王者电竞 IP' },
  { key: 'city', label: '城市文旅' },
  { key: 'pop', label: '潮流文化' },
  { key: 'ai', label: '电竞 + AI' },
] as const

function badgeClass(item: HomeCardSwiperItem) {
  const tone = item.badgeTone ?? 'blue'
  return ['qq-card__badge', `qq-card__badge--${tone}`]
}
</script>

<template>
  <section
    v-if="items?.length"
    class="home-card-swiper-wrap"
    :class="{
      'home-card-swiper-wrap--fullbleed': fullBleed,
      'home-card-swiper-wrap--compact': compact,
    }"
    :style="{ '--qq-swiper-dur': `${transitionMs}ms` }"
    aria-label="推荐卡片轮播"
  >
    <header v-if="compact" class="home-card-swiper-head home-card-swiper-head--visual">
      <h2 class="home-card-swiper-title home-card-swiper-title--visual">主题精选</h2>
      <span class="home-card-swiper-meta" aria-hidden="true"
        >{{ autoplaySec }}s · 滑动 / 箭头</span
      >
    </header>
    <header v-else class="home-card-swiper-head">
      <p class="home-card-swiper-eyebrow">王者电竞 IP × 城市文旅 × 潮流 × 场景化 AI</p>
      <h2 class="home-card-swiper-title">主题精选 · 沉浸入口</h2>
      <p class="home-card-swiper-lead home-card-swiper-lead--short">
        浏览器端宽屏沉浸 — 深度融合电竞 IP 与文旅、潮流场景；资讯 / 社区 / 智能体共创入口
      </p>
      <ul class="home-card-swiper-ribbon" aria-label="内容维度">
        <li v-for="r in themeRibbon" :key="r.key" class="home-card-swiper-ribbon__pill">
          {{ r.label }}
        </li>
      </ul>
      <p class="home-card-swiper-sub">滑动或箭头 · 约 {{ autoplaySec }}s · 悬停暂停</p>
    </header>

    <div class="home-card-swiper-stage">
      <button
        v-if="items.length > 1"
        type="button"
        class="home-card-swiper-nav home-card-swiper-nav--prev"
        aria-label="上一张推荐卡片"
        @click="goPrev"
      >
        <svg class="home-card-swiper-nav__ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M14.7 6.3a1 1 0 0 0-1.4 0l-6 6a1 1 0 0 0 0 1.4l6 6a1 1 0 1 0 1.4-1.4L9.4 12l5.3-5.3a1 1 0 0 0 0-1.4z"
          />
        </svg>
      </button>
      <button
        v-if="items.length > 1"
        type="button"
        class="home-card-swiper-nav home-card-swiper-nav--next"
        aria-label="下一张推荐卡片"
        @click="goNext"
      >
        <svg class="home-card-swiper-nav__ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9.3 6.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4-1.4L14.6 12 9.3 6.7a1 1 0 0 1 0-1.4z"
          />
        </svg>
      </button>

    <Swiper
      class="home-card-swiper"
      :modules="modules"
      effect="creative"
      :creative-effect="creativeEffectOpts"
      :parallax="motionOk"
      :slides-per-view="slidesPerViewCreative"
      :centered-slides="true"
      :space-between="0"
      :grab-cursor="true"
      :observer="true"
      :observe-parents="true"
      :resize-observer="true"
      :loop="enableLoop"
      :loop-additional-slides="enableLoop ? loopAdditionalSlidesCount : 0"
      :rewind="!enableLoop && items.length > 1"
      :speed="transitionMs"
      :slide-to-clicked-slide="true"
      :watch-overflow="!enableLoop"
      :loop-prevents-sliding="false"
      :pagination="{
        clickable: true,
        dynamicBullets: false,
      }"
      :autoplay="{
        delay: autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
        waitForTransition: true,
      }"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
      @real-index-change="onRealIndexChange"
      @slide-change-transition-end="onSlideChangeTransitionEnd"
    >
      <SwiperSlide v-for="item in items" :key="item.id">
        <button
          type="button"
          class="qq-card"
          :class="{ 'qq-card--active': item.id === activeItemId }"
          :style="{ '--card-bg': item.gradient }"
          @click="onCardClick(item)"
        >
          <div
            class="qq-card__parallax-bg"
            :data-swiper-parallax="motionOk ? '-18%' : undefined"
          >
            <div v-if="item.coverSrc" class="qq-card__image-box">
              <img
                class="qq-card__cover"
                :src="item.coverSrc"
                :alt="item.title"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div v-else class="news-item__visual qq-card__image-box" aria-hidden="true">
              <div class="news-item__visual-mesh" />
              <el-icon class="news-item__visual-ico" :size="36"><Reading /></el-icon>
              <span class="news-item__visual-badge">{{ item.badge || '主题' }}</span>
            </div>
          </div>
          <span v-if="item.badge" :class="badgeClass(item)">{{ item.badge }}</span>
          <span class="qq-card__shine" aria-hidden="true" />
          <div
            class="qq-card__info"
            :data-swiper-parallax="motionOk ? '-48' : undefined"
          >
            <span class="qq-card__body">
              <span class="qq-card__title">{{ item.title }}</span>
              <span class="qq-card__sub">{{ item.subtitle }}</span>
              <span v-if="item.tags?.length && !compact" class="qq-card__tags">
                <span v-for="tag in item.tags" :key="tag" class="qq-card__tag">{{ tag }}</span>
              </span>
              <span v-if="item.to" class="qq-card__hint">{{
                item.id === activeItemId ? '点击进入' : '滑至中间后进入'
              }}</span>
            </span>
          </div>
        </button>
      </SwiperSlide>
    </Swiper>

      <div
        v-if="activeItem"
        class="home-card-swiper-spotlight"
        :class="{ 'home-card-swiper-spotlight--inline': compact }"
        aria-live="polite"
      >
        <template v-if="compact">
          <span class="home-card-swiper-spotlight__title">{{ activeItem.title }}</span>
          <span class="home-card-swiper-spotlight__desc">{{
            activeItem.microHint ?? activeItem.subtitle
          }}</span>
        </template>
        <template v-else>
          <span class="home-card-swiper-spotlight__kicker">当前焦点</span>
          <span class="home-card-swiper-spotlight__title">{{ activeItem.title }}</span>
          <span class="home-card-swiper-spotlight__desc">{{
            activeItem.microHint ?? activeItem.subtitle
          }}</span>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* --- 亮色舞台重构 --- */
.home-card-swiper-wrap {
  position: relative;
  /* 调整为亮色变量 */
  --qq-bg-0: #ffffff;
  --qq-bg-1: #f8fafc;
  --qq-bg-2: #f1f5f9;
  --qq-shine-duration: 14s;
  --qq-shine-ease: cubic-bezier(0.42, 0.02, 0.58, 0.98);
  --qq-ease-carousel: cubic-bezier(0.22, 0.82, 0.28, 1);

  margin: 0 calc(-1 * var(--buddy-space, 16px)) 16px; /* 减小底部外边距 */
  padding: 12px clamp(12px, 4vw, 20px) 16px; /* 大幅压减上下无用留白 */
  /*
   * 不可用 overflow-x: clip：loop 末张居中时，右侧衔接的首屏克隆会被裁掉，表现为「右侧无法循环」。
   * 页级已有 html { overflow-x: clip }，此处保持横向可见以露出循环带。
   */
  overflow-x: visible;
  overflow-y: visible;
  border-radius: var(--buddy-radius, 14px);
  /* 亮色系渐变底色与微妙的光晕 */
  background:
    radial-gradient(120% 80% at 50% -20%, rgba(59, 130, 246, 0.06), transparent 52%),
    linear-gradient(180deg, var(--qq-bg-0) 0%, var(--qq-bg-1) 42%, var(--qq-bg-2) 100%);
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
}

.home-card-swiper-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
  /* 保持氛围光的动画，但调整为适合亮色的透明度 */
  opacity: 0.35;
  background:
    radial-gradient(ellipse 90% 55% at 15% 20%, rgb(59 130 246 / 0.22), transparent 50%),
    radial-gradient(ellipse 70% 50% at 88% 75%, rgb(168 85 247 / 0.18), transparent 48%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgb(34 211 238 / 0.1), transparent 45%);
  animation: qq-ambient-drift 14s ease-in-out infinite;
}

.home-card-swiper-wrap > * {
  position: relative;
  z-index: 1;
}

@media (min-width: 640px) {
  .home-card-swiper-wrap:not(.home-card-swiper-wrap--fullbleed) {
    margin-left: 0;
    margin-right: 0;
  }
}

/* 相对居中内容区拉满视口宽度；父级宜为整页内容宽（如单列 / grid 跨列）— 与亮色主舞台一致 */
.home-card-swiper-wrap--fullbleed {
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  margin-bottom: 16px;
  padding-top: 12px;
  padding-bottom: 16px;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
  background:
    radial-gradient(100% 120% at 50% -30%, rgba(59, 130, 246, 0.08), transparent 55%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 38%, #f1f5f9 100%);
}

.home-card-swiper-wrap--fullbleed::before {
  opacity: 0.35;
  animation-duration: 18s;
}

@media (min-width: 900px) {
  .home-card-swiper-wrap--fullbleed {
    padding-top: 14px;
    padding-bottom: 18px;
    padding-left: max(24px, env(safe-area-inset-left));
    padding-right: max(24px, env(safe-area-inset-right));
  }
}

.home-card-swiper-head {
  padding: 0 14px 14px;
  text-align: center;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

.home-card-swiper-head--visual {
  display: flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 0 10px 8px;
  max-width: none;
  margin: 0;
}

.home-card-swiper-title--visual {
  margin: 0;
  font-size: clamp(18px, 3vw, 24px);
  letter-spacing: 0.08em;
}

.home-card-swiper-meta {
  font-size: 11px;
  font-weight: 500;
  color: rgb(148 163 184);
  letter-spacing: 0.02em;
}

.home-card-swiper-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b; /* 亮色模式下的次级文字 */
}

.home-card-swiper-lead {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.65;
  color: #475569;
}

.home-card-swiper-lead--short {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.45;
  color: #475569;
}

.home-card-swiper-ribbon {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}

.home-card-swiper-ribbon__pill {
  margin: 0;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #334155;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.home-card-swiper-title {
  margin: 0 0 6px;
  font-size: clamp(17px, 2.5vw, 20px);
  font-weight: 800;
  letter-spacing: 0.06em;
  /* 亮色模式下的高饱和渐变标题 */
  background: linear-gradient(105deg, #0f172a 0%, #1e3a8a 22%, #0369a1 48%, #4c1d95 72%, #0f172a 100%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06));
}

.home-card-swiper-sub {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #475569;
}

.home-card-swiper-spotlight {
  margin: 4px 14px 0; /* 缩减顶部位移，让其贴紧卡片 */
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.home-card-swiper-spotlight__kicker {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0284c7;
}

.home-card-swiper-spotlight__title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.home-card-swiper-spotlight__desc {
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}

.home-card-swiper-spotlight--inline {
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  margin: 10px 12px 0;
  padding: 7px 12px;
}

.home-card-swiper-spotlight--inline .home-card-swiper-spotlight__title {
  flex-shrink: 0;
  font-size: 13px;
}

.home-card-swiper-spotlight--inline .home-card-swiper-spotlight__desc {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* 紧凑模式（非全宽）：边距更紧；slide 宽度见下方 --compact 规则 */
.home-card-swiper-wrap--compact:not(.home-card-swiper-wrap--fullbleed) {
  margin-bottom: 12px;
  padding: 6px clamp(6px, 2vw, 12px) 12px;
}

.home-card-swiper-wrap--compact.home-card-swiper-wrap--fullbleed {
  margin-bottom: 10px;
  padding-top: 8px;
  padding-bottom: 12px;
}

@media (min-width: 900px) {
  .home-card-swiper-wrap--compact.home-card-swiper-wrap--fullbleed {
    padding-top: 10px;
    padding-bottom: 14px;
  }
}

.home-card-swiper-wrap--compact .home-card-swiper {
  padding: 12px 0 6px;
}

.home-card-swiper-wrap--compact .home-card-swiper-nav {
  width: 38px;
  height: 38px;
}

.home-card-swiper-wrap--compact .home-card-swiper-nav__ico {
  width: 18px;
  height: 18px;
}

.home-card-swiper-wrap--compact :deep(.home-card-swiper .swiper-slide) {
  /* EffectCreative + slidesPerView：寬度由 Swiper 計算，勿覆寫 */
  min-height: clamp(160px, 22vh, 220px);
  max-height: min(40vh, 260px);
}

.home-card-swiper-wrap--compact :deep(.qq-card) {
  /*
   * 16:9 在寬屏會隨 slide 寬度把高度撐滿視窗；用 max-height 與 vh 限制首屏佔比。
   */
  min-height: clamp(160px, 22vh, 220px);
  max-height: min(40vh, 260px);
  aspect-ratio: 16 / 9;
  border-radius: 16px;
}

.home-card-swiper-wrap--compact :deep(.qq-card__body) {
  padding: 8px 12px 10px;
  gap: 3px;
  /* 底部文案区收窄，封面/渐变可视区更大 */
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 50%,
    rgb(0 0 0 / 0.45) 72%,
    rgb(0 0 0 / 0.82) 100%
  );
}

.home-card-swiper-wrap--compact :deep(.qq-card__title) {
  font-size: clamp(16px, 3.6vw, 20px);
  font-weight: 800;
}

.home-card-swiper-wrap--compact :deep(.qq-card__sub) {
  font-size: 11px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-card-swiper-wrap--compact :deep(.qq-card__tags) {
  gap: 4px;
}

.home-card-swiper-wrap--compact :deep(.qq-card__tag) {
  padding: 1px 6px;
  font-size: 9px;
}

.home-card-swiper-wrap--compact :deep(.qq-card__hint) {
  margin-top: 4px;
  font-size: 10px;
}

.home-card-swiper-wrap--compact :deep(.qq-card__badge) {
  top: 8px;
  left: 8px;
  padding: 3px 7px;
  font-size: 9px;
  border-radius: 6px;
}

.home-card-swiper-wrap--compact .home-card-swiper :deep(.swiper-pagination) {
  padding: 6px 0 2px !important;
  gap: 6px !important;
}

.home-card-swiper-wrap--compact .home-card-swiper :deep(.swiper-pagination-bullet) {
  width: 6px;
  height: 5px;
}

.home-card-swiper-wrap--compact .home-card-swiper :deep(.swiper-pagination-bullet-active) {
  width: 32px;
  height: 5px;
}

.home-card-swiper-stage {
  position: relative;
  z-index: 0;
  overflow: visible;
  isolation: isolate;
  perspective: 1400px;
  perspective-origin: 50% 44%;
  /* 防止 flex 子項在 Swiper 尚未完成量測時被壓成 0 高度 */
  /* 舞台最小高度适当压低，防止撑开多余空白 */
  min-height: clamp(160px, 30vw, 340px);
}

.home-card-swiper-wrap--compact .home-card-swiper-stage {
  min-height: clamp(150px, min(28vw, 38vh), 280px);
  max-height: min(44vh, 300px);
}

/* --- 控制按钮亮色化 --- */
.home-card-swiper-nav {
  position: absolute;
  z-index: 8;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin: 0;
  padding: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #334155;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(12px) saturate(1.2);
  transition:
    background 0.28s var(--qq-ease-carousel),
    border-color 0.28s var(--qq-ease-carousel),
    transform 0.22s var(--qq-ease-carousel),
    box-shadow 0.35s var(--qq-ease-carousel);
}

.home-card-swiper-nav--prev {
  left: clamp(2px, 1.5vw, 10px);
}

.home-card-swiper-nav--next {
  right: clamp(2px, 1.5vw, 10px);
}

.home-card-swiper-nav:hover {
  background: #ffffff;
  border-color: rgba(59, 130, 246, 0.3);
  color: #2563eb;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
  transform: translateY(-50%) scale(1.06);
}

.home-card-swiper-nav:active {
  transform: translateY(-50%) scale(0.96);
}

.home-card-swiper-nav:focus-visible {
  outline: 2px solid rgb(96 165 250);
  outline-offset: 3px;
}

.home-card-swiper-nav__ico {
  display: block;
  width: 22px;
  height: 22px;
}

.home-card-swiper-nav.swiper-button-disabled {
  opacity: 0.28;
  cursor: not-allowed;
  pointer-events: none;
}

.home-card-swiper {
  width: 100%;
  max-width: 100%;
  padding: 8px 0 10px;
  /* 允许两侧露边；裁切交给 .home-card-swiper-wrap */
  overflow: visible;
  box-sizing: border-box;
}

/*
 * 根节点同时带 .swiper（无内层 .swiper），必须用合并选择器覆盖 swiper.css 的 overflow:hidden，
 * 否则会裁掉居中时左右邻卡，表现为「一侧空白、无法对称露边」。
 */
.home-card-swiper.swiper {
  overflow: visible !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  /* 继承 wrap 的曲线；保证轨道与卡片 easing 一致 */
  --swiper-wrapper-transition-timing-function: var(--qq-ease-carousel);
}

.home-card-swiper :deep(.swiper-wrapper) {
  align-items: center;
  overflow: visible;
}

/*
 * EffectCreative：slide 寬度由 Swiper（slidesPerView）寫入，勿設固定 width。
 */
.home-card-swiper :deep(.swiper-slide) {
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: visible;
  display: flex;
  justify-content: center;
  align-items: stretch;
  min-height: clamp(196px, 34vw, 360px);
  transform-style: preserve-3d;
  transition:
    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity var(--qq-swiper-dur, 680ms) var(--qq-ease-carousel);
}

.home-card-swiper :deep(.swiper-slide:not(.swiper-slide-active) .qq-card) {
  filter: brightness(0.68) saturate(0.8);
  box-shadow:
    0 12px 28px rgb(0 0 0 / 0.22),
    0 20px 40px -10px rgb(var(--current-theme-rgb) / 0.18);
}

.home-card-swiper :deep(.swiper-slide-active .qq-card) {
  transform: scale(1.05);
  filter: saturate(1.08) brightness(1.04);
  animation: qq-active-breathe 3.4s ease-in-out infinite;
}

@keyframes qq-active-breathe {
  0%,
  100% {
    box-shadow:
      var(--meta-shadow-card),
      0 28px 56px rgb(0 0 0 / 0.28),
      0 0 0 2px rgb(255 255 255 / 0.28) inset,
      0 0 48px rgb(var(--current-theme-rgb) / 0.22);
  }
  50% {
    box-shadow:
      0 24px 48px -10px rgb(var(--current-theme-rgb) / 0.38),
      0 32px 64px rgb(0 0 0 / 0.26),
      0 0 0 2px rgb(255 255 255 / 0.34) inset,
      0 0 64px rgb(var(--current-theme-rgb) / 0.26);
  }
}

/* 分页：相对整块轮播水平居中（覆盖 Swiper 默认 absolute 偏一侧） */
.home-card-swiper :deep(.swiper-pagination) {
  position: relative !important;
  bottom: auto !important;
  left: 0 !important;
  right: auto !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 14px 0 6px !important;
  transform: none !important;
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 8px !important;
}

.home-card-swiper :deep(.swiper-pagination-bullet) {
  /* 胶囊短条：未激活更短，激活拉长 + 品牌渐变 */
  width: 7px;
  height: 6px;
  border-radius: 999px;
  margin: 0 !important;
  background: rgb(148 163 184 / 0.45);
  opacity: 1;
  transition:
    transform var(--qq-swiper-dur, 680ms) var(--qq-ease-carousel),
    width 0.38s cubic-bezier(0.33, 0.9, 0.32, 1),
    background var(--qq-swiper-dur, 680ms) var(--qq-ease-carousel),
    opacity var(--qq-swiper-dur, 680ms) var(--qq-ease-carousel);
}

.home-card-swiper :deep(.swiper-pagination-bullet-active) {
  width: 42px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--meta-primary),
    rgb(var(--current-theme-rgb) / 0.95),
    var(--meta-secondary),
    var(--meta-accent)
  );
  box-shadow:
    var(--meta-shadow-card),
    0 0 18px rgb(var(--current-theme-rgb) / 0.4);
  animation: qq-bullet-pulse 2.4s ease-in-out infinite;
}

.qq-card__parallax-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  overflow: hidden;
  transform: translateZ(0);
}

.qq-card__image-box {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
}

.qq-card__image-box img {
  transform: scale(1.2);
  transform-origin: center center;
  transition: transform 0.8s ease-out;
}

.home-card-swiper :deep(.swiper-slide-active .qq-card__image-box img) {
  transform: scale(1);
}

.qq-card__parallax-bg .news-item__visual {
  min-height: 100%;
  height: 100%;
}

.qq-card {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-height: clamp(180px, 32vw, 248px);
  aspect-ratio: 16 / 9;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  border-radius: 24px;
  background: var(--card-bg, linear-gradient(135deg, #1e3a8a 0%, #312e81 100%));
  background-color: #1e2433;
  box-shadow:
    var(--meta-shadow-card),
    0 10px 28px rgb(var(--current-theme-rgb) / 0.14),
    0 12px 32px rgb(0 0 0 / 0.2),
    0 0 0 1px rgb(255 255 255 / 0.1) inset;
  overflow: hidden;
  transition:
    transform var(--qq-swiper-dur, 680ms) var(--qq-ease-carousel),
    filter var(--qq-swiper-dur, 680ms) var(--qq-ease-carousel),
    box-shadow var(--qq-swiper-dur, 680ms) var(--qq-ease-carousel);
}

@media (min-width: 900px) {
  .qq-card {
    border-radius: 24px;
  }
}

.qq-card:focus-visible {
  outline: 2px solid rgb(96 165 250);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: no-preference) {
  .home-card-swiper :deep(.swiper-slide-active .qq-card:hover) {
    transform: translateY(-4px) scale(1.06);
    box-shadow:
      var(--meta-shadow-card),
      0 22px 44px rgb(0 0 0 / 0.26),
      0 20px 40px -10px rgb(var(--current-theme-rgb) / 0.34),
      0 0 0 1px rgb(255 255 255 / 0.14) inset;
  }
}

.qq-card:active {
  transform: scale(0.98);
}

.qq-card__cover {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  border-radius: inherit;
}

.qq-card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  padding: 4px 9px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
  border-radius: 7px;
  border: 1px solid rgb(255 255 255 / 0.22);
  color: #fff;
  text-shadow: 0 1px 6px rgb(0 0 0 / 0.45);
  box-shadow:
    0 4px 16px rgb(0 0 0 / 0.35),
    0 0 0 1px rgb(0 0 0 / 0.15) inset;
  pointer-events: none;
}

.qq-card__badge--blue {
  background: linear-gradient(135deg, rgb(29 78 216 / 0.95) 0%, rgb(59 130 246 / 0.88) 100%);
}

.qq-card__badge--violet {
  background: linear-gradient(135deg, rgb(91 33 182 / 0.95) 0%, rgb(139 92 246 / 0.88) 100%);
}

.qq-card__badge--teal {
  background: linear-gradient(135deg, rgb(15 118 110 / 0.95) 0%, rgb(20 184 166 / 0.88) 100%);
}

.qq-card__badge--gold {
  background: linear-gradient(135deg, rgb(146 64 14 / 0.96) 0%, rgb(245 158 11 / 0.9) 100%);
}

.qq-card__badge--pink {
  background: linear-gradient(135deg, rgb(157 23 77 / 0.95) 0%, rgb(236 72 153 / 0.9) 100%);
}

.qq-card__badge--cyan {
  background: linear-gradient(135deg, rgb(14 116 144 / 0.95) 0%, rgb(34 211 238 / 0.88) 100%);
}

.qq-card__badge--orange {
  background: linear-gradient(135deg, rgb(194 65 12 / 0.95) 0%, rgb(251 146 60 / 0.9) 100%);
}

.qq-card__shine {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    125deg,
    rgb(255 255 255 / 0.18) 0%,
    transparent 42%,
    transparent 60%,
    rgb(255 255 255 / 0.05) 100%
  );
  pointer-events: none;
  border-radius: inherit;
}

.home-card-swiper :deep(.swiper-slide-active .qq-card__shine) {
  background: linear-gradient(
    118deg,
    transparent 0%,
    rgb(255 255 255 / 0.05) 38%,
    rgb(255 255 255 / 0.28) 50%,
    rgb(255 255 255 / 0.06) 62%,
    transparent 100%
  );
  background-size: 260% 260%;
  animation: qq-shine-sweep var(--qq-shine-duration) var(--qq-shine-ease) infinite;
}

.qq-card__info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 0;
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.5s ease 0.2s,
    transform 0.5s ease 0.2s;
}

.home-card-swiper :deep(.swiper-slide-active .qq-card__info) {
  opacity: 1;
  transform: translateY(0);
}

.qq-card__body {
  padding: 16px 18px 18px;
  background: linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 0.5) 38%, rgb(0 0 0 / 0.75) 100%);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qq-card__title {
  font-size: clamp(17px, 3.8vw, 22px);
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 12px rgb(0 0 0 / 0.45);
}

.qq-card__sub {
  font-size: 12px;
  line-height: 1.45;
  color: rgb(226 232 240);
  opacity: 0.95;
}

.qq-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.qq-card__tag {
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 5px;
  background: rgb(255 255 255 / 0.12);
  border: 1px solid rgb(255 255 255 / 0.14);
  color: rgb(241 245 249);
}

.qq-card__hint {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgb(186 230 253);
  text-transform: uppercase;
}

@keyframes qq-ambient-drift {
  0%,
  100% {
    opacity: 0.48;
  }
  50% {
    opacity: 0.78;
  }
}

@keyframes qq-shine-sweep {
  /* 起止略停留，避免光带「整圈连扫」显得急促 */
  0%,
  10% {
    background-position: 8% 42%;
  }
  45% {
    background-position: 92% 58%;
  }
  55% {
    background-position: 92% 58%;
  }
  90%,
  100% {
    background-position: 8% 42%;
  }
}

@keyframes qq-bullet-pulse {
  0%,
  100% {
    box-shadow:
      0 0 14px rgb(var(--current-theme-rgb) / 0.4),
      0 0 26px rgb(var(--current-theme-rgb) / 0.22);
    filter: brightness(1);
  }
  50% {
    box-shadow:
      0 0 26px rgb(var(--current-theme-rgb) / 0.55),
      0 0 44px rgb(var(--current-theme-rgb) / 0.3);
    filter: brightness(1.12);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-card-swiper-wrap::before {
    animation: none;
    opacity: 0.4;
  }

  .home-card-swiper-title {
    animation: none;
    color: rgb(248 250 252);
    background: none;
    filter: none;
    -webkit-background-clip: unset;
    background-clip: unset;
  }

  .home-card-swiper-stage {
    perspective: none;
  }

  .qq-card {
    transition: none;
  }

  .home-card-swiper :deep(.swiper-slide-active .qq-card) {
    animation: none;
    box-shadow:
      var(--meta-shadow-card),
      0 28px 56px rgb(0 0 0 / 0.32),
      0 0 0 2px rgb(255 255 255 / 0.26) inset,
      0 0 56px rgb(var(--current-theme-rgb) / 0.16);
  }

  .home-card-swiper :deep(.swiper-slide-active .qq-card__shine) {
    animation: none;
  }

  .home-card-swiper :deep(.swiper-pagination-bullet-active) {
    animation: none;
    filter: none;
  }

  .home-card-swiper :deep(.swiper-slide .qq-card) {
    transform: none;
    filter: none;
  }

  .home-card-swiper :deep(.qq-card__info) {
    transition: none;
  }

  .home-card-swiper :deep(.swiper-slide-active .qq-card__info) {
    opacity: 1;
    transform: none;
  }

  .home-card-swiper :deep(.swiper-slide-active .qq-card__image-box img) {
    transform: none;
    transition: none;
  }

  .home-card-swiper :deep(.swiper-pagination-bullet) {
    transition: opacity 0.15s ease;
  }
}
</style>
