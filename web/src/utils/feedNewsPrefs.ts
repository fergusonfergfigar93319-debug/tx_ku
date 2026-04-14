/**
 * 版本速递：资讯点赞 / 收藏（本地持久化，减轻会话丢失）
 */
const STORAGE_KEY = 'buddy_feed_news_prefs_v1'

export interface FeedNewsPrefsPayload {
  liked: string[]
  saved: string[]
}

function safeParse(raw: string | null): FeedNewsPrefsPayload {
  if (!raw) return { liked: [], saved: [] }
  try {
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== 'object') return { liked: [], saved: [] }
    const rec = o as Record<string, unknown>
    const liked = Array.isArray(rec.liked) ? rec.liked.filter((x) => typeof x === 'string') : []
    const saved = Array.isArray(rec.saved) ? rec.saved.filter((x) => typeof x === 'string') : []
    return { liked, saved }
  } catch {
    return { liked: [], saved: [] }
  }
}

export function loadFeedNewsPrefs(): FeedNewsPrefsPayload {
  if (typeof localStorage === 'undefined') return { liked: [], saved: [] }
  return safeParse(localStorage.getItem(STORAGE_KEY))
}

export function saveFeedNewsPrefs(payload: FeedNewsPrefsPayload) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / 隐私模式 */
  }
}
