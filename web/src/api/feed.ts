import { http, unwrap } from './http'
import { isMockApiEnabled } from '@/mock/config'
import { MOCK_NEWS } from '@/mock/seedData'
import type { NewsFeedResult } from '@/types/feed'

export type { NewsItem, NewsFeedResult } from '@/types/feed'

export async function getNewsFeed(params: { game?: string; page?: number }) {
  if (isMockApiEnabled()) {
    return unwrap(
      http.get<NewsFeedResult>('/feed/news', { params: { game: params.game, page: params.page ?? 1 } })
    )
  }
  try {
    return await unwrap(
      http.get<NewsFeedResult>('/feed/news', { params: { game: params.game, page: params.page ?? 1 } })
    )
  } catch {
    return { list: MOCK_NEWS, hasMore: false }
  }
}
