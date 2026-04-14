/** 搭子申请单（列表接口预留） */
export type BuddyRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface BuddyRequestItem {
  relationId: string
  fromUserId: string
  fromNickname: string
  toUserId: string
  message?: string
  status: BuddyRequestStatus
  createdAt?: string
}
