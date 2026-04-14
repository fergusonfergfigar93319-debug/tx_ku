<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  Brush,
  Cpu,
  MagicStick,
  Present,
  QuestionFilled,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import * as aiApi from '@/api/ai'
import AgentChibiAvatar from '@/components/agent/AgentChibiAvatar.vue'
import {
  FACTORY_AGENT_AVATAR,
  FACTORY_AGENT_NAME,
  OFFICIAL_AGENT_PRESETS,
  findAgentPreset,
  type AgentOfficialPreset,
} from '@/data/agentPresets'
import { Q_ACCENT_SWATCHES, Q_HAIR_SWATCHES, Q_LABELS, Q_OUTFIT_SWATCHES } from '@/data/agentQDesignUi'
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

    <section class="chibi-workshop buddy-card-surface" aria-labelledby="chibi-heading">
      <div class="chibi-workshop__head">
        <span class="chibi-workshop__ico" aria-hidden="true">
          <el-icon :size="22"><Brush /></el-icon>
        </span>
        <div>
          <h2 id="chibi-heading" class="chibi-workshop__title">峡谷 Q 版形象工坊</h2>
          <p class="chibi-workshop__desc">
            分路气质、神态与配色可自由组合（原创抽象造型）。善用「随机灵感」探索搭配，再用色板与取色器精修；保存后聊天顶栏与气泡旁同步展示。
          </p>
        </div>
      </div>

      <el-radio-group
        class="chibi-mode-toggle"
        :model-value="avatarMode"
        size="default"
        @change="(v: string | number | boolean | undefined) => onAvatarModeChange(String(v) as 'preset' | 'custom')"
      >
        <el-radio-button value="preset">官方成品套组</el-radio-button>
        <el-radio-button value="custom">我的 Q 版创作</el-radio-button>
      </el-radio-group>

      <div v-show="avatarMode === 'custom'" class="chibi-workshop__grid">
        <div class="chibi-workshop__preview-card">
          <p class="chibi-workshop__preview-label">实时预览</p>
          <div class="chibi-workshop__preview-ring" aria-hidden="true">
            <AgentChibiAvatar :design="qForm" :size="180" />
          </div>
          <p class="chibi-workshop__lane-hint">
            当前气质：
            <strong>{{ LANE_ARCHETYPE_OPTIONS.find((x) => x.value === qForm.laneArchetype)?.label }}</strong>
          </p>
          <p class="chibi-workshop__tip">
            衣装与点缀色对比度越高，轮廓越清晰；腮红「元气」适合暖色发系。
          </p>
        </div>

        <div class="chibi-workshop__fields">
          <div class="chibi-panel">
            <h3 class="chibi-panel__title">分路气质</h3>
            <div class="chibi-lane-grid" role="group" aria-label="选择分路气质">
              <button
                v-for="o in LANE_ARCHETYPE_OPTIONS"
                :key="o.value"
                type="button"
                class="chibi-lane-pill"
                :class="{ 'is-on': qForm.laneArchetype === o.value }"
                :aria-pressed="qForm.laneArchetype === o.value"
                @click="qForm.laneArchetype = o.value"
              >
                <span class="chibi-lane-pill__short">{{ o.short }}</span>
                <span class="chibi-lane-pill__full">{{ o.label }}</span>
              </button>
            </div>
          </div>

          <div class="chibi-panel">
            <h3 class="chibi-panel__title">神态与肤色</h3>
            <div class="chibi-field">
              <span class="chibi-field__label">肤色</span>
              <el-slider v-model="qForm.skinTone" :min="0" :max="3" :step="1" show-stops />
              <span class="chibi-field__meta">{{ Q_LABELS.skin[qForm.skinTone] }}</span>
            </div>
            <div class="chibi-field chibi-field--row">
              <div>
                <span class="chibi-field__label">嘴型</span>
                <el-select v-model="qForm.mouthStyle" style="width: 100%">
                  <el-option
                    v-for="(lb, i) in Q_LABELS.mouth"
                    :key="'m-' + i"
                    :label="lb"
                    :value="i as 0 | 1 | 2"
                  />
                </el-select>
              </div>
              <div>
                <span class="chibi-field__label">腮红</span>
                <el-select v-model="qForm.blushLevel" style="width: 100%">
                  <el-option
                    v-for="(lb, i) in Q_LABELS.blush"
                    :key="'b-' + i"
                    :label="lb"
                    :value="i as 0 | 1 | 2"
                  />
                </el-select>
              </div>
            </div>
            <div class="chibi-field">
              <span class="chibi-field__label">眼神</span>
              <el-select v-model="qForm.eyeStyle" style="width: 100%">
                <el-option
                  v-for="(lb, i) in Q_LABELS.eyes"
                  :key="i"
                  :label="lb"
                  :value="i as 0 | 1 | 2"
                />
              </el-select>
            </div>
          </div>

          <div class="chibi-panel">
            <h3 class="chibi-panel__title">发型与头饰</h3>
            <div class="chibi-field chibi-field--row">
              <div>
                <span class="chibi-field__label">发型</span>
                <el-select v-model="qForm.hairStyle" style="width: 100%">
                  <el-option
                    v-for="(lb, i) in Q_LABELS.hair"
                    :key="i"
                    :label="lb"
                    :value="i as 0 | 1 | 2 | 3"
                  />
                </el-select>
              </div>
              <div>
                <span class="chibi-field__label">头饰</span>
                <el-select v-model="qForm.accessory" style="width: 100%">
                  <el-option
                    v-for="(lb, i) in Q_LABELS.accessory"
                    :key="i"
                    :label="lb"
                    :value="i as 0 | 1 | 2 | 3"
                  />
                </el-select>
              </div>
            </div>
            <div class="chibi-field">
              <div class="chibi-field__label-row">
                <span class="chibi-field__label">发色</span>
                <el-color-picker
                  v-model="qForm.hairColor"
                  size="small"
                  :predefine="[...Q_HAIR_SWATCHES]"
                  show-alpha
                />
              </div>
              <div class="chibi-swatches">
                <button
                  v-for="c in Q_HAIR_SWATCHES"
                  :key="c"
                  type="button"
                  class="chibi-swatch"
                  :class="{ 'is-on': qForm.hairColor === c }"
                  :style="{ background: c }"
                  :title="c"
                  @click="qForm.hairColor = c"
                />
              </div>
            </div>
          </div>

          <div class="chibi-panel">
            <h3 class="chibi-panel__title">配色与氛围</h3>
            <div class="chibi-field">
              <span class="chibi-field__label">预览背景</span>
              <el-select v-model="qForm.framePreset" style="width: 100%">
                <el-option
                  v-for="(lb, i) in Q_LABELS.frame"
                  :key="'f-' + i"
                  :label="lb"
                  :value="i as 0 | 1 | 2 | 3"
                />
              </el-select>
            </div>
            <div class="chibi-field chibi-field--row">
              <div>
                <div class="chibi-field__label-row">
                  <span class="chibi-field__label">衣装主色</span>
                  <el-color-picker
                    v-model="qForm.outfitHue"
                    size="small"
                    :predefine="[...Q_OUTFIT_SWATCHES]"
                    show-alpha
                  />
                </div>
                <div class="chibi-swatches chibi-swatches--sm">
                  <button
                    v-for="c in Q_OUTFIT_SWATCHES"
                    :key="'o-' + c"
                    type="button"
                    class="chibi-swatch"
                    :class="{ 'is-on': qForm.outfitHue === c }"
                    :style="{ background: c }"
                    @click="qForm.outfitHue = c"
                  />
                </div>
              </div>
              <div>
                <div class="chibi-field__label-row">
                  <span class="chibi-field__label">点缀色</span>
                  <el-color-picker
                    v-model="qForm.accentHue"
                    size="small"
                    :predefine="[...Q_ACCENT_SWATCHES]"
                    show-alpha
                  />
                </div>
                <div class="chibi-swatches chibi-swatches--sm">
                  <button
                    v-for="c in Q_ACCENT_SWATCHES"
                    :key="'a-' + c"
                    type="button"
                    class="chibi-swatch"
                    :class="{ 'is-on': qForm.accentHue === c }"
                    @click="qForm.accentHue = c"
                  />
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

      <div class="preset-scroller">
        <button
          v-for="p in OFFICIAL_AGENT_PRESETS"
          :key="p.id"
          type="button"
          class="preset-card"
          :class="{ 'is-selected': user.profile?.agentPresetId === p.id }"
          :aria-pressed="user.profile?.agentPresetId === p.id"
          :style="{ background: p.gradient }"
          :disabled="loading"
          @click="selectPreset(p)"
        >
          <div v-if="selectingId === p.id" class="preset-card__loading" aria-hidden="true" />
          <div class="preset-card__avatar">
            <img :src="p.avatarUrl" alt="" width="64" height="64" />
          </div>
          <span class="preset-card__role" aria-hidden="true">
            <el-icon :size="18"><component :is="p.roleIcon" /></el-icon>
          </span>
          <span class="preset-card__name">{{ p.name }}</span>
          <span class="preset-card__line">{{ p.tagline }} · {{ p.detail }}</span>
        </button>
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
              <el-select v-model="form.focusScenario" style="width: 100%">
                <el-option v-for="s in FOCUS_SCENARIO_OPTIONS" :key="s" :label="s" :value="s" />
              </el-select>
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
              <el-select v-model="form.avatarStyle" style="width: 100%">
                <el-option v-for="s in AVATAR_STYLE_OPTIONS" :key="s" :label="s" :value="s" />
              </el-select>
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
.agent-studio {
  padding-bottom: 28px;
}

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
  margin-bottom: 28px;
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

.preset-scroller {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 6px 2px 12px;
  margin: 0 -4px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.preset-scroller::-webkit-scrollbar {
  height: 5px;
}

.preset-card {
  position: relative;
  flex: 0 0 148px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 14px 10px 12px;
  border: 2px solid transparent;
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.38s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.38s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.22s ease;
}

/* 轻量装饰层（优化方案 2.3 B：悬停时层次加深） */
.preset-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.12) 0%, transparent 45%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.preset-card:hover:not(:disabled)::before {
  opacity: 1;
}

.preset-card:hover:not(:disabled) {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.14),
    0 0 0 1px rgb(255 255 255 / 0.22) inset;
}

@media (prefers-reduced-motion: reduce) {
  .preset-card:hover:not(:disabled) {
    transform: translateY(-2px);
  }
}

.preset-card.is-selected {
  border-color: rgba(37, 99, 235, 0.5);
  box-shadow: 0 6px 22px rgba(37, 99, 235, 0.18);
}

.preset-card:disabled {
  opacity: 0.7;
  cursor: wait;
}

.preset-card__loading {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: rgba(18, 18, 22, 0.55);
  pointer-events: none;
}

.preset-card__avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.07);
  background: var(--buddy-surface-elevated);
}

.preset-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preset-card__role {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--buddy-primary);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}

.preset-card__name {
  font-size: 13px;
  font-weight: 800;
  color: var(--buddy-primary);
  line-height: 1.3;
  margin-bottom: 6px;
}

.preset-card__line {
  font-size: 10px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
</style>
