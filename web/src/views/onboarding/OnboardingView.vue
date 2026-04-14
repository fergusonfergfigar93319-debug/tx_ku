<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BuddyBackButton from '@/components/buddy/BuddyBackButton.vue'
import { ElMessage } from 'element-plus'
import rawQuestions from '../../../shared/onboarding-questions.json'
import { useOnboardingStore } from '@/stores/onboarding'
import { useUserStore } from '@/stores/user'
import type { OnboardingFieldJson, OnboardingQuestionsFile } from '@/types/onboarding'
import type { Profile } from '@/types/profile'

const questions = rawQuestions as OnboardingQuestionsFile

const router = useRouter()
const user = useUserStore()
const ob = useOnboardingStore()

const step = ref(0)
const loading = ref(false)

const steps = questions.steps
const current = computed(() => steps[step.value])

const allFields = computed(() => steps.flatMap((s) => s.fields))

const form = reactive<Record<string, unknown>>({})

function isInputField(f: OnboardingFieldJson) {
  return f.options.length === 0
}

function initDefault(f: OnboardingFieldJson) {
  if (isInputField(f)) return ''
  if (f.multiSelect) return [] as string[]
  return ''
}

onMounted(() => {
  ob.load()
  for (const f of allFields.value) {
    if (ob.draft[f.id] !== undefined) form[f.id] = ob.draft[f.id]
    else form[f.id] = initDefault(f)
  }
})

function syncDraft() {
  for (const f of allFields.value) {
    ob.setField(f.id, form[f.id])
  }
}

function list(id: string): string[] {
  const v = form[id]
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x.length > 0) as string[]
  return []
}

function single(id: string): string {
  const v = form[id]
  if (Array.isArray(v)) return v[0] ?? ''
  return String(v ?? '')
}

function validateField(f: OnboardingFieldJson): string | null {
  if (isInputField(f)) {
    if (!String(form[f.id] ?? '').trim()) {
      return f.id === 'nickname' ? '请填写昵称' : `请填写：${f.title}`
    }
    return null
  }
  if (f.multiSelect) {
    if (!list(f.id).length) return `请至少选择一项：${f.title}`
    return null
  }
  if (!single(f.id)) return `请选择：${f.title}`
  return null
}

function validateStep(): boolean {
  for (const f of current.value.fields) {
    const err = validateField(f)
    if (err) {
      ElMessage.warning(err)
      return false
    }
  }
  return true
}

function next() {
  if (!validateStep()) return
  syncDraft()
  if (step.value < steps.length - 1) step.value += 1
  else void submit()
}

function prev() {
  syncDraft()
  if (step.value > 0) step.value -= 1
}

/** 对齐 Android `parseAnswersToProfile` 字段 id */
function buildProfilePayload(): Partial<Profile> {
  const noGos = list('no_gos').filter((x) => x !== '无')
  return {
    nickname: single('nickname').trim() || '元流同频',
    bio: '',
    cityOrRegion: '',
    preferredGames: list('preferred_games').length
      ? list('preferred_games')
      : ['王者荣耀对局（排位 / 巅峰 / 匹配）'],
    rank: single('rank') || '未知',
    activeTime: list('active_time').length ? list('active_time') : ['不定时'],
    mainRoles: list('main_roles').length ? list('main_roles') : ['指挥 / 全能补位'],
    playStyle: single('play_style') || '稳健',
    target: single('target') || '娱乐放松',
    voicePref: single('voice_pref') || '随意',
    noGos,
    personalityArchetype: single('personality_archetype'),
    agentVoicePref: single('agent_voice_pref'),
    agentVisualTheme: single('agent_visual_theme'),
    favoriteEsportsHint: '',
    proPersonaStyle: '',
  }
}

async function submit() {
  if (!validateStep()) return
  syncDraft()
  loading.value = true
  try {
    const payload = buildProfilePayload()
    await user.saveProfile(payload)
    ob.clear()
    void router.replace('/game-interest')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="buddy-page onboarding">
    <div class="onboard-head">
      <BuddyBackButton :fallback="{ name: 'login' }" />
      <h1 class="onboard-title">建档问卷</h1>
    </div>
    <p class="progress">第 {{ step + 1 }} / {{ steps.length }} 步</p>
    <el-progress :percentage="Math.round(((step + 1) / steps.length) * 100)" :stroke-width="6" />

    <el-card class="buddy-card-surface" shadow="never">
      <h3>{{ current.title }}</h3>
      <p v-if="current.subtitle" class="step-sub">{{ current.subtitle }}</p>

      <div v-for="field in current.fields" :key="field.id" class="field-block">
        <h4 class="field-title">{{ field.title }}</h4>

        <template v-if="isInputField(field)">
          <el-input
            v-model="form[field.id] as string"
            :placeholder="field.id === 'nickname' ? '输入昵称' : '请输入'"
            maxlength="32"
            show-word-limit
          />
        </template>

        <template v-else-if="field.multiSelect">
          <el-checkbox-group v-model="form[field.id] as string[]" class="checks">
            <el-checkbox v-for="o in field.options" :key="o" :label="o" :value="o" />
          </el-checkbox-group>
        </template>

        <template v-else>
          <el-select v-model="form[field.id]" placeholder="请选择" style="width: 100%">
            <el-option v-for="o in field.options" :key="o" :label="o" :value="o" />
          </el-select>
        </template>
      </div>

      <div class="actions">
        <el-button @click="prev" :disabled="step === 0">上一步</el-button>
        <el-button type="primary" :loading="loading" @click="next">
          {{ step === steps.length - 1 ? '完成并继续' : '下一步' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.onboarding {
  padding-top: 24px;
}

.onboard-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.onboard-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--buddy-text);
}

.progress {
  margin: 12px 0 8px;
  font-size: 13px;
  color: var(--buddy-text-muted);
}

h3 {
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.35;
}

.step-sub {
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.field-block {
  margin-bottom: 22px;
}

.field-block:last-of-type {
  margin-bottom: 8px;
}

.field-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--buddy-text);
}

.checks {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 8px;
  border-top: 1px solid var(--buddy-border);
}
</style>
