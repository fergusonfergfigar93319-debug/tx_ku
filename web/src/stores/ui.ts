import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 全局面板：快捷跳转、与顶栏协同的轻量 UI 状态 */
export const useUiStore = defineStore('ui', () => {
  const commandPaletteOpen = ref(false)

  function openCommandPalette() {
    commandPaletteOpen.value = true
  }

  function closeCommandPalette() {
    commandPaletteOpen.value = false
  }

  function toggleCommandPalette() {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }

  return {
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
  }
})
