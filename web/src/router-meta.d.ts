import type { RouteLocationRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 无历史可退时，返回键跳转的上一级路由 */
    backTo?: RouteLocationRaw
  }
}

export {}
