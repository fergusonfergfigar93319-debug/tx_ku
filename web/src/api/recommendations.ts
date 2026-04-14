import { http, unwrap } from './http'
import type { RecommendationListResult } from '@/types/recommendation'

export function getRecommendations(params: { page?: number; size?: number }) {
  return unwrap(
    http.get<RecommendationListResult>('/recommendations', {
      params: { page: params.page ?? 1, size: params.size ?? 10 },
    })
  )
}
