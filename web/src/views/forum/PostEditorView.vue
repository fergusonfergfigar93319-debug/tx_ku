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
/* --- 页面标题与步骤引导 --- */
.page-heading {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.steps {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.steps strong {
  color: #0ea5e9; /* 亮色系点缀：AI 专属蓝 */
  font-weight: 700;
  background: rgba(14, 165, 233, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
}

/* --- 表单主体与 Label 优化 --- */
.form-main {
  position: relative;
  padding: 10px 0;
}

.form-main :deep(.el-form-item__label) {
  font-weight: 700;
  color: #334155;
  padding-bottom: 8px;
  font-size: 14px;
}

/* 下拉选择框也统一质感 */
.form-main :deep(.el-select .el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02) !important;
}

/* --- 核心编辑区 (Draft Zone) --- */
.draft-zone {
  position: relative;
  border-radius: 16px;
  background: #f8fafc; /* 极浅的蓝灰底色，形成视觉分组 */
  padding: 20px;
  margin: 0 -10px 16px; /* 两侧稍微向外扩展，包裹感更强 */
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.draft-zone :deep(.el-input__wrapper),
.draft-zone :deep(.el-textarea__inner) {
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02) !important;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: #ffffff;
  padding: 8px 12px; /* 增加文字呼吸感 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 🚀 高级感来源：输入框焦点反馈，呼吸光晕 */
.draft-zone :deep(.el-input__wrapper.is-focus),
.draft-zone :deep(.el-textarea__inner:focus) {
  border-color: rgba(0, 110, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(0, 110, 255, 0.1), 0 4px 16px rgba(0, 110, 255, 0.06) !important;
  background: #ffffff;
}

/* --- AI 生成状态交互动画 --- */
.draft-zone.is-ai :deep(.el-input__wrapper),
.draft-zone.is-ai :deep(.el-textarea__inner) {
  filter: grayscale(0.2);
  opacity: 0.6;
  transform: scale(0.995); /* 生成时底层轻微内缩，凸显上层 Shimmer */
}

/* 高级毛玻璃遮罩 */
.ai-shimmer-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  padding: 20px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px); /* 加大模糊半径 */
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* --- 底部操作栏与按钮美化 --- */
.row {
  display: flex;
  justify-content: flex-end; /* 按钮靠右更符合表单提交直觉 */
  gap: 12px;
  margin-top: 16px;
  padding-top: 20px;
  border-top: 1px dashed rgba(15, 23, 42, 0.08);
}

/* AI 生成按钮定制化 */
.row :deep(.el-button:first-child) {
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border: 1px solid rgba(14, 165, 233, 0.2);
  color: #0369a1;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.row :deep(.el-button:first-child:hover:not(.is-disabled)) {
  background: linear-gradient(135deg, #dcfce7 0%, #bae6fd 100%);
  border-color: rgba(14, 165, 233, 0.4);
  transform: translateY(-1px);
}

/* 发布按钮定制化 */
.row :deep(.el-button:last-child) {
  font-weight: 600;
  border-radius: 10px;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.2s ease;
}

.row :deep(.el-button:last-child:hover:not(.is-disabled)) {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  transform: translateY(-1px);
}
</style>
