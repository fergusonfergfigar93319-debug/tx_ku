<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 下拉结束松手时执行，需返回 Promise */
    refresh: () => Promise<void>
    /** 宽屏网页：不显示下拉区与独立滚动，仅渲染插槽（整页滚动） */
    plain?: boolean
    disabled?: boolean
    /**
     * calc：用视口高度减预留（列表页默认）
     * flex-fill：占满父级 flex 剩余空间（父级需为 column flex + 固定/最小高度）
     */
    variant?: 'calc' | 'flex-fill'
    /** 与顶栏、页头、分段等预留高度（px），用于滚动区 max-height（仅 variant=calc） */
    reservedTopExtra?: number
    /** 视口底部预留（safe-area + 边距等，非 Tab 底栏）（px）（仅 variant=calc） */
    reservedBottom?: number
  }>(),
  {
    plain: false,
    disabled: false,
    variant: 'calc',
    reservedTopExtra: 200,
    /** 无额外底部 UI 时为 safe-area + 少量边距 */
    reservedBottom: 24,
  }
)

const scrollEl = ref<HTMLElement | null>(null)
const pull = ref(0)
const internalRefreshing = ref(false)

const startY = ref(0)
const startScrollTop = ref(0)
const tracking = ref(false)

const hintText = computed(() => {
  if (internalRefreshing.value) return '刷新中…'
  if (pull.value > 36) return '松开刷新'
  if (pull.value > 8) return '下拉刷新'
  return '下拉可刷新'
})

const scrollMaxHeight = computed(
  () =>
    `calc(100dvh - 52px - ${props.reservedBottom}px - ${props.reservedTopExtra}px - env(safe-area-inset-top, 0px))`
)

const scrollStyle = computed(() => {
  if (props.variant === 'flex-fill') {
    return {
      maxHeight: 'none',
      flex: '1',
      minHeight: '0',
    }
  }
  return { maxHeight: scrollMaxHeight.value }
})

const trackTransform = computed(() => ({
  transform: `translate3d(0, ${pull.value}px, 0)`,
  transition: tracking.value ? 'none' : 'transform 0.22s ease-out',
}))

function clampPull(y: number) {
  return Math.min(Math.max(0, y) * 0.5, 64)
}

function onTouchStart(e: TouchEvent) {
  if (props.disabled || internalRefreshing.value) return
  const el = scrollEl.value
  if (!el) return
  startScrollTop.value = el.scrollTop
  startY.value = e.touches[0].clientY
  tracking.value = startScrollTop.value <= 0
}

function onTouchMove(e: TouchEvent) {
  if (!tracking.value || props.disabled || internalRefreshing.value) return
  const el = scrollEl.value
  if (!el || el.scrollTop > 0) {
    pull.value = 0
    tracking.value = false
    return
  }
  const dy = e.touches[0].clientY - startY.value
  if (dy > 0) {
    e.preventDefault()
    pull.value = clampPull(dy)
  } else {
    pull.value = 0
  }
}

async function onTouchEnd() {
  if (!tracking.value && pull.value === 0) return
  tracking.value = false
  const threshold = 36
  if (pull.value >= threshold && !internalRefreshing.value) {
    pull.value = 0
    internalRefreshing.value = true
    try {
      await props.refresh()
    } finally {
      internalRefreshing.value = false
    }
  } else {
    pull.value = 0
  }
}

async function onHintClick() {
  if (props.disabled || internalRefreshing.value) return
  internalRefreshing.value = true
  try {
    await props.refresh()
  } finally {
    internalRefreshing.value = false
  }
}

let moveListener: ((e: TouchEvent) => void) | null = null

onMounted(() => {
  if (props.plain) return
  const el = scrollEl.value
  if (!el) return
  moveListener = (e: TouchEvent) => onTouchMove(e)
  el.addEventListener('touchmove', moveListener, { passive: false })
})

onBeforeUnmount(() => {
  if (props.plain) return
  const el = scrollEl.value
  if (el && moveListener) el.removeEventListener('touchmove', moveListener)
})
</script>

<template>
  <div v-if="plain" class="buddy-pull-plain">
    <slot />
  </div>
  <div v-else class="buddy-pull" :class="{ 'is-flex-fill': variant === 'flex-fill' }">
    <div
      class="hint-row buddy-card-surface"
      role="button"
      tabindex="0"
      :class="{ active: pull > 8 || internalRefreshing }"
      @click="onHintClick"
      @keydown.enter.prevent="onHintClick"
    >
      <div v-if="internalRefreshing" class="buddy-pull-bar buddy-shimmer-fill" aria-hidden="true" />
      <span v-else class="hint-label">{{ hintText }}</span>
    </div>
    <div
      ref="scrollEl"
      class="buddy-pull-scroll"
      :style="scrollStyle"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <div class="buddy-pull-track" :style="trackTransform">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.buddy-pull-plain {
  min-height: 0;
}

.buddy-pull {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.buddy-pull.is-flex-fill {
  flex: 1;
  min-height: 0;
}

.hint-row {
  flex-shrink: 0;
  position: relative;
  margin-bottom: 10px;
  padding: 8px 12px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px dashed var(--buddy-border-strong);
  box-shadow: none;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.hint-row.active {
  border-style: solid;
  border-color: rgba(0, 122, 255, 0.25);
  background: var(--buddy-info-banner);
}

.hint-label {
  font-size: 12px;
  color: var(--buddy-text-muted);
  font-weight: 500;
}

.hint-row.active .hint-label {
  color: var(--buddy-primary);
}

.buddy-pull-bar {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  max-width: 160px;
}

.buddy-pull-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  min-height: 120px;
}

.buddy-pull-track {
  will-change: transform;
}
</style>
