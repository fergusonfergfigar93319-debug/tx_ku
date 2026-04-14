import { http, unwrap } from './http'

export function uploadFile(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  // 勿手写 Content-Type，否则缺少 boundary；由浏览器为 FormData 自动带齐
  return unwrap(http.post<{ url: string }>('/uploads', fd))
}
