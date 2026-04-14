import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ForumCategory } from '@/types/post'

export const useForumStore = defineStore('forum', () => {
  const category = ref<ForumCategory | ''>('')
  const keyword = ref('')

  function setCategory(c: ForumCategory | '') {
    category.value = c
  }

  function setKeyword(q: string) {
    keyword.value = q
  }

  return { category, keyword, setCategory, setKeyword }
})
