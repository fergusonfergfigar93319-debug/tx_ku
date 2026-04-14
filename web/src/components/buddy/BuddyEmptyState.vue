<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  description?: string
  actionLabel?: string
  /** 与 `actionLabel` 同时存在时渲染为跳转按钮 */
  actionTo?: RouteLocationRaw
}>()

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="buddy-empty buddy-card-surface">
    <div class="buddy-empty-icon" aria-hidden="true">
      <slot name="icon">
        <el-icon :size="28">
          <Document />
        </el-icon>
      </slot>
    </div>
    <p class="buddy-empty-title">{{ title }}</p>
    <p v-if="description" class="buddy-empty-desc">{{ description }}</p>
    <div class="buddy-empty-actions">
      <el-button
        v-if="actionLabel && actionTo"
        type="primary"
        tag="router-link"
        :to="actionTo"
      >
        {{ actionLabel }}
      </el-button>
      <el-button v-else-if="actionLabel" type="primary" @click="$emit('action')">
        {{ actionLabel }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.buddy-empty {
  padding: 28px 20px;
  text-align: center;
  border: 1px dashed var(--buddy-border-strong);
  box-shadow: none;
}

.buddy-empty-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: var(--buddy-primary-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--buddy-primary);
}


.buddy-empty-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--buddy-text);
}

.buddy-empty-desc {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

.buddy-empty-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
