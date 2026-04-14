import type { LaneArchetype } from '@/types/agentQDesign'
import type { AgentTuning } from '@/types/profile'

/** 顶栏副标题：展示当前人设焦点 */
export function getAgentPresenceLine(tuning: AgentTuning | undefined): string {
  const parts: string[] = []
  if (tuning?.personaStyle) parts.push(tuning.personaStyle)
  if (tuning?.focusScenario && tuning.focusScenario !== '通用') parts.push(tuning.focusScenario)
  if (tuning?.tone) parts.push(tuning.tone)
  if (parts.length === 0) return '情境感知 · 多轮对话'
  return `${parts.slice(0, 2).join(' · ')} · 同频陪伴`
}

/** 离线/兜底时的智能体感回复（与创作台调参对齐） */
export function buildSmartMockReply(question: string, tuning: AgentTuning | undefined): string {
  const q = question.trim()
  const persona = tuning?.personaStyle || '温柔搭子'
  const humor = Number(tuning?.humor)
  const light = Number.isFinite(humor) && humor >= 55

  if (/广场|发帖|招募/.test(q)) {
    return light
      ? `${persona}模式：可以呀～我帮你打开发帖页，把招募条件写清楚，更容易蹲到合拍队友。`
      : `${persona}：已理解你想去峡谷广场发帖。确认后我会带你打开发帖页，把段位、时段和玩法写清楚即可。`
  }
  if (/搜索|找人|搭子/.test(q)) {
    return `${persona}：试试在广场用关键词搜「双排」「娱乐局」等；也可以跟我说你玩的分路和大致段位，我帮你收窄话术。`
  }
  if (/复盘|失误|输了/.test(q)) {
    return `${persona}：先深呼吸一局～复盘可以看三点：阵容克制、关键团前视野、经济差。你想从哪条聊起？`
  }
  if (/压力|焦虑|累/.test(q)) {
    return `${persona}：上分有起伏很正常。今天先定个小目标：打两把就休息，或者我们只聊开心局内梗也行。`
  }
  if (/版本|更新|英雄/.test(q)) {
    return `${persona}：版本速递里能扫一眼环境变化；你主玩哪路？我可以按分路帮你拆「该练谁、该 ban 谁」。`
  }

  const tail = light ? ' 要不要顺便玩个「一句吐槽今日对局」？' : ' 也可以说「去广场」跳转论坛。'
  return `${persona}：收到「${q.slice(0, 80)}${q.length > 80 ? '…' : ''}」。${tail}`
}

const BASE_PROMPTS = [
  '帮我拟一条峡谷广场招募帖',
  '今天连跪，陪我聊聊怎么调整心态',
  '版本里射手环境怎么样？',
  '想改口吻和专注场景，创作台要怎么调？',
] as const

const LANE_PROMPTS: Record<LaneArchetype, string> = {
  tank: '我这把想玩前排，帮我列开团要点和站位习惯',
  fighter: '对线换血总吃亏，战士位有什么通用节奏？',
  mage: '中路支援时机怎么判断？给一套游走 checklist',
  marksman: '射手发育期防抓小技巧，顺便推荐两件保命装思路',
  assassin: '打野节奏断了怎么止损？刺客位复盘从哪看',
  support: '辅助视野和跟射手还是跟打野，怎么取舍？',
}

export function getQuickPrompts(
  tuning: AgentTuning | undefined,
  lane?: LaneArchetype,
): string[] {
  const focus = tuning?.focusScenario
  const extra: string[] = []
  if (lane && LANE_PROMPTS[lane]) {
    extra.push(LANE_PROMPTS[lane])
  }
  if (focus === '组队招募') extra.push('双排钻石段，晚间在线，帮我写招募要点')
  else if (focus === '赛后复盘') extra.push('上一把逆风翻盘点在哪里？')
  else if (focus === '缓解压力') extra.push('连败两场了，陪我放松一下')
  else if (focus === '王者电竞') extra.push('最近赛事有哪些看点值得追？')
  else if (focus === '王者荣耀') extra.push('我主玩中路，当前版本优先练谁？')
  return [...extra, ...BASE_PROMPTS].slice(0, 8)
}
