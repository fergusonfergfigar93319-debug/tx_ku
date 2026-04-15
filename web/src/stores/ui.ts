import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const DARK_STORAGE_KEY = 'buddy-theme-dark'
const THEME_LABEL_KEY = 'buddy-theme'

/** 未儲存偏好時預設亮色（與 tokens.css :root 亮色系一致；不依賴系統深色） */
function readStoredDark(): boolean {
  if (typeof localStorage === 'undefined') {
    return false
  }
  const legacy = localStorage.getItem(DARK_STORAGE_KEY)
  if (legacy === '1') return true
  if (legacy === '0') return false
  const label = localStorage.getItem(THEME_LABEL_KEY)
  if (label === 'dark') return true
  if (label === 'light') return false
  return false
}

/** 全局面板：快捷跳转、与顶栏协同的轻量 UI 状态 */
export const useUiStore = defineStore('ui', () => {
  const commandPaletteOpen = ref(false)
  /** Element Plus 暗黑模式（html.dark） */
  const isDark = ref(readStoredDark())

  watch(isDark, (v) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DARK_STORAGE_KEY, v ? '1' : '0')
      localStorage.setItem(THEME_LABEL_KEY, v ? 'dark' : 'light')
    }
  })

  function openCommandPalette() {
    commandPaletteOpen.value = true
  }

  function closeCommandPalette() {
    commandPaletteOpen.value = false
  }

  function toggleCommandPalette() {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }

  function setDark(value: boolean) {
    isDark.value = value
  }

  function toggleDark() {
    isDark.value = !isDark.value
  }

  return {
    commandPaletteOpen,
    isDark,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
    setDark,
    toggleDark,
  }
})
