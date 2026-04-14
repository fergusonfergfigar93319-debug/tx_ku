import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'buddy_forum_favorite_post_ids'

function readStoredIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0)
  } catch {
    return []
  }
}

function writeStoredIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export const useFavoritePostsStore = defineStore('favoritePosts', () => {
  const postIds = ref<string[]>(readStoredIds())

  function persist() {
    writeStoredIds(postIds.value)
  }

  function isFavorite(postId: string) {
    return postIds.value.includes(postId)
  }

  function addFavorite(postId: string) {
    if (postIds.value.includes(postId)) return
    postIds.value = [...postIds.value, postId]
    persist()
  }

  function removeFavorite(postId: string) {
    if (!postIds.value.includes(postId)) return
    postIds.value = postIds.value.filter((id) => id !== postId)
    persist()
  }

  function toggleFavorite(postId: string) {
    if (isFavorite(postId)) removeFavorite(postId)
    else addFavorite(postId)
  }

  return {
    postIds,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  }
})
