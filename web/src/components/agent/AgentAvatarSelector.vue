<template>
  <div class="avatar-selector">
    <div v-if="showSectionHeader" class="section-header">
      <h3 class="section-title">搭子形象设定 (Avatar Style)</h3>
      <p class="section-subtitle">选择符合该搭子人设的视觉外观；提交值与 App 端枚举一致</p>
    </div>

    <div class="avatar-grid" role="listbox" :aria-label="ariaLabel">
      <div
        v-for="style in rows"
        :id="'avatar-style-' + style.value"
        :key="style.value"
        class="avatar-card"
        :class="{
          'is-selected': modelValue === style.value,
          'is-light': style.theme === 'neutral',
          'is-disabled': disabled,
        }"
        :data-theme="style.theme"
        role="option"
        :aria-selected="modelValue === style.value"
        :tabindex="disabled ? -1 : 0"
        @click="select(style.value)"
        @keydown.enter.prevent="select(style.value)"
        @keydown.space.prevent="select(style.value)"
      >
        <div class="avatar-card__bg" aria-hidden="true" />
        <div class="avatar-card__content">
          <span class="avatar-card__icon" aria-hidden="true">{{ style.icon }}</span>
          <span class="avatar-card__label">{{ style.shortLabel }}</span>
          <span class="avatar-card__value" aria-hidden="true">{{ style.value }}</span>
        </div>
        <div v-if="modelValue === style.value" class="avatar-card__glow" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AVATAR_STYLE_OPTIONS } from '@/data/agentTuningOptions'

/**
 * 与 Android `AgentTuningOptions.avatarStyles` 逐字一致；仅 shortLabel / theme / icon 为 Web 展示用
 */
const STYLE_META: Record<string, { shortLabel: string; theme: string; icon: string }> = {
  通用淡彩: { shortLabel: '通用淡彩', theme: 'neutral', icon: '✨' },
  '英雄主题·对抗路': { shortLabel: '战边霸主', theme: 'top', icon: '⚔️' },
  '英雄主题·打野': { shortLabel: '野区利刃', theme: 'jungle', icon: '🗡️' },
  '英雄主题·中路': { shortLabel: '中路掌控', theme: 'mid', icon: '🔮' },
  '英雄主题·发育路': { shortLabel: '发育核心', theme: 'adc', icon: '🏹' },
  '英雄主题·游走': { shortLabel: '游走护航', theme: 'support', icon: '🛡️' },
  赛事实况台: { shortLabel: '专业解说', theme: 'esports', icon: '🎙️' },
  军师复盘型: { shortLabel: '军师复盘', theme: 'review', icon: '📊' },
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** 独立一页时可打开标题区；嵌在表单里建议 false */
    showSectionHeader?: boolean
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    showSectionHeader: false,
    disabled: false,
    ariaLabel: '形象风格',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rows = computed(() =>
  AVATAR_STYLE_OPTIONS.map((value) => {
    const m = STYLE_META[value]
    return {
      value,
      shortLabel: m?.shortLabel ?? value,
      theme: m?.theme ?? 'neutral',
      icon: m?.icon ?? '◆',
    }
  }),
)

function select(value: string) {
  if (props.disabled) return
  emit('update:modelValue', value)
}
</script>

<style scoped>
.avatar-selector {
  width: 100%;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
  color: var(--buddy-text);
}

.section-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--buddy-text-muted);
  line-height: 1.45;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 16px;
}

.avatar-card {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s ease,
    border-color 0.35s ease;
  background: var(--buddy-surface);
  border: 1px solid var(--buddy-border);
  outline: none;
}

.avatar-card:focus-visible {
  box-shadow: 0 0 0 2px rgb(var(--buddy-rgb-brand) / 0.45);
}

.avatar-card__bg {
  position: absolute;
  inset: 0;
  opacity: 0.85;
  transition:
    opacity 0.4s ease,
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.avatar-card[data-theme='neutral'] .avatar-card__bg {
  background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
}
.avatar-card[data-theme='top'] .avatar-card__bg {
  background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%);
}
.avatar-card[data-theme='jungle'] .avatar-card__bg {
  background: linear-gradient(135deg, #0f172a 0%, #3b82f6 100%);
}
.avatar-card[data-theme='mid'] .avatar-card__bg {
  background: linear-gradient(135deg, #4c1d95 0%, #a855f7 100%);
}
.avatar-card[data-theme='adc'] .avatar-card__bg {
  background: linear-gradient(135deg, #7c2d12 0%, #f59e0b 100%);
}
.avatar-card[data-theme='support'] .avatar-card__bg {
  background: linear-gradient(135deg, #064e3b 0%, #10b981 100%);
}
.avatar-card[data-theme='esports'] .avatar-card__bg {
  background: linear-gradient(135deg, #1e293b 0%, #0ea5e9 100%);
}
.avatar-card[data-theme='review'] .avatar-card__bg {
  background: linear-gradient(135deg, #0c4a6e 0%, #38bdf8 100%);
}

.avatar-card__content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.58) 100%);
  color: #fff;
}

.avatar-card.is-light .avatar-card__content {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(15, 23, 42, 0.35) 100%);
  color: #0f172a;
}

.avatar-card__icon {
  font-size: 34px;
  line-height: 1;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.avatar-card__label {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  letter-spacing: 0.02em;
  line-height: 1.25;
}

.avatar-card.is-light .avatar-card__label {
  text-shadow: none;
}

.avatar-card__value {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.75;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.avatar-card.is-light .avatar-card__value {
  color: #334155;
  opacity: 0.9;
}

.avatar-card:hover:not(.is-disabled) {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.14);
}

.avatar-card:hover:not(.is-disabled) .avatar-card__icon {
  transform: scale(1.15);
}

.avatar-card:hover:not(.is-disabled) .avatar-card__bg {
  transform: scale(1.05);
  opacity: 1;
}

.avatar-card.is-selected {
  border: 2px solid rgba(255, 255, 255, 0.92);
  transform: translateY(-8px);
  box-shadow:
    0 16px 36px rgba(37, 99, 235, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.35) inset;
}

.avatar-card__glow {
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  z-index: 0;
  pointer-events: none;
  box-shadow: 0 0 22px 5px rgba(59, 130, 246, 0.45);
  animation: pulse-glow 2s ease-in-out infinite alternate;
}

.avatar-card.is-selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
  z-index: 4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  animation: check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.avatar-card.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

@keyframes pulse-glow {
  0% {
    opacity: 0.45;
    filter: blur(5px);
  }
  100% {
    opacity: 0.95;
    filter: blur(10px);
  }
}

@keyframes check-pop {
  0% {
    transform: scale(0);
  }
  55% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .avatar-card,
  .avatar-card__bg,
  .avatar-card__icon {
    transition: none;
  }
  .avatar-card:hover:not(.is-disabled) {
    transform: none;
  }
  .avatar-card.is-selected {
    transform: none;
  }
  .avatar-card__glow {
    animation: none;
    opacity: 0.7;
  }
  .avatar-card.is-selected::after {
    animation: none;
  }
}

:global(html.dark) .avatar-card {
  border-color: rgba(255, 255, 255, 0.1);
}

:global(html.dark) .avatar-card.is-light .avatar-card__content {
  color: #f8fafc;
}

:global(html.dark) .avatar-card.is-light .avatar-card__value {
  color: #e2e8f0;
}
</style>
