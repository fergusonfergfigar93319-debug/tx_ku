export interface DmThread {
  peerUserId: string
  peerNickname?: string
  peerAvatarUrl?: string
  lastMessagePreview?: string
  updatedAt?: string
}

export interface DmMessage {
  messageId: string
  senderId: string
  content: string
  createdAt?: string
}
