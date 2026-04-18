<script setup lang="ts">
import { onMounted, ref } from 'vue'

const message = ref('版本速递页面测试')

onMounted(() => {
  console.log('DiscoverView-simple mounted')
})
</script>

<template>
  <div style="padding: 20px; background: white; min-height: 100vh;">
    <h1>{{ message }}</h1>
    <p>如果你能看到这个页面，说明路由是正常的。</p>
  </div>
</template>
