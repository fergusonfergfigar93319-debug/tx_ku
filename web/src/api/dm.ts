import { http, unwrap } from './http'
import type { DmMessage, DmThread } from '@/types/dm'

export function getDmThreads() {
  return unwrap(http.get<{ list: DmThread[] }>('/dm/threads'))
}

export function getDmMessages(peerUserId: string, params?: { before?: string }) {
  return unwrap(
    http.get<{ list: DmMessage[] }>(`/dm/${peerUserId}/messages`, {
      params,
    })
  )
}

export function sendDmMessage(peerUserId: string, content: string) {
  return unwrap(http.post<DmMessage>('/dm/messages', { peerUserId, content }))
}
