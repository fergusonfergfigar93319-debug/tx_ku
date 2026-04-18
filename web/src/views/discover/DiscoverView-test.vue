<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { HomeFilled } from '@element-plus/icons-vue'
import * as feedApi from '@/api/feed'
import type { NewsItem } from '@/api/feed'

const news = ref<NewsItem[]>([])
const loading = ref(true)

async function loadNews() {
  loading.value = true
  try {
    const r = await feedApi.getNewsFeed({ page: 1 })
    news.value = r.list || []
    console.log('加载了', news.value.length, '条资讯')
  } catch (e) {
    console.error('加载失败:', e)
    news.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('DiscoverView-test mounted')
  void loadNews()
})
</script>

<template>
  <div class="discover-test" style="padding: 20px; min-height: 100vh;">
    <header style="margin-bottom: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
      <RouterLink to="/app/home" style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <el-icon :size="16"><HomeFilled /></el-icon>
        返回首页
      </RouterLink>
      <h1 style="margin: 10px 0;">版本速递</h1>
      <p style="color: #666;">资讯与推荐</p>
    </header>

    <div v-if="loading" style="padding: 20px; text-align: center;">
      <p>加载中...</p>
    </div>

    <div v-else-if="news.length === 0" style="padding: 20px; text-align: center;">
      <p>暂无资讯</p>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 16px;">
      <article
        v-for="item in news"
        :key="item.id"
        style="padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;"
      >
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">{{ item.title }}</h3>
        <p v-if="item.summary" style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
          {{ item.summary }}
        </p>
        <div style="display: flex; gap: 12px; font-size: 12px; color: #999;">
          <span v-if="item.publisherDisplayName">{{ item.publisherDisplayName }}</span>
          <span v-if="item.publishedAt">{{ new Date(item.publishedAt).toLocaleDateString() }}</span>
        </div>
      </article>
    </div>
  </div>
</template>
