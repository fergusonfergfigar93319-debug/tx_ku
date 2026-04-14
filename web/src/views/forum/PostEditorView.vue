<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as postsApi from '@/api/posts'
import * as aiApi from '@/api/ai'
import ForumPostAiShimmer from '@/components/buddy/ForumPostAiShimmer.vue'
import type { ForumCategory } from '@/types/post'

const router = useRouter()
const route = useRoute()

const title = ref('')
const content = ref('')
const category = ref<ForumCategory>('recruit')
const loading = ref(false)
const aiLoading = ref(false)

onMounted(() => {
  const pre = route.query.prefill as string | undefined
  if (pre) content.value = pre
})

async function aiDraft() {
  aiLoading.value = true
  try {
    const d = await aiApi.postAiPostDraft({
      expectedRole: '辅助',
      extraDemand: '脾气好',
    })
    title.value = d.title
    content.value = d.content
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '生成失败')
  } finally {
    aiLoading.value = false
  }
}

async function submit() {
  if (!title.value.trim() || !content.value.trim()) {
    ElMessage.warning('请填写标题与正文')
    return
  }
  loading.value = true
  try {
    const p = await postsApi.createPost({
      title: title.value,
      content: content.value,
      category: category.value,
    })
    void router.replace({ name: 'post-detail', params: { postId: p.postId } })
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '发布失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="buddy-page editor app-page-stack">
    <section class="app-layer app-layer--discover" aria-label="发帖说明">
      <div class="app-layer__inner">
        <h2 class="page-heading">发帖</h2>
        <p class="steps">① 填意向 ② <strong>AI 生成</strong> ③ 发布</p>
      </div>
    </section>

    <section class="app-layer app-layer--content" aria-label="发帖表单">
      <div class="app-layer__inner">
    <el-form label-position="top" class="form-main">
      <el-form-item label="分区">
        <el-select v-model="category" style="width: 100%" :disabled="aiLoading">
          <el-option label="招募" value="recruit" />
          <el-option label="攻略" value="guide" />
          <el-option label="社交" value="social" />
          <el-option label="活动" value="event" />
        </el-select>
      </el-form-item>

      <div class="draft-zone" :class="{ 'is-ai': aiLoading }">
        <el-form-item label="标题">
          <el-input v-model="title" maxlength="80" show-word-limit :disabled="aiLoading" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="content" type="textarea" :rows="12" :disabled="aiLoading" />
        </el-form-item>

        <Transition name="fade">
          <div v-if="aiLoading" class="ai-shimmer-overlay">
            <ForumPostAiShimmer />
          </div>
        </Transition>
      </div>

      <div class="row">
        <el-button :disabled="aiLoading || loading" @click="aiDraft">AI 生成草稿</el-button>
        <el-button type="primary" :loading="loading" :disabled="aiLoading" @click="submit">发布</el-button>
      </div>
    </el-form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-heading {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--buddy-text);
}

.steps {
  margin: 0;
  font-size: 12px;
  color: var(--buddy-text-muted);
}

.steps strong {
  color: var(--buddy-primary);
  font-weight: 600;
}

.form-main {
  position: relative;
}

.draft-zone {
  position: relative;
  border-radius: var(--buddy-radius);
}

.draft-zone.is-ai :deep(.el-input__wrapper),
.draft-zone.is-ai :deep(.el-textarea__inner) {
  filter: grayscale(0.15);
  opacity: 0.88;
}

.ai-shimmer-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  padding: 8px 4px 12px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: var(--buddy-radius);
  pointer-events: none;
  display: flex;
  align-items: flex-start;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.row {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
</style>
