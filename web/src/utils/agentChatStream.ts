/**
 * 客户端模拟流式默认节奏（mock / JSON 兜底）：约 22–28 字/秒，肉眼可辨「逐字出现」。
 * 真实 SSE 由服务端节奏决定，未传参时仍用此作为兜底。
 */
export const AGENT_STREAM_SIM_DEFAULTS = {
  chunkSize: 1,
  intervalMs: 38,
} as const

/** 将完整回复以流式节奏写入 UI（mock 或 SSE 兜底） */
export async function streamReplyText(
  fullText: string,
  onUpdate: (text: string) => void | Promise<void>,
  options?: {
    signal?: AbortSignal
    /** 每次追加的字符数，越大越快 */
    chunkSize?: number
    /** 每步间隔 ms */
    intervalMs?: number
  },
): Promise<void> {
  const chunkSize = Math.max(1, options?.chunkSize ?? AGENT_STREAM_SIM_DEFAULTS.chunkSize)
  const intervalMs = Math.max(0, options?.intervalMs ?? AGENT_STREAM_SIM_DEFAULTS.intervalMs)
  const signal = options?.signal
  let i = 0
  let acc = ''

  return new Promise((resolve, reject) => {
    function scheduleNext() {
      window.setTimeout(step, intervalMs)
    }
    async function step() {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      if (i >= fullText.length) {
        resolve()
        return
      }
      const end = Math.min(fullText.length, i + chunkSize)
      acc = fullText.slice(0, end)
      i = end
      try {
        await Promise.resolve(onUpdate(acc))
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)))
        return
      }
      if (i >= fullText.length) {
        resolve()
        return
      }
      scheduleNext()
    }
    void step()
  })
}

export type AgentStreamMeta = {
  route?: 'forum' | 'search'
  query?: string
}

/** 解析单行 SSE data: 内容（JSON 或纯文本） */
export function parseSseDataLine(raw: string): {
  delta?: string
  done?: boolean
  route?: 'forum' | 'search'
  query?: string
  reply?: string
} | null {
  const line = raw.trim()
  if (!line.startsWith('data:')) return null
  const payload = line.slice(5).trim()
  if (payload === '[DONE]') return { done: true }
  try {
    const j = JSON.parse(payload) as Record<string, unknown>
    const delta = typeof j.delta === 'string' ? j.delta : typeof j.text === 'string' ? j.text : undefined
    const done = j.done === true
    const route = j.route === 'forum' || j.route === 'search' ? j.route : undefined
    const query = typeof j.query === 'string' ? j.query : undefined
    const reply = typeof j.reply === 'string' ? j.reply : undefined
    return { delta, done, route, query, reply }
  } catch {
    return { delta: payload }
  }
}
