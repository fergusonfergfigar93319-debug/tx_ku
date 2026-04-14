<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as dmApi from '@/api/dm'
import { useDmStore } from '@/stores/dm'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'

const route = useRoute()
const dm = useDmStore()

const peerUserId = ref(route.params.peerUserId as string)
const text = ref('')
const loading = ref(false)
const sending = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const messages = ref(dm.messagesByPeer[peerUserId.value] || [])

async function load(opts?: { silent?: boolean }) {
  const silent = opts?.silent === true
  if (!silent) loading.value = true
  try {
    const r = await dmApi.getDmMessages(peerUserId.value)
    messages.value = r.list
    dm.setMessages(peerUserId.value, r.list)
  } catch {
    if (!silent) {
      messages.value = []
    }
  } finally {
    if (!silent) loading.value = false
  }
}

async function pullRefresh() {
  await load({ silent: true })
}

async function send() {
  const t = text.value.trim()
  if (!t) return
  sending.value = true
  try {
    const m = await dmApi.sendDmMessage(peerUserId.value, t)
    text.value = ''
    messages.value.push(m)
    dm.appendMessage(peerUserId.value, m)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  void load()
  pollTimer = setInterval(() => void load({ silent: true }), 8000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

watch(
  () => route.params.peerUserId,
  (id) => {
    peerUserId.value = id as string
    messages.value = dm.messagesByPeer[peerUserId.value] || []
    void load()
  }
)
</script>

<template>
  <div class="dm buddy-page">
    <header class="head">
      <span class="title">私信 · {{ peerUserId }}</span>
    </header>
    <BuddyPullRefresh variant="flex-fill" :refresh="pullRefresh">
      <div v-loading="loading && !messages.length" class="msg-list">
        <div
          v-for="m in messages"
          :key="m.messageId"
          class="bubble"
          :class="{ me: m.senderId !== peerUserId }"
        >
          {{ m.content }}
        </div>
        <el-empty v-if="!loading && !messages.length" description="暂无消息，先发一条试试" />
      </div>
    </BuddyPullRefresh>
    <div class="composer">
      <el-input v-model="text" placeholder="消息（需已关注对方；未互关最多 1 条由服务端校验）" @keyup.enter="send" />
      <el-button type="primary" :loading="sending" @click="send">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.dm {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: calc(100dvh - 52px - 32px);
  max-width: 720px;
  margin: 0 auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 12px;
  flex-shrink: 0;
}

.title {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
}

.bubble {
  align-self: flex-start;
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--buddy-surface-2);
  border: 1px solid var(--buddy-border);
  font-size: 14px;
}

.bubble.me {
  align-self: flex-end;
  background: var(--buddy-primary-dim);
}

.composer {
  display: flex;
  gap: 8px;
  padding: 8px 0 0;
  flex-shrink: 0;
}
</style>
