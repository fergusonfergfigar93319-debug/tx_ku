<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ForumCategory, Post } from '@/types/post'

defineProps<{
  posts: Post[]
}>()

const router = useRouter()

const categoryLabel: Record<ForumCategory, string> = {
  recruit: '讨论',
  guide: '指南',
  social: '社区',
  event: '活动',
}

function openPost(postId: string) {
  void router.push({ name: 'post-detail', params: { postId } })
}

function openForum() {
  void router.push({ name: 'forum' })
}
</script>

<template>
  <section id="home-forum" class="dp-fp home-anchor-target" tabindex="-1" aria-labelledby="dp-fp-title">
    <div class="dp-fp__head">
      <h2 id="dp-fp-title" class="dp-fp__title">开发者讨论</h2>
      <button type="button" class="dp-fp__more" @click="openForum">进入论坛 →</button>
    </div>
    <p class="dp-fp__sub">集成问题、迁移经验与示例脚本，优先在公开版块检索与提问。</p>
    <ul class="dp-fp__list">
      <li v-for="p in posts" :key="p.postId">
        <button type="button" class="dp-fp__row" @click="openPost(p.postId)">
          <span class="dp-fp__cat">{{ categoryLabel[p.category] }}</span>
          <span class="dp-fp__main">
            <span class="dp-fp__t">{{ p.title }}</span>
            <span class="dp-fp__m"
              >{{ p.authorNickname ?? '用户' }} · {{ p.likeCount ?? 0 }} 赞 · {{ p.commentCount ?? 0 }} 回复</span
            >
          </span>
          <span class="dp-fp__arr" aria-hidden="true">›</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.home-anchor-target {
  scroll-margin-top: 88px;
}

.dp-fp {
  padding: 20px 16px 16px;
  border-radius: 14px;
  border: 1px solid rgb(15 23 42 / 0.08);
  background: linear-gradient(180deg, rgb(255 255 255 / 0.98) 0%, rgb(250 245 255 / 0.5) 100%);
  box-shadow: 0 2px 18px rgb(109 75 212 / 0.06);
}

.dp-fp__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.dp-fp__title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--buddy-text);
}

.dp-fp__more {
  border: none;
  background: none;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--buddy-primary);
  cursor: pointer;
  font-family: inherit;
}

.dp-fp__more:hover {
  text-decoration: underline;
}

.dp-fp__sub {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--buddy-text-muted);
}

.dp-fp__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dp-fp__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px 12px;
  border-radius: 10px;
  border: 1px solid rgb(15 23 42 / 0.07);
  background: rgb(255 255 255 / 0.95);
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.dp-fp__row:hover {
  border-color: rgb(124 58 237 / 0.28);
  box-shadow: 0 8px 22px rgb(124 58 237 / 0.1);
}

.dp-fp__cat {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: rgb(109 40 217);
  background: rgb(124 58 237 / 0.08);
  border: 1px solid rgb(124 58 237 / 0.2);
}

.dp-fp__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dp-fp__t {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--buddy-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dp-fp__m {
  font-size: 11px;
  color: var(--buddy-text-muted);
}

.dp-fp__arr {
  flex-shrink: 0;
  font-size: 18px;
  color: rgb(148 163 184);
}
</style>
