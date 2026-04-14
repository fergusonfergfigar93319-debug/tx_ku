/** 与 GET /ai/agent/messages、会话展示对齐 */
export interface AgentChatMessageDTO {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
}
