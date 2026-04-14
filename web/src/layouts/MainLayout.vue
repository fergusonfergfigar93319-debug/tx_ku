<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter, RouterLink, type RouteLocationRaw } from 'vue-router'
import {
  ChatDotRound,
  Compass,
  Grid,
  HomeFilled,
  Menu,
  Opportunity,
  Search,
  User,
} from '@element-plus/icons-vue'
import BuddyBackButton from '@/components/buddy/BuddyBackButton.vue'
import WorkbenchCommandPalette from '@/components/workbench/WorkbenchCommandPalette.vue'
import { useAppModule } from '@/composables/useAppModule'
import { useForumStore } from '@/stores/forum'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const forum = useForumStore()
const ui = useUiStore()
const { module: appModule, pageSubtitle } = useAppModule()
const drawerOpen = ref(false)

const navDesktopRef = ref<HTMLElement | null>(null)
const searchOpen = ref(false)
const headerQ = ref('')
const searchInputRef = ref<{ focus?: () => void } | null>(null)

const inkStyle = ref<Record<string, string>>({
  left: '0px',
  width: '0px',
  opacity: '0',
})

const nickInitial = computed(() => user.profile?.nickname?.trim().slice(0, 1) || '我')

/** 与 meta.tab 对齐；子路由继承父级 tab，合并后由 route.meta.tab 提供 */
const resolvedTab = computed((): string | null => {
  const raw = route.meta.tab
  if (raw !== undefined && raw !== null && String(raw).length > 0) {
    return String(raw)
  }
  return null
})

/** 一级 Tab：返回优先走历史，否则回 Web 首页门户 */
const TAB_ROOT_NAMES = new Set(['home', 'feed', 'forum', 'agent', 'me'])

const layoutBack = computed((): {
  fallback: RouteLocationRaw
  preferHistory: boolean
} | null => {
  const n = route.name as string | undefined
  if (!n || n === 'home') return null
  const explicit = route.meta.backTo
  if (explicit) return { fallback: explicit, preferHistory: false }
  if (TAB_ROOT_NAMES.has(n)) return { fallback: { name: 'home' }, preferHistory: true }
  return { fallback: { name: 'home' }, preferHistory: false }
})

/** 与路由 meta.tab 对齐，用于子页高亮父级入口（如「元流档案」下的子页） */
const tabs = [
  { name: 'home', label: '首页', path: '/app/home', icon: HomeFilled },
  { name: 'feed', label: '版本速递', path: '/app/feed', icon: Compass },
  { name: 'agent', label: 'AI搭子', path: '/app/agent', icon: ChatDotRound },
  { name: 'forum', label: '峡谷广场', path: '/app/forum', icon: Grid },
  { name: 'me', label: '元流档案', path: '/app/me', icon: User },
] as const

function tabActive(name: string) {
  return resolvedTab.value === name
}

function navigate(path: string) {
  drawerOpen.value = false
  const p = path.replace(/\/+$/, '') || '/'
  const cur = route.path.replace(/\/+$/, '') || '/'
  if (p === cur) return
  void router.push(path)
}

/** 指示条对齐活动 Tab：等 DOM 更新后再读几何，双 rAF 避开首帧布局未稳定 */
function layoutNavInk() {
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nav = navDesktopRef.value
        if (!nav) return
        const active = nav.querySelector<HTMLElement>('.nav-link.is-active')
        if (!active) {
          inkStyle.value = { left: '0px', width: '0px', opacity: '0' }
          return
        }
        const nr = nav.getBoundingClientRect()
        const ar = active.getBoundingClientRect()
        inkStyle.value = {
          left: `${ar.left - nr.left + nav.scrollLeft}px`,
          width: `${ar.width}px`,
          opacity: '1',
        }
      })
    })
  })
}

function openHeaderSearch() {
  headerQ.value = forum.keyword || ''
  searchOpen.value = true
  nextTick(() => {
    const el = searchInputRef.value as { focus?: () => void } | null
    el?.focus?.()
  })
}

function submitHeaderSearch() {
  const q = headerQ.value.trim()
  forum.setKeyword(q)
  searchOpen.value = false
  void router.push({ name: 'forum' })
}

watch(
  () => [route.fullPath, resolvedTab.value] as const,
  () => {
    drawerOpen.value = false
    layoutNavInk()
  },
  { flush: 'post' },
)

function onResize() {
  layoutNavInk()
}

let navResizeObserver: ResizeObserver | null = null

function onGlobalKeydown(e: KeyboardEvent) {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return
  const t = e.target as HTMLElement | null
  if (t?.closest?.('input, textarea, [contenteditable="true"]')) return
  e.preventDefault()
  ui.toggleCommandPalette()
}

onMounted(() => {
  layoutNavInk()
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onGlobalKeydown)
  const nav = navDesktopRef.value
  if (nav && typeof ResizeObserver !== 'undefined') {
    navResizeObserver = new ResizeObserver(() => layoutNavInk())
    navResizeObserver.observe(nav)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onGlobalKeydown)
  navResizeObserver?.disconnect()
  navResizeObserver = null
})
</script>

<template>
  <div class="main-shell" :data-app-module="appModule.id">
    <a href="#main-content" class="skip-to-main">跳到主要内容</a>
    <header class="app-header app-header--glass" aria-label="站点主导航">
      <div class="header-inner">
        <div class="header-start">
          <BuddyBackButton
            v-if="layoutBack"
            :fallback="layoutBack.fallback"
            :prefer-history="layoutBack.preferHistory"
            class="header-back"
          />
          <div class="brand-wrap">
            <RouterLink to="/app/home" class="brand brand--glow" @click="drawerOpen = false"
              >元流同频</RouterLink
            >
            <span
              class="brand-tagline"
              title="将王者电竞 IP 元素与城市文旅、潮流文化深度融合，探索高质量、场景化的电竞 + AI 新内容与新体验。网页端突出宽屏工作台与键鼠交互。"
              >电竞 IP · 文旅 · 潮流 · Web 场景化 AI</span
            >
          </div>
        </div>

        <div class="header-trail">
          <nav ref="navDesktopRef" class="nav-desktop" aria-label="主导航">
            <span class="nav-ink" aria-hidden="true" :style="inkStyle" />
            <button
              v-for="t in tabs"
              :key="t.name"
              type="button"
              class="nav-link"
              :class="{ 'is-active': tabActive(t.name) }"
              :aria-current="tabActive(t.name) ? 'page' : undefined"
              @click="navigate(t.path)"
            >
              <el-icon class="nav-link-ico" :size="18"><component :is="t.icon" /></el-icon>
              <span class="nav-link-text">{{ t.label }}</span>
            </button>
          </nav>

          <div class="header-end">
            <el-button
              class="header-cmd"
              text
              circle
              title="工作台指令（Ctrl+K）"
              @click="ui.openCommandPalette()"
            >
              <el-icon :size="20"><Opportunity /></el-icon>
            </el-button>
            <div class="header-search" :class="{ 'is-open': searchOpen }">
              <el-button
                v-if="!searchOpen"
                class="header-search__toggle"
                text
                circle
                aria-label="展开搜索"
                @click="openHeaderSearch"
              >
                <el-icon :size="20"><Search /></el-icon>
              </el-button>
              <el-input
                v-else
                ref="searchInputRef"
                v-model="headerQ"
                class="header-search__field"
                clearable
                placeholder="搜索帖子关键词"
                @keydown.enter.prevent="submitHeaderSearch"
                @keyup.escape="searchOpen = false"
              >
                <template #prefix>
                  <el-icon class="header-search__ico"><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <RouterLink
              to="/app/me"
              class="header-avatar"
              :title="user.profile?.nickname || '元流档案'"
              @click="drawerOpen = false"
            >
              <el-avatar :size="32" :src="user.profile?.avatarUrl || undefined">{{
                nickInitial
              }}</el-avatar>
            </RouterLink>
          </div>
        </div>

        <el-button
          class="nav-mobile-btn"
          text
          aria-label="打开导航菜单"
          @click="drawerOpen = true"
        >
          <el-icon :size="22"><Menu /></el-icon>
        </el-button>
      </div>
    </header>

    <div class="web-context-bar" role="status" aria-live="polite" aria-label="当前功能域与页面上下文">
      <span class="web-context-bar__k">{{ appModule.shortLabel }}域</span>
      <span class="web-context-bar__s" aria-hidden="true">·</span>
      <span class="web-context-bar__t">
        <template v-if="pageSubtitle">
          <strong class="web-context-bar__page">{{ pageSubtitle }}</strong>
          <span class="web-context-bar__s" aria-hidden="true">·</span>
        </template>
        {{ appModule.contextHint }}
        <span class="web-context-bar__s" aria-hidden="true">·</span>
        宽视窗 · 搜索进峡谷广场 ·
        <strong class="web-context-bar__hotkey">Ctrl+K</strong>
        指令
      </span>
    </div>

    <main class="main-body main-body--web-canvas app-workspace" id="main-content">
      <router-view v-slot="{ Component }">
        <transition name="buddy-route" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>

    <footer class="site-footer" aria-label="页脚">
      <div class="site-footer-inner">
        <p class="site-footer-brand">元流同频 · 网页端</p>
        <p class="site-footer-desc">
          设计核心：将王者电竞 IP 元素与城市文旅、潮流文化深度融合，探索高质量、场景化的电竞 + AI
          新内容与新体验。凸显 Web
          端特色：宽视口信息编排、多标签并行浏览、全局搜索与键鼠精操；与移动 App
          分工，不必功能对齐。
        </p>
        <p class="site-footer-shortcuts">
          快捷键：
          <kbd class="site-footer-kbd">Ctrl</kbd>
          +
          <kbd class="site-footer-kbd">K</kbd>
          打开工作台指令 · 顶栏搜索默认跳转峡谷广场
        </p>
        <RouterLink class="site-footer-link" :to="{ name: 'app-modules' }">功能地图（架构说明）</RouterLink>
        <span class="site-footer-skip-gap" aria-hidden="true">·</span>
        <a class="site-footer-skip" href="#main-content">回到内容</a>
      </div>
    </footer>

    <WorkbenchCommandPalette />

    <el-drawer
      v-model="drawerOpen"
      direction="rtl"
      size="min(300px, 86vw)"
      title="导航"
      class="nav-drawer"
      append-to-body
    >
      <div class="drawer-links">
        <button
          v-for="t in tabs"
          :key="'d-' + t.name"
          type="button"
          class="drawer-item"
          :class="{ 'is-active': tabActive(t.name) }"
          :aria-current="tabActive(t.name) ? 'page' : undefined"
          @click="navigate(t.path)"
        >
          <el-icon :size="20"><component :is="t.icon" /></el-icon>
          <span>{{ t.label }}</span>
        </button>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.main-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.skip-to-main {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-to-main:focus {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 3000;
  width: auto;
  height: auto;
  margin: 0;
  padding: 10px 16px;
  overflow: visible;
  clip: auto;
  white-space: normal;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #0a0a0c;
  background: #e8f1ff;
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.75),
    0 8px 24px rgba(0, 0, 0, 0.35);
  text-decoration: none;
}

/* Glassmorphism 顶栏（优化方案 2.1） */
.app-header--glass {
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  color: var(--buddy-header-text);
  background: rgb(255 255 255 / 0.72);
  backdrop-filter: saturate(185%) blur(20px);
  -webkit-backdrop-filter: saturate(185%) blur(20px);
  border-bottom: 1px solid transparent;
  box-shadow:
    0 4px 24px rgb(15 23 42 / 0.08),
    0 0 0 1px rgb(255 255 255 / 0.1) inset;
  transition:
    box-shadow var(--buddy-duration-sm) var(--buddy-ease-out),
    background var(--buddy-duration-sm) var(--buddy-ease-out);
}

.app-header--glass::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgb(var(--buddy-rgb-brand) / 0.24) 0%,
    rgb(var(--buddy-rgb-accent) / 0.22) 38%,
    rgb(var(--buddy-rgb-honor-gold) / 0.38) 50%,
    rgb(var(--buddy-rgb-accent) / 0.2) 62%,
    rgb(var(--buddy-rgb-teal) / 0.22) 100%
  );
  pointer-events: none;
}

.app-header {
  position: relative;
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.header-start {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: 0;
}

.brand-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  min-width: 0;
}

.brand-tagline {
  display: none;
  margin-top: 1px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1.2;
  color: var(--buddy-text-muted);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 900px) {
  .brand-tagline {
    display: block;
  }
}

.header-back {
  flex-shrink: 0;
}

.header-trail {
  flex: 1;
  display: none;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  min-width: 0;
}

@media (min-width: 768px) {
  .header-trail {
    display: flex;
  }
}

.brand {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-decoration: none;
  flex-shrink: 0;
  background: var(--buddy-gradient-brand-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition:
    filter var(--buddy-duration-sm) var(--buddy-ease-out),
    transform var(--buddy-duration-sm) var(--buddy-ease-spring);
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes buddy-brand-glow {
    0%,
    100% {
      filter: drop-shadow(0 0 6px rgb(var(--buddy-rgb-brand) / 0.35));
    }
    33% {
      filter:
        drop-shadow(0 0 12px rgb(var(--buddy-rgb-accent) / 0.38))
        drop-shadow(0 0 20px rgb(var(--buddy-rgb-honor-gold) / 0.22));
    }
    50% {
      filter: drop-shadow(0 0 14px rgb(var(--buddy-rgb-accent) / 0.42));
    }
  }

  .brand--glow {
    animation: buddy-brand-glow 3.2s ease-in-out infinite;
  }
}

.brand:hover {
  animation: none;
  filter: brightness(1.08);
  transform: scale(1.02);
}

.brand:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .brand:hover,
  .brand:active {
    transform: none;
  }
}

.nav-desktop {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.nav-ink {
  position: absolute;
  bottom: 4px;
  height: 3px;
  border-radius: 4px;
  background: var(--buddy-gradient-brand-ribbon);
  pointer-events: none;
  z-index: 0;
  transform: translateZ(0);
  transition:
    left 0.4s var(--buddy-ease-emphasized, cubic-bezier(0.2, 0.75, 0.25, 1)),
    width 0.4s var(--buddy-ease-emphasized, cubic-bezier(0.2, 0.75, 0.25, 1)),
    opacity 0.28s var(--buddy-ease-out, ease);
  box-shadow:
    0 0 12px rgb(var(--buddy-rgb-brand) / 0.32),
    0 0 18px rgb(var(--buddy-rgb-honor-gold) / 0.18);
}

@media (prefers-reduced-motion: reduce) {
  .nav-ink {
    transition: opacity 0.15s ease;
  }
}

.nav-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: var(--buddy-text-muted);
  font-size: 14px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color var(--buddy-duration-sm) var(--buddy-ease-out),
    background var(--buddy-duration-sm) var(--buddy-ease-out),
    box-shadow var(--buddy-duration-sm) var(--buddy-ease-out),
    transform var(--buddy-duration-xs) var(--buddy-ease-spring);
}

.nav-link-ico {
  flex-shrink: 0;
  opacity: 0.88;
}

.nav-link.is-active .nav-link-ico {
  opacity: 1;
}

.nav-link:hover {
  color: var(--buddy-text);
  background: rgb(var(--buddy-rgb-brand) / 0.08);
}

.nav-link:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .nav-link:active {
    transform: none;
  }
}

.nav-link.is-active {
  color: #1e40af;
  background: var(--buddy-nav-active-bg);
  box-shadow:
    0 0 0 1px rgb(var(--buddy-rgb-brand) / 0.2),
    0 4px 16px rgb(var(--buddy-rgb-brand) / 0.09);
}

.header-end {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-search {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.header-search__toggle {
  color: var(--buddy-text-secondary) !important;
}

.header-search__field {
  width: min(220px, 28vw);
}

.header-search__field :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgb(var(--buddy-rgb-brand) / 0.14);
}

.header-search__ico {
  color: var(--buddy-primary);
  opacity: 0.85;
}

.header-avatar {
  display: flex;
  align-items: center;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgb(var(--buddy-rgb-brand) / 0.15);
  transition:
    transform var(--buddy-duration-sm) var(--buddy-ease-spring),
    box-shadow var(--buddy-duration-sm) var(--buddy-ease-out);
}

.header-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgb(var(--buddy-rgb-brand) / 0.22);
}

@media (prefers-reduced-motion: reduce) {
  .header-avatar:hover {
    transform: none;
  }
}

.nav-mobile-btn {
  color: var(--buddy-header-text) !important;
  padding: 8px !important;
  margin-left: auto;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .nav-mobile-btn {
    display: none !important;
  }
}

.web-context-bar {
  display: none;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 1280px;
  margin: 0 auto;
  padding: 8px max(16px, env(safe-area-inset-left)) 10px max(16px, env(safe-area-inset-right));
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-secondary);
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
  background: linear-gradient(
    90deg,
    rgb(var(--buddy-rgb-brand) / 0.05) 0%,
    rgb(var(--buddy-rgb-accent) / 0.04) 40%,
    rgb(var(--buddy-rgb-honor-gold) / 0.06) 50%,
    rgb(var(--buddy-rgb-teal) / 0.04) 100%
  );
}

@media (min-width: 900px) {
  .web-context-bar {
    display: flex;
  }
}

.web-context-bar__k {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--buddy-rgb-brand));
  background: rgb(255 255 255 / 0.85);
  border: 1px solid transparent;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.92), rgb(255 255 255 / 0.92)),
    linear-gradient(
      125deg,
      rgb(var(--buddy-rgb-brand) / 0.35) 0%,
      rgb(var(--buddy-rgb-accent) / 0.32) 45%,
      rgb(var(--buddy-rgb-honor-gold) / 0.55) 52%,
      rgb(var(--buddy-rgb-teal) / 0.3) 100%
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 1px 4px rgb(15 23 42 / 0.05);
}

.web-context-bar__s {
  opacity: 0.45;
  user-select: none;
}

.web-context-bar__t {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  color: var(--buddy-text-muted);
}

.web-context-bar__hotkey {
  font-weight: 800;
  color: rgb(var(--buddy-rgb-brand));
  margin: 0 2px;
}

.web-context-bar__page {
  font-weight: 800;
  color: var(--buddy-text-secondary);
}

.main-body {
  flex: 1;
  background: var(--buddy-page-bg);
  min-height: 0;
  position: relative;
}

/* 大屏 Web：弱网格 + 斜向微光（峡谷地图式秩序感），仅桌面启用 */
.main-body--web-canvas::before {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0;
  background-image:
    repeating-linear-gradient(
      -32deg,
      transparent,
      transparent 47px,
      rgb(var(--buddy-rgb-honor-gold) / 0.035) 47px,
      rgb(var(--buddy-rgb-honor-gold) / 0.035) 48px
    ),
    linear-gradient(rgb(37 99 235 / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgb(37 99 235 / 0.04) 1px, transparent 1px);
  background-size:
    auto,
    28px 28px,
    28px 28px;
  mask-image: linear-gradient(180deg, rgb(0 0 0) 0%, rgb(0 0 0 / 0.65) 45%, transparent 92%);
}

@media (min-width: 1100px) {
  .main-body--web-canvas::before {
    opacity: 1;
  }
}

.main-body--web-canvas > * {
  position: relative;
  z-index: 1;
}

.site-footer {
  flex-shrink: 0;
  margin-top: auto;
  padding: 28px 16px 36px;
  border-top: 1px solid var(--buddy-border);
  background: var(--buddy-footer-bg);
}

.site-footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
}

.site-footer-brand {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--buddy-text-muted);
}

.site-footer-desc {
  margin: 0 auto;
  max-width: 520px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--buddy-text-muted);
}

.site-footer-shortcuts {
  margin: 12px auto 0;
  max-width: 520px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
  opacity: 0.92;
}

.site-footer-kbd {
  display: inline-block;
  padding: 1px 5px;
  margin: 0 1px;
  border-radius: 4px;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  border: 1px solid rgb(15 23 42 / 0.12);
  background: rgb(255 255 255 / 0.75);
}

.header-cmd {
  color: var(--buddy-text-secondary) !important;
}

.site-footer-link,
.site-footer-skip {
  display: inline-block;
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-primary);
  text-decoration: none;
  transition:
    color var(--buddy-duration-sm) var(--buddy-ease-out),
    opacity var(--buddy-duration-sm) var(--buddy-ease-out);
}

.site-footer-skip-gap {
  display: inline-block;
  margin: 14px 6px 0;
  opacity: 0.45;
  user-select: none;
}

.site-footer-link:hover,
.site-footer-skip:hover {
  text-decoration: underline;
  color: #1d4ed8;
}

.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0 24px;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 14px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  color: var(--buddy-text);
  cursor: pointer;
  transition:
    background var(--buddy-duration-sm) var(--buddy-ease-out),
    transform var(--buddy-duration-xs) var(--buddy-ease-spring);
}

.drawer-item:hover {
  background: var(--buddy-info-banner);
}

.drawer-item.is-active {
  color: var(--buddy-primary);
  font-weight: 700;
  background: var(--buddy-nav-active-bg);
  box-shadow: 0 0 0 1px rgb(var(--buddy-rgb-brand) / 0.2);
}
</style>

<style>
/* 抽屉标题与内容区贴近产品色 */
.nav-drawer .el-drawer__header {
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
</style>
