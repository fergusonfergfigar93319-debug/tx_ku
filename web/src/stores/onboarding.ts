import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'buddycard_onboarding_draft'

export const useOnboardingStore = defineStore('onboarding', () => {
  const draft = ref<Record<string, unknown>>({})

  function load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) draft.value = JSON.parse(raw) as Record<string, unknown>
    } catch {
      draft.value = {}
    }
  }

  function persist() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft.value))
  }

  function setField(key: string, value: unknown) {
    draft.value = { ...draft.value, [key]: value }
    persist()
  }

  function clear() {
    draft.value = {}
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { draft, load, setField, clear, persist }
})
