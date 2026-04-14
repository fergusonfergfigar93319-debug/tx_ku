import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getAppModuleForRoute, getRouteContextSubtitle, type AppModuleDef } from '@/config/appModules'

/** 当前路由所属功能域与可选子页标题（顶栏上下文条） */
export function useAppModule() {
  const route = useRoute()

  const module = computed((): AppModuleDef => getAppModuleForRoute(route.name))

  const pageSubtitle = computed((): string | null => getRouteContextSubtitle(route.name))

  return { module, pageSubtitle }
}
