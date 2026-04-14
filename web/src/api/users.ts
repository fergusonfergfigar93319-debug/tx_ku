import { http, unwrap } from './http'

export interface UserSummary {
  userId: string
  nickname: string
  avatarUrl?: string | null
}

export function searchUsers(q: string) {
  return unwrap(http.get<{ list: UserSummary[] }>('/users', { params: { q } }))
}

export function getUserById(id: string) {
  return unwrap(http.get<UserSummary>('/users/by-id', { params: { id } }))
}
