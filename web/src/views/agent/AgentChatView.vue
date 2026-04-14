<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ChatLineRound, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { InputInstance } from 'element-plus'
import * as aiApi from '@/api/ai'
import AgentChibiAvatar from '@/components/agent/AgentChibiAvatar.vue'
import { useUserStore } from '@/stores/user'
import {
  FACTORY_AGENT_AVATAR,
  FACTORY_AGENT_NAME,
  findAgentPreset,
} from '@/data/agentPresets'
import { normalizeAgentQDesign } from '@/types/agentQDesign'
import { AGENT_STREAM_SIM_DEFAULTS, streamReplyText } from '@/utils/agentChatStream'
import {
  buildSmartMockReply,
  getAgentPresenceLine,
  getQuickPrompts,
} from '@/utils/agentPersona'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const composerInputRef = ref<InputInstance>()
const abortCtl = ref<AbortController | null>(null)

const useCustomChibiChat = computed(() => user.profile?.agentUseCustomChibi === true)

const chatChibiDesign = computed(() => normalizeAgentQDesign(user.profile?.agentBuddyQDesign))

const chatAvatar = computed(() => {
  if (useCustomChibiChat.value) return ''
  if (!user.profile?.agentPresetId) return FACTORY_AGENT_AVATAR
  return (
    user.profile.agentBuddyAvatarUrl ||
    findAgentPreset(user.profile.agentPresetId)?.avatarUrl ||
    FACTORY_AGENT_AVATAR
  )
})

const chatTitle = computed(() => {
  if (user.profile?.agentUseCustomChibi) {
    return user.profile?.agentBuddyDisplayName?.trim() || '我的峡谷搭子'
  }
  if (!user.profile?.agentPresetId) return FACTORY_AGENT_NAME
  return (
    user.profile.agentBuddyDisplayName?.trim() ||
    findAgentPreset(user.profile.agentPresetId)?.name ||
    FACTORY_AGENT_NAME
  )
})

const presenceLine = computed(() => getAgentPresenceLine(user.agentTuning))

const laneForPrompts = computed(() => {
  if (user.profile?.agentUseCustomChibi && user.profile?.agentBuddyQDesign) {
    return normalizeAgentQDesign(user.profile.agentBuddyQDesign).laneArchetype
  }
  return undefined
})

const quickPrompts = computed(() => getQuickPrompts(user.agentTuning, laneForPrompts.value))

interface Msg {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
  /** 流式输出中（用于光标与样式） */
  streaming?: boolean
}

const messages = ref<Msg[]>([])
const input = ref('')
const loading = ref(false)
const streaming = ref(false)
const bottomRef = ref<HTMLElement | null>(null)

function formatMsgTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function mapFromApi(
  list: { id: string; role: 'user' | 'assistant'; text: string; createdAt?: string }[],
): Msg[] {
  return list.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    createdAt: m.createdAt,
  }))
}

async function loadHistory() {
  try {
    const r = await aiApi.getAgentChatHistory()
    messages.value = mapFromApi(r.list)
  } catch {
    messages.value = [
      {
        id: 'local-fallback',
        role: 'assistant',
        text: '暂时无法同步云端会话，已启用本地智能体感回复；发送消息即可体验。',
        createdAt: new Date().toISOString(),
      },
    ]
  }
}

async function sendTextFallback(t: string, signal: AbortSignal) {
  loading.value = false
  streaming.value = true
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    text: t,
    createdAt: new Date().toISOString(),
  })
  const reply = buildSmartMockReply(t, user.agentTuning)
  const assistant: Msg = {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: '',
    streaming: true,
    createdAt: new Date().toISOString(),
  }
  messages.value.push(assistant)
  try {
    await streamReplyText(
      reply,
      (text) => {
        assistant.text = text
      },
      { signal, ...AGENT_STREAM_SIM_DEFAULTS },
    )
  } finally {
    assistant.streaming = false
    streaming.value = false
  }
}

async function sendText(text: string) {
  const t = text.trim()
  if (!t || loading.value || streaming.value) return
  input.value = ''
  loading.value = true
  streaming.value = false
  abortCtl.value?.abort()
  abortCtl.value = new AbortController()
  const signal = abortCtl.value.signal

  let streamStarted = false

  try {
    await aiApi.postAgentChatStream(
      { message: t },
      {
        onDelta: async (full) => {
          if (!streamStarted) {
            streamStarted = true
            loading.value = false
            streaming.value = true
            await loadHistory()
          }
          const lastAssistant = [...messages.value].reverse().find((m) => m.role === 'assistant')
          if (lastAssistant) {
            lastAssistant.text = full
            lastAssistant.streaming = true
          }
          await nextTick()
          bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
        },
        onDone: async (meta) => {
          streaming.value = false
          const lastAssistant = [...messages.value].reverse().find((m) => m.role === 'assistant')
          if (lastAssistant) lastAssistant.streaming = false
          await loadHistory()
          if (meta.route === 'forum') {
            void router.push({ name: 'post-editor', query: { prefill: meta.query || '' } })
          }
        },
        onError: (err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          console.error(err)
          ElMessage.error('回复失败，请重试')
        },
      },
      { signal },
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      streaming.value = false
      await loadHistory()
      return
    }
    await sendTextFallback(t, signal)
  } finally {
    if (!streamStarted) loading.value = false
    streaming.value = false
    await nextTick()
    bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
  }
}

function send() {
  void sendText(input.value)
}

function stopStreaming() {
  abortCtl.value?.abort()
}

function focusComposer() {
  composerInputRef.value?.focus?.()
}

function onComposerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    send()
    return
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function onChatHotkeys(e: KeyboardEvent) {
  if (route.name !== 'agent-chat') return
  if (!(e.ctrlKey || e.metaKey)) return
  const isSlash = e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide'
  if (!isSlash) return
  const t = e.target as HTMLElement | null
  if (t?.closest?.('input, textarea, [contenteditable="true"]')) return
  e.preventDefault()
  focusComposer()
}

function useQuickPrompt(p: string) {
  void sendText(p)
}

onMounted(async () => {
  await loadHistory()
  await nextTick(() => bottomRef.value?.scrollIntoView())
  window.addEventListener('keydown', onChatHotkeys, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onChatHotkeys, true)
})
</script>

<template>
  <div class="agent-chat-root buddy-page app-page-stack">
    <div class="agent-chat-aurora" aria-hidden="true">
      <span class="agent-chat-aurora__blob agent-chat-aurora__blob--a" />
      <span class="agent-chat-aurora__blob agent-chat-aurora__blob--b" />
      <span class="agent-chat-aurora__blob agent-chat-aurora__blob--c" />
    </div>

    <section class="app-layer app-layer--discover agent-chat-layer agent-chat-layer--head" aria-label="对话对象">
      <div class="app-layer__inner">
        <header class="chat-head">
          <div class="chat-head__row">
            <div class="chat-head__agent" :class="{ 'is-thinking': loading || streaming }">
              <div class="chat-head__avatar-ring">
                <div v-if="useCustomChibiChat" class="chat-head__chibi-wrap">
                  <AgentChibiAvatar
                    :design="chatChibiDesign"
                    :size="48"
                    :with-backdrop="false"
                  />
                </div>
                <img
                  v-else
                  class="chat-head__avatar"
                  :class="{ 'chat-head__avatar--brand': !user.profile?.agentPresetId }"
                  :src="chatAvatar"
                  alt=""
                  width="48"
                  height="48"
                />
              </div>
              <div class="chat-head__meta">
                <span class="chat-head__title-row">
                  <span class="title">{{ chatTitle }}</span>
                  <span class="chat-head__badge" title="对话智能体">
                    <el-icon :size="14"><ChatLineRound /></el-icon>
                    智能体
                  </span>
                </span>
                <span class="subtitle">
                  {{ presenceLine }}
                  <span v-if="loading" class="chat-head__thinking"> · 正在回复</span>
                  <span v-else-if="streaming" class="chat-head__thinking"> · 流式输出中</span>
                </span>
              </div>
            </div>
            <RouterLink class="chat-head__studio-link" to="/app/agent">调整搭子</RouterLink>
          </div>
        </header>
      </div>
    </section>

    <section
      class="app-layer app-layer--content agent-chat-layer agent-chat-layer--feed"
      aria-label="消息列表"
    >
      <div class="app-layer__inner agent-chat-layer__feed-inner">
        <div class="messages-scroll">
          <div class="messages">
            <template v-for="m in messages" :key="m.id">
              <div v-if="m.role === 'user'" class="msg-row msg-row--user">
                <div class="msg-col">
                  <span v-if="m.createdAt" class="msg-time">{{ formatMsgTime(m.createdAt) }}</span>
                  <div class="bubble bubble--user">{{ m.text }}</div>
                </div>
              </div>
              <div v-else class="msg-row msg-row--assistant">
                <div v-if="useCustomChibiChat" class="msg-chibi-wrap">
                  <AgentChibiAvatar :design="chatChibiDesign" :size="36" :with-backdrop="false" />
                </div>
                <img
                  v-else
                  class="msg-avatar"
                  :class="{ 'msg-avatar--brand': !user.profile?.agentPresetId }"
                  :src="chatAvatar"
                  alt=""
                  width="36"
                  height="36"
                />
                <div class="msg-col">
                  <span v-if="m.createdAt" class="msg-time">{{ formatMsgTime(m.createdAt) }}</span>
                  <div
                    class="bubble bubble--assistant"
                    :class="{ 'bubble--streaming': m.streaming }"
                  >
                    {{ m.text }}
                  </div>
                </div>
              </div>
            </template>

            <div v-if="loading && !streaming" class="msg-row msg-row--assistant typing-row">
              <div v-if="useCustomChibiChat" class="msg-chibi-wrap msg-chibi-wrap--dim">
                <AgentChibiAvatar :design="chatChibiDesign" :size="36" :with-backdrop="false" />
              </div>
              <img
                v-else
                class="msg-avatar msg-avatar--dim"
                :class="{ 'msg-avatar--brand': !user.profile?.agentPresetId }"
                :src="chatAvatar"
                alt=""
                width="36"
                height="36"
              />
              <div class="typing-bubble" aria-live="polite" aria-busy="true">
                <span class="typing-dot" />
                <span class="typing-dot" />
                <span class="typing-dot" />
              </div>
            </div>

            <div ref="bottomRef" />
          </div>
        </div>
      </div>
    </section>

    <section class="app-layer app-layer--tools agent-chat-layer agent-chat-layer--composer" aria-label="输入与快捷话术">
      <div class="app-layer__inner">
        <div class="composer-wrap">
          <div v-if="quickPrompts.length" class="quick-prompts" aria-label="快捷话术">
            <button
              v-for="(p, i) in quickPrompts"
              :key="i"
              type="button"
              class="quick-chip"
              :disabled="loading || streaming"
              @click="useQuickPrompt(p)"
            >
              <el-icon class="quick-chip__ico" :size="14"><Promotion /></el-icon>
              {{ p }}
            </button>
          </div>
          <p class="composer-tip">
            点选上方快捷话术可一键发送；支持流式输出与多轮上下文。快捷键：
            <kbd class="composer-kbd">Enter</kbd> 发送 ·
            <kbd class="composer-kbd">Shift+Enter</kbd> 换行 ·
            <kbd class="composer-kbd">Ctrl+Enter</kbd> 发送 ·
            <kbd class="composer-kbd">Ctrl+/</kbd> 聚焦输入
          </p>
          <div class="composer">
            <el-input
              ref="composerInputRef"
              v-model="input"
              type="textarea"
              :rows="2"
              class="composer-input"
              placeholder="输入消息，Enter 发送 · Shift+Enter 换行"
              :disabled="loading || streaming"
              @keydown="onComposerKeydown"
            />
            <div class="composer-actions">
              <el-button
                v-if="loading || streaming"
                class="composer-stop"
                @click="stopStreaming"
              >
                停止
              </el-button>
              <el-button
                class="composer-send buddy-button buddy-button--primary"
                type="primary"
                :loading="loading && !streaming"
                :disabled="loading || streaming"
                @click="send"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.agent-chat-root {
  position: relative;
  max-width: 880px;
  margin: 0 auto;
  min-height: min(78vh, 720px);
  padding-bottom: 8px;
}

.agent-chat-root > .app-layer {
  z-index: 1;
}

.agent-chat-root.app-page-stack {
  align-items: stretch;
}

.agent-chat-layer--feed {
  flex: 1;
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.agent-chat-layer__feed-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-top: 10px;
  padding-bottom: 10px;
}

.agent-chat-aurora {
  position: absolute;
  inset: -12px -8px 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 28px;
}

.agent-chat-aurora__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.55;
  animation: agent-aurora-float 14s ease-in-out infinite;
}

.agent-chat-aurora__blob--a {
  width: min(72vw, 420px);
  height: min(72vw, 420px);
  top: -18%;
  left: -12%;
  background: radial-gradient(circle, rgb(var(--buddy-rgb-brand) / 0.35) 0%, transparent 68%);
}

.agent-chat-aurora__blob--b {
  width: min(60vw, 360px);
  height: min(60vw, 360px);
  top: 8%;
  right: -16%;
  background: radial-gradient(circle, rgb(var(--buddy-rgb-accent) / 0.32) 0%, transparent 70%);
  animation-delay: -4s;
}

.agent-chat-aurora__blob--c {
  width: min(50vw, 280px);
  height: min(50vw, 280px);
  bottom: 0;
  left: 28%;
  background: radial-gradient(circle, rgb(var(--buddy-rgb-teal) / 0.28) 0%, transparent 72%);
  animation-delay: -7s;
}

@keyframes agent-aurora-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(3%, 4%) scale(1.04);
  }
  66% {
    transform: translate(-2%, 2%) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .agent-chat-aurora__blob {
    animation: none;
    opacity: 0.38;
  }
}

.chat-head {
  margin: 0;
  padding: 0;
}

.chat-head__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 100%;
}

.chat-head__studio-link {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--buddy-primary);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.22);
  background: rgb(255 255 255 / 0.75);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.chat-head__studio-link:hover {
  background: rgb(var(--buddy-rgb-brand) / 0.08);
  box-shadow: 0 2px 12px rgb(37 99 235 / 0.12);
}

.chat-head__agent {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.chat-head__avatar-ring {
  flex-shrink: 0;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fda4af 0%, #c084fc 45%, #6366f1 100%);
  box-shadow: 0 0 24px rgb(99 102 241 / 0.25);
  transition: box-shadow 0.35s ease;
}

.chat-head__agent.is-thinking .chat-head__avatar-ring {
  box-shadow:
    0 0 0 3px rgb(var(--buddy-rgb-brand) / 0.2),
    0 0 32px rgb(99 102 241 / 0.45);
  animation: agent-think-pulse 1.2s ease-in-out infinite;
}

@keyframes agent-think-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-head__agent.is-thinking .chat-head__avatar-ring {
    animation: none;
  }
}

.chat-head__avatar {
  display: block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--buddy-surface-elevated);
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.95);
}

.chat-head__avatar--brand {
  object-fit: contain;
  padding: 4px;
}

.chat-head__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.chat-head__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}

.title {
  font-weight: 800;
  font-size: clamp(17px, 2.6vw, 19px);
  color: var(--buddy-primary);
  letter-spacing: 0.02em;
}

.chat-head__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--buddy-rgb-accent));
  background: rgb(var(--buddy-rgb-accent) / 0.1);
  border: 1px solid rgb(var(--buddy-rgb-accent) / 0.2);
}

.subtitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--buddy-text-muted);
  line-height: 1.45;
}

.chat-head__thinking {
  font-weight: 700;
  color: rgb(var(--buddy-rgb-brand));
}

.chat-head__chibi-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--buddy-surface-elevated);
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.95);
}

.msg-chibi-wrap {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  align-self: flex-end;
  margin-bottom: 22px;
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.9);
  background: var(--buddy-surface-elevated);
}

.msg-chibi-wrap--dim {
  opacity: 0.85;
}

.messages-scroll {
  flex: 1;
  min-height: 120px;
  overflow: auto;
  padding: 4px 2px 6px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.msg-row {
  display: flex;
  gap: 10px;
  max-width: 100%;
}

.msg-row--user {
  justify-content: flex-end;
}

.msg-row--assistant {
  justify-content: flex-start;
  align-items: flex-end;
}

.msg-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  align-self: flex-end;
  margin-bottom: 22px;
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.9);
  background: var(--buddy-surface-elevated);
}

.msg-avatar--brand {
  object-fit: contain;
  padding: 2px;
}

.msg-avatar--dim {
  opacity: 0.85;
}

.msg-col {
  display: flex;
  flex-direction: column;
  align-items: inherit;
  max-width: min(88%, 560px);
}

.msg-row--user .msg-col {
  align-items: flex-end;
}

.msg-time {
  font-size: 10px;
  font-weight: 600;
  color: var(--buddy-text-muted);
  opacity: 0.85;
  margin-bottom: 4px;
}

.bubble {
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.58;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble--user {
  background: linear-gradient(
    135deg,
    rgb(var(--buddy-rgb-brand) / 0.14) 0%,
    rgb(var(--buddy-rgb-accent) / 0.1) 100%
  );
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.22);
  box-shadow: 0 2px 12px rgb(37 99 235 / 0.08);
}

.bubble--assistant {
  background: linear-gradient(180deg, rgb(255 255 255 / 0.95) 0%, rgb(248 250 252 / 0.92) 100%);
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: 0 2px 14px rgb(15 23 42 / 0.05);
}

.bubble--streaming::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 3px;
  vertical-align: -0.12em;
  background: rgb(var(--buddy-rgb-brand));
  animation: agent-stream-cursor 0.85s step-end infinite;
}

@keyframes agent-stream-cursor {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bubble--streaming::after {
    animation: none;
    opacity: 0.75;
  }
}

.typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgb(255 255 255 / 0.92);
  border: 1px solid rgb(15 23 42 / 0.08);
}

.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--buddy-rgb-brand) / 0.45);
  animation: agent-typing 0.9s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes agent-typing {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing-dot {
    animation: none;
    opacity: 0.65;
  }
}

.composer-wrap {
  margin: 0;
  padding: 0;
}

.composer-tip {
  margin: 0 0 10px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
}

.composer-kbd {
  display: inline-block;
  margin: 0 2px;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--buddy-text-muted);
  background: rgb(15 23 42 / 0.06);
  border-radius: 4px;
  border: 1px solid rgb(15 23 42 / 0.08);
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.quick-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 7px 11px;
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.18);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-primary);
  background: rgb(255 255 255 / 0.85);
  cursor: pointer;
  transition:
    transform 0.2s var(--buddy-ease-out),
    box-shadow 0.2s var(--buddy-ease-out),
    border-color 0.2s ease;
}

.quick-chip:hover:not(:disabled) {
  border-color: rgb(var(--buddy-rgb-brand) / 0.35);
  box-shadow: 0 4px 14px rgb(37 99 235 / 0.12);
  transform: translateY(-1px);
}

.quick-chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.quick-chip__ico {
  flex-shrink: 0;
  opacity: 0.85;
}

.composer {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.composer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  align-items: stretch;
}

.composer-stop {
  min-width: 88px;
  height: 40px;
  border-radius: 12px !important;
  font-weight: 700;
}

.composer-input {
  flex: 1;
}

.composer-input :deep(.el-textarea__inner) {
  border-radius: 14px;
  resize: none;
  box-shadow: 0 0 0 1px rgb(15 23 42 / 0.08) inset;
  transition: box-shadow 0.2s ease;
}

.composer-input :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px rgb(var(--buddy-rgb-brand) / 0.35) inset;
}

.composer-send {
  flex-shrink: 0;
  min-width: 88px;
  height: 40px;
  font-weight: 700;
  border-radius: 12px !important;
}

@media (min-width: 1280px) {
  .agent-chat-root {
    max-width: 920px;
  }
}
</style>
