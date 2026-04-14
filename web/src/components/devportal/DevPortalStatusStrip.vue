<script setup lang="ts">
import { CircleCheckFilled, DataLine, InfoFilled } from '@element-plus/icons-vue'

const items = [
  { label: 'API 网关', status: '正常', tone: 'ok' as const },
  { label: '沙箱（AI 工作台）', status: '可用', tone: 'ok' as const },
  { label: '文档站点', status: '已同步', tone: 'ok' as const },
  { label: 'Webhook 投递', status: '演示关闭', tone: 'muted' as const },
]
</script>

<template>
  <div class="dp-status" role="status" aria-label="服务状态">
    <div class="dp-status__head">
      <el-icon class="dp-status__head-ico" :size="18"><DataLine /></el-icon>
      <span class="dp-status__head-t">系统健康</span>
      <el-tag size="small" type="success" effect="plain" class="dp-status__tag">All systems operational</el-tag>
    </div>
    <ul class="dp-status__list">
      <li v-for="it in items" :key="it.label" class="dp-status__item">
        <el-icon class="dp-status__dot" :size="16" :class="'is-' + it.tone">
          <InfoFilled v-if="it.tone === 'muted'" />
          <CircleCheckFilled v-else />
        </el-icon>
        <span class="dp-status__label">{{ it.label }}</span>
        <span class="dp-status__val" :class="'is-' + it.tone">{{ it.status }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dp-status {
  padding: 14px 16px 12px;
  border-radius: 12px;
  border: 1px solid rgb(34 197 94 / 0.25);
  background: linear-gradient(
    125deg,
    rgb(240 253 244 / 0.85) 0%,
    rgb(255 255 255 / 0.95) 55%,
    rgb(239 246 255 / 0.6) 100%
  );
  box-shadow: 0 2px 14px rgb(22 163 74 / 0.08);
}

.dp-status__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 10px;
}

.dp-status__head-ico {
  color: rgb(22 163 74);
}

.dp-status__head-t {
  font-size: 13px;
  font-weight: 800;
  color: var(--buddy-text);
}

.dp-status__tag {
  margin-left: auto;
  font-weight: 700 !important;
  letter-spacing: 0.02em;
}

.dp-status__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

@media (min-width: 640px) {
  .dp-status__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.dp-status__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.65);
  border: 1px solid rgb(15 23 42 / 0.05);
}

.dp-status__dot {
  flex-shrink: 0;
  color: rgb(34 197 94);
}

.dp-status__dot.is-muted {
  color: rgb(148 163 184);
}

.dp-status__label {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-text-secondary);
}

.dp-status__val {
  font-size: 11px;
  font-weight: 700;
  color: rgb(22 163 94);
}

.dp-status__val.is-muted {
  color: var(--buddy-text-muted);
  font-weight: 600;
}
</style>
