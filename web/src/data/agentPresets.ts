import type { Component } from 'vue'
import { MagicStick, Medal, Sunny, TrophyBase, View } from '@element-plus/icons-vue'

/** 与 App「官方成品搭子」一致的横向卡片数据（Web 端展示与选中同步到 Profile） */
export interface AgentOfficialPreset {
  id: string
  name: string
  tagline: string
  detail: string
  avatarUrl: string
  /** 卡片背景渐变 */
  gradient: string
  roleIcon: Component
}

/** 出厂默认智能体（未选成品前展示名固定） */
export const FACTORY_AGENT_NAME = '咕咕嘎嘎'

/** 品牌「咕咕嘎嘎」官方立绘（见 `public/avatars/gugugaga.jpeg`） */
export const FACTORY_AGENT_AVATAR = `${import.meta.env.BASE_URL}avatars/gugugaga.jpeg`

/** 现版仅王者荣耀 / 王者电竞向，对齐 Android DesignedAgentPresets 策略（数量可精简） */
export const OFFICIAL_AGENT_PRESETS: AgentOfficialPreset[] = [
  {
    id: 'preset_honor_front',
    name: '前线视野龙队',
    tagline: '王者荣耀',
    detail: '前排视野 · 开团沟通型',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=honorDragon&backgroundColor=ffccd5&mouth=smile',
    gradient: 'linear-gradient(165deg, #2d1f30 0%, #241c28 45%, #1a1820 100%)',
    roleIcon: Medal,
  },
  {
    id: 'preset_honor_jungle',
    name: '野核节奏军师',
    tagline: '王者荣耀',
    detail: '入侵节奏 · 资源团指挥',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=honorJungle&backgroundColor=c4b5fd&mouth=smile',
    gradient: 'linear-gradient(165deg, #1f2438 0%, #1c2030 45%, #181c28 100%)',
    roleIcon: Sunny,
  },
  {
    id: 'preset_honor_mid',
    name: '中单法刺喊话',
    tagline: '王者荣耀',
    detail: '支援时机 · 切C话术',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=honorMid&backgroundColor=fbcfe8&mouth=smile',
    gradient: 'linear-gradient(165deg, #281828 0%, #221c24 45%, #1c1820 100%)',
    roleIcon: MagicStick,
  },
  {
    id: 'preset_honor_esports',
    name: '赛事实况搭子',
    tagline: '王者电竞',
    detail: '赛程提醒 · 水友赛话术',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=honorEsports&backgroundColor=ffedd5&mouth=smile',
    gradient: 'linear-gradient(165deg, #2a2418 0%, #241e16 45%, #1c1814 100%)',
    roleIcon: TrophyBase,
  },
  {
    id: 'preset_honor_review',
    name: '赛后复盘搭子',
    tagline: '通用',
    detail: '心态陪伴 · 失误复盘',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=honorReview&backgroundColor=bae6fd&mouth=smile',
    gradient: 'linear-gradient(165deg, #182830 0%, #162428 45%, #141c22 100%)',
    roleIcon: View,
  },
]

export function findAgentPreset(id: string | undefined) {
  if (!id) return undefined
  return OFFICIAL_AGENT_PRESETS.find((p) => p.id === id)
}
