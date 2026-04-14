import { http, unwrap } from './http'

export interface FollowUser {
  userId: string
  nickname: string
  avatarUrl?: string | null
}

export function follow(targetUserId: string) {
  return unwrap(http.post('/follows', { targetUserId }))
}

export function unfollow(targetUserId: string) {
  return unwrap(http.delete(`/follows/${targetUserId}`))
}

export function getMyFollowing(params?: { page?: number }) {
  return unwrap(http.get<{ list: FollowUser[]; hasMore?: boolean }>('/users/me/following', { params }))
}
