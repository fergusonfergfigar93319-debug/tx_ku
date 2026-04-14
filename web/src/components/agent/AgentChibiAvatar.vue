<script setup lang="ts">
import { computed, useId } from 'vue'
import type { AgentBuddyQDesign } from '@/types/agentQDesign'
import { DEFAULT_AGENT_Q_DESIGN, normalizeAgentQDesign } from '@/types/agentQDesign'

const props = withDefaults(
  defineProps<{
    design?: AgentBuddyQDesign | null
    size?: number
    withBackdrop?: boolean
  }>(),
  {
    design: null,
    size: 120,
    withBackdrop: true,
  },
)

const d = computed(() => normalizeAgentQDesign(props.design ?? DEFAULT_AGENT_Q_DESIGN))

const skinFill = computed(() => {
  const map = ['#ffe8dc', '#ffd4bc', '#e8b896', '#c49a78']
  return map[d.value.skinTone] ?? map[1]
})

const hairPath = computed(() => {
  const c = d.value.hairColor
  const paths: Record<number, string> = {
    0: 'M22 52 Q18 28 50 18 Q82 28 78 52 Q88 48 92 62 Q88 75 78 70 Q70 38 50 32 Q30 38 22 70 Q12 75 8 62 Q12 48 22 52Z',
    1: 'M15 58 Q20 22 50 14 Q80 22 85 58 Q92 42 96 55 Q90 78 78 68 Q72 36 50 28 Q28 36 22 68 Q10 78 4 55 Q8 42 15 58Z',
    2: 'M25 55 Q28 20 50 16 Q72 20 75 55 Q82 30 94 48 Q88 72 76 65 Q68 40 50 34 Q32 40 24 65 Q12 72 6 48 Q18 30 25 55Z',
    3: 'M20 50 Q24 26 50 20 Q76 26 80 50 Q86 44 90 58 Q84 76 74 72 Q66 44 50 38 Q34 44 26 72 Q16 76 10 58 Q14 44 20 50Z',
  }
  return { path: paths[d.value.hairStyle] ?? paths[1], fill: c }
})

type EyeSimple = { mode: 'simple'; lx: number; rx: number; y: number; r: number; py: number; pr: number }
type EyeSparkle = { mode: 'sparkle'; lx: number; rx: number; y: number; r: number; py: number; pr: number }
type EyeLine = { mode: 'line'; d: string }

const eyeNodes = computed((): EyeSimple | EyeSparkle | EyeLine => {
  const s = d.value.eyeStyle
  if (s === 0) {
    return { mode: 'simple', lx: 38, rx: 62, y: 44, r: 5, py: 45, pr: 2 }
  }
  if (s === 2) {
    return { mode: 'line', d: 'M34 46 Q50 40 66 46' }
  }
  return { mode: 'sparkle', lx: 38, rx: 62, y: 44, r: 6, py: 44, pr: 2.5 }
})

const accStroke = computed(() => d.value.accentHue)

const gradId = `chibi-bg-${useId()}`

/** 预览背景环：与衣装配色联动或独立主题 */
const backdropStops = computed(() => {
  const f = d.value.framePreset
  const o = d.value.outfitHue
  const a = d.value.accentHue
  if (f === 1) {
    return [
      { c: '#312e81', o: 0.42 },
      { c: '#a855f7', o: 0.28 },
    ]
  }
  if (f === 2) {
    return [
      { c: '#fb923c', o: 0.4 },
      { c: '#fb7185', o: 0.26 },
    ]
  }
  if (f === 3) {
    return [
      { c: '#0e7490', o: 0.38 },
      { c: '#22d3ee', o: 0.3 },
    ]
  }
  return [
    { c: o, o: 0.38 },
    { c: a, o: 0.22 },
  ]
})

const blushOpacity = computed(() => {
  const lv = d.value.blushLevel
  if (lv === 0) return 0
  if (lv === 1) return 0.22
  return 0.4
})

const mouthPath = computed(() => {
  const m = d.value.mouthStyle
  if (m === 1) return 'M40 57 Q50 66 60 57'
  return 'M42 58 Q50 62 58 58'
})

const mouthIsEllipse = computed(() => d.value.mouthStyle === 2)
</script>

<template>
  <div
    class="agent-chibi"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="`Q版峡谷形象 · ${d.laneArchetype}`"
  >
    <svg
      class="agent-chibi__svg"
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      :width="size"
      :height="size"
    >
      <defs>
        <linearGradient :id="gradId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            :style="{ stopColor: backdropStops[0].c, stopOpacity: backdropStops[0].o }"
          />
          <stop
            offset="100%"
            :style="{ stopColor: backdropStops[1].c, stopOpacity: backdropStops[1].o }"
          />
        </linearGradient>
      </defs>
      <circle v-if="withBackdrop" cx="50" cy="58" r="48" :fill="`url(#${gradId})`" />

      <path
        :fill="d.outfitHue"
        opacity="0.92"
        d="M28 72 Q26 88 24 108 L76 108 Q74 88 72 72 Q50 66 28 72Z"
      />
      <path :fill="d.accentHue" opacity="0.4" d="M38 72 L50 82 L62 72 L58 108 L42 108 Z" />

      <ellipse cx="50" cy="46" rx="26" ry="28" :fill="skinFill" />
      <ellipse cx="50" cy="50" rx="22" ry="24" :fill="skinFill" opacity="0.88" />

      <path :fill="hairPath.fill" :d="hairPath.path" opacity="0.96" />

      <template v-if="eyeNodes.mode === 'simple'">
        <circle :cx="eyeNodes.lx" :cy="eyeNodes.y" :r="eyeNodes.r" fill="#1e1b2e" />
        <circle :cx="eyeNodes.rx" :cy="eyeNodes.y" :r="eyeNodes.r" fill="#1e1b2e" />
        <circle :cx="eyeNodes.lx - 1" :cy="eyeNodes.py" :r="eyeNodes.pr" fill="#fff" />
        <circle :cx="eyeNodes.rx - 1" :cy="eyeNodes.py" :r="eyeNodes.pr" fill="#fff" />
      </template>
      <template v-else-if="eyeNodes.mode === 'sparkle'">
        <circle :cx="eyeNodes.lx" :cy="eyeNodes.y" :r="eyeNodes.r" fill="#1e1b2e" />
        <circle :cx="eyeNodes.rx" :cy="eyeNodes.y" :r="eyeNodes.r" fill="#1e1b2e" />
        <circle :cx="eyeNodes.lx - 1.5" :cy="eyeNodes.py" :r="eyeNodes.pr" fill="#fff" />
        <circle :cx="eyeNodes.rx - 1.5" :cy="eyeNodes.py" :r="eyeNodes.pr" fill="#fff" />
        <circle :cx="eyeNodes.lx + 2" :cy="eyeNodes.y - 2" r="1.5" fill="#fff" opacity="0.9" />
        <circle :cx="eyeNodes.rx + 2" :cy="eyeNodes.y - 2" r="1.5" fill="#fff" opacity="0.9" />
      </template>
      <path
        v-else
        :d="eyeNodes.d"
        fill="none"
        stroke="#1e1b2e"
        stroke-width="2.2"
        stroke-linecap="round"
      />

      <ellipse
        v-if="mouthIsEllipse"
        cx="50"
        cy="59"
        rx="3.2"
        ry="2.2"
        fill="none"
        stroke="#b07a62"
        stroke-width="1.6"
        opacity="0.88"
      />
      <path
        v-else
        :d="mouthPath"
        fill="none"
        stroke="#b07a62"
        stroke-width="1.8"
        stroke-linecap="round"
        opacity="0.85"
      />

      <ellipse cx="32" cy="54" rx="5" ry="3" fill="#fb7185" :opacity="blushOpacity" />
      <ellipse cx="68" cy="54" rx="5" ry="3" fill="#fb7185" :opacity="blushOpacity" />

      <!-- 配饰 -->
      <g v-if="d.accessory === 0">
        <path d="M38 22 L36 12 L40 14 Z" :fill="accStroke" />
        <path d="M62 22 L64 12 L60 14 Z" :fill="accStroke" />
      </g>
      <path
        v-else-if="d.accessory === 1"
        d="M42 20 L50 14 L58 20 L54 24 L46 24 Z"
        :fill="accStroke"
      />
      <path
        v-else-if="d.accessory === 2"
        d="M28 40 Q26 36 30 34 L70 34 Q74 36 72 40"
        fill="none"
        :stroke="accStroke"
        stroke-width="2.5"
        stroke-linecap="round"
      />

      <!-- 分路小图腾 -->
      <path
        v-if="d.laneArchetype === 'tank'"
        d="M44 98 L50 88 L56 98 L54 104 L46 104 Z"
        :fill="d.accentHue"
        opacity="0.95"
      />
      <circle
        v-else-if="d.laneArchetype === 'mage'"
        cx="50"
        cy="100"
        r="5"
        :fill="d.accentHue"
        opacity="0.95"
      />
      <path
        v-else-if="d.laneArchetype === 'marksman'"
        d="M46 96 L54 96 L52 104 Z"
        :fill="d.accentHue"
        opacity="0.95"
      />
      <path
        v-else-if="d.laneArchetype === 'support'"
        d="M47 98 H53 M50 95 V103"
        fill="none"
        :stroke="d.accentHue"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.95"
      />
      <path
        v-else-if="d.laneArchetype === 'assassin'"
        d="M46 98 L54 104 M54 98 L46 104"
        fill="none"
        :stroke="d.accentHue"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.95"
      />
      <rect
        v-else
        width="8"
        height="10"
        x="46"
        y="94"
        rx="1"
        :fill="d.accentHue"
        opacity="0.95"
      />
    </svg>
  </div>
</template>

<style scoped>
.agent-chibi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}

.agent-chibi__svg {
  display: block;
  overflow: visible;
}
</style>
