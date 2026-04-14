import { getToken, http, unwrap } from './http'
import { isMockApiEnabled } from '@/mock/config'
import type { AgentStreamMeta } from '@/utils/agentChatStream'
import {
  AGENT_STREAM_SIM_DEFAULTS,
  parseSseDataLine,
  streamReplyText,
} from '@/utils/agentChatStream'
import type { AgentChatMessageDTO } from '@/types/agentChat'
import type { BuddyCard } from '@/types/profile'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

/** 拉取当前用户与智能体的会话历史（模拟层会累积 POST 产生的消息） */
export function getAgentChatHistory(params?: { sessionId?: string }) {
  return unwrap(
    http.get<{ list: AgentChatMessageDTO[] }>('/ai/agent/messages', {
      params: params?.sessionId ? { sessionId: params.sessionId } : undefined,
    })
  )
}

export function postBuddyCard(body: { personaStyle?: string }) {
  return unwrap(http.post<BuddyCard>('/ai/buddy-card', body))
}

export function postAiPostDraft(body: { expectedRole?: string; extraDemand?: string }) {
  return unwrap(
    http.post<{ title: string; content: string }>('/ai/posts', body)
  )
}

export function postAgentChat(body: { message: string; sessionId?: string }) {
  return unwrap(
    http.post<{ reply: string; route?: 'forum' | 'search'; query?: string }>('/ai/agent/chat', body)
  )
}

type StreamCallbacks = {
  onDelta: (fullTextSoFar: string) => void | Promise<void>
  onDone: (meta: AgentStreamMeta) => void | Promise<void>
  onError?: (err: Error) => void
}

/**
 * 优先请求 SSE：`POST /ai/agent/chat/stream`（Accept: text/event-stream）。
 * 模拟数据或未实现流式接口时：先走 `postAgentChat` 再在客户端按句柄输出。
 */
export async function postAgentChatStream(
  body: { message: string; sessionId?: string },
  callbacks: StreamCallbacks,
  opts?: { signal?: AbortSignal },
): Promise<void> {
  const { onDelta, onDone, onError } = callbacks
  const signal = opts?.signal

  async function fallbackFromJson(): Promise<void> {
    const res = await postAgentChat(body)
    let acc = ''
    await streamReplyText(
      res.reply,
      (t) => {
        acc = t
        return onDelta(acc)
      },
      { signal, ...AGENT_STREAM_SIM_DEFAULTS },
    )
    await Promise.resolve(onDone({ route: res.route, query: res.query }))
  }

  if (isMockApiEnabled()) {
    await fallbackFromJson()
    return
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  const t = getToken()
  if (t) headers.Authorization = `Bearer ${t}`

  let response: Response
  try {
    response = await fetch(`${API_BASE}/ai/agent/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    try {
      await fallbackFromJson()
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    }
    return
  }

  if (!response.ok || !response.body) {
    try {
      await fallbackFromJson()
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error(String(e)))
    }
    return
  }

  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('text/event-stream') && !ct.includes('application/x-ndjson')) {
    try {
      await fallbackFromJson()
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error(String(e)))
    }
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let assembled = ''
  let meta: AgentStreamMeta = {}

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const parsed = parseSseDataLine(trimmed)
        if (!parsed) continue
        if (parsed.delta) {
          assembled += parsed.delta
          await Promise.resolve(onDelta(assembled))
        }
        if (parsed.reply) {
          assembled = parsed.reply
          await Promise.resolve(onDelta(assembled))
        }
        if (parsed.done) {
          meta = { route: parsed.route, query: parsed.query }
        }
      }
    }
    if (buffer.trim()) {
      const parsed = parseSseDataLine(buffer.trim())
      if (parsed?.delta) {
        assembled += parsed.delta
        await Promise.resolve(onDelta(assembled))
      }
      if (parsed?.reply) {
        assembled = parsed.reply
        await Promise.resolve(onDelta(assembled))
      }
      if (parsed?.done) meta = { route: parsed.route, query: parsed.query }
    }
    await Promise.resolve(onDone(meta))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      onError?.(e)
      return
    }
    onError?.(e instanceof Error ? e : new Error(String(e)))
  }
}

export function postConsensusCard(body: { relationId: string }) {
  return unwrap(
    http.post<{
      relationId: string
      communicationRules: string[]
      commonGoal: string
    }>('/ai/consensus-card', body)
  )
}
