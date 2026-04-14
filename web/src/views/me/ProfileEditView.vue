<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import * as uploadsApi from '@/api/uploads'

const router = useRouter()
const user = useUserStore()

const loading = ref(false)
const avatarUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
/** 本地选图后的即时预览（blob），上传成功或离开页时释放 */
const localPreviewUrl = ref<string | null>(null)

const form = reactive({
  nickname: '',
  avatarUrl: '',
  rank: '',
  bio: '',
  cityOrRegion: '',
})

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const avatarDisplaySrc = computed(() => localPreviewUrl.value || form.avatarUrl || undefined)

function revokeLocalPreview() {
  if (localPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }
  localPreviewUrl.value = null
}

onMounted(() => {
  const p = user.profile
  if (p) {
    form.nickname = p.nickname
    form.avatarUrl = p.avatarUrl || ''
    form.rank = p.rank
    form.bio = p.bio || ''
    form.cityOrRegion = p.cityOrRegion || ''
  }
})

onBeforeUnmount(() => {
  revokeLocalPreview()
})

function triggerPickAvatar() {
  fileInputRef.value?.click()
}

function validateImageFile(file: File): string | null {
  if (!AVATAR_ACCEPT.includes(file.type)) {
    return '请上传 JPG、PNG、WebP 或 GIF 图片'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return '图片需小于 2MB'
  }
  return null
}

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const err = validateImageFile(file)
  if (err) {
    ElMessage.warning(err)
    return
  }

  revokeLocalPreview()
  localPreviewUrl.value = URL.createObjectURL(file)

  avatarUploading.value = true
  try {
    const { url } = await uploadsApi.uploadFile(file)
    form.avatarUrl = url
    revokeLocalPreview()
    ElMessage.success('头像已上传')
  } catch (e) {
    revokeLocalPreview()
    ElMessage.error(e instanceof Error ? e.message : '上传失败')
  } finally {
    avatarUploading.value = false
  }
}

function clearAvatar() {
  form.avatarUrl = ''
  revokeLocalPreview()
}

async function save() {
  const nick = form.nickname.trim()
  if (!nick) {
    ElMessage.warning('请填写昵称')
    return
  }

  loading.value = true
  try {
    await user.saveProfile({
      nickname: nick,
      avatarUrl: form.avatarUrl.trim() || undefined,
      rank: form.rank,
      bio: form.bio.trim() || undefined,
      cityOrRegion: form.cityOrRegion.trim() || undefined,
    })
    ElMessage.success('资料已保存')
    void router.replace({ name: 'me' })
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="buddy-page profile-edit app-page-stack">
    <section class="app-layer app-layer--discover" aria-label="编辑说明">
      <div class="app-layer__inner">
        <h2 class="page-heading">编辑资料</h2>
        <p class="page-lead">修改昵称、上传头像与个性签名；保存后在「元流档案」与峡谷广场等位置同步展示。</p>
      </div>
    </section>

    <section class="app-layer app-layer--content" aria-label="资料表单">
      <div class="app-layer__inner">
    <el-form label-position="top" class="form">
      <section class="section buddy-card-surface">
        <h3 class="section-title">头像</h3>
        <p class="section-hint">支持 JPG / PNG / WebP / GIF，单张不超过 2MB。</p>
        <div class="avatar-row">
          <div class="avatar-wrap" :class="{ 'is-busy': avatarUploading }">
            <el-avatar class="avatar-preview" :size="96" :src="avatarDisplaySrc">
              {{ form.nickname?.slice(0, 1) || '我' }}
            </el-avatar>
            <div v-if="avatarUploading" class="avatar-loading" aria-live="polite">上传中…</div>
          </div>
          <div class="avatar-actions">
            <input
              ref="fileInputRef"
              type="file"
              class="sr-only"
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-label="选择头像图片"
              @change="onAvatarFileChange"
            />
            <el-button type="primary" :loading="avatarUploading" @click="triggerPickAvatar">
              <el-icon class="btn-ico"><Plus /></el-icon>
              上传图片
            </el-button>
            <el-button v-if="form.avatarUrl || localPreviewUrl" :disabled="avatarUploading" @click="clearAvatar">
              移除头像
            </el-button>
          </div>
        </div>
        <el-form-item label="或使用图片链接（可选）" class="url-field">
          <el-input
            v-model="form.avatarUrl"
            clearable
            placeholder="https://… 填写后将覆盖上方上传结果"
          >
            <template #prefix>
              <el-icon><Picture /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </section>

      <section class="section buddy-card-surface">
        <h3 class="section-title">基本资料</h3>
        <el-form-item label="昵称" required>
          <el-input v-model="form.nickname" maxlength="32" show-word-limit placeholder="展示名，最多 32 字" />
        </el-form-item>
        <el-form-item label="个性签名">
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="一句话介绍自己、常玩位置或开黑习惯等"
          />
        </el-form-item>
      </section>

      <section class="section buddy-card-surface section--muted">
        <h3 class="section-title">其他（可选）</h3>
        <el-form-item label="段位 / 水平">
          <el-input v-model="form.rank" placeholder="如：钻石 / 黄金" />
        </el-form-item>
        <el-form-item label="地区 / 时区">
          <el-input v-model="form.cityOrRegion" placeholder="如：华东 / UTC+8" />
        </el-form-item>
      </section>

      <div class="form-actions">
        <el-button type="primary" size="large" :loading="loading" @click="save">保存</el-button>
      </div>
    </el-form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-edit {
  max-width: 560px;
}

.page-heading {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--buddy-text);
}

.page-lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section {
  padding: 16px 16px 8px;
  border: 1px solid var(--buddy-border);
}

.section--muted {
  background: linear-gradient(180deg, rgba(248, 250, 255, 0.6) 0%, var(--buddy-surface) 100%);
}

.section-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--buddy-text);
}

.section-hint {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--buddy-text-muted);
}

.avatar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-wrap.is-busy .avatar-preview {
  opacity: 0.55;
}

.avatar-preview {
  border: 2px solid var(--buddy-border);
  box-shadow: 0 4px 16px rgba(0, 110, 255, 0.12);
}

.avatar-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--buddy-primary);
  background: rgba(255, 255, 255, 0.65);
  border-radius: 50%;
  pointer-events: none;
}

.avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.btn-ico {
  margin-right: 4px;
  vertical-align: middle;
}

.url-field {
  margin-bottom: 4px;
}

.url-field :deep(.el-form-item__label) {
  font-size: 12px;
  color: var(--buddy-text-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.form-actions {
  padding-top: 4px;
}
</style>
