export interface NewsItem {
  id: string
  title: string
  summary?: string
  coverUrl?: string
  publishedAt?: string
  gameId?: string
  /** 与 `BrandConfig.officialPublisherName` 一致，如官方资讯来源 */
  publisherDisplayName?: string
}

export interface NewsFeedResult {
  list: NewsItem[]
  hasMore?: boolean
  total?: number
}
