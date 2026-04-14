import { http, unwrap } from './http'
import type { BuddyRequestItem } from '@/types/buddyRequest'

export function listBuddyRequests(params?: { status?: string }) {
  return unwrap(http.get<{ list: BuddyRequestItem[] }>('/buddy-requests', { params }))
}

export function createBuddyRequest(body: { targetUserId: string; message?: string }) {
  return unwrap(http.post<{ relationId: string }>('/buddy-requests', body))
}

export function patchBuddyRequest(relationId: string, action: 'ACCEPT' | 'REJECT') {
  return unwrap(http.patch(`/buddy-requests/${relationId}`, { action }))
}
