<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as feedApi from '@/api/feed'

const debugInfo = ref<string[]>([])
const error = ref<string | null>(null)

onMounted(async () => {
  debugInfo.value.push('组件已挂载')

  try {
    debugInfo.value.push('开始加载资讯数据...')
    const result = await feedApi.getNewsFeed({ page: 1 })
    debugInfo.value.push(`成功获取 ${result.list.length} 条资讯`)
    debugInfo.value.push(JSON.stringify(result.list[0], null, 2))
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    debugInfo.value.push(`错误: ${error.value}`)
  }
})
</script>

<template>
  <div style="padding: 20px; background: white; min-height: 100vh;">
    <h1>版本速递调试页面</h1>

    <div v-if="error" style="color: red; padding: 10px; border: 1px solid red; margin: 10px 0;">
      <strong>错误:</strong> {{ error }}
    </div>

    <div style="background: #f5f5f5; padding: 10px; margin: 10px 0;">
      <h2>调试信息:</h2>
      <div v-for="(info, idx) in debugInfo" :key="idx" style="margin: 5px 0;">
        {{ idx + 1 }}. {{ info }}
      </div>
    </div>
  </div>
</template>
