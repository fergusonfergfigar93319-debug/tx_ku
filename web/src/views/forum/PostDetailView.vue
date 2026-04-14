<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, StarFilled } from '@element-plus/icons-vue'
import * as postsApi from '@/api/posts'
import { useFavoritePostsStore } from '@/stores/favoritePosts'
import type { Comment, Post } from '@/types/post'
import BuddyPullRefresh from '@/components/buddy/BuddyPullRefresh.vue'

const route = useRoute()
const favoritePosts = useFavoritePostsStore()

const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(false)
const text = ref('')

const postId = computed(() => route.params.postId as string)

const favorited = computed(() => favoritePosts.isFavorite(postId.value))

function toggleFavorite() {
  const was = favoritePosts.isFavorite(postId.value)
  favoritePosts.toggleFavorite(postId.value)
  ElMessage.success(was ? '已取消收藏' : '已加入收藏')
}

async function load(opts?: { silent?: boolean }) {
  const silent = opts?.silent === true
  if (!silent) loading.value = true
  try {
    post.value = await postsApi.getPost(postId.value)
    const c = await postsApi.getComments(postId.value)
    comments.value = c.list
  } catch {
    if (!silent) {
      post.value = null
      comments.value = []
    }
  } finally {
    if (!silent) loading.value = false
  }
}

async function pullRefresh() {
  await load({ silent: true })
}

async function sendComment() {
  const t = text.value.trim()
  if (!t) return
  try {
    const c = await postsApi.postComment(postId.value, t)
    comments.value.push(c)
    text.value = ''
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '发送失败')
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="buddy-page post-detail app-page-stack">
    <BuddyPullRefresh :refresh="pullRefresh" :reserved-top-extra="40">
      <div v-loading="loading && !post" class="detail-inner app-page-stack">
        <template v-if="post">
          <section class="app-layer app-layer--discover" aria-label="帖子正文">
            <div class="app-layer__inner">
              <div class="detail-title-row">
                <h2>{{ post.title }}</h2>
                <el-button class="fav-btn" text type="primary" @click="toggleFavorite">
                  <el-icon :size="20">
                    <StarFilled v-if="favorited" />
                    <Star v-else />
                  </el-icon>
                  <span>{{ favorited ? '已收藏' : '收藏' }}</span>
                </el-button>
              </div>
              <p class="body">{{ post.content }}</p>
              <div class="bar">
                <el-tag size="small">{{ post.category }}</el-tag>
              </div>
            </div>
          </section>

          <section class="app-layer app-layer--content" aria-label="评论">
            <div class="app-layer__inner">
              <h3 class="comments-heading">评论</h3>
              <div class="comments">
                <div v-for="c in comments" :key="c.commentId" class="c-item">
                  <strong>{{ c.authorNickname || '用户' }}</strong>
                  <p>{{ c.content }}</p>
                </div>
                <el-empty v-if="!comments.length" description="暂无评论" />
              </div>
            </div>
          </section>
        </template>
        <section v-else-if="!loading" class="app-layer app-layer--plain" aria-label="空状态">
          <div class="app-layer__inner">
            <el-empty description="帖子不存在" />
          </div>
        </section>
      </div>
    </BuddyPullRefresh>

    <section v-if="post" class="app-layer app-layer--tools" aria-label="写评论">
      <div class="app-layer__inner">
        <div class="comment-composer">
          <el-input v-model="text" type="textarea" :rows="3" placeholder="写评论…" />
          <el-button type="primary" class="comment-composer__send" @click="sendComment">发送</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
}

.post-detail h2 {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: clamp(18px, 4vw, 22px);
  line-height: 1.35;
}

.fav-btn {
  flex-shrink: 0;
  font-weight: 600;
}

.fav-btn .el-icon {
  margin-right: 4px;
  vertical-align: middle;
  color: #f59e0b;
}

.body {
  white-space: pre-wrap;
  line-height: 1.7;
}

.bar {
  margin: 16px 0;
}

.comments-heading {
  margin: 0 0 10px;
  font-size: 16px;
}

.comments {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.c-item {
  padding: 10px;
  background: var(--buddy-surface);
  border-radius: var(--buddy-radius-sm);
  border: 1px solid var(--buddy-border);
}

.c-item p {
  margin: 6px 0 0;
  font-size: 14px;
}

.comment-composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-composer__send {
  align-self: flex-start;
}
</style>
