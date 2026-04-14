/**
 * 与 Android `AgentTuningOptions` / 对接说明对齐：`focusScenario`、`avatarStyle` 禁止前端自造别名。
 * 取值以后端与 App 锁定的清单为准；以下为现版产品与对齐说明列出的合法展示文案。
 */
export const FOCUS_SCENARIO_OPTIONS: string[] = [
  '通用',
  '组队招募',
  '赛后复盘',
  '缓解压力',
  '王者荣耀',
  '王者电竞',
]

/** `avatarStyle` 与后端及 App `AgentTuningOptions.avatarStyles` 键一致时可逐字提交 */
export const AVATAR_STYLE_OPTIONS: string[] = [
  '通用淡彩',
  '英雄主题·对抗路',
  '英雄主题·打野',
  '英雄主题·中路',
  '英雄主题·发育路',
  '英雄主题·游走',
  '赛事实况台',
  '军师复盘型',
]
