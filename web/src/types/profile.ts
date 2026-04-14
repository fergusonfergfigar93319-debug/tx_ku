import type { AgentBuddyQDesign } from '@/types/agentQDesign'

/**
 * 与 Android `core/model/Profile.kt` 及 POST /profiles 字段对齐（camelCase JSON）。
 */
export interface Profile {
  userId?: string
  nickname: string
  avatarUrl?: string | null
  bio?: string
  cityOrRegion?: string
  /** 关注方向（可多选），与建档问卷 preferred_games 一致；本项目仅围绕王者荣耀与王者电竞 */
  preferredGames?: string[]
  rank: string
  activeTime: string[]
  mainRoles: string[]
  playStyle: string
  target: string
  voicePref: string
  noGos?: string[]
  personalityArchetype?: string
  agentVoicePref?: string
  agentVisualTheme?: string
  favoriteEsportsHint?: string
  proPersonaStyle?: string
  /** 扩展：智能体调参、解锁态等，后端可合并进 profile */
  agentTuning?: AgentTuning
  /** 选中的官方成品搭子 id；未设置时表示出厂默认形象 */
  agentPresetId?: string | null
  /** 选中成品后可改的展示名（出厂默认下忽略） */
  agentBuddyDisplayName?: string | null
  agentBuddyAvatarUrl?: string | null
  /** 为 true 时优先用 agentBuddyQDesign 渲染 Q 版 SVG，而非成品套组头像图 */
  agentUseCustomChibi?: boolean
  /** 用户自创 Q 版形象参数（Web 端 SVG 合成） */
  agentBuddyQDesign?: AgentBuddyQDesign | null
  agentChatUnlocked?: boolean
  gameInterestCompleted?: boolean
  /** 本地或后端同步的游戏兴趣 id 列表（与 FollowGameCatalog id 对齐） */
  gameIds?: string[]
}

export interface AgentTuning {
  /** 与 Android 一致：六选一合法文案 */
  focusScenario?: string
  /** 与 `AgentTuningOptions.avatarStyles` 键一致 */
  avatarStyle?: string
  personaStyle?: string
  tone?: string
  humor?: string | number
  formality?: string
}

export interface BuddyCard {
  cardId: string
  tags: string[]
  declaration: string
  rules: string[]
}

export interface ProfileMeResponse {
  profile: Profile | null
  card: BuddyCard | null
}
