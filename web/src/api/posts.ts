import { http, unwrap } from './http'
import type { Comment, ForumCategory, Post, PostListResult } from '@/types/post'

export function getPosts(params: {
  category?: ForumCategory | ''
  page?: number
  size?: number
  q?: string
}) {
  return unwrap(
    http.get<PostListResult>('/posts', {
      params: {
        category: params.category || undefined,
        page: params.page ?? 1,
        size: params.size ?? 20,
        q: params.q || undefined,
      },
    })
  )
}

export function getPost(postId: string) {
  return unwrap(http.get<Post>(`/posts/${postId}`))
}

/** 作者全状态帖子（含待审），与对接说明 `GET /users/me/posts` 对齐 */
export function getMyPosts(params?: { page?: number }) {
  return unwrap(
    http.get<PostListResult>('/users/me/posts', {
      params: { page: params?.page ?? 1 },
    })
  )
}

export function createPost(body: {
  title: string
  content: string
  category: ForumCategory
  tags?: string[]
  mediaAttachments?: string[]
}) {
  return unwrap(http.post<Post>('/posts', body))
}

export function getComments(postId: string, params?: { page?: number }) {
  return unwrap(
    http.get<{ list: Comment[]; hasMore?: boolean }>(`/posts/${postId}/comments`, {
      params: { page: params?.page ?? 1 },
    })
  )
}

export function postComment(postId: string, content: string) {
  return unwrap(http.post<Comment>(`/posts/${postId}/comments`, { content }))
}

export function likePost(postId: string) {
  return unwrap(http.post(`/posts/${postId}/like`, {}))
}

export function unlikePost(postId: string) {
  return unwrap(http.delete(`/posts/${postId}/like`))
}
