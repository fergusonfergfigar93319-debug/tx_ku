import { mockSession, resetMockSession } from '@/mock/session'

const KEY = 'buddycard_mock_session'

export function loadPersistedMockSession() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return
    const o = JSON.parse(raw) as {
      profile: typeof mockSession.profile
      card: typeof mockSession.card
      email: string
    }
    mockSession.profile = o.profile
    mockSession.card = o.card
    mockSession.lastEmail = o.email ?? ''
  } catch {
    /* ignore */
  }
}

export function persistMockSession() {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        profile: mockSession.profile,
        card: mockSession.card,
        email: mockSession.lastEmail,
      })
    )
  } catch {
    /* ignore */
  }
}

export function clearPersistedMockSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function clearMockSessionAndPersist() {
  resetMockSession()
  clearPersistedMockSession()
}
