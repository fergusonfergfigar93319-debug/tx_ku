import type { Post } from '@/types/post'

/** 与 Android isVisibleInPublicForum 对齐：审核通过或显式可见 */
export function isVisibleInPublicForum(post: Post): boolean {
  if (post.visibleInPublicForum === false) return false
  if (post.reviewStatus === 'rejected' || post.reviewStatus === 'pending') return false
  return post.reviewStatus === 'approved' || post.visibleInPublicForum === true || post.reviewStatus == null
}
