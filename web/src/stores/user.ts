import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/api/auth'
import * as profileApi from '@/api/profile'
import { setToken, getToken } from '@/api/http'
import type { LoginResponse } from '@/types/auth'
import type { AgentTuning, BuddyCard, Profile } from '@/types/profile'
import { isProfileComplete } from '@/utils/profile'
import { createDevMockBuddyCard, createDevMockProfile } from '@/dev/quickLogin'

const GAME_INTEREST_KEY = 'buddycard_game_interest_done'

function gameInterestKey(email: string | undefined): string {
  const e = email?.trim().toLowerCase() ?? ''
  return e ? `${GAME_INTEREST_KEY}_${e}` : GAME_INTEREST_KEY
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const account = ref<LoginResponse['account'] | null>(null)
  const profile = ref<Profile | null>(null)
  const buddyCard = ref<BuddyCard | null>(null)
  const loadingProfile = ref(false)

  const agentTuning = computed<AgentTuning | undefined>(() => profile.value?.agentTuning)
  const agentChatUnlocked = computed(() => profile.value?.agentChatUnlocked === true)

  const gameInterestCompleted = computed(() => {
    if (profile.value?.gameInterestCompleted) return true
    const k = gameInterestKey(account.value?.email)
    return localStorage.getItem(k) === '1'
  })

  function setGameInterestDone(done: boolean) {
    const k = gameInterestKey(account.value?.email)
    if (done) localStorage.setItem(k, '1')
    else localStorage.removeItem(k)
  }

  function hydrateFromLoginResponse(res: LoginResponse) {
    token.value = res.accessToken
    setToken(res.accessToken)
    account.value = res.account ?? null
  }

  async function fetchProfile() {
    loadingProfile.value = true
    try {
      const data = await profileApi.getProfileMe()
      profile.value = data.profile
      buddyCard.value = data.card
      return data
    } finally {
      loadingProfile.value = false
    }
  }

  async function saveProfile(partial: Partial<Profile>) {
    const data = profile.value
      ? await profileApi.putProfileMe(partial)
      : await profileApi.createProfile(partial as Profile)
    profile.value = data.profile
    buddyCard.value = data.card
    return data
  }

  async function setAgentChatUnlocked(unlocked: boolean) {
    await saveProfile({ agentChatUnlocked: unlocked })
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* optional */
    }
    token.value = null
    account.value = null
    profile.value = null
    buddyCard.value = null
    setToken(null)
  }

  function needsOnboarding() {
    return !isProfileComplete(profile.value)
  }

  /**
   * 开发者通道：写入本地模拟会话（不请求后端）。
   * 生产环境为 no-op。
   */
  function devQuickLoginMock() {
    if (!import.meta.env.DEV) return
    const t = import.meta.env.VITE_DEV_QUICK_TOKEN || 'dev-quick-token'
    token.value = t
    setToken(t)
    account.value = {
      email: 'dev@local.test',
      regNickname: '开发用户',
      avatarUrl: null,
    }
    profile.value = { ...createDevMockProfile(), gameInterestCompleted: true }
    buddyCard.value = createDevMockBuddyCard()
    setGameInterestDone(true)
  }

  /**
   * 若配置了 VITE_DEV_EMAIL / VITE_DEV_PASSWORD，则走真实登录接口。
   * @returns 是否已发起并成功登录
   */
  async function devLoginWithEnvCredentials(): Promise<boolean> {
    if (!import.meta.env.DEV) return false
    const email = import.meta.env.VITE_DEV_EMAIL?.trim()
    const password = import.meta.env.VITE_DEV_PASSWORD
    if (!email || !password) return false
    const res = await authApi.login({ email, password })
    hydrateFromLoginResponse(res)
    await fetchProfile()
    return true
  }

  return {
    token,
    account,
    profile,
    buddyCard,
    loadingProfile,
    agentTuning,
    agentChatUnlocked,
    gameInterestCompleted,
    hydrateFromLoginResponse,
    fetchProfile,
    saveProfile,
    setAgentChatUnlocked,
    setGameInterestDone,
    logout,
    needsOnboarding,
    devQuickLoginMock,
    devLoginWithEnvCredentials,
  }
})
