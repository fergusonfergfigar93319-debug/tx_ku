<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Brush,
  ChatDotRound,
  ChatLineRound,
  Compass,
  Document,
  Grid,
  HomeFilled,
  Link,
  Location,
  Plus,
  Star,
  User,
} from '@element-plus/icons-vue'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { useForumStore } from '@/stores/forum'

type Item = {
  id: string
  label: string
  hint: string
  icon: typeof HomeFilled
  to?: RouteLocationRaw
  action?: 'forum-search' | 'copy-url'
  requiresAgentChat?: boolean
}

const ui = useUiStore()
const { commandPaletteOpen } = storeToRefs(ui)
const user = useUserStore()
const forum = useForumStore()
const router = useRouter()

const filter = ref('')
const listRef = ref<HTMLElement | null>(null)

const allItems = computed((): Item[] => {
  const items: Item[] = [
    {
      id: 'home',
      label: '门户首页',
      hint: '工作台与主题入口',
      icon: HomeFilled,
      to: { name: 'home' },
    },
    {
      id: 'app-modules',
      label: '功能地图',
      hint: '五大功能域与入口说明',
      icon: HomeFilled,
      to: { name: 'app-modules' },
    },
    {
      id: 'feed',
      label: '版本速递',
      hint: '资讯与推荐搭子',
      icon: Compass,
      to: { name: 'feed' },
    },
    {
      id: 'feed-city',
      label: '城市文旅线',
      hint: '主场观赛与同城打卡',
      icon: Location,
      to: { name: 'feed-city' },
    },
    {
      id: 'trend-studio',
      label: '潮流共创',
      hint: '模板、画廊与发帖',
      icon: Brush,
      to: { name: 'trend-studio' },
    },
    {
      id: 'forum',
      label: '峡谷广场',
      hint: '帖子与招募',
      icon: Grid,
      to: { name: 'forum' },
    },
    {
      id: 'forum-fav',
      label: '帖子收藏',
      hint: '收藏的论坛帖',
      icon: Star,
      to: { name: 'forum-favorites' },
    },
    {
      id: 'agent',
      label: 'AI 搭子创作台',
      hint: '形象与气质',
      icon: ChatDotRound,
      to: { name: 'agent' },
    },
    {
      id: 'agent-chat',
      label: 'AI 搭子对话',
      hint: '多轮聊天（需解锁）',
      icon: ChatLineRound,
      to: { name: 'agent-chat' },
      requiresAgentChat: true,
    },
    {
      id: 'me',
      label: '元流档案',
      hint: '个人主页',
      icon: User,
      to: { name: 'me' },
    },
    {
      id: 'me-flow',
      label: '数字身份档案',
      hint: '特权与活动时间线',
      icon: User,
      to: { name: 'me-flow' },
    },
    {
      id: 'profile-edit',
      label: '编辑资料',
      hint: '昵称、头像与偏好',
      icon: Document,
      to: { name: 'profile-edit' },
    },
    {
      id: 'my-posts',
      label: '我的帖子',
      hint: '发帖记录',
      icon: Document,
      to: { name: 'my-posts' },
    },
    {
      id: 'following',
      label: '关注列表',
      hint: '管理关注',
      icon: User,
      to: { name: 'following' },
    },
    {
      id: 'add-friend',
      label: '加好友 / 关注',
      hint: '搜索用户',
      icon: Plus,
      to: { name: 'add-friend' },
    },
    {
      id: 'forum-search',
      label: '带关键词打开峡谷广场',
      hint: '使用下方输入框作为搜索词',
      icon: Compass,
      action: 'forum-search',
    },
    {
      id: 'copy-url',
      label: '复制当前页面链接',
      hint: '分享或收藏地址',
      icon: Link,
      action: 'copy-url',
    },
  ]
  return items.filter((it) => {
    if (it.requiresAgentChat && !user.agentChatUnlocked) return false
    return true
  })
})

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return allItems.value
  return allItems.value.filter(
    (it) =>
      it.label.toLowerCase().includes(q) ||
      it.hint.toLowerCase().includes(q) ||
      it.id.includes(q),
  )
})

watch(
  commandPaletteOpen,
  (open) => {
    if (open) {
      filter.value = ''
      requestAnimationFrame(() => listRef.value?.querySelector<HTMLElement>('button')?.focus())
    }
  },
)

function onFilterEnter() {
  const list = filtered.value
  if (list.length) void runItem(list[0])
}

async function runItem(it: Item) {
  ui.closeCommandPalette()
  if (it.action === 'copy-url') {
    try {
      await navigator.clipboard.writeText(window.location.href)
      ElMessage.success('链接已复制')
    } catch {
      ElMessage.warning('无法访问剪贴板')
    }
    return
  }
  if (it.action === 'forum-search') {
    const q = filter.value.trim()
    forum.setKeyword(q)
    void router.push({ name: 'forum' })
    if (!q) ElMessage.info('已打开峡谷广场，可在顶栏搜索框输入关键词')
    return
  }
  if (it.to) void router.push(it.to)
}

function onDialogKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    ui.closeCommandPalette()
  }
}
</script>

<template>
  <el-dialog
    v-model="commandPaletteOpen"
    title="工作台指令"
    width="min(520px, 94vw)"
    class="workbench-cmd-dialog"
    append-to-body
    destroy-on-close
    @keydown="onDialogKeydown"
  >
    <p class="workbench-cmd-kicker">
      快速跳转页面与常用操作 ·
      <kbd class="workbench-kbd">Ctrl</kbd>
      +
      <kbd class="workbench-kbd">K</kbd>
      开关
    </p>
    <el-input
      v-model="filter"
      clearable
      placeholder="筛选指令或输入关键词后选「带关键词打开峡谷广场」"
      class="workbench-cmd-filter"
      @keydown.enter.prevent="onFilterEnter"
    >
      <template #prefix>
        <span class="workbench-cmd-filter-hint">⌕</span>
      </template>
    </el-input>
    <div ref="listRef" class="workbench-cmd-list" role="listbox" aria-label="指令列表">
      <button
        v-for="it in filtered"
        :key="it.id"
        type="button"
        class="workbench-cmd-item"
        role="option"
        @click="runItem(it)"
      >
        <span class="workbench-cmd-ico" aria-hidden="true">
          <el-icon :size="20"><component :is="it.icon" /></el-icon>
        </span>
        <span class="workbench-cmd-text">
          <span class="workbench-cmd-label">{{ it.label }}</span>
          <span class="workbench-cmd-hint">{{ it.hint }}</span>
        </span>
      </button>
      <p v-if="!filtered.length" class="workbench-cmd-empty">无匹配指令，请换个关键词</p>
    </div>
  </el-dialog>
</template>

<style scoped>
.workbench-cmd-kicker {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--buddy-text-muted);
  line-height: 1.45;
}

.workbench-kbd {
  display: inline-block;
  padding: 1px 6px;
  margin: 0 2px;
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  border: 1px solid rgb(15 23 42 / 0.12);
  background: rgb(248 250 252);
}

.workbench-cmd-filter {
  margin-bottom: 12px;
}

.workbench-cmd-filter-hint {
  opacity: 0.55;
  font-weight: 700;
}

.workbench-cmd-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: min(52vh, 420px);
  overflow-y: auto;
}

.workbench-cmd-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: rgb(255 255 255 / 0.85);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.workbench-cmd-item:hover {
  border-color: rgb(var(--buddy-rgb-brand) / 0.22);
  background: linear-gradient(100deg, rgb(var(--buddy-rgb-brand) / 0.06) 0%, rgb(255 255 255 / 0.95) 100%);
  box-shadow: 0 2px 12px rgb(15 23 42 / 0.06);
}

.workbench-cmd-ico {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--buddy-primary);
  opacity: 0.9;
}

.workbench-cmd-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.workbench-cmd-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--buddy-text);
}

.workbench-cmd-hint {
  font-size: 12px;
  color: var(--buddy-text-muted);
  line-height: 1.35;
}

.workbench-cmd-empty {
  margin: 16px 0;
  text-align: center;
  font-size: 13px;
  color: var(--buddy-text-muted);
}
</style>

<style>
.workbench-cmd-dialog .el-dialog__body {
  padding-top: 8px;
}
</style>
