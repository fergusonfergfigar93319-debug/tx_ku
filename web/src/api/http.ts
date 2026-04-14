import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { isMockApiEnabled } from '@/mock/config'
import { createMockAxiosAdapter } from '@/mock/resolver'

const TOKEN_KEY = 'access_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** 由 main 注入，避免 http 与 router 循环依赖 */
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 60_000,
})

http.interceptors.request.use((config) => {
  const t = getToken()
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  if (isMockApiEnabled()) {
    ;(config as InternalAxiosRequestConfig).adapter = createMockAxiosAdapter
  }
  return config
})

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

function isSuccessCode(code: number) {
  return code === 200 || code === 20000
}

http.interceptors.response.use(
  (res) => {
    const body = res.data as ApiEnvelope<unknown>
    if (body && typeof body === 'object' && 'code' in body) {
      if (!isSuccessCode(body.code)) {
        const err = new Error(body.message || '请求失败')
        ;(err as Error & { code?: number }).code = body.code
        return Promise.reject(err)
      }
      return { ...res, data: body.data }
    }
    return res
  },
  (error: AxiosError<ApiEnvelope<null>>) => {
    const status = error.response?.status
    const data = error.response?.data
    const msg = data?.message || error.message || '网络异常'

    if (status === 401 || data?.code === 40100) {
      setToken(null)
      onUnauthorized?.()
    }

    if (data?.code === 50301) {
      ElMessage.warning('智能体正在沉思中，请稍后重试')
    } else if (data?.code === 50302) {
      ElMessage.warning('智能体输出异常，请重试')
    } else if (!error.config?.headers?.['X-Silent-Error']) {
      ElMessage.error(msg)
    }

    return Promise.reject(error)
  }
)

export async function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  const r = await p
  return r.data
}
