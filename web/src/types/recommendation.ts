import type { BuddyCard } from './profile'

export interface RecommendationItem {
  userId: string
  nickname: string
  avatarUrl?: string | null
  matchScore: number
  matchReasons: string[]
  conflict?: string
  advice?: string
  communicationStylePreview?: string
  card?: BuddyCard | null
}

export interface RecommendationListResult {
  list: RecommendationItem[]
  hasMore: boolean
}
