<template>
  <div class="scenario-selector">
    <div class="scenario-grid" role="listbox" :aria-label="ariaLabel">
      <div
        v-for="scenario in rows"
        :key="scenario.value"
        class="scenario-card"
        :class="{ 'is-selected': modelValue === scenario.value, 'is-disabled': disabled }"
        role="option"
        :aria-selected="modelValue === scenario.value"
        :tabindex="disabled ? -1 : 0"
        @click="select(scenario.value)"
        @keydown.enter.prevent="select(scenario.value)"
        @keydown.space.prevent="select(scenario.value)"
      >
        <div
          v-if="modelValue === scenario.value"
          class="scenario-card__glow"
          aria-hidden="true"
        />

        <div class="scenario-card__content">
          <span class="scenario-icon" aria-hidden="true">{{ scenario.icon }}</span>
          <span class="scenario-label">{{ scenario.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FOCUS_SCENARIO_OPTIONS } from '@/data/agentTuningOptions'

/** 與 `FOCUS_SCENARIO_OPTIONS` 逐字對應；僅 icon 為 Web 展示用 */
const SCENARIO_META: Record<string, { icon: string }> = {
  通用: { icon: '✨' },
  组队招募: { icon: '🤝' },
  赛后复盘: { icon: '📊' },
  缓解压力: { icon: '🧘‍♀️' },
  王者荣耀: { icon: '⚔️' },
  王者电竞: { icon: '🏆' },
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    disabled: false,
    ariaLabel: '專注場景',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rows = computed(() =>
  FOCUS_SCENARIO_OPTIONS.map((value) => ({
    value,
    label: value,
    icon: SCENARIO_META[value]?.icon ?? '◆',
  })),
)

function select(value: string) {
  if (props.disabled) return
  emit('update:modelValue', value)
}
</script>

<style scoped>
.scenario-selector {
  width: 100%;
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.scenario-card {
  position: relative;
  height: 88px;
  background: var(--buddy-surface, #ffffff);
  border: 1px solid var(--buddy-border, #e2e8f0);
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  outline: none;
}

.scenario-card:focus-visible {
  box-shadow: 0 0 0 2px rgb(var(--buddy-rgb-brand, 59 130 246) / 0.45);
}

.scenario-card.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
  pointer-events: none;
}

.scenario-card__glow {
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  z-index: 0;
  pointer-events: none;
  box-shadow: 0 0 20px 4px rgba(59, 130, 246, 0.35);
  animation: pulse-glow 2s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  from {
    opacity: 0.65;
  }
  to {
    opacity: 1;
  }
}

.scenario-card__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.scenario-icon {
  font-size: 28px;
  line-height: 1;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scenario-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--buddy-text-regular, #475569);
  transition:
    color 0.3s ease,
    font-weight 0.3s ease;
}

.scenario-card:hover:not(.is-disabled) {
  transform: translateY(-4px);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.scenario-card:hover:not(.is-disabled) .scenario-icon {
  transform: scale(1.15) rotate(8deg);
}

.scenario-card.is-selected {
  border-color: transparent;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.05) 0%,
    rgba(124, 58, 237, 0.05) 100%
  );
  box-shadow:
    0 0 0 2px #3b82f6,
    0 8px 24px rgba(59, 130, 246, 0.25);
  transform: translateY(-4px);
}

.scenario-card.is-selected .scenario-label {
  color: #3b82f6;
  font-weight: 600;
}

.scenario-card.is-selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  z-index: 3;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
  animation: check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .scenario-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
