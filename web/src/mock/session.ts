import type { BuddyCard, Profile } from '@/types/profile'

/** 内存会话，随登录 / 改资料 / 发帖更新 */
export const mockSession = {
  profile: null as Profile | null,
  card: null as BuddyCard | null,
  lastEmail: '' as string,
}

export function resetMockSession() {
  mockSession.profile = null
  mockSession.card = null
  mockSession.lastEmail = ''
}
