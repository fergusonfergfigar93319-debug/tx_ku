/**
 * 全站功能域：用于顶栏上下文、主区色调与「功能地图」页，避免各模块语义混用。
 * 与底栏 Tab（home / feed / agent / forum / me）正交：同一 Tab 下可有不同子域（如 feed-city 属资讯域）。
 */
export type AppModuleId = 'portal' | 'news' | 'community' | 'ai' | 'account'

export type AppModuleDef = {
  id: AppModuleId
  /** 顶栏、地图卡主标题 */
  label: string
  /** 短标签，用于紧凑展示 */
  shortLabel: string
  /** 一句话说明职责边界 */
  description: string
  /** 顶栏副文案补充 */
  contextHint: string
  /** 主入口路由 name（用于地图页一键进入） */
  primaryRouteName: string
}

export const APP_MODULES: AppModuleDef[] = [
  {
    id: 'portal',
    label: '工作台门户',
    shortLabel: '门户',
    description: '首页总览、主题入口与全站功能地图。',
    contextHint: '聚合动线与模块导航',
    primaryRouteName: 'home',
  },
  {
    id: 'news',
    label: '内容资讯',
    shortLabel: '资讯',
    description: '版本速递、赛事与城市活动；与城市文旅线并列，不含论坛发帖。',
    contextHint: '赛事 · 活动 · 文旅线（只读消费）',
    primaryRouteName: 'feed',
  },
  {
    id: 'community',
    label: '峡谷社区',
    shortLabel: '社区',
    description: '广场帖子、招募热议、发帖与收藏；潮流共创归属社区创作子场景。',
    contextHint: '讨论 · 招募 · 发帖 · 收藏',
    primaryRouteName: 'forum',
  },
  {
    id: 'ai',
    label: 'AI 搭子',
    shortLabel: 'AI',
    description: '人设、气质与智能体对话；与资讯只读、社区 UGC 区分。',
    contextHint: '创作台 · 多轮对话（解锁后）',
    primaryRouteName: 'agent',
  },
  {
    id: 'account',
    label: '账户与关系',
    shortLabel: '账户',
    description: '资料、数字身份档案、我的帖子、关注与私信。',
    contextHint: '资料 · 社交 · 内容资产',
    primaryRouteName: 'me',
  },
]

const BY_ID: Record<AppModuleId, AppModuleDef> = Object.fromEntries(
  APP_MODULES.map((m) => [m.id, m]),
) as Record<AppModuleId, AppModuleDef>

/** 路由 name → 功能域（子页随父域） */
export const ROUTE_NAME_TO_MODULE: Partial<Record<string, AppModuleId>> = {
  home: 'portal',
  'app-modules': 'portal',

  feed: 'news',
  'feed-city': 'news',

  forum: 'community',
  'forum-favorites': 'community',
  'post-detail': 'community',
  'post-editor': 'community',
  'trend-studio': 'community',

  agent: 'ai',
  'agent-chat': 'ai',

  me: 'account',
  'me-flow': 'account',
  'profile-edit': 'account',
  'my-posts': 'account',
  following: 'account',
  'add-friend': 'account',
  'user-dm': 'account',
  'buddy-room': 'account',
}

/** 子页在顶栏显示的补充标题（可选） */
export const ROUTE_CONTEXT_SUBTITLE: Partial<Record<string, string>> = {
  'feed-city': '城市文旅线',
  'trend-studio': '潮流共创',
  'forum-favorites': '帖子收藏',
  'post-detail': '帖子详情',
  'post-editor': '发布帖子',
  'agent-chat': '智能体对话',
  'me-flow': '数字身份档案',
  'profile-edit': '编辑资料',
  'my-posts': '我的帖子',
  following: '关注列表',
  'add-friend': '加好友 / 关注',
  'user-dm': '私信',
  'buddy-room': '同频房间',
  'app-modules': '功能地图',
}

export function getAppModuleForRoute(routeName: string | symbol | null | undefined): AppModuleDef {
  const key = routeName != null ? String(routeName) : ''
  const id = ROUTE_NAME_TO_MODULE[key] ?? 'portal'
  return BY_ID[id] ?? BY_ID.portal
}

export function getRouteContextSubtitle(routeName: string | symbol | null | undefined): string | null {
  const key = routeName != null ? String(routeName) : ''
  return ROUTE_CONTEXT_SUBTITLE[key] ?? null
}
