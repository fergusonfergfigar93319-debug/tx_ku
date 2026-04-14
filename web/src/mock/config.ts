/**
 * 模拟数据总开关：在 `.env.development` / `.env.local` 中设置
 * `VITE_USE_MOCK=true` 时，所有 API 走本地模拟，不请求真实后端。
 * 生产构建请保持未设置或为 `false`。
 */
export function isMockApiEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true'
}
