import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DmMessage } from '@/types/dm'

export const useDmStore = defineStore('dm', () => {
  const messagesByPeer = ref<Record<string, DmMessage[]>>({})
  const sending = ref(false)

  function setMessages(peerUserId: string, list: DmMessage[]) {
    messagesByPeer.value = { ...messagesByPeer.value, [peerUserId]: list }
  }

  function appendMessage(peerUserId: string, m: DmMessage) {
    const prev = messagesByPeer.value[peerUserId] ?? []
    setMessages(peerUserId, [...prev, m])
  }

  return { messagesByPeer, sending, setMessages, appendMessage }
})
