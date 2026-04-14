/**
 * AI 搭子创作台：字段说明（与 Android / 后端合法取值对齐，供 Tooltip 使用）
 */
export const FOCUS_SCENARIO_HINTS: Record<string, string> = {
  通用: '不强化单一路径，适合日常闲聊与泛场景提问。',
  组队招募: '优先帮你打磨招募帖要点：段位、时段、分路与沟通习惯。',
  赛后复盘: '更侧重局内决策、失误点与下一局可执行的小目标。',
  缓解压力: '语气更偏陪伴与情绪承接，适合连败或心态波动时。',
  王者荣耀: '对局内英雄、分路、版本环境类问题更积极回应。',
  王者电竞: '赛程、战队、观赛与水友赛相关话术更顺手。',
}

export const AVATAR_STYLE_HINT =
  '与 App 对齐的形象风格标签；影响展示气质与部分生成文案的联想方向。'

export const PERSONA_STYLE_HINT =
  '口吻预设：温柔偏陪伴，战术偏报点与节奏，搞笑偏轻松玩梗（仍遵守社区规范）。'

export const TONE_HINT = '轻松更口语化；认真更结构化、少玩梗。'

export const HUMOR_HINT = '数值越高，回复中越容易穿插轻度玩笑与梗图式表达（模拟层体感）。'

export const FORMALITY_HINT = '随意像朋友开黑；正式更像战队事务或对外招募说明。'

/** 未在映射表中时的兜底 */
export function focusScenarioHint(value: string): string {
  return FOCUS_SCENARIO_HINTS[value] ?? '选择智能体最优先响应的场景类型。'
}
