<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  Cpu,
  MagicStick,
  Present,
  QuestionFilled,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import * as aiApi from '@/api/ai'
import AgentAvatarSelector from '@/components/agent/AgentAvatarSelector.vue'
import AgentScenarioSelector from '@/components/agent/AgentScenarioSelector.vue'
import AgentChibiAvatar from '@/components/agent/AgentChibiAvatar.vue'
import AgentPresetCard from '@/components/agent/AgentPresetCard.vue'
import {
  FACTORY_AGENT_AVATAR,
  FACTORY_AGENT_NAME,
  OFFICIAL_AGENT_PRESETS,
  findAgentPreset,
  type AgentOfficialPreset,
} from '@/data/agentPresets'
import {
  Q_ACCENT_SWATCHES,
  Q_HAIR_SWATCHES,
  Q_LABELS,
  Q_OUTFIT_SWATCHES,
  Q_SKIN_SWATCHES,
} from '@/data/agentQDesignUi'
import { AVATAR_STYLE_OPTIONS, FOCUS_SCENARIO_OPTIONS } from '@/data/agentTuningOptions'
import {
  DEFAULT_AGENT_Q_DESIGN,
  LANE_ARCHETYPE_OPTIONS,
  normalizeAgentQDesign,
  type AgentBuddyQDesign,
  type LaneArchetype,
} from '@/types/agentQDesign'
import {
  AVATAR_STYLE_HINT,
  FORMALITY_HINT,
  focusScenarioHint,
  HUMOR_HINT,
  PERSONA_STYLE_HINT,
  TONE_HINT,
} from '@/data/agentStudioHints'
import BuddyModuleSection from '@/components/buddy/BuddyModuleSection.vue'

const router = useRouter()
const user = useUserStore()

const loading = ref(false)
const selectingId = ref<string | null>(null)
const displayNameDraft = ref('')
/** 气质与参数区块默认展开 */
const tuningCollapse = ref<string[]>(['tuning'])

function initialFocusScenario() {
  const t = user.agentTuning?.focusScenario
  if (t) return t
  return FOCUS_SCENARIO_OPTIONS[0]
}

function initialAvatarStyle() {
  const t = user.agentTuning?.avatarStyle
  if (t) return t
  return AVATAR_STYLE_OPTIONS[0]
}

const form = reactive({
  focusScenario: initialFocusScenario(),
  avatarStyle: initialAvatarStyle(),
  personaStyle: user.agentTuning?.personaStyle || '温柔搭子',
  tone: user.agentTuning?.tone || '轻松',
  humor: Number(user.agentTuning?.humor) || 50,
  formality: user.agentTuning?.formality || '随意',
})

const qForm = reactive<AgentBuddyQDesign>({ ...DEFAULT_AGENT_Q_DESIGN })

watch(
  () => user.profile?.agentBuddyQDesign,
  (raw) => {
    const n = normalizeAgentQDesign(raw)
    Object.assign(qForm, n)
  },
  { immediate: true, deep: true },
)

const avatarMode = computed<'preset' | 'custom'>(() =>
  user.profile?.agentUseCustomChibi ? 'custom' : 'preset',
)

const hasPreset = computed(() => Boolean(user.profile?.agentPresetId))

const showCustomChibiHero = computed(() => user.profile?.agentUseCustomChibi === true)

const heroChibiDesign = computed(() => normalizeAgentQDesign(user.profile?.agentBuddyQDesign))

const activePreset = computed(() => findAgentPreset(user.profile?.agentPresetId || undefined))

const heroAvatar = computed(() => {
  if (showCustomChibiHero.value) return ''
  if (!hasPreset.value) return FACTORY_AGENT_AVATAR
  return user.profile?.agentBuddyAvatarUrl || activePreset.value?.avatarUrl || FACTORY_AGENT_AVATAR
})

const heroName = computed(() => {
  if (user.profile?.agentUseCustomChibi) {
    return user.profile?.agentBuddyDisplayName?.trim() || '我的峡谷搭子'
  }
  if (!hasPreset.value) return FACTORY_AGENT_NAME
  return (
    user.profile?.agentBuddyDisplayName?.trim() ||
    activePreset.value?.name ||
    FACTORY_AGENT_NAME
  )
})

/** 创作台预览条：当前表单气质摘要 */
const tuningPreviewChips = computed(() => {
  const chips: string[] = [form.personaStyle, form.focusScenario, `${form.tone}语气`]
  if (form.formality === '正式') chips.push('偏正式')
  if (form.humor >= 65) chips.push('高幽默')
  else if (form.humor <= 35) chips.push('低幽默')
  return chips.filter(Boolean)
})

const primaryCtaLabel = computed(() =>
  user.agentChatUnlocked ? '进入对话' : '保存气质并开聊',
)

watch(
  () => ({
    id: user.profile?.agentPresetId,
    custom: user.profile?.agentUseCustomChibi,
    dn: user.profile?.agentBuddyDisplayName,
  }),
  () => {
    if (user.profile?.agentUseCustomChibi) {
      displayNameDraft.value =
        user.profile?.agentBuddyDisplayName?.trim() || '我的峡谷搭子'
      return
    }
    if (!hasPreset.value) {
      displayNameDraft.value = FACTORY_AGENT_NAME
      return
    }
    displayNameDraft.value =
      user.profile?.agentBuddyDisplayName?.trim() ||
      activePreset.value?.name ||
      FACTORY_AGENT_NAME
  },
  { immediate: true },
)

watch(
  () => user.agentTuning,
  (t) => {
    if (!t) return
    if (t.focusScenario) form.focusScenario = t.focusScenario
    if (t.avatarStyle) form.avatarStyle = t.avatarStyle
    form.personaStyle = t.personaStyle || form.personaStyle
    form.tone = t.tone || form.tone
    form.humor = Number(t.humor) || form.humor
    form.formality = t.formality || form.formality
  },
  { deep: true }
)

async function saveDisplayName() {
  if (!user.profile?.agentPresetId && user.profile?.agentUseCustomChibi !== true) return
  const t = displayNameDraft.value.trim()
  if (!t) {
    displayNameDraft.value =
      user.profile?.agentUseCustomChibi === true
        ? '我的峡谷搭子'
        : activePreset.value?.name || FACTORY_AGENT_NAME
    return
  }
  if (t === user.profile?.agentBuddyDisplayName) return
  loading.value = true
  try {
    await user.saveProfile({ agentBuddyDisplayName: t })
    ElMessage.success('展示名已更新')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}

async function selectPreset(p: AgentOfficialPreset) {
  selectingId.value = p.id
  loading.value = true
  try {
    await user.saveProfile({
      agentPresetId: p.id,
      agentBuddyDisplayName: p.name,
      agentBuddyAvatarUrl: p.avatarUrl,
      agentUseCustomChibi: false,
    })
    displayNameDraft.value = p.name
    ElMessage.success(`已选择：${p.name}`)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
    selectingId.value = null
  }
}

function buildAgentTuningPayload() {
  return {
    focusScenario: form.focusScenario,
    avatarStyle: form.avatarStyle,
    personaStyle: form.personaStyle,
    tone: form.tone,
    humor: form.humor,
    formality: form.formality,
  }
}

/** 仅保存气质参数（不强制进入聊天），便于先调参再生成名片 */
async function saveTuningOnly() {
  loading.value = true
  try {
    await user.saveProfile({
      agentTuning: buildAgentTuningPayload(),
    })
    ElMessage.success('气质参数已保存')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}

async function saveAndUnlock() {
  loading.value = true
  try {
    await user.saveProfile({
      agentTuning: buildAgentTuningPayload(),
      agentChatUnlocked: true,
    })
    ElMessage.success('已解锁智能体聊天')
    void router.push('/app/agent/chat')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}

async function startChat() {
  if (user.agentChatUnlocked) {
    void router.push('/app/agent/chat')
    return
  }
  await saveAndUnlock()
}

async function onAvatarModeChange(mode: 'preset' | 'custom') {
  loading.value = true
  try {
    if (mode === 'custom') {
      await user.saveProfile({
        agentUseCustomChibi: true,
        agentBuddyQDesign: normalizeAgentQDesign(qForm),
      })
      ElMessage.success('已切换为 Q 版自创形象')
    } else {
      await user.saveProfile({ agentUseCustomChibi: false })
      ElMessage.success('已切换为官方成品形象')
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}

async function saveQDesign() {
  loading.value = true
  try {
    await user.saveProfile({
      agentBuddyQDesign: normalizeAgentQDesign(qForm),
      agentUseCustomChibi: true,
    })
    ElMessage.success('Q 版形象已保存')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}

function resetQDesign() {
  Object.assign(qForm, DEFAULT_AGENT_Q_DESIGN)
}

const LANE_VALUES: LaneArchetype[] = [
  'tank',
  'fighter',
  'mage',
  'marksman',
  'support',
  'assassin',
]

/** 分路卡片圖示（僅展示；提交值仍為 `laneArchetype` 枚舉） */
const LANE_ARCHETYPE_ICONS: Record<LaneArchetype, string> = {
  tank: '🛡️',
  fighter: '⚔️',
  mage: '🔮',
  marksman: '🏹',
  assassin: '🗡️',
  support: '✨',
}

/** 捏臉籌碼：圖示僅展示，提交值仍為 qForm 枚舉 */
const Q_DESIGN_EYE_CHIPS = [
  { idx: 0 as const, icon: '🫧' },
  { idx: 1 as const, icon: '✨' },
  { idx: 2 as const, icon: '😑' },
]
const Q_DESIGN_MOUTH_CHIPS = [
  { idx: 0 as const, icon: '🙂' },
  { idx: 1 as const, icon: '😆' },
  { idx: 2 as const, icon: '😳' },
]
const Q_DESIGN_BLUSH_CHIPS = [
  { idx: 0 as const, icon: '○' },
  { idx: 1 as const, icon: '🌸' },
  { idx: 2 as const, icon: '💖' },
]
const Q_DESIGN_HAIR_CHIPS = [
  { idx: 0 as const, icon: '✂️' },
  { idx: 1 as const, icon: '〰️' },
  { idx: 2 as const, icon: '💫' },
  { idx: 3 as const, icon: '💧' },
]
const Q_DESIGN_ACCESSORY_CHIPS = [
  { idx: 0 as const, icon: '🦄' },
  { idx: 1 as const, icon: '👑' },
  { idx: 2 as const, icon: '🎧' },
  { idx: 3 as const, icon: '·' },
]
/** 氛圍主題卡 ↔ `framePreset` 0–3（與 `Q_LABELS.frame` 順序對齊） */
const VIBE_FRAME_OPTIONS = [
  { val: 'nature', frame: 0 as const, icon: '🍃', text: '清新森系' },
  { val: 'void', frame: 1 as const, icon: '🌌', text: '深渊虚空' },
  { val: 'flame', frame: 2 as const, icon: '🔥', text: '热血赤焰' },
  { val: 'cyber', frame: 3 as const, icon: '🌃', text: '赛博霓虹' },
] as const

const previewVibeKey = computed(() => {
  const row = VIBE_FRAME_OPTIONS.find((o) => o.frame === qForm.framePreset)
  return (row?.val ?? 'nature') as 'nature' | 'void' | 'flame' | 'cyber'
})

const activeVibeLabel = computed(
  () => VIBE_FRAME_OPTIONS.find((o) => o.frame === qForm.framePreset)?.text ?? '默认配置',
)

function randomizeQDesign() {
  qForm.laneArchetype = LANE_VALUES[Math.floor(Math.random() * LANE_VALUES.length)]!
  qForm.skinTone = Math.floor(Math.random() * 4) as AgentBuddyQDesign['skinTone']
  qForm.hairStyle = Math.floor(Math.random() * 4) as AgentBuddyQDesign['hairStyle']
  qForm.hairColor = Q_HAIR_SWATCHES[Math.floor(Math.random() * Q_HAIR_SWATCHES.length)]!
  qForm.eyeStyle = Math.floor(Math.random() * 3) as AgentBuddyQDesign['eyeStyle']
  qForm.accessory = Math.floor(Math.random() * 4) as AgentBuddyQDesign['accessory']
  qForm.outfitHue = Q_OUTFIT_SWATCHES[Math.floor(Math.random() * Q_OUTFIT_SWATCHES.length)]!
  qForm.accentHue = Q_ACCENT_SWATCHES[Math.floor(Math.random() * Q_ACCENT_SWATCHES.length)]!
  qForm.mouthStyle = Math.floor(Math.random() * 3) as AgentBuddyQDesign['mouthStyle']
  qForm.blushLevel = Math.floor(Math.random() * 3) as AgentBuddyQDesign['blushLevel']
  qForm.framePreset = Math.floor(Math.random() * 4) as AgentBuddyQDesign['framePreset']
  ElMessage.success('已为你随机一组搭配，可再微调后保存')
}

async function refreshCard() {
  const firstGen = !user.buddyCard
  loading.value = true
  try {
    const card = await aiApi.postBuddyCard({ personaStyle: form.personaStyle })
    user.buddyCard = card
    ElMessage.success(firstGen ? '名片已生成' : '名片已更新')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '生成失败')
  } finally {
    loading.value = false
  }
}

function setSkinToneIdx(i: number) {
  if (i < 0 || i > 3) return
  qForm.skinTone = i as AgentBuddyQDesign['skinTone']
}
</script>

<template>
  <div class="buddy-page agent-studio app-page-stack">
    <!-- 说明与流程（与下方编辑区分离） -->
    <section class="app-layer app-layer--discover agent-studio-intro" aria-labelledby="agent-studio-title">
      <div class="app-layer__inner agent-studio-intro__inner">
    <header class="studio-head">
      <h1 id="agent-studio-title" class="studio-title">AI 搭子创作台</h1>
      <p class="studio-sub">
        自定义
        <strong>峡谷 Q 版形象</strong>
        （分路气质 + 配色）或选用官方套组 → 调对话气质 → 生成名片 →
        <strong>多轮聊天</strong>
        ；与广场、档案展示联动。
      </p>
    </header>

    <nav class="studio-flow" aria-label="配置顺序">
      <ol class="studio-flow__list">
        <li class="studio-flow__step" :class="{ 'is-done': hasPreset || showCustomChibiHero }">
          <span class="studio-flow__n">1</span>
          <span class="studio-flow__t">形象</span>
        </li>
        <li class="studio-flow__sep" aria-hidden="true" />
        <li class="studio-flow__step" :class="{ 'is-done': Boolean(user.agentTuning) }">
          <span class="studio-flow__n">2</span>
          <span class="studio-flow__t">调气质</span>
        </li>
        <li class="studio-flow__sep" aria-hidden="true" />
        <li class="studio-flow__step" :class="{ 'is-done': Boolean(user.buddyCard) }">
          <span class="studio-flow__n">3</span>
          <span class="studio-flow__t">AI 名片</span>
        </li>
        <li class="studio-flow__sep" aria-hidden="true" />
        <li class="studio-flow__step" :class="{ 'is-done': user.agentChatUnlocked }">
          <span class="studio-flow__n">4</span>
          <span class="studio-flow__t">对话</span>
        </li>
      </ol>
    </nav>
      </div>
    </section>

    <!-- 当前形象预览 -->
    <section class="hero-card" aria-label="当前搭子形象">
      <div class="hero-card__inner">
        <div class="hero-avatar-wrap">
          <AgentChibiAvatar
            v-if="showCustomChibiHero"
            :design="heroChibiDesign"
            :size="120"
          />
          <img
            v-else
            class="hero-avatar"
            :class="{ 'hero-avatar--brand': !hasPreset }"
            :src="heroAvatar"
            alt=""
            width="120"
            height="120"
          />
        </div>
        <div class="hero-ctrl">
          <el-icon class="hero-ctrl__ico" :size="22"><Cpu /></el-icon>
        </div>
        <p class="hero-hint">
          选择「Q
          版自创」可用分路气质与配色捏出专属形象；选「官方套组」则使用成品头像。展示名在选中套组或启用自创后即可编辑。
        </p>
        <template v-if="!hasPreset && !showCustomChibiHero">
          <h2 class="hero-name">{{ heroName }}</h2>
        </template>
        <template v-else-if="showCustomChibiHero">
          <el-input
            v-model="displayNameDraft"
            class="hero-name-input"
            maxlength="16"
            show-word-limit
            placeholder="给搭子起个展示名"
            @blur="saveDisplayName"
            @keyup.enter="($event.target as HTMLInputElement)?.blur()"
          />
        </template>
        <template v-else>
          <el-input
            v-model="displayNameDraft"
            class="hero-name-input"
            maxlength="16"
            show-word-limit
            @blur="saveDisplayName"
            @keyup.enter="($event.target as HTMLInputElement)?.blur()"
          />
        </template>
        <ul v-if="tuningPreviewChips.length" class="hero-tuning-preview" aria-label="当前气质预览">
          <li v-for="c in tuningPreviewChips" :key="c" class="hero-tuning-preview__chip">{{ c }}</li>
        </ul>
        <div class="hero-chevron" aria-hidden="true">
          <el-icon :size="20"><ArrowDown /></el-icon>
        </div>
      </div>
    </section>

    <section class="chibi-workshop chibi-workshop--glass2 buddy-card-surface" aria-labelledby="chibi-heading">
      <div class="chibi-workshop__header">
        <h2 id="chibi-heading" class="chibi-workshop__title chibi-workshop__title--hero">峡谷 Q 版形象工坊</h2>
        <p class="chibi-workshop__subtitle">定制你的专属电竞化身，与峡谷广场同频</p>
      </div>

      <div class="chibi-mode-toggle chibi-mode-toggle--segment">
        <div class="toggle-track">
          <div class="toggle-glider" :class="avatarMode" aria-hidden="true" />
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'is-active': avatarMode === 'preset' }"
            :disabled="loading"
            @click="onAvatarModeChange('preset')"
          >
            官方成品套组
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'is-active': avatarMode === 'custom' }"
            :disabled="loading"
            @click="onAvatarModeChange('custom')"
          >
            我的 Q 版创作
          </button>
        </div>
      </div>

      <div v-show="avatarMode === 'custom'" class="chibi-workshop__grid chibi-workshop__grid--workspace">
        <div class="chibi-workspace-layout">
          <div class="chibi-preview-showcase" :data-vibe="previewVibeKey">
            <div class="showcase-backdrop" aria-hidden="true" />
            <div class="theme-badge">{{ activeVibeLabel }}</div>

            <div class="avatar-hologram">
              <div class="hologram-scanline" aria-hidden="true" />
              <div class="hologram-aura" aria-hidden="true" />
              <div class="showcase-avatar-ring">
                <AgentChibiAvatar :design="qForm" :size="180" />
              </div>
            </div>

            <div class="showcase-meta">
              <p class="showcase-lane-hint">
                当前气质：
                <strong>{{ LANE_ARCHETYPE_OPTIONS.find((x) => x.value === qForm.laneArchetype)?.label }}</strong>
              </p>
              <p class="showcase-tip">
                衣装与点缀色对比度越高，轮廓越清晰；腮红「元气」适合暖色发系。
              </p>
            </div>

            <div class="showcase-pedestal" aria-hidden="true" />
          </div>

          <div class="chibi-controls-scroll">
            <div class="chibi-workshop__fields">
          <div class="chibi-panel chibi-panel--lane">
            <div class="chibi-panel__header">
              <h3 class="chibi-lane-panel__title">分路气质</h3>
              <span class="chibi-lane-panel__hint">决定化身的基础动作与气场</span>
            </div>
            <div class="chibi-lane-grid chibi-lane-grid--cards" role="group" aria-label="选择分路气质">
              <button
                v-for="o in LANE_ARCHETYPE_OPTIONS"
                :key="o.value"
                type="button"
                class="chibi-lane-btn"
                :class="{ 'is-selected': qForm.laneArchetype === o.value }"
                :aria-pressed="qForm.laneArchetype === o.value"
                @click="qForm.laneArchetype = o.value"
              >
                <div class="btn-glow" aria-hidden="true" />
                <div class="btn-content">
                  <span class="btn-icon">{{ LANE_ARCHETYPE_ICONS[o.value] }}</span>
                  <span class="btn-label">{{ o.short }}</span>
                  <span class="btn-sublabel">{{ o.label }}</span>
                </div>
              </button>
            </div>
          </div>

          <div class="chibi-panel chibi-panel--doll">
            <div class="chibi-doll-panel__header">
              <h3 class="chibi-doll-panel__title">神态与肤色</h3>
              <span class="chibi-doll-panel__hint">赋予形象独特的情绪与生机</span>
            </div>
            <div class="chibi-feature-container">
              <div class="feature-group">
                <span class="feature-label">基础肤色</span>
                <div class="color-swatches" role="group" aria-label="肤色">
                  <button
                    v-for="(hex, i) in Q_SKIN_SWATCHES"
                    :key="'skin-' + i"
                    type="button"
                    class="swatch-btn"
                    :class="{ 'is-active': qForm.skinTone === i }"
                    :style="{ '--swatch-color': hex }"
                    :title="Q_LABELS.skin[i]"
                    :aria-pressed="qForm.skinTone === i"
                    @click="setSkinToneIdx(i)"
                  />
                </div>
              </div>
              <div class="feature-group">
                <span class="feature-label">眼神</span>
                <div class="chip-list" role="group" aria-label="眼神">
                  <button
                    v-for="c in Q_DESIGN_EYE_CHIPS"
                    :key="'eye-' + c.idx"
                    type="button"
                    class="feature-chip"
                    :class="{ 'is-active': qForm.eyeStyle === c.idx }"
                    :aria-pressed="qForm.eyeStyle === c.idx"
                    @click="qForm.eyeStyle = c.idx"
                  >
                    <span class="chip-icon">{{ c.icon }}</span>
                    <span class="chip-text">{{ Q_LABELS.eyes[c.idx] }}</span>
                  </button>
                </div>
              </div>
              <div class="feature-group feature-group--split">
                <div class="feature-group__col">
                  <span class="feature-label">嘴型</span>
                  <div class="chip-list" role="group" aria-label="嘴型">
                    <button
                      v-for="c in Q_DESIGN_MOUTH_CHIPS"
                      :key="'mouth-' + c.idx"
                      type="button"
                      class="feature-chip"
                      :class="{ 'is-active': qForm.mouthStyle === c.idx }"
                      :aria-pressed="qForm.mouthStyle === c.idx"
                      @click="qForm.mouthStyle = c.idx"
                    >
                      <span class="chip-icon">{{ c.icon }}</span>
                      <span class="chip-text">{{ Q_LABELS.mouth[c.idx] }}</span>
                    </button>
                  </div>
                </div>
                <div class="feature-group__col">
                  <span class="feature-label">腮红</span>
                  <div class="chip-list" role="group" aria-label="腮红">
                    <button
                      v-for="c in Q_DESIGN_BLUSH_CHIPS"
                      :key="'blush-' + c.idx"
                      type="button"
                      class="feature-chip"
                      :class="{ 'is-active': qForm.blushLevel === c.idx }"
                      :aria-pressed="qForm.blushLevel === c.idx"
                      @click="qForm.blushLevel = c.idx"
                    >
                      <span class="chip-icon">{{ c.icon }}</span>
                      <span class="chip-text">{{ Q_LABELS.blush[c.idx] }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chibi-panel chibi-panel--doll">
            <div class="chibi-doll-panel__header">
              <h3 class="chibi-doll-panel__title">发型与头饰</h3>
              <span class="chibi-doll-panel__hint">打造个性的潮玩造型</span>
            </div>
            <div class="chibi-feature-container">
              <div class="feature-group">
                <span class="feature-label">发型</span>
                <div class="chip-list" role="group" aria-label="发型">
                  <button
                    v-for="c in Q_DESIGN_HAIR_CHIPS"
                    :key="'hair-' + c.idx"
                    type="button"
                    class="feature-chip"
                    :class="{ 'is-active': qForm.hairStyle === c.idx }"
                    :aria-pressed="qForm.hairStyle === c.idx"
                    @click="qForm.hairStyle = c.idx"
                  >
                    <span class="chip-icon">{{ c.icon }}</span>
                    <span class="chip-text">{{ Q_LABELS.hair[c.idx] }}</span>
                  </button>
                </div>
              </div>
              <div class="feature-group">
                <span class="feature-label">头饰</span>
                <div class="chip-list" role="group" aria-label="头饰">
                  <button
                    v-for="c in Q_DESIGN_ACCESSORY_CHIPS"
                    :key="'acc-' + c.idx"
                    type="button"
                    class="feature-chip"
                    :class="{ 'is-active': qForm.accessory === c.idx }"
                    :aria-pressed="qForm.accessory === c.idx"
                    @click="qForm.accessory = c.idx"
                  >
                    <span class="chip-icon">{{ c.icon }}</span>
                    <span class="chip-text">{{ Q_LABELS.accessory[c.idx] }}</span>
                  </button>
                </div>
              </div>
              <div class="feature-group">
                <div class="feature-label-row">
                  <span class="feature-label">发色</span>
                  <el-color-picker
                    v-model="qForm.hairColor"
                    size="small"
                    :predefine="[...Q_HAIR_SWATCHES]"
                    show-alpha
                  />
                </div>
                <div class="color-swatches color-swatches--hair">
                  <button
                    v-for="c in Q_HAIR_SWATCHES"
                    :key="'hc-' + c"
                    type="button"
                    class="swatch-btn"
                    :class="{ 'is-active': qForm.hairColor === c }"
                    :style="{ '--swatch-color': c }"
                    :title="c"
                    @click="qForm.hairColor = c"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="chibi-panel chibi-panel--doll">
            <div class="chibi-doll-panel__header">
              <h3 class="chibi-doll-panel__title">配色与氛围</h3>
              <span class="chibi-doll-panel__hint">一键注入灵魂主题色，联动左侧展台环境光</span>
            </div>
            <div class="chibi-feature-container">
              <div class="feature-group">
                <span class="feature-label">氛围主题</span>
                <div class="vibe-cards-grid" role="group" aria-label="氛围主题">
                  <button
                    v-for="v in VIBE_FRAME_OPTIONS"
                    :key="'vibe-' + v.val"
                    type="button"
                    class="vibe-card"
                    :class="{ 'is-active': qForm.framePreset === v.frame }"
                    :data-color="v.val"
                    :aria-pressed="qForm.framePreset === v.frame"
                    @click="qForm.framePreset = v.frame"
                  >
                    <div class="vibe-card__bg" aria-hidden="true" />
                    <span class="vibe-card__icon">{{ v.icon }}</span>
                    <span class="vibe-card__text">{{ v.text }}</span>
                  </button>
                </div>
              </div>
              <div class="feature-group feature-group--colors">
                <div class="feature-group__col">
                  <div class="feature-label-row">
                    <span class="feature-label">衣装主色</span>
                    <el-color-picker
                      v-model="qForm.outfitHue"
                      size="small"
                      :predefine="[...Q_OUTFIT_SWATCHES]"
                      show-alpha
                    />
                  </div>
                  <div class="color-swatches color-swatches--dense">
                    <button
                      v-for="c in Q_OUTFIT_SWATCHES"
                      :key="'out-' + c"
                      type="button"
                      class="swatch-btn"
                      :class="{ 'is-active': qForm.outfitHue === c }"
                      :style="{ '--swatch-color': c }"
                      :title="c"
                      @click="qForm.outfitHue = c"
                    />
                  </div>
                </div>
                <div class="feature-group__col">
                  <div class="feature-label-row">
                    <span class="feature-label">点缀色</span>
                    <el-color-picker
                      v-model="qForm.accentHue"
                      size="small"
                      :predefine="[...Q_ACCENT_SWATCHES]"
                      show-alpha
                    />
                  </div>
                  <div class="color-swatches color-swatches--dense">
                    <button
                      v-for="c in Q_ACCENT_SWATCHES"
                      :key="'ac-' + c"
                      type="button"
                      class="swatch-btn"
                      :class="{ 'is-active': qForm.accentHue === c }"
                      :style="{ '--swatch-color': c }"
                      @click="qForm.accentHue = c"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chibi-workshop__actions">
            <el-button round :disabled="loading" @click="resetQDesign">重置默认</el-button>
            <el-button round :disabled="loading" @click="randomizeQDesign">
              <el-icon class="chibi-action-ico"><MagicStick /></el-icon>
              随机灵感
            </el-button>
            <el-button type="primary" round :loading="loading" @click="saveQDesign">
              保存 Q 版形象
            </el-button>
          </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="official-block" aria-labelledby="official-heading">
      <div class="official-head">
        <span class="official-gift" aria-hidden="true">
          <el-icon :size="22"><Present /></el-icon>
        </span>
        <div class="official-text">
          <h2 id="official-heading" class="official-title">官方成品搭子</h2>
          <p class="official-desc">
            下列为王者荣耀 / 王者电竞向的官方气质套组；选中后使用成品头像。若已启用上方「Q
            版创作」，切换任一套组将切回官方头像。
          </p>
          <p class="official-desc">展示名仅影响搭子相关展示，与元流档案昵称相互独立。</p>
        </div>
      </div>

      <div class="agent-presets-carousel">
        <AgentPresetCard
          v-for="p in OFFICIAL_AGENT_PRESETS"
          :key="p.id"
          :preset="p"
          :selected="user.profile?.agentPresetId === p.id"
          :disabled="loading"
          :loading="selectingId === p.id"
          @select="selectPreset(p)"
        />
      </div>
    </section>

    <BuddyModuleSection
      title="气质与参数"
      subtitle="影响智能体回复体感与 AI 名片生成；可先保存再生成名片，不必立刻开聊"
    >
      <el-collapse v-model="tuningCollapse" class="buddy-card-surface collapse">
        <el-collapse-item title="编辑气质与对话策略" name="tuning">
          <el-form label-position="top" class="tuning-form">
            <el-form-item>
              <template #label>
                <span class="form-label-tip">
                  专注场景
                  <el-tooltip :content="focusScenarioHint(form.focusScenario)" placement="top">
                    <el-icon class="form-label-tip__ico" :size="15"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <AgentScenarioSelector v-model="form.focusScenario" :disabled="loading" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="form-label-tip">
                  形象风格
                  <el-tooltip :content="AVATAR_STYLE_HINT" placement="top">
                    <el-icon class="form-label-tip__ico" :size="15"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <AgentAvatarSelector v-model="form.avatarStyle" :disabled="loading" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="form-label-tip">
                  口吻预设
                  <el-tooltip :content="PERSONA_STYLE_HINT" placement="top">
                    <el-icon class="form-label-tip__ico" :size="15"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-select v-model="form.personaStyle" style="width: 100%">
                <el-option label="温柔搭子" value="温柔搭子" />
                <el-option label="战术搭子" value="战术搭子" />
                <el-option label="搞笑搭子" value="搞笑搭子" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="form-label-tip">
                  语气
                  <el-tooltip :content="TONE_HINT" placement="top">
                    <el-icon class="form-label-tip__ico" :size="15"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-radio-group v-model="form.tone">
                <el-radio-button label="轻松" />
                <el-radio-button label="认真" />
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="form-label-tip">
                  幽默程度
                  <el-tooltip :content="HUMOR_HINT" placement="top">
                    <el-icon class="form-label-tip__ico" :size="15"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-slider v-model="form.humor" :min="0" :max="100" show-input />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="form-label-tip">
                  正式程度
                  <el-tooltip :content="FORMALITY_HINT" placement="top">
                    <el-icon class="form-label-tip__ico" :size="15"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-radio-group v-model="form.formality">
                <el-radio-button label="随意" />
                <el-radio-button label="正式" />
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </BuddyModuleSection>

    <BuddyModuleSection title="我的 AI 名片" subtitle="对外展示的宣言、标签与相处规则；可随时刷新以匹配当前口吻">
      <el-card v-if="user.buddyCard" class="buddy-card-surface card-block" shadow="never">
        <p class="decl">{{ user.buddyCard.declaration }}</p>
        <div class="tags">
          <el-tag v-for="t in user.buddyCard.tags" :key="t" effect="dark" type="primary">{{ t }}</el-tag>
        </div>
        <ul class="rules">
          <li v-for="(r, i) in user.buddyCard.rules" :key="i">{{ r }}</li>
        </ul>
        <el-button text type="primary" :loading="loading" @click="refreshCard">刷新名片</el-button>
      </el-card>
      <el-card v-else class="buddy-card-surface card-block card-block--empty" shadow="never">
        <p class="card-empty-lead">
          尚未生成名片。可先调好「气质与参数」，再点击下方生成；生成内容会参考当前口吻预设。
        </p>
        <el-button type="primary" :loading="loading" @click="refreshCard">生成 AI 名片</el-button>
      </el-card>
    </BuddyModuleSection>

    <div class="studio-actions">
      <el-button
        class="studio-actions__secondary"
        size="large"
        round
        :disabled="loading && !selectingId"
        @click="saveTuningOnly"
      >
        仅保存气质
      </el-button>
      <el-button
        class="studio-actions__primary buddy-button buddy-button--primary"
        type="primary"
        size="large"
        round
        :loading="loading && !selectingId"
        @click="startChat"
      >
        {{ primaryCtaLabel }}
      </el-button>
    </div>
    <p class="studio-actions-hint">
      「仅保存气质」写入档案但不进入聊天；首次使用请点「{{ user.agentChatUnlocked ? '进入对话' : '保存气质并开聊' }}」解锁对话能力。
    </p>

    <BuddyModuleSection v-if="user.agentChatUnlocked" title="快捷入口" subtitle="已解锁对话，可从创作台随时返回聊天">
      <div class="actions">
        <el-button type="primary" plain @click="router.push('/app/agent/chat')">进入聊天</el-button>
      </div>
    </BuddyModuleSection>
  </div>
</template>

<style scoped>
.studio-head {
  margin-bottom: 18px;
}

.studio-title {
  margin: 0 0 8px;
  font-size: clamp(22px, 5vw, 26px);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--buddy-text);
}

.studio-sub {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--buddy-text-secondary);
  max-width: 52rem;
}

/* 流程指引 */
.studio-flow {
  margin-bottom: 20px;
}

.studio-flow__list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin: 0;
  padding: 12px 14px;
  list-style: none;
  border-radius: 16px;
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.12);
  background: linear-gradient(120deg, rgb(255 255 255 / 0.95) 0%, rgb(248 250 252 / 0.92) 100%);
  box-shadow: 0 2px 16px rgb(15 23 42 / 0.04);
}

.studio-flow__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--buddy-text-muted);
}

.studio-flow__n {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  color: var(--buddy-text-muted);
  background: rgb(15 23 42 / 0.06);
  border: 1px solid rgb(15 23 42 / 0.06);
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.studio-flow__step.is-done .studio-flow__n {
  color: #fff;
  background: linear-gradient(135deg, rgb(var(--buddy-rgb-brand)) 0%, rgb(var(--buddy-rgb-accent)) 100%);
  border-color: transparent;
  box-shadow: 0 2px 10px rgb(var(--buddy-rgb-brand) / 0.25);
}

.studio-flow__t {
  line-height: 1.3;
  color: var(--buddy-text-secondary);
}

.studio-flow__sep {
  width: 12px;
  height: 1px;
  flex-shrink: 0;
  background: linear-gradient(90deg, transparent, rgb(15 23 42 / 0.12), transparent);
  align-self: center;
  margin-bottom: 22px;
}

@media (max-width: 520px) {
  .studio-flow__list {
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 10px;
  }

  .studio-flow__sep {
    display: none;
  }
}

.hero-tuning-preview {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.hero-tuning-preview__chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--buddy-rgb-brand));
  background: rgb(var(--buddy-rgb-brand) / 0.09);
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.15);
}

.form-label-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.form-label-tip__ico {
  cursor: help;
  color: var(--buddy-text-muted);
  vertical-align: middle;
}

.tuning-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.studio-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin: 8px 0 10px;
}

.studio-actions__primary {
  min-width: 168px;
  height: 48px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
}

.studio-actions__primary.buddy-button--primary {
  background: linear-gradient(105deg, #38bdf8 0%, #6366f1 48%, #7c3aed 100%) !important;
  background-size: 200% 100% !important;
}

.studio-actions__secondary {
  min-width: 132px;
  height: 48px;
  font-weight: 700;
}

.studio-actions-hint {
  margin: 0 0 24px;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
  max-width: 40rem;
  margin-left: auto;
  margin-right: auto;
}

.card-block--empty {
  text-align: center;
  padding: 20px 16px 22px;
}

.card-empty-lead {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--buddy-text-secondary);
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
}

.hero-card {
  margin-bottom: 18px;
  border-radius: 24px;
  padding: 2px;
  background: linear-gradient(145deg, rgba(124, 58, 237, 0.35) 0%, rgba(37, 99, 235, 0.22) 100%);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1);
}

.hero-card__inner {
  border-radius: 22px;
  padding: 22px 18px 14px;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%);
}

.hero-avatar-wrap {
  display: inline-flex;
  margin: 0 auto 12px;
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fda4af 0%, #f472b6 40%, #c084fc 100%);
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.95),
    0 0 24px rgba(244, 114, 182, 0.35);
}

.hero-avatar {
  display: block;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--buddy-surface-elevated);
}

/* 出厂立绘浅底，contain 避免圆裁切掉企鹅翅膀与字 */
.hero-avatar--brand {
  object-fit: contain;
  padding: 6px;
}

.hero-ctrl {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.hero-ctrl__ico {
  color: var(--buddy-primary);
  opacity: 0.85;
}

.hero-hint {
  margin: 0 auto 12px;
  max-width: 280px;
  font-size: 11px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

.hero-name {
  margin: 0 0 8px;
  font-size: clamp(22px, 5.5vw, 28px);
  font-weight: 800;
  color: var(--buddy-primary);
  letter-spacing: 0.02em;
}

.hero-name-input {
  margin: 0 auto 8px;
  max-width: 260px;
}

.hero-name-input :deep(.el-input__wrapper) {
  font-size: clamp(20px, 5vw, 26px);
  font-weight: 800;
  color: var(--buddy-primary);
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.25);
}

.hero-name-input :deep(.el-input__inner) {
  text-align: center;
  font-weight: 800;
}

.hero-chevron {
  margin-top: 4px;
  color: var(--buddy-text-muted);
  opacity: 0.6;
}

.official-block {
  /* flex 子項預設 min-width:auto，會被內部橫向卡片撐開，導致無法出現橫向捲動 */
  margin-bottom: 28px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.official-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.official-gift {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.official-title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 800;
  color: var(--buddy-text);
}

.official-desc {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.official-desc:last-child {
  margin-bottom: 0;
}

.agent-presets-carousel {
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: visible;
  /* 底部留空避免 3D hover 陰影被裁切；perspective 給子卡 rotateX 縱深感 */
  padding: 24px 12px 60px;
  margin: 0 -12px;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.agent-presets-carousel::-webkit-scrollbar {
  display: none;
}

.card-block {
  margin-bottom: 16px;
}

.decl {
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.rules {
  margin: 0 0 12px;
  padding-left: 18px;
  color: var(--buddy-text-muted);
  font-size: 13px;
}

.collapse {
  margin-bottom: 16px;
  border: 1px solid var(--buddy-border);
  border-radius: var(--buddy-radius);
  overflow: hidden;
}

.actions {
  display: flex;
  gap: 12px;
}

/* Q 版工坊 */
.chibi-workshop {
  margin-bottom: 24px;
  padding: 18px 16px 20px;
  border-radius: var(--buddy-radius);
}

.chibi-workshop__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.chibi-workshop__ico {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgb(var(--buddy-rgb-brand) / 0.12) 0%, rgb(var(--buddy-rgb-accent) / 0.1) 100%);
  color: var(--buddy-primary);
}

.chibi-workshop__title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 800;
  color: var(--buddy-text);
}

.chibi-workshop__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

.chibi-mode-toggle {
  display: flex;
  width: 100%;
  margin-bottom: 16px;
}

.chibi-mode-toggle :deep(.el-radio-button__inner) {
  width: 100%;
  font-weight: 700;
}

.chibi-workshop__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 640px) {
  .chibi-workshop__grid {
    grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
    align-items: start;
    gap: 22px;
  }
}

.chibi-workshop__preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 12px 18px;
  border-radius: 18px;
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.14);
  background: linear-gradient(
    165deg,
    rgb(255 255 255 / 0.98) 0%,
    rgb(var(--buddy-rgb-brand) / 0.06) 55%,
    rgb(var(--buddy-rgb-accent) / 0.05) 100%
  );
  box-shadow:
    0 4px 24px rgb(15 23 42 / 0.06),
    inset 0 1px 0 rgb(255 255 255 / 0.85);
  position: sticky;
  top: 12px;
}

@media (max-width: 639px) {
  .chibi-workshop__preview-card {
    position: static;
  }
}

.chibi-workshop__preview-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 204px;
  height: 204px;
  border-radius: 50%;
  margin: 4px 0 2px;
  background: radial-gradient(
    circle at 35% 30%,
    rgb(255 255 255 / 0.95) 0%,
    rgb(var(--buddy-rgb-brand) / 0.08) 45%,
    rgb(var(--buddy-rgb-accent) / 0.06) 100%
  );
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.8) inset,
    0 12px 40px rgb(37 99 235 / 0.12);
}

.chibi-workshop__tip {
  margin: 10px 0 0;
  padding: 0 6px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
  max-width: 220px;
}

.chibi-panel {
  padding-bottom: 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
}

.chibi-panel:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.chibi-panel__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--buddy-primary);
  text-transform: uppercase;
}

.chibi-lane-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (min-width: 520px) {
  .chibi-lane-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.chibi-lane-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
  border-radius: 12px;
  border: 1px solid rgb(15 23 42 / 0.1);
  background: rgb(255 255 255 / 0.92);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.chibi-lane-pill:hover {
  border-color: rgb(var(--buddy-rgb-brand) / 0.35);
  box-shadow: 0 4px 14px rgb(37 99 235 / 0.1);
}

.chibi-lane-pill.is-on {
  border-color: rgb(var(--buddy-rgb-brand) / 0.55);
  background: linear-gradient(
    145deg,
    rgb(var(--buddy-rgb-brand) / 0.1) 0%,
    rgb(var(--buddy-rgb-accent) / 0.08) 100%
  );
  box-shadow: 0 0 0 2px rgb(var(--buddy-rgb-brand) / 0.15);
}

.chibi-lane-pill__short {
  font-size: 15px;
  font-weight: 800;
  color: var(--buddy-text);
}

.chibi-lane-pill__full {
  font-size: 10px;
  font-weight: 600;
  color: var(--buddy-text-muted);
  line-height: 1.25;
  text-align: center;
}

.chibi-field__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.chibi-field__label-row .chibi-field__label {
  margin: 0;
}

.chibi-action-ico {
  margin-right: 4px;
  vertical-align: middle;
}

.chibi-workshop__preview-label {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}

.chibi-workshop__lane-hint {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-secondary);
}

.chibi-workshop__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chibi-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chibi-field--row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.chibi-field__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--buddy-text-secondary);
}

.chibi-field__meta {
  font-size: 11px;
  color: var(--buddy-text-muted);
}

.chibi-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chibi-swatches--sm .chibi-swatch {
  width: 28px;
  height: 28px;
}

.chibi-swatch {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.12);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.chibi-swatch:hover {
  transform: scale(1.06);
}

.chibi-swatch.is-on {
  border-color: var(--buddy-primary);
  box-shadow: 0 0 0 2px rgb(var(--buddy-rgb-brand) / 0.25);
}

.chibi-workshop__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  align-items: center;
}

@media (min-width: 480px) {
  .chibi-workshop__actions .el-button--primary {
    margin-left: auto;
  }
}

/* ==========================================================
   🔮 AI 搭子创作台：终极全息控制台 (Holographic Console)
   ========================================================== */

/* --- 1. 全局星云背景与基础防抖 --- */
.agent-studio {
  position: relative;
  overflow: hidden;
  /* 置於 flex 主工作區內時避免子區塊被內容撐寬，確保橫向捲動容器能受限於視口 */
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 60px;
  background: var(--buddy-page-bg);
  transition: background 0.8s ease;
  z-index: 0;
}

:global(html:not(.dark)) .agent-studio {
  background:
    radial-gradient(ellipse 100% 400px at 50% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 100%),
    linear-gradient(180deg, #f8fafc 0%, var(--buddy-page-bg) 400px);
}

:global(html.dark) .agent-studio {
  background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
}

/* 动态深空能量球 */
:global(html.dark) .agent-studio::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  width: 70vw;
  height: 70vw;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%);
  filter: blur(100px);
  animation: agent-orb 20s infinite alternate ease-in-out;
  pointer-events: none;
  z-index: -1;
}

:global(html.dark) .agent-studio::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -10%;
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 65%);
  filter: blur(90px);
  animation: agent-orb-reverse 18s infinite alternate ease-in-out;
  pointer-events: none;
  z-index: -1;
}

@keyframes agent-orb {
  100% {
    transform: translate(100px, 50px) scale(1.1);
  }
}

@keyframes agent-orb-reverse {
  100% {
    transform: translate(-80px, -40px) scale(1.05);
  }
}

/* 抹除原有的大白底外壳 */
.agent-studio .app-layer,
.agent-studio .app-layer__inner {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

/* --- 2. 统一瀑布流进场动效 (Staggered Entry) --- */
.agent-studio-intro,
.hero-card,
.chibi-workshop,
.official-block,
.buddy-card-surface,
.studio-actions {
  opacity: 0;
  animation: agent-rise-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.agent-studio-intro {
  animation-delay: 0.05s;
}

.hero-card {
  animation-delay: 0.15s;
}

.chibi-workshop {
  animation-delay: 0.25s;
}

.official-block {
  animation-delay: 0.35s;
}

.buddy-card-surface {
  animation-delay: 0.45s;
}

.studio-actions {
  animation-delay: 0.5s;
}

@keyframes agent-rise-in {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* --- 3. 核心 Bento 卡片材质 (Glassmorphism 2.0) --- */
.agent-studio .buddy-card-surface,
.agent-studio .hero-card__inner,
.agent-studio .chibi-workshop__preview-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(243, 244, 246, 0.7) 100%) !important;
  backdrop-filter: blur(30px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  border-top-color: rgba(255, 255, 255, 1) !important;
  box-shadow:
    0 12px 30px -10px rgba(15, 23, 42, 0.08),
    0 1px 1px rgba(255, 255, 255, 0.6) inset !important;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

/* 暗黑模式霓虹发光卡片 */
:global(html.dark) .agent-studio .buddy-card-surface,
:global(html.dark) .agent-studio .hero-card__inner,
:global(html.dark) .agent-studio .chibi-workshop__preview-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  border-top-color: rgba(255, 255, 255, 0.25) !important;
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(99, 102, 241, 0.05),
    0 1px 1px rgba(255, 255, 255, 0.15) inset !important;
}

/* --- 4. 赛博朋克流程指引 (Cyber Steps) --- */
.studio-flow__list {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%) !important;
  backdrop-filter: blur(20px) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

:global(html.dark) .studio-flow__list {
  background: rgba(30, 41, 59, 0.6) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.studio-flow__step.is-done .studio-flow__n {
  background: linear-gradient(135deg, #38bdf8, #8b5cf6, #ec4899) !important;
  background-size: 200% 200% !important;
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.5) !important;
  animation: flow-pulse 3s ease infinite !important;
  border: none !important;
  color: #fff !important;
}

.studio-flow__step.is-done .studio-flow__t {
  color: #38bdf8 !important;
  font-weight: 800 !important;
}

@keyframes flow-pulse {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 流动能量连接线 */
.studio-flow__sep {
  background: rgba(148, 163, 184, 0.2) !important;
  position: relative;
  overflow: hidden;
}

.studio-flow__step.is-done + .studio-flow__sep::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
  animation: scan-line 2s linear infinite;
}

@keyframes scan-line {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* --- 5. Q版工坊预览区 (Holographic Scan & Spin) --- */
.chibi-workshop__preview-ring {
  position: relative;
  background: transparent !important;
  box-shadow: 0 12px 40px rgba(37, 99, 235, 0.15) !important;
}

/* 旋转科技准星 */
.chibi-workshop__preview-ring::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px dashed rgba(56, 189, 248, 0.6);
  border-top-color: #8b5cf6;
  border-bottom-color: #ec4899;
  animation: spin-ring 12s linear infinite;
  z-index: 0;
  pointer-events: none;
}

:global(html.dark) .chibi-workshop__preview-ring::before {
  border-width: 3px;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.3) inset;
}

@keyframes spin-ring {
  100% {
    transform: rotate(360deg);
  }
}

/* --- 6. 深度接管 Element UI 组件 (Sliders, Radios, Selects) --- */
/* 选项胶囊 (Radio & Selects) */
.agent-studio :deep(.el-radio-button__inner) {
  border-radius: 999px !important;
  border: 1px solid transparent !important;
  background: rgba(148, 163, 184, 0.1) !important;
  margin: 4px !important;
  padding: 8px 20px !important;
  box-shadow: none !important;
  font-weight: 700 !important;
  color: var(--buddy-text-secondary) !important;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

:global(html.dark) .agent-studio :deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #94a3b8 !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.agent-studio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4) !important;
  transform: scale(1.05) !important;
}

/* 能量槽滑块 (Sliders) */
.agent-studio :deep(.el-slider__runway) {
  background-color: rgba(148, 163, 184, 0.2) !important;
  height: 8px !important;
}

.agent-studio :deep(.el-slider__bar) {
  background: linear-gradient(90deg, #38bdf8, #8b5cf6) !important;
  height: 8px !important;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.5) !important;
}

.agent-studio :deep(.el-slider__button) {
  border: none !important;
  background: #fff !important;
  box-shadow:
    0 0 0 4px rgba(139, 92, 246, 0.2),
    0 0 12px rgba(139, 92, 246, 0.8) !important;
  transition: transform 0.2s;
}

.agent-studio :deep(.el-slider__button:hover) {
  transform: scale(1.2);
  box-shadow:
    0 0 0 6px rgba(139, 92, 246, 0.3),
    0 0 16px rgba(139, 92, 246, 1) !important;
}

/* 隐藏折叠面板粗糙边框 */
.agent-studio :deep(.el-collapse),
.agent-studio :deep(.el-collapse-item__header),
.agent-studio :deep(.el-collapse-item__wrap) {
  border: none !important;
  background: transparent !important;
  color: var(--buddy-text);
  font-weight: 800;
}

:global(html.dark) .agent-studio :deep(.el-collapse-item__header) {
  color: #f8fafc;
}

/* --- 7. 全息光效标题与标签 --- */
.studio-title,
.hero-name-input :deep(.el-input__inner) {
  background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #0ea5e9 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  font-weight: 900 !important;
}

:global(html.dark) .studio-title,
:global(html.dark) .hero-name-input :deep(.el-input__inner) {
  background: linear-gradient(135deg, #93c5fd 0%, #d8b4fe 50%, #6ee7b7 100%) !important;
  filter: drop-shadow(0 2px 12px rgba(168, 85, 247, 0.5)) !important;
}

/* 晶体化名片标签 */
.agent-studio .tags :deep(.el-tag) {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  color: #0284c7 !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  font-weight: 800 !important;
  font-size: 12px !important;
}

:global(html.dark) .agent-studio .tags :deep(.el-tag) {
  color: #7dd3fc !important;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.2) !important;
}

/* --- 8. CTA 动作按钮流光 --- */
.studio-actions__primary {
  animation: btn-flow 3s linear infinite !important;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4) !important;
  border: none !important;
  background-size: 200% 100% !important;
}

.studio-actions__primary:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 12px 32px rgba(124, 58, 237, 0.6) !important;
  filter: brightness(1.1);
}

@keyframes btn-flow {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 分路气质药丸发光 */
.chibi-lane-pill {
  transition: all 0.3s ease !important;
}

.chibi-lane-pill.is-on {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%) !important;
  border-color: #8b5cf6 !important;
  box-shadow:
    0 0 16px rgba(139, 92, 246, 0.4) inset,
    0 4px 16px rgba(59, 130, 246, 0.2) !important;
  transform: scale(1.05);
}

.chibi-lane-pill.is-on .chibi-lane-pill__short {
  color: #8b5cf6 !important;
}

:global(html.dark) .chibi-lane-pill.is-on .chibi-lane-pill__short {
  color: #c4b5fd !important;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  :global(html.dark) .agent-studio::before,
  :global(html.dark) .agent-studio::after {
    animation: none !important;
  }
  .studio-flow__step.is-done .studio-flow__n {
    animation: none !important;
  }
  .studio-flow__step.is-done + .studio-flow__sep::after {
    animation: none !important;
  }
  .chibi-workshop__preview-ring::before,
  .agent-studio .chibi-workshop__preview-ring::before {
    animation: none !important;
  }
  .studio-actions__primary {
    animation: none !important;
  }
  .studio-actions__primary:hover {
    transform: none !important;
    filter: none !important;
  }
  .agent-studio-intro,
  .hero-card,
  .chibi-workshop,
  .official-block,
  .buddy-card-surface,
  .studio-actions {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
  .agent-studio :deep(.el-slider__button:hover) {
    transform: none !important;
  }
}

/* ==========================================================
   1. 表单控件深度玻璃化 (Inputs & Selects)
   ========================================================== */
/* 强制穿透 Element Plus 的输入框外壳 */
.agent-studio :deep(.el-input__wrapper),
.agent-studio :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02) inset, 0 0 0 1px rgba(203, 213, 225, 0.6) inset !important;
  border-radius: 12px !important;
  backdrop-filter: blur(12px) !important;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

/* 暗黑模式输入框：深空凝胶态 */
:global(html.dark) .agent-studio :deep(.el-input__wrapper),
:global(html.dark) .agent-studio :deep(.el-select__wrapper) {
  background: rgba(15, 23, 42, 0.4) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4) inset, 0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;
}

/* 激活/聚焦状态：爆发电竞高光 */
.agent-studio :deep(.el-input__wrapper.is-focus),
.agent-studio :deep(.el-select__wrapper.is-focused) {
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 0 0 2px #8b5cf6 inset, 0 6px 16px rgba(139, 92, 246, 0.2) !important;
}

:global(html.dark) .agent-studio :deep(.el-input__wrapper.is-focus),
:global(html.dark) .agent-studio :deep(.el-select__wrapper.is-focused) {
  background: rgba(30, 41, 59, 0.8) !important;
  box-shadow: 0 0 0 2px #a855f7 inset, 0 0 20px rgba(168, 85, 247, 0.4) !important;
}

/* 表单文字颜色适配 */
.agent-studio :deep(.el-input__inner) { color: var(--buddy-text) !important; font-weight: 600 !important; }
:global(html.dark) .agent-studio :deep(.el-input__inner) { color: #f8fafc !important; }

/* ==========================================================
   2. 自定义色板与工坊按钮 (Swatches & Actions)
   ========================================================== */
/* 调色板按钮：发光晶体 */
.chibi-swatch {
  border-radius: 12px !important;
  border: 2px solid transparent !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1), 0 2px 4px inset rgba(255, 255, 255, 0.4) !important;
}
.chibi-swatch.is-on {
  transform: scale(1.15) !important;
  border-color: #fff !important;
  box-shadow: 0 0 0 2px #a855f7, 0 8px 20px rgba(168, 85, 247, 0.4) !important;
}

/* 工坊底部动作按钮 */
.chibi-workshop__actions .el-button {
  border-radius: 14px !important;
  font-weight: 700 !important;
  backdrop-filter: blur(10px) !important;
}
.chibi-workshop__actions .el-button:not(.el-button--primary) {
  background: rgba(255, 255, 255, 0.6) !important; border-color: rgba(203, 213, 225, 0.8) !important;
}
:global(html.dark) .chibi-workshop__actions .el-button:not(.el-button--primary) {
  background: rgba(30, 41, 59, 0.6) !important; border-color: rgba(255, 255, 255, 0.15) !important; color: #e2e8f0 !important;
}

/* ==========================================================
   4. 折叠面板无缝融合 (Collapse Panel)
   ========================================================== */
.agent-studio :deep(.el-collapse) {
  border: none !important;
}
.agent-studio :deep(.el-collapse-item__header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2) !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  color: var(--buddy-text) !important;
}
:global(html.dark) .agent-studio :deep(.el-collapse-item__header) {
  border-bottom-color: rgba(255, 255, 255, 0.1) !important;
  color: #f8fafc !important;
}
.agent-studio :deep(.el-collapse-item__wrap) {
  background: transparent !important;
  border-bottom: none !important;
}
.agent-studio :deep(.el-collapse-item__content) {
  padding-top: 20px !important;
  padding-bottom: 8px !important;
}

/* ==========================================================
   🛠️ Q版形象工坊：全息兵工厂 (Holographic Workshop)
   ========================================================== */

/* --- 1. 左侧投影舱 (Holographic Comms Pod) --- */
.agent-studio .chibi-workshop__preview-card {
  position: relative;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(241, 245, 249, 0.6) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 24px 48px -12px rgba(37, 99, 235, 0.15), inset 0 2px 12px rgba(255, 255, 255, 0.8) !important;
  /* 注入科幻蓝图网格纹理 */
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px) !important;
  background-size: 20px 20px !important;
  border-radius: 28px !important;
  padding: 24px 20px !important;
}

:global(html.dark) .agent-studio .chibi-workshop__preview-card {
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.9), inset 0 2px 16px rgba(255, 255, 255, 0.05) !important;
  background-image:
    linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px) !important;
}

/* 旋转科技准星 HUD 环 */
.agent-studio .chibi-workshop__preview-ring {
  background: transparent !important;
  box-shadow: none !important;
  position: relative;
  z-index: 1;
}
.agent-studio .chibi-workshop__preview-ring::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px dashed rgba(139, 92, 246, 0.5);
  border-top: 3px solid #38bdf8;
  border-bottom: 3px solid #ec4899;
  animation: hud-scan-spin 10s linear infinite;
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.3) inset;
}
@keyframes hud-scan-spin {
  100% {
    transform: rotate(360deg);
  }
}

/* 预览图增加全息发光边框（根节点 class 为 .agent-chibi） */
.agent-studio .chibi-workshop__preview-ring .agent-chibi {
  border: 3px solid #fff !important;
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.6) !important;
}
:global(html.dark) .agent-studio .chibi-workshop__preview-ring .agent-chibi {
  border-color: #0f172a !important;
}

/* --- 2. 赛博机械按键 (Tactile Cyber-Pills) --- */
.agent-studio .chibi-lane-pill {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.6) 100%) !important;
  border: 1px solid rgba(203, 213, 225, 0.8) !important;
  border-bottom: 3px solid rgba(203, 213, 225, 0.9) !important; /* 物理厚度感 */
  border-radius: 16px !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important; /* 弹簧动效 */
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04) !important;
}

:global(html.dark) .agent-studio .chibi-lane-pill {
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.6) 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  border-bottom: 3px solid rgba(0, 0, 0, 0.4) !important;
}

.agent-studio .chibi-lane-pill:hover:not(.is-on) {
  transform: translateY(-4px) scale(1.02) !important;
  border-color: rgba(139, 92, 246, 0.4) !important;
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.15) !important;
}

/* 选中按下状态：赛博能量流转 */
.agent-studio .chibi-lane-pill.is-on {
  transform: translateY(2px) !important; /* 被按下去的真实质感 */
  border-bottom-width: 1px !important; /* 厚度消失 */
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%) !important;
  border: 1px solid #8b5cf6 !important;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4), inset 0 4px 12px rgba(139, 92, 246, 0.2) !important;
}

.agent-studio .chibi-lane-pill.is-on .chibi-lane-pill__short {
  background: linear-gradient(135deg, #7c3aed, #0ea5e9) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  font-weight: 900 !important;
  filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3)) !important;
}
:global(html.dark) .agent-studio .chibi-lane-pill.is-on .chibi-lane-pill__short {
  background: linear-gradient(135deg, #c4b5fd, #7dd3fc) !important;
}

/* --- 3. 宝石色板 (Gemstone Swatches) --- */
.agent-studio .chibi-swatch {
  border-radius: 12px !important;
  /* 强烈的宝石倒角与内部高光 */
  box-shadow:
    inset -2px -3px 6px rgba(0, 0, 0, 0.2),
    inset 2px 3px 6px rgba(255, 255, 255, 0.6),
    0 4px 10px rgba(15, 23, 42, 0.15) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.agent-studio .chibi-swatch:hover {
  transform: translateY(-4px) scale(1.1) !important;
}

/* 选中的宝石：能量爆发荧光 */
.agent-studio .chibi-swatch.is-on {
  transform: scale(1.2) !important;
  border-color: #fff !important;
  box-shadow:
    inset -2px -3px 6px rgba(0, 0, 0, 0.2),
    inset 2px 3px 6px rgba(255, 255, 255, 0.8),
    0 0 20px currentColor !important; /* 借用自身的颜色散发荧光 */
}

/* --- 4. 等离子滑块 (Plasma Sliders) --- */
.agent-studio :deep(.el-slider__runway) {
  background: rgba(203, 213, 225, 0.5) !important;
  border-radius: 8px !important;
  height: 10px !important;
}
:global(html.dark) .agent-studio :deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.1) !important;
}

.agent-studio :deep(.el-slider__bar) {
  background: linear-gradient(90deg, #38bdf8, #8b5cf6) !important;
  height: 10px !important;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.6) !important;
}
.agent-studio :deep(.el-slider__button) {
  border: 3px solid #fff !important;
  background: #8b5cf6 !important;
  width: 22px !important;
  height: 22px !important;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.8), 0 4px 8px rgba(0, 0, 0, 0.2) !important;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
.agent-studio :deep(.el-slider__button:hover),
.agent-studio :deep(.el-slider__button.dragging) {
  transform: scale(1.3) !important;
  box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3), 0 0 20px #8b5cf6 !important;
}

/* --- 5. HUD 面板标题 --- */
.agent-studio .chibi-panel__title {
  display: inline-block;
  background: linear-gradient(135deg, #1e3a8a, #7c3aed);
  -webkit-background-clip: text; color: transparent;
  font-weight: 900; letter-spacing: 0.05em;
  padding-bottom: 6px; margin-bottom: 16px;
  border-bottom: 3px solid rgba(139, 92, 246, 0.3);
}
:global(html.dark) .agent-studio .chibi-panel__title {
  background: linear-gradient(135deg, #93c5fd, #d8b4fe);
  -webkit-background-clip: text; color: transparent; border-bottom-color: rgba(168, 85, 247, 0.4);
}

/* =========================================
   峡谷 Q 版形象工坊 · Glass 2.0（膠囊切換 + 分路卡片）
   ========================================= */

.chibi-workshop.chibi-workshop--glass2 {
  margin-bottom: 32px;
  padding: 32px 24px 28px;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.chibi-workshop__header {
  text-align: center;
  margin-bottom: 28px;
}

.chibi-workshop__title--hero {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.chibi-workshop__subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--buddy-text-secondary, #64748b);
}

.chibi-mode-toggle.chibi-mode-toggle--segment {
  display: flex;
  justify-content: center;
  width: auto;
  margin-bottom: 28px;
}

.toggle-track {
  position: relative;
  display: flex;
  background: var(--buddy-surface-2, #f1f5f9);
  padding: 6px;
  border-radius: 100px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.toggle-btn {
  position: relative;
  z-index: 2;
  min-width: 0;
  flex: 1;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--buddy-text-regular, #475569);
  background: transparent;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.toggle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.toggle-btn.is-active {
  color: #3b82f6;
}

.toggle-glider {
  position: absolute;
  top: 6px;
  left: 6px;
  height: calc(100% - 12px);
  width: calc(50% - 6px);
  background: #ffffff;
  border-radius: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

.toggle-glider.preset {
  transform: translateX(0);
}
.toggle-glider.custom {
  transform: translateX(100%);
}

:global(html.dark) .toggle-track {
  background: rgba(15, 23, 42, 0.55);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);
}
:global(html.dark) .toggle-glider {
  background: rgba(30, 41, 59, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}
:global(html.dark) .toggle-btn {
  color: #94a3b8;
}
:global(html.dark) .toggle-btn.is-active {
  color: #93c5fd;
}

.chibi-panel--lane .chibi-panel__header {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
}

.chibi-lane-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--buddy-text-primary, #0f172a);
}

.chibi-lane-panel__hint {
  font-size: 12px;
  color: #94a3b8;
}

:global(html.dark) .chibi-lane-panel__title {
  color: #f8fafc;
}

.chibi-lane-grid.chibi-lane-grid--cards {
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.chibi-lane-btn {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  border: 1px solid var(--buddy-border, #e2e8f0);
  background: var(--buddy-surface, #ffffff);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chibi-lane-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(var(--buddy-rgb-brand, 59 130 246) / 0.45);
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px 6px;
  gap: 4px;
}

.btn-icon {
  font-size: 28px;
  line-height: 1;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.btn-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--buddy-text-regular, #475569);
  transition: color 0.3s ease;
}

.btn-sublabel {
  font-size: 10px;
  font-weight: 600;
  color: var(--buddy-text-muted, #94a3b8);
  line-height: 1.2;
  text-align: center;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chibi-lane-btn:hover {
  transform: translateY(-4px);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.chibi-lane-btn:hover .btn-icon {
  transform: scale(1.15) translateY(-2px);
}

.chibi-lane-btn.is-selected {
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

.chibi-lane-btn.is-selected .btn-label {
  color: #3b82f6;
}

.chibi-lane-btn.is-selected .btn-sublabel {
  color: rgba(37, 99, 235, 0.85);
}

.chibi-lane-btn.is-selected .btn-glow {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 40px;
  background: #3b82f6;
  filter: blur(20px);
  opacity: 0.4;
  animation: lane-pulse 2s infinite alternate;
}

.chibi-lane-btn.is-selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  z-index: 3;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
  animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop-in {
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

@keyframes lane-pulse {
  0% {
    opacity: 0.2;
    transform: translateX(-50%) scaleY(0.8);
  }
  100% {
    opacity: 0.6;
    transform: translateX(-50%) scaleY(1.2);
  }
}

:global(html.dark) .chibi-lane-btn {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(148, 163, 184, 0.25);
  color: #e2e8f0;
}

:global(html.dark) .chibi-lane-btn.is-selected {
  box-shadow:
    0 0 0 2px #60a5fa,
    0 8px 24px rgba(59, 130, 246, 0.35);
}

:global(html.dark) .chibi-lane-btn.is-selected::after {
  background: #3b82f6;
}

@media (prefers-reduced-motion: reduce) {
  .toggle-glider {
    transition: none;
  }
  .chibi-lane-btn.is-selected .btn-glow {
    animation: none;
    opacity: 0.35;
  }
  .chibi-lane-btn.is-selected::after {
    animation: none;
  }
}

/* --- 捏臉模塊：潮玩盲盒風（色卡 + 籌碼，與 qForm 枚舉對齊） --- */

.chibi-doll-panel__header {
  margin-bottom: 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
}

.chibi-doll-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--buddy-text-primary, #0f172a);
}

.chibi-doll-panel__hint {
  font-size: 12px;
  color: #94a3b8;
}

:global(html.dark) .chibi-doll-panel__title {
  color: #f8fafc;
}

.chibi-feature-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--buddy-surface-2, #f8fafc);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
}

:global(html.dark) .chibi-feature-container {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.35);
}

.feature-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-group--split {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}

.feature-group__col {
  flex: 1;
  min-width: min(100%, 200px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-group--colors {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}

.feature-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--buddy-text-primary, #334155);
  display: flex;
  align-items: center;
  gap: 6px;
}

.feature-label::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 12px;
  background: #3b82f6;
  border-radius: 2px;
}

.feature-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.feature-label-row .feature-label {
  margin: 0;
}

.color-swatches {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-swatches--dense {
  gap: 10px;
}

.color-swatches--hair .swatch-btn {
  width: 40px;
  height: 40px;
}

.swatch-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 0;
  background: var(--swatch-color);
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.swatch-btn:hover {
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.swatch-btn.is-active {
  transform: scale(1.1);
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px #3b82f6,
    0 8px 16px rgba(59, 130, 246, 0.3);
}

:global(html.dark) .swatch-btn {
  border-color: rgba(15, 23, 42, 0.9);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip-list--frame {
  gap: 8px;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid var(--buddy-border, #e2e8f0);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  color: var(--buddy-text-regular, #475569);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.chip-icon {
  font-size: 16px;
  line-height: 1;
  transition: transform 0.3s ease;
}

.chip-text {
  white-space: nowrap;
}

.feature-chip:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.feature-chip:hover .chip-icon {
  transform: scale(1.2) rotate(5deg);
}

.feature-chip.is-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  border-color: transparent;
  color: #3b82f6;
  font-weight: 600;
  box-shadow:
    0 0 0 1.5px #3b82f6,
    0 4px 12px rgba(59, 130, 246, 0.2);
}

.feature-chip--frame {
  flex: 1 1 calc(50% - 6px);
  min-width: 140px;
  justify-content: center;
}

@media (min-width: 640px) {
  .feature-chip--frame {
    flex: 1 1 calc(25% - 8px);
    min-width: 0;
  }
}

:global(html.dark) .feature-chip {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(148, 163, 184, 0.25);
  color: #e2e8f0;
}

:global(html.dark) .feature-chip.is-active {
  color: #93c5fd;
  box-shadow:
    0 0 0 1.5px #60a5fa,
    0 4px 12px rgba(59, 130, 246, 0.25);
}

@media (prefers-reduced-motion: reduce) {
  .swatch-btn,
  .feature-chip,
  .feature-chip:hover .chip-icon {
    transition: none;
    transform: none;
  }
}

/* --- 雙列：全息展台 + 捏臉控制（聯動 framePreset / 氛圍主題） --- */

.chibi-workshop__grid--workspace {
  display: block;
}

.chibi-workspace-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

@media (max-width: 900px) {
  .chibi-workspace-layout {
    grid-template-columns: 1fr;
  }

  .chibi-controls-scroll {
    max-height: none;
    overflow: visible;
  }
}

.chibi-controls-scroll {
  min-width: 0;
  max-height: min(82vh, 960px);
  overflow-y: auto;
  padding-right: 6px;
  scrollbar-gutter: stable;
}

.chibi-preview-showcase {
  position: relative;
  min-height: 440px;
  border-radius: 24px;
  background: linear-gradient(165deg, #0f172a 0%, #020617 88%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 52px 16px 24px;
  box-shadow:
    0 28px 56px rgba(0, 0, 0, 0.38) inset,
    0 20px 48px rgba(0, 0, 0, 0.25);
  transition:
    box-shadow 0.5s ease,
    border-color 0.5s ease;
  perspective: 900px;
  --vibe-color: #60a5fa;
}

.chibi-preview-showcase::before {
  content: '';
  position: absolute;
  top: -28%;
  left: -25%;
  right: -25%;
  bottom: 12%;
  background: radial-gradient(circle at 50% 32%, var(--vibe-color) 0%, transparent 58%);
  opacity: 0.2;
  filter: blur(46px);
  transition:
    background 0.85s ease,
    opacity 0.5s ease;
  pointer-events: none;
}

.chibi-preview-showcase[data-vibe='nature'] {
  --vibe-color: #34d399;
}
.chibi-preview-showcase[data-vibe='void'] {
  --vibe-color: #818cf8;
}
.chibi-preview-showcase[data-vibe='flame'] {
  --vibe-color: #fb923c;
}
.chibi-preview-showcase[data-vibe='cyber'] {
  --vibe-color: #c084fc;
}

.showcase-backdrop {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.6s ease;
}

.theme-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 6;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.avatar-hologram {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  animation: showcase-float 4s ease-in-out infinite;
}

.hologram-aura {
  position: absolute;
  inset: -6% -18% 22%;
  background: radial-gradient(ellipse at center, var(--vibe-color) 0%, transparent 72%);
  opacity: 0.38;
  filter: blur(24px);
  transition: background 0.85s ease, opacity 0.5s ease;
  pointer-events: none;
}

.hologram-scanline {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.55);
  animation: showcase-scan 3.2s linear infinite;
  opacity: 0.55;
  z-index: 4;
  pointer-events: none;
}

.showcase-avatar-ring {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 204px;
  height: 204px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.18), transparent 52%),
    radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.08) 0%, transparent 48%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14) inset,
    0 16px 44px rgba(0, 0, 0, 0.45);
}

.showcase-avatar-ring :deep(.agent-chibi) {
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 28px rgba(96, 165, 250, 0.45);
}

.showcase-meta {
  position: relative;
  z-index: 3;
  width: 100%;
  text-align: center;
  padding: 0 12px;
  margin-bottom: 10px;
}

.showcase-lane-hint {
  margin: 0 0 6px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.92);
}

.showcase-lane-hint strong {
  color: #fff;
}

.showcase-tip {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
  color: rgba(148, 163, 184, 0.95);
}

.showcase-pedestal {
  width: 200px;
  height: 38px;
  margin-top: 2px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.55),
    0 0 42px rgba(59, 130, 246, 0.22) inset;
  transform: rotateX(58deg);
  transform-origin: center center;
  z-index: 2;
  transition: box-shadow 0.85s ease;
}

.chibi-preview-showcase[data-vibe='nature'] .showcase-pedestal {
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.55),
    0 0 46px rgba(52, 211, 153, 0.35) inset;
}
.chibi-preview-showcase[data-vibe='void'] .showcase-pedestal {
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.55),
    0 0 46px rgba(129, 140, 248, 0.38) inset;
}
.chibi-preview-showcase[data-vibe='flame'] .showcase-pedestal {
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.55),
    0 0 46px rgba(251, 146, 60, 0.38) inset;
}
.chibi-preview-showcase[data-vibe='cyber'] .showcase-pedestal {
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.55),
    0 0 46px rgba(192, 132, 252, 0.4) inset;
}

@keyframes showcase-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

@keyframes showcase-scan {
  0% {
    top: 14%;
    opacity: 0;
  }
  12% {
    opacity: 0.88;
  }
  88% {
    opacity: 0.88;
  }
  100% {
    top: 76%;
    opacity: 0;
  }
}

/* 流光氛圍卡 */
.vibe-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.vibe-card {
  position: relative;
  min-height: 72px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 10px;
  text-align: left;
  background: rgba(255, 255, 255, 0.55);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.vibe-card__bg {
  position: absolute;
  inset: 0;
  opacity: 0.14;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.vibe-card[data-color='cyber'] .vibe-card__bg {
  background: linear-gradient(135deg, #4c1d95, #a855f7);
}
.vibe-card[data-color='nature'] .vibe-card__bg {
  background: linear-gradient(135deg, #064e3b, #10b981);
}
.vibe-card[data-color='flame'] .vibe-card__bg {
  background: linear-gradient(135deg, #7f1d1d, #ef4444);
}
.vibe-card[data-color='void'] .vibe-card__bg {
  background: linear-gradient(135deg, #312e81, #6366f1);
}

.vibe-card__icon,
.vibe-card__text {
  position: relative;
  z-index: 1;
}

.vibe-card__icon {
  font-size: 22px;
  line-height: 1;
}

.vibe-card__text {
  font-size: 14px;
  font-weight: 700;
  color: var(--buddy-text-primary, #0f172a);
}

.vibe-card:hover {
  transform: translateY(-3px);
}

.vibe-card:hover .vibe-card__bg {
  opacity: 0.32;
}

.vibe-card.is-active {
  transform: translateY(-3px) scale(1.02);
  border-color: transparent;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}

.vibe-card.is-active .vibe-card__bg {
  opacity: 1;
}

.vibe-card.is-active .vibe-card__text {
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

:global(html.dark) .vibe-card {
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(148, 163, 184, 0.22);
}

:global(html.dark) .vibe-card__text {
  color: #e2e8f0;
}

:global(html.dark) .vibe-card.is-active .vibe-card__text {
  color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .avatar-hologram {
    animation: none;
  }
  .hologram-scanline {
    animation: none;
  }
  .vibe-card:hover,
  .vibe-card.is-active {
    transform: none;
  }
}
</style>
