/**
 * 用户自创「峡谷 Q 版」形象参数（抽象分路与配色，非具体游戏角色造型，避免版权风险）。
 * 由前端 SVG 合成展示，可随 Profile 一并保存。
 */
export type LaneArchetype = 'fighter' | 'mage' | 'marksman' | 'support' | 'assassin' | 'tank'

export interface AgentBuddyQDesign {
  laneArchetype: LaneArchetype
  /** 0–3 肤色档 */
  skinTone: 0 | 1 | 2 | 3
  /** 发型预设 0–3 */
  hairStyle: 0 | 1 | 2 | 3
  hairColor: string
  /** 眼睛 0–2 */
  eyeStyle: 0 | 1 | 2
  outfitHue: string
  accentHue: string
  /** 头饰/小道具 0–3 */
  accessory: 0 | 1 | 2 | 3
  /** 嘴型 0–2：微笑 / 开怀 / 呆萌 */
  mouthStyle: 0 | 1 | 2
  /** 腮红 0–2：无 / 淡 / 元气 */
  blushLevel: 0 | 1 | 2
  /** 预览背景环 0–3 */
  framePreset: 0 | 1 | 2 | 3
}

export const DEFAULT_AGENT_Q_DESIGN: AgentBuddyQDesign = {
  laneArchetype: 'mage',
  skinTone: 1,
  hairStyle: 1,
  hairColor: '#8b5cf6',
  eyeStyle: 1,
  outfitHue: '#6366f1',
  accentHue: '#22d3ee',
  accessory: 2,
  mouthStyle: 0,
  blushLevel: 1,
  framePreset: 0,
}

/** 分路原型（抽象，非具体英雄名） */
export const LANE_ARCHETYPE_OPTIONS: { value: LaneArchetype; label: string; short: string }[] = [
  { value: 'tank', label: '游走坦克', short: '坦克' },
  { value: 'fighter', label: '战士切入', short: '战士' },
  { value: 'mage', label: '中单法师', short: '法师' },
  { value: 'marksman', label: '发育射手', short: '射手' },
  { value: 'assassin', label: '刺客游猎', short: '刺客' },
  { value: 'support', label: '辅助守护', short: '辅助' },
]

export function normalizeAgentQDesign(raw: unknown): AgentBuddyQDesign {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AGENT_Q_DESIGN }
  const o = raw as Record<string, unknown>
  const lanes: LaneArchetype[] = [
    'fighter',
    'mage',
    'marksman',
    'support',
    'assassin',
    'tank',
  ]
  const lane = lanes.includes(o.laneArchetype as LaneArchetype)
    ? (o.laneArchetype as LaneArchetype)
    : DEFAULT_AGENT_Q_DESIGN.laneArchetype
  const st = Number(o.skinTone)
  const skinTone = ([0, 1, 2, 3] as const).includes(st as 0 | 1 | 2 | 3)
    ? (st as 0 | 1 | 2 | 3)
    : DEFAULT_AGENT_Q_DESIGN.skinTone
  const hs = Number(o.hairStyle)
  const hairStyle = ([0, 1, 2, 3] as const).includes(hs as 0 | 1 | 2 | 3)
    ? (hs as 0 | 1 | 2 | 3)
    : DEFAULT_AGENT_Q_DESIGN.hairStyle
  const es = Number(o.eyeStyle)
  const eyeStyle = ([0, 1, 2] as const).includes(es as 0 | 1 | 2)
    ? (es as 0 | 1 | 2)
    : DEFAULT_AGENT_Q_DESIGN.eyeStyle
  const acc = Number(o.accessory)
  const accessory = ([0, 1, 2, 3] as const).includes(acc as 0 | 1 | 2 | 3)
    ? (acc as 0 | 1 | 2 | 3)
    : DEFAULT_AGENT_Q_DESIGN.accessory
  const ms = Number(o.mouthStyle)
  const mouthStyle = ([0, 1, 2] as const).includes(ms as 0 | 1 | 2)
    ? (ms as 0 | 1 | 2)
    : DEFAULT_AGENT_Q_DESIGN.mouthStyle
  const bl = Number(o.blushLevel)
  const blushLevel = ([0, 1, 2] as const).includes(bl as 0 | 1 | 2)
    ? (bl as 0 | 1 | 2)
    : DEFAULT_AGENT_Q_DESIGN.blushLevel
  const fp = Number(o.framePreset)
  const framePreset = ([0, 1, 2, 3] as const).includes(fp as 0 | 1 | 2 | 3)
    ? (fp as 0 | 1 | 2 | 3)
    : DEFAULT_AGENT_Q_DESIGN.framePreset
  return {
    laneArchetype: lane,
    skinTone,
    hairStyle,
    hairColor: typeof o.hairColor === 'string' ? o.hairColor : DEFAULT_AGENT_Q_DESIGN.hairColor,
    eyeStyle,
    outfitHue: typeof o.outfitHue === 'string' ? o.outfitHue : DEFAULT_AGENT_Q_DESIGN.outfitHue,
    accentHue: typeof o.accentHue === 'string' ? o.accentHue : DEFAULT_AGENT_Q_DESIGN.accentHue,
    accessory,
    mouthStyle,
    blushLevel,
    framePreset,
  }
}
