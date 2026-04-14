export type ForumCategory = 'recruit' | 'guide' | 'social' | 'event'

export interface Post {
  postId: string
  authorId: string
  authorNickname?: string
  authorAvatarUrl?: string
  title: string
  content: string
  category: ForumCategory
  tags?: string[]
  mediaAttachments?: string[]
  likeCount?: number
  commentCount?: number
  createdAt?: string
  /** 广场置顶（展示在列表前部） */
  pinned?: boolean
  /** 审核态：仅 isVisibleInPublicForum 为 true 的展示在列表 */
  visibleInPublicForum?: boolean
  reviewStatus?: 'pending' | 'approved' | 'rejected'
}

export interface Comment {
  commentId: string
  postId: string
  authorId: string
  authorNickname?: string
  content: string
  createdAt?: string
}

export interface PostListResult {
  list: Post[]
  hasMore?: boolean
  total?: number
}
