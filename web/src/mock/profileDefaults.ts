import type { BuddyCard, Profile } from '@/types/profile'

export function createMockProfileFromEmail(email: string): Profile {
  const nick = email.split('@')[0] || '元流同频'
  return {
    userId: 'mock-user-1',
    nickname: nick,
    avatarUrl: null,
    bio: '模拟用户',
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
    agentChatUnlocked: false,
    gameInterestCompleted: true,
  }
}

export function createDefaultMockBuddyCard(): BuddyCard {
  return {
    cardId: 'mock-card',
    tags: ['模拟', '元流同频'],
    declaration: '这是一张模拟名片，用于离线开发。',
    rules: ['友好沟通', '准时上线', '连跪先休息'],
  }
}
