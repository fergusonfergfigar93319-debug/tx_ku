import type { BuddyCard, Profile } from '@/types/profile'

/** 仅 `npm run dev` 时为 true，生产构建为 false */
export function isDevQuickLoginEnabled(): boolean {
  return import.meta.env.DEV === true
}

/** 本地开发用完整画像，满足路由守卫与「我的」展示 */
export function createDevMockProfile(): Profile {
  return {
    userId: 'dev-user-local',
    nickname: '开发用户',
    avatarUrl: null,
    bio: '本地开发模拟会话',
    cityOrRegion: '',
    preferredGames: ['王者荣耀', '王者电竞'],
    rank: '中高分段',
    activeTime: ['周末全天'],
    mainRoles: ['辅助 / 游走'],
    playStyle: '稳健运营',
    target: '娱乐放松',
    voicePref: '随意',
    noGos: [],
    personalityArchetype: '幽默氛围型',
    agentVoicePref: '交给系统微调',
    agentVisualTheme: '赛博神经 HUD',
    agentChatUnlocked: true,
    gameInterestCompleted: true,
  }
}

export function createDevMockBuddyCard(): BuddyCard {
  return {
    cardId: 'dev-card-local',
    tags: ['开发模式', '模拟数据', '快速登录'],
    declaration: '这是开发者通道生成的模拟名片，便于联调 UI。',
    rules: ['仅开发环境可见', '生产构建不包含此入口'],
  }
}
