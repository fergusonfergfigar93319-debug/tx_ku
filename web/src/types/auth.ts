export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname?: string
}

export interface LoginResponse {
  accessToken: string
  tokenType?: string
  account?: {
    email?: string
    regNickname?: string
    avatarUrl?: string | null
  }
}
