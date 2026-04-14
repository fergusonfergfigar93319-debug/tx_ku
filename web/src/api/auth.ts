import { http, unwrap } from './http'
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/types/auth'

function normalizeLogin(raw: LoginResponse & { access_token?: string }): LoginResponse {
  return {
    accessToken: raw.accessToken ?? raw.access_token ?? '',
    tokenType: raw.tokenType,
    account: raw.account,
  }
}

export async function register(body: RegisterRequest) {
  const raw = await unwrap(http.post<LoginResponse & { access_token?: string }>('/auth/register', body))
  return normalizeLogin(raw)
}

export async function login(body: LoginRequest) {
  const raw = await unwrap(http.post<LoginResponse & { access_token?: string }>('/auth/login', body))
  return normalizeLogin(raw)
}

export function logout() {
  return unwrap(http.post<unknown>('/auth/logout', {}))
}
