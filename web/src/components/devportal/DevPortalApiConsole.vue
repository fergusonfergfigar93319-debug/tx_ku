<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Key, Monitor } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const user = useUserStore()
const copied = ref(false)

/** 演示用：由账户邮箱派生的伪 Key，非真实密钥 */
const keyTail = computed(() => {
  const seed = user.account?.email?.trim() || user.profile?.nickname?.trim() || 'dev-portal-demo'
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 8)
})

const maskedKey = computed(() => `yl_live_${keyTail.value}••••••••••••`)

const copyPayload = computed(() => `yl_live_${keyTail.value}_demo_secret`)

async function copyKey() {
  try {
    await navigator.clipboard.writeText(copyPayload.value)
    copied.value = true
    ElMessage.success('已复制到剪贴板（演示占位）')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    ElMessage.warning('复制失败，请手动选择文本')
  }
}
</script>

<template>
  <section id="dp-credentials" class="dp-api dp-api--anchor" tabindex="-1" aria-labelledby="dp-api-title">
    <div class="dp-api__head">
      <h2 id="dp-api-title" class="dp-api__title">
        <el-icon class="dp-api__title-ico" :size="20"><Key /></el-icon>
        凭证与示例请求
      </h2>
      <p class="dp-api__sub">
        与 Partnerfleet / Moesif 类门户一致：把 <strong>API Key</strong> 放在显眼位置，并附一条可复制的 curl 示例，降低首次集成成本。
      </p>
    </div>

    <div class="dp-api__row">
      <div class="dp-api__panel">
        <div class="dp-api__panel-head">
          <span class="dp-api__badge">Secret key</span>
          <span class="dp-api__env">Production · 演示</span>
        </div>
        <div class="dp-api__key-row">
          <code class="dp-api__key">{{ maskedKey }}</code>
          <button type="button" class="dp-api__copy" @click="copyKey">
            <el-icon :size="16"><CopyDocument /></el-icon>
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
        <p class="dp-api__hint">正式环境请接入后端签发与轮换策略；此处为前端演示占位。</p>
      </div>

      <div class="dp-api__panel dp-api__panel--code">
        <div class="dp-api__panel-head">
          <span class="dp-api__badge dp-api__badge--code">
            <el-icon :size="14"><Monitor /></el-icon>
            cURL
          </span>
        </div>
        <pre class="dp-api__pre" tabindex="0"><code>curl -sS https://api.example.com/v1/feed \\
  -H "Authorization: Bearer &lt;YOUR_API_KEY&gt;" \\
  -H "Accept: application/json"</code></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dp-api--anchor {
  scroll-margin-top: 88px;
}

.dp-api {
  padding: 20px 18px 18px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: linear-gradient(
    165deg,
    rgb(15 23 42 / 0.02) 0%,
    rgb(255 255 255 / 0.98) 40%,
    rgb(239 246 255 / 0.5) 100%
  );
  box-shadow: 0 4px 24px rgb(15 23 42 / 0.05);
}

.dp-api__head {
  margin-bottom: 16px;
}

.dp-api__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 800;
  color: var(--buddy-text);
}

.dp-api__title-ico {
  color: rgb(217 119 6);
}

.dp-api__sub {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--buddy-text-muted);
}

.dp-api__sub strong {
  color: var(--buddy-text-secondary);
  font-weight: 700;
}

.dp-api__row {
  display: grid;
  gap: 12px;
}

@media (min-width: 860px) {
  .dp-api__row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: stretch;
  }
}

.dp-api__panel {
  padding: 14px 14px 12px;
  border-radius: 12px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: rgb(255 255 255 / 0.92);
}

.dp-api__panel--code {
  background: rgb(15 23 42 / 0.96);
  border-color: rgb(15 23 42 / 0.5);
}

.dp-api__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.dp-api__badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--buddy-text-muted);
}

.dp-api__badge--code {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgb(148 163 184);
}

.dp-api__env {
  font-size: 11px;
  font-weight: 600;
  color: var(--buddy-success);
}

.dp-api__key-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.dp-api__key {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-family:
    ui-monospace,
    'Cascadia Code',
    'SF Mono',
    Menlo,
    Monaco,
    Consolas,
    monospace;
  color: var(--buddy-text);
  background: rgb(248 250 252);
  border: 1px solid rgb(15 23 42 / 0.08);
  word-break: break-all;
}

.dp-api__copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid rgb(var(--buddy-rgb-brand) / 0.25);
  background: rgb(255 255 255 / 0.95);
  font-size: 12px;
  font-weight: 700;
  color: var(--buddy-primary);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}

.dp-api__copy:hover {
  background: rgb(var(--buddy-rgb-brand) / 0.08);
}

.dp-api__hint {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
}

.dp-api__pre {
  margin: 0;
  padding: 0;
  overflow: auto;
  font-size: 11px;
  line-height: 1.55;
  color: rgb(226 232 240);
}

.dp-api__pre code {
  font-family:
    ui-monospace,
    'Cascadia Code',
    'SF Mono',
    Menlo,
    Monaco,
    Consolas,
    monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
