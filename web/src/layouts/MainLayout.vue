<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink, type RouteLocationRaw } from 'vue-router'
import {
  ChatDotRound,
  Guide,
  House,
  Location,
  Menu,
  Monitor,
  Moon,
  Opportunity,
  Search,
  Sunny,
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

/** 論壇列表資訊密度高，隱藏次級上下文條避免三重導覽堆疊 */
const showWebContextBar = computed(
  () => String(route.name) !== 'forum',
)
const user = useUserStore()
const forum = useForumStore()
const ui = useUiStore()
const { module: appModule, pageSubtitle } = useAppModule()
const drawerOpen = ref(false)

const searchOpen = ref(false)
const headerQ = ref('')
const searchInputRef = ref<{ focus?: () => void } | null>(null)

const avatarHeaderSrc = computed(
  () => user.profile?.avatarUrl || '/forum/avatars/a01.svg'
)

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
  { name: 'home', label: '首页', path: '/app/home', icon: House },
  { name: 'feed', label: '版本速递', path: '/app/feed', icon: Guide },
  { name: 'agent', label: 'AI搭子', path: '/app/agent', icon: ChatDotRound },
  { name: 'forum', label: '峡谷广场', path: '/app/forum', icon: Monitor },
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

function goBrandHome() {
  drawerOpen.value = false
  void router.push('/app/home')
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
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

function onGlobalKeydown(e: KeyboardEvent) {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return
  const t = e.target as HTMLElement | null
  if (t?.closest?.('input, textarea, [contenteditable="true"]')) return
  e.preventDefault()
  ui.toggleCommandPalette()
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="main-shell buddy-app-container" :data-app-module="appModule.id">
    <a href="#main-content" class="skip-to-main">跳到主要内容</a>
    <header class="gl-header" aria-label="站点主导航">
      <div class="gl-header-inner">
        <div class="gl-header-start">
          <BuddyBackButton
            v-if="layoutBack"
            :fallback="layoutBack.fallback"
            :prefer-history="layoutBack.preferHistory"
            class="gl-header-back"
          />
          <div class="gl-brand" role="button" tabindex="0" @click="goBrandHome" @keydown.enter.prevent="goBrandHome">
            <span class="gl-brand-text">元流同频</span>
          </div>
        </div>

        <nav class="gl-nav-menu" aria-label="主导航">
          <RouterLink
            v-for="t in tabs"
            :key="t.name"
            :to="t.path"
            class="gl-nav-item"
            :class="{ 'is-active': tabActive(t.name) }"
            :aria-current="tabActive(t.name) ? 'page' : undefined"
            @click="drawerOpen = false"
          >
            <el-icon class="gl-nav-icon"><component :is="t.icon" /></el-icon>
            <span>{{ t.label }}</span>
          </RouterLink>
        </nav>

        <div class="gl-header-actions">
          <button
            type="button"
            class="gl-action-btn"
            :title="ui.isDark ? '切换为浅色' : '切换为暗黑'"
            :aria-label="ui.isDark ? '切换为浅色' : '切换为暗黑'"
            @click="ui.toggleDark()"
          >
            <el-icon><Moon v-if="!ui.isDark" /><Sunny v-else /></el-icon>
          </button>
          <button
            type="button"
            class="gl-action-btn"
            title="城市出行"
            aria-label="城市出行"
            @click="navigate('/app/feed/city')"
          >
            <el-icon><Location /></el-icon>
          </button>
          <button
            type="button"
            class="gl-action-btn"
            title="工作台指令（Ctrl+K）"
            aria-label="工作台指令"
            @click="ui.openCommandPalette()"
          >
            <el-icon><Opportunity /></el-icon>
          </button>
          <div class="gl-header-search" :class="{ 'is-open': searchOpen }">
            <button
              v-if="!searchOpen"
              type="button"
              class="gl-action-btn"
              aria-label="展开搜索"
              @click="openHeaderSearch"
            >
              <el-icon><Search /></el-icon>
            </button>
            <el-input
              v-else
              ref="searchInputRef"
              v-model="headerQ"
              class="gl-header-search__field"
              clearable
              placeholder="搜索帖子关键词"
              @keydown.enter.prevent="submitHeaderSearch"
              @keyup.escape="searchOpen = false"
            >
              <template #prefix>
                <el-icon class="gl-header-search__ico"><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="gl-user-profile" role="button" tabindex="0" title="元流档案" @click="navigate('/app/me')" @keydown.enter.prevent="navigate('/app/me')">
            <div class="gl-avatar-ring">
              <img class="gl-avatar" :src="avatarHeaderSrc" alt="" />
            </div>
          </div>
        </div>

        <el-button class="nav-mobile-btn" text aria-label="打开导航菜单" @click="drawerOpen = true">
          <el-icon :size="22"><Menu /></el-icon>
        </el-button>
      </div>
    </header>

    <div
      v-show="showWebContextBar"
      class="web-context-bar"
      role="status"
      aria-live="polite"
      aria-label="当前功能域与页面上下文"
    >
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

    <main class="main-body main-body--web-canvas main-body--app-tab app-workspace" id="main-content">
      <div class="main-route-fade-slide-wrap">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </div>
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

    <nav class="mobile-tabbar" aria-label="主导航">
      <button
        v-for="t in tabs"
        :key="'mb-' + t.name"
        type="button"
        class="mobile-tabbar__item"
        :class="{ 'is-active': tabActive(t.name) }"
        :aria-current="tabActive(t.name) ? 'page' : undefined"
        @click="navigate(t.path)"
      >
        <el-icon :size="22"><component :is="t.icon" /></el-icon>
        <span class="mobile-tabbar__label">{{ t.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.main-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 主工作区浅暖渐变底，打破纯白（与首页氛围一致） */
.buddy-app-container {
  background: radial-gradient(circle at 100% 0%, rgb(253 252 251 / 0.9) 0%, transparent 42%),
    radial-gradient(circle at 0% 0%, rgb(239 246 255 / 0.75) 0%, transparent 38%),
    var(--buddy-page-bg);
}

:global(html.dark) .buddy-app-container {
  background: var(--buddy-page-bg);
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

/* ==========================================================
   GLOBAL HEADER (悬浮毛玻璃导航栏 · gl-)
   ========================================================== */
.gl-header {
  position: sticky;
  top: 0;
  z-index: 999;
  width: 100%;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.5) inset;
  transition: all 0.3s ease;
}

:global(html.dark) .gl-header {
  background: rgba(15, 23, 42, 0.65);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.55),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
}

.gl-header-inner {
  max-width: 1440px;
  margin: 0 auto;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
  flex-wrap: wrap;
}

.gl-header-start {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}

.gl-header-back {
  flex-shrink: 0;
}

/* --- 品牌 Logo --- */
.gl-brand {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.gl-brand-text {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #2563eb 0%, #8b5cf6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: filter 0.3s ease;
}
.gl-brand:hover .gl-brand-text {
  filter: brightness(1.2) drop-shadow(0 2px 8px rgba(139, 92, 246, 0.3));
}

/* --- 核心导航 --- */
.gl-nav-menu {
  display: none;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  min-width: 0;
}

@media (min-width: 768px) {
  .gl-nav-menu {
    display: flex;
  }
}

.gl-nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 700;
  color: #64748b;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gl-nav-icon {
  font-size: 16px;
  opacity: 0.8;
}

.gl-nav-item:hover {
  color: #0f172a;
  background: rgba(15, 23, 42, 0.04);
}
:global(html.dark) .gl-nav-item:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}

.gl-nav-item.is-active {
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}
.gl-nav-item.is-active .gl-nav-icon {
  opacity: 1;
}

/* --- 右侧工具枢纽 --- */
.gl-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  min-width: 0;
}

.gl-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 0;
}
.gl-action-btn:hover {
  background: rgba(15, 23, 42, 0.05);
  color: #3b82f6;
  transform: translateY(-2px);
}
:global(html.dark) .gl-action-btn {
  color: #94a3b8;
}
:global(html.dark) .gl-action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #60a5fa;
}

.gl-header-search {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.gl-header-search__field {
  width: min(220px, 28vw);
}

.gl-header-search__field :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgb(var(--buddy-rgb-brand) / 0.14);
}

.gl-header-search__ico {
  color: var(--buddy-primary);
  opacity: 0.85;
}

.gl-user-profile {
  cursor: pointer;
  margin-left: 8px;
  flex-shrink: 0;
}
.gl-avatar-ring {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
  transition: transform 0.3s ease;
}
.gl-user-profile:hover .gl-avatar-ring {
  transform: scale(1.1) rotate(15deg);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}
.gl-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  display: block;
}
:global(html.dark) .gl-avatar {
  border-color: #0f172a;
}

.nav-mobile-btn {
  color: #64748b !important;
  padding: 8px !important;
  margin-left: auto;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .nav-mobile-btn {
    display: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gl-nav-item.is-active,
  .gl-action-btn:hover,
  .gl-user-profile:hover .gl-avatar-ring {
    transform: none !important;
  }
}

.web-context-bar {
  display: none;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: fit-content;
  max-width: min(1280px, 100%);
  margin: 16px auto 0;
  padding: 8px 24px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}

:global(html.dark) .web-context-bar {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.55);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
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

/* 内层路由过渡：为 fade-slide 离场 position:absolute 提供定位上下文 */
.main-route-fade-slide-wrap {
  position: relative;
  width: 100%;
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

/* 移动端：底部 Tab（≥768px 沿用顶栏导航） */
.mobile-tabbar {
  display: none;
}

@media (max-width: 767px) {
  .nav-mobile-btn {
    display: none !important;
  }

  .main-body--app-tab {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  }

  .mobile-tabbar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 120;
    padding: 6px 8px calc(8px + env(safe-area-inset-bottom, 0px));
    gap: 4px;
    justify-content: space-around;
    align-items: stretch;
    background: var(--buddy-glass-bg);
    backdrop-filter: var(--buddy-glass-blur);
    -webkit-backdrop-filter: var(--buddy-glass-blur);
    border-top: var(--buddy-glass-border);
    box-shadow: 0 -4px 24px rgb(15 23 42 / 0.08);
  }

  .mobile-tabbar__item {
    flex: 1;
    flex-direction: column;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    padding: 6px 4px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: var(--buddy-text-muted);
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition:
      color 0.2s ease,
      background 0.2s ease,
      transform 0.2s var(--buddy-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
  }

  .mobile-tabbar__item:active {
    transform: scale(0.96);
  }

  .mobile-tabbar__item.is-active {
    color: #1d4ed8;
    background: rgb(var(--buddy-rgb-brand) / 0.1);
  }

  :global(html.dark) .mobile-tabbar__item.is-active {
    color: #93c5fd;
  }

  .mobile-tabbar__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-tabbar__item:active {
    transform: none;
  }
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
