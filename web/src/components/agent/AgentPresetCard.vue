<template>
  <div
    class="agent-preset-card"
    :class="{ 'is-selected': selected, 'is-loading': loading, 'is-disabled': disabled || loading }"
    :data-hero="preset.heroId"
    :style="cardStyle"
    role="button"
    :tabindex="disabled || loading ? -1 : 0"
    :aria-disabled="disabled || loading ? 'true' : 'false'"
    :aria-pressed="selected"
    @click="onActivate"
    @keydown.enter.prevent="onActivate"
    @keydown.space.prevent="onActivate"
  >
    <div v-if="loading" class="agent-preset-card__loading" aria-hidden="true" />
    <div class="agent-preset-card__content">
      <div class="agent-preset-card__tags">
        <span v-for="(tag, index) in displayTags" :key="index" class="agent-preset-card__tag">
          {{ tag }}
        </span>
      </div>
      <div class="agent-preset-card__info">
        <h3 class="agent-preset-card__name">{{ preset.name }}</h3>
        <p class="agent-preset-card__desc">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AgentOfficialPreset } from '@/data/agentPresets'

const props = defineProps<{
  preset: AgentOfficialPreset
  selected?: boolean
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

function onActivate() {
  if (props.disabled || props.loading) return
  emit('select')
}

const silhouetteSrc = computed(() => props.preset.silhouetteUrl ?? props.preset.avatarUrl)

const cardStyle = computed(() => ({
  '--hero-silhouette': `url('${encodeURI(silhouetteSrc.value)}')`,
}))

const description = computed(() => `${props.preset.tagline} · ${props.preset.detail}`)

const displayTags = computed(() => {
  const chunks = props.preset.detail
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
  const tags = [props.preset.tagline, ...chunks]
  return tags.slice(0, 4)
})
</script>

<style scoped>
/* 純 div；透視由父級 .agent-presets-carousel 提供，此處 preserve-3d 承接 rotateX */
.agent-preset-card {
  position: relative;
  flex: 0 0 auto;
  width: 280px;
  height: 360px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border: 2px solid transparent !important;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: #ffffff !important;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  scroll-snap-align: start;
  transition:
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.35s ease;
  /* Glass 2.0：內緣高光 + 輕微景深預備 */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
  outline: none;
}

.agent-preset-card:focus-visible {
  outline: 2px solid rgb(var(--buddy-rgb-brand) / 0.55);
  outline-offset: 3px;
}

.agent-preset-card.is-disabled {
  opacity: 0.65;
  cursor: not-allowed;
  pointer-events: none;
}

.agent-preset-card[data-hero='luna'] {
  background-image:
    repeating-linear-gradient(118deg, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px 26px),
    linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%) !important;
}

.agent-preset-card[data-hero='diaochan'] {
  background-image:
    repeating-linear-gradient(118deg, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px 26px),
    linear-gradient(135deg, #831843 0%, #db2777 50%, #f472b6 100%) !important;
}

.agent-preset-card[data-hero='default'] {
  background-image:
    repeating-linear-gradient(118deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 26px),
    linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%) !important;
}

.agent-preset-card::before {
  content: '';
  position: absolute;
  right: -18%;
  bottom: -8%;
  width: 118%;
  height: 118%;
  background-image: var(--hero-silhouette);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: bottom right;
  transform: translateZ(22px) rotate(0deg);
  transform-style: preserve-3d;
  /* 內建漸層 SVG：略提不透明度 + 飽和，避免變灰塊 */
  opacity: 0.66;
  filter: saturate(1.15) contrast(1.04) drop-shadow(0 10px 32px rgba(0, 0, 0, 0.28))
    drop-shadow(0 0 28px rgba(255, 255, 255, 0.12));
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease, filter 0.45s ease;
  z-index: 1;
}

/* 頂部高光：勿用 soft-light（會沖淡剪影色相） */
.agent-preset-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 44%;
  border-radius: 20px 20px 0 0;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 78%);
  opacity: 0.55;
  transition: opacity 0.45s ease;
}

.agent-preset-card__content {
  position: relative;
  z-index: 3;
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* 底部蒙版：不用 backdrop-filter，避免把底層剪影糊掉 */
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.12) 32%,
    rgba(0, 0, 0, 0.72) 100%
  ) !important;
}

.agent-preset-card:hover:not(.is-disabled) {
  /* 父級 perspective + rotateX 才有「脫框」縱深感；translateZ 略抬升 */
  transform: translate3d(0, -12px, 12px) rotateX(5deg);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.35),
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.28) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
}

.agent-preset-card:hover:not(.is-disabled)::after {
  opacity: 0.72;
}

.agent-preset-card:hover:not(.is-disabled)::before {
  transform: translateZ(52px) scale(1.1) rotate(4deg);
  opacity: 0.82;
  filter: saturate(1.22) contrast(1.06) drop-shadow(0 14px 40px rgba(0, 0, 0, 0.32))
    drop-shadow(0 0 36px rgba(255, 255, 255, 0.18));
}

.agent-preset-card.is-selected {
  border-color: rgba(255, 255, 255, 0.55) !important;
  box-shadow:
    0 0 0 2px rgba(59, 130, 246, 0.55),
    0 18px 48px rgba(59, 130, 246, 0.28) !important;
}

.agent-preset-card.is-loading {
  pointer-events: none;
}

.agent-preset-card__loading {
  position: absolute;
  inset: 0;
  z-index: 5;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.45) !important;
  backdrop-filter: blur(2px);
}

.agent-preset-card__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.agent-preset-card__tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.agent-preset-card__info {
  color: #ffffff !important;
}

.agent-preset-card__name {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 8px;
  line-height: 1.2;
  color: #ffffff !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.agent-preset-card__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.92) !important;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .agent-preset-card:hover:not(.is-disabled) {
    transform: none;
  }
  .agent-preset-card:hover:not(.is-disabled)::before {
    transform: translateZ(0) scale(1) rotate(0deg);
    opacity: 0.66;
  }
}
</style>
