import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { setOnUnauthorized } from './api/http'

import '@/assets/styles/tokens.css'
import '@/assets/styles/app-layers.css'
import '@/assets/styles/app-module-scope.css'
import '@/assets/styles/auth-pages.css'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

setOnUnauthorized(() => {
  void router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
})

document.body.classList.add('buddy-app')

app.mount('#app')
