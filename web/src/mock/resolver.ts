import type { InternalAxiosRequestConfig } from 'axios'
import type { ForumCategory } from '@/types/post'
import type { Profile } from '@/types/profile'
import { createDefaultMockBuddyCard, createMockProfileFromEmail } from '@/mock/profileDefaults'
import { clearMockSessionAndPersist, loadPersistedMockSession, persistMockSession } from '@/mock/persist'
import { mockSession } from '@/mock/session'
import {
  MOCK_NEWS,
  MOCK_RECOMMENDATIONS,
  mockAgentChatLog,
  mockBuddyRequestsList,
  mockCommentsByPost,
  mockDmMessagesByPeer,
  mockDmThreads,
  mockFollowing,
  removeFollowing,
  mockPosts,
  mockUsersDirectory,
  nextPostId,
} from '@/mock/seedData'

/** 当前模拟用户已点赞的帖子（用于 unlike 与重复点赞） */
const mockLikedPostIds = new Set<string>()

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> | undefined {
  const d = config.data
  if (d == null || d === '') return undefined
  if (typeof d === 'string') {
    try {
      return JSON.parse(d) as Record<string, unknown>
    } catch {
      return undefined
    }
  }
  if (typeof d === 'object' && !(d instanceof FormData)) {
    return d as Record<string, unknown>
  }
  return undefined
}

function normalizePath(config: InternalAxiosRequestConfig): string {
  let u = config.url || ''
  const q = u.indexOf('?')
  if (q >= 0) u = u.slice(0, q)
  if (u.startsWith('http')) {
    try {
      u = new URL(u).pathname
    } catch {
      /* keep */
    }
  }
  u = u.replace(/^\/api\/v\d+/, '') || '/'
  if (!u.startsWith('/')) u = `/${u}`
  return u
}

function ensureMockSessionLoaded() {
  if (mockSession.profile) return
  if (!localStorage.getItem('access_token')) return
  loadPersistedMockSession()
}

/**
 * 返回将进入标准响应包 `data` 字段的业务数据（非 envelope）。
 */
export function resolveMockData(config: InternalAxiosRequestConfig): unknown {
  ensureMockSessionLoaded()

  const method = (config.method || 'get').toUpperCase()
  const path = normalizePath(config)
  const body = parseBody(config)
  const params = (config.params || {}) as Record<string, unknown>

  const mergeProfile = (patch: Partial<Profile>) => {
    const base = mockSession.profile ?? createMockProfileFromEmail(mockSession.lastEmail || 'user@mock.local')
    const next: Profile = { ...base, ...patch }
    if (patch.agentTuning && base.agentTuning) {
      next.agentTuning = { ...base.agentTuning, ...patch.agentTuning }
    }
    mockSession.profile = next
    persistMockSession()
    return { profile: mockSession.profile, card: mockSession.card }
  }

  if (method === 'POST' && path === '/auth/login') {
    const email = String(body?.email ?? 'user@mock.local')
    const password = String(body?.password ?? '')
    if (!password) {
      /* 允许空密码仅用于极端测试；正常应填写 */
    }
    mockSession.lastEmail = email
    mockSession.profile = createMockProfileFromEmail(email)
    mockSession.card = createDefaultMockBuddyCard()
    persistMockSession()
    return {
      accessToken: 'mock-access-token',
      tokenType: 'Bearer',
      account: {
        email,
        regNickname: mockSession.profile.nickname,
        avatarUrl: null,
      },
    }
  }

  if (method === 'POST' && path === '/auth/register') {
    const email = String(body?.email ?? 'user@mock.local')
    mockSession.lastEmail = email
    mockSession.profile = createMockProfileFromEmail(email)
    mockSession.card = createDefaultMockBuddyCard()
    persistMockSession()
    return {
      accessToken: 'mock-access-token',
      tokenType: 'Bearer',
      account: {
        email,
        regNickname: String(body?.nickname || mockSession.profile.nickname),
        avatarUrl: null,
      },
    }
  }

  if (method === 'POST' && path === '/auth/logout') {
    clearMockSessionAndPersist()
    return {}
  }

  if (method === 'GET' && path === '/profiles/me') {
    if (!mockSession.profile) {
      return { profile: null, card: null }
    }
    return { profile: mockSession.profile, card: mockSession.card }
  }

  if (method === 'PUT' && path === '/profiles/me') {
    const patch = body as unknown as Partial<Profile>
    return mergeProfile(patch)
  }

  if (method === 'POST' && path === '/profiles') {
    const patch = body as unknown as Partial<Profile>
    mockSession.profile = { ...createMockProfileFromEmail(mockSession.lastEmail || 'user@mock.local'), ...patch }
    if (!mockSession.card) mockSession.card = createDefaultMockBuddyCard()
    persistMockSession()
    return { profile: mockSession.profile, card: mockSession.card }
  }

  if (method === 'GET' && path === '/feed/news') {
    let list = [...MOCK_NEWS]
    const game = params.game as string | undefined
    if (game) {
      list = list.filter((n) => !n.gameId || n.gameId === game)
    }
    const page = Math.max(1, Number(params.page ?? 1))
    const size = Math.min(50, Math.max(1, Number(params.size ?? 20)))
    const start = (page - 1) * size
    const slice = list.slice(start, start + size)
    return { list: slice, hasMore: start + size < list.length, total: list.length }
  }

  if (method === 'GET' && path === '/recommendations') {
    const all = MOCK_RECOMMENDATIONS
    const page = Math.max(1, Number(params.page ?? 1))
    const size = Math.min(50, Math.max(1, Number(params.size ?? 10)))
    const start = (page - 1) * size
    const slice = all.slice(start, start + size)
    return { list: slice, hasMore: start + size < all.length }
  }

  if (method === 'GET' && path === '/buddy-requests') {
    const st = params.status as string | undefined
    let list = [...mockBuddyRequestsList]
    if (st) list = list.filter((x) => x.status === st)
    return { list }
  }

  if (method === 'POST' && path === '/buddy-requests') {
    const targetUserId = String((body as { targetUserId?: string })?.targetUserId ?? '')
    const message = String((body as { message?: string })?.message ?? '')
    const rid = 'rel_mock_' + Date.now()
    mockBuddyRequestsList.unshift({
      relationId: rid,
      fromUserId: 'mock-self',
      fromNickname: mockSession.profile?.nickname ?? '我',
      toUserId: targetUserId,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    return { relationId: rid }
  }

  if (method === 'PATCH' && /^\/buddy-requests\/.+/.test(path)) {
    const rid = path.replace('/buddy-requests/', '')
    const action = String((body as { action?: string })?.action ?? '')
    const item = mockBuddyRequestsList.find((x) => x.relationId === rid)
    if (item && (action === 'ACCEPT' || action === 'REJECT')) {
      item.status = action === 'ACCEPT' ? 'accepted' : 'rejected'
    }
    return {}
  }

  if (method === 'GET' && path === '/posts') {
    let list = [...mockPosts]
    const cat = params.category as ForumCategory | undefined
    if (cat) list = list.filter((p) => p.category === cat)
    const qRaw = (params.q as string | undefined)?.trim().toLowerCase()
    if (qRaw) {
      const parts = qRaw.split(/\s+/).filter(Boolean)
      list = list.filter((p) =>
        parts.every((part) => {
          const inText =
            p.title.toLowerCase().includes(part) || p.content.toLowerCase().includes(part)
          const inTags = (p.tags ?? []).some((t) => t.toLowerCase().includes(part))
          return inText || inTags
        })
      )
    }
    const total = list.length
    const page = Math.max(1, Number(params.page ?? 1))
    const size = Math.min(50, Math.max(1, Number(params.size ?? 20)))
    const start = (page - 1) * size
    list = list.slice(start, start + size)
    return { list, hasMore: start + size < total, total }
  }

  if (method === 'GET' && path === '/users/me/posts') {
    const uid = mockSession.profile?.userId
    const mine = uid ? mockPosts.filter((p) => p.authorId === uid) : []
    const pageNum = Math.max(1, Number(params.page ?? 1))
    const size = 50
    const start = (pageNum - 1) * size
    const list = mine.slice(start, start + size)
    return {
      list,
      hasMore: start + size < mine.length,
      total: mine.length,
    }
  }

  if (method === 'GET' && /^\/posts\/[^/]+$/.test(path)) {
    const postId = path.replace('/posts/', '')
    const p = mockPosts.find((x) => x.postId === postId)
    if (p) return p
    return {
      postId,
      authorId: 'unknown',
      title: '（模拟）未找到帖子',
      content: '该帖子在模拟数据中不存在。',
      category: 'social' as ForumCategory,
      reviewStatus: 'approved' as const,
      visibleInPublicForum: true,
    }
  }

  if (method === 'POST' && path === '/posts') {
    const b = body as {
      title?: string
      content?: string
      category?: ForumCategory
      tags?: string[]
    }
    const postId = nextPostId()
    const post = {
      postId,
      authorId: 'mock-self',
      authorNickname: mockSession.profile?.nickname ?? '我',
      title: b.title ?? '',
      content: b.content ?? '',
      category: (b.category ?? 'recruit') as ForumCategory,
      tags: b.tags,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      reviewStatus: 'approved' as const,
      visibleInPublicForum: true,
    }
    mockPosts.unshift(post)
    mockCommentsByPost[postId] = mockCommentsByPost[postId] ?? []
    return post
  }

  if (method === 'GET' && /^\/posts\/[^/]+\/comments$/.test(path)) {
    const m = path.match(/^\/posts\/([^/]+)\/comments$/)
    const postId = m?.[1] ?? ''
    const list = mockCommentsByPost[postId] ?? []
    return { list, hasMore: false }
  }

  if (method === 'POST' && /^\/posts\/[^/]+\/comments$/.test(path)) {
    const m = path.match(/^\/posts\/([^/]+)\/comments$/)
    const postId = m?.[1] ?? ''
    const content = String((body as { content?: string })?.content ?? '')
    const c = {
      commentId: 'c_' + Date.now(),
      postId,
      authorId: 'mock-self',
      authorNickname: mockSession.profile?.nickname ?? '我',
      content,
      createdAt: new Date().toISOString(),
    }
    if (!mockCommentsByPost[postId]) mockCommentsByPost[postId] = []
    mockCommentsByPost[postId].push(c)
    const post = mockPosts.find((p) => p.postId === postId)
    if (post) post.commentCount = (post.commentCount ?? 0) + 1
    return c
  }

  if (method === 'POST' && /^\/posts\/[^/]+\/like$/.test(path)) {
    const m = path.match(/^\/posts\/([^/]+)\/like$/)
    const postId = m?.[1] ?? ''
    const p = mockPosts.find((x) => x.postId === postId)
    if (p && !mockLikedPostIds.has(postId)) {
      mockLikedPostIds.add(postId)
      p.likeCount = (p.likeCount ?? 0) + 1
    }
    return { liked: true, likeCount: p?.likeCount ?? 0 }
  }

  if (method === 'DELETE' && /^\/posts\/[^/]+\/like$/.test(path)) {
    const m = path.match(/^\/posts\/([^/]+)\/like$/)
    const postId = m?.[1] ?? ''
    const p = mockPosts.find((x) => x.postId === postId)
    if (p && mockLikedPostIds.has(postId)) {
      mockLikedPostIds.delete(postId)
      p.likeCount = Math.max(0, (p.likeCount ?? 1) - 1)
    }
    return { liked: false, likeCount: p?.likeCount ?? 0 }
  }

  if (method === 'POST' && path === '/follows') {
    const targetUserId = String((body as { targetUserId?: string })?.targetUserId ?? '')
    const u = mockUsersDirectory.find((x) => x.userId === targetUserId)
    if (u && !mockFollowing.some((f) => f.userId === targetUserId)) {
      mockFollowing.push({ userId: u.userId, nickname: u.nickname, avatarUrl: u.avatarUrl })
    }
    return {}
  }

  if (method === 'DELETE' && /^\/follows\/.+/.test(path)) {
    const id = path.replace('/follows/', '')
    removeFollowing(id)
    return {}
  }

  if (method === 'GET' && path === '/users/me/following') {
    const all = [...mockFollowing]
    const page = Math.max(1, Number(params.page ?? 1))
    const size = Math.min(100, Math.max(1, Number(params.size ?? 50)))
    const start = (page - 1) * size
    const list = all.slice(start, start + size)
    return { list, hasMore: start + size < all.length }
  }

  if (method === 'GET' && path === '/users') {
    const q = String(params.q ?? '')
      .trim()
      .toLowerCase()
    const list = mockUsersDirectory.filter(
      (u) => !q || u.nickname.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q)
    )
    return { list }
  }

  if (method === 'GET' && path === '/users/by-id') {
    const id = String(params.id ?? '')
    const u = mockUsersDirectory.find((x) => x.userId === id)
    if (u) return u
    return {
      userId: id,
      nickname: '模拟用户',
      avatarUrl: null,
    }
  }

  if (method === 'GET' && path === '/dm/threads') {
    return { list: [...mockDmThreads] }
  }

  if (method === 'GET' && /^\/dm\/[^/]+\/messages$/.test(path)) {
    const m = path.match(/^\/dm\/([^/]+)\/messages$/)
    const peerUserId = m?.[1] ?? ''
    const list = mockDmMessagesByPeer[peerUserId] ?? []
    return { list: [...list] }
  }

  if (method === 'POST' && path === '/dm/messages') {
    const peerUserId = String((body as { peerUserId?: string })?.peerUserId ?? '')
    const content = String((body as { content?: string })?.content ?? '')
    const m = {
      messageId: 'm_' + Date.now(),
      senderId: 'mock-self',
      content,
      createdAt: new Date().toISOString(),
    }
    if (!mockDmMessagesByPeer[peerUserId]) mockDmMessagesByPeer[peerUserId] = []
    mockDmMessagesByPeer[peerUserId].push(m)
    return m
  }

  if (method === 'POST' && path === '/uploads') {
    const seed = `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    return { url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/256/256` }
  }

  if (method === 'POST' && path === '/ai/buddy-card') {
    mockSession.card = {
      ...createDefaultMockBuddyCard(),
      cardId: 'crd_' + Date.now(),
      declaration: `（模拟）已按「${String((body as { personaStyle?: string })?.personaStyle ?? '默认')}」生成名片。`,
    }
    persistMockSession()
    return mockSession.card
  }

  if (method === 'POST' && path === '/ai/posts') {
    return {
      title: '【模拟招募】钻石段位 · 寻找王者双排搭子',
      content:
        '这是 AI 发帖草稿（模拟数据）。本人主玩射手，晚间在线，希望找到性格稳定、愿意沟通的队友。',
    }
  }

  if (method === 'GET' && path === '/ai/agent/messages') {
    return { list: [...mockAgentChatLog] }
  }

  if (method === 'POST' && path === '/ai/agent/chat') {
    const msg = String((body as { message?: string })?.message ?? '')
    const now = new Date().toISOString()
    const tuning = mockSession.profile?.agentTuning
    const persona = tuning?.personaStyle?.trim() || '温柔搭子'
    const focus = tuning?.focusScenario?.trim()
    const toneHint = tuning?.tone === '认真' ? '我认真看了你的描述。' : '轻松聊就好～'

    mockAgentChatLog.push({
      id: 'u_' + Date.now(),
      role: 'user',
      text: msg,
      createdAt: now,
    })
    let reply = `（模拟·${persona}）${toneHint} 收到：${msg.slice(0, 120)}${msg.length > 120 ? '…' : ''}`
    if (focus && focus !== '通用') {
      reply += ` 【当前情境：${focus}】`
    }
    let route: 'forum' | 'search' | undefined
    let query: string | undefined
    if (/广场|发帖|招募/.test(msg)) {
      reply = `（模拟·${persona}）可以帮你跳转到发帖页，把招募条件写清楚更容易匹配队友。`
      route = 'forum'
      query = ''
    } else if (/搜索/.test(msg)) {
      reply = `（模拟·${persona}）试试在广场搜索关键词，或告诉我你想找什么类型的搭子。`
      route = 'search'
      query = ''
    }
    mockAgentChatLog.push({
      id: 'a_' + Date.now(),
      role: 'assistant',
      text: reply,
      createdAt: new Date().toISOString(),
    })
    return { reply, route, query }
  }

  if (method === 'POST' && path === '/ai/consensus-card') {
    const relationId = String((body as { relationId?: string })?.relationId ?? 'rel_mock')
    return {
      relationId,
      communicationRules: ['遇事不决先沟通', '连败两场先休息', '局内只报点不抱怨'],
      commonGoal: '（模拟）本周末一起上分！',
    }
  }

  console.warn('[mock] 未匹配路由，返回空对象:', method, path)
  return {}
}

export function createMockAxiosAdapter(config: InternalAxiosRequestConfig) {
  const data = resolveMockData(config)
  const envelope = { code: 200, message: 'success', data }
  const res = {
    data: envelope,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
  return Promise.resolve(res)
}
