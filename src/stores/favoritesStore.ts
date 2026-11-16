import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  // 从 localStorage 读取收藏列表
  const getInitialFavorites = (): string[] => {
    const saved = localStorage.getItem('vba-visual-favorites')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  }

  const favorites = ref<string[]>(getInitialFavorites())

  // 监听收藏变化并持久化
  watch(favorites, (newFavorites) => {
    localStorage.setItem('vba-visual-favorites', JSON.stringify(newFavorites))
  }, { deep: true })

  // 添加收藏
  const addFavorite = (blockId: string) => {
    if (!favorites.value.includes(blockId)) {
      favorites.value.push(blockId)
    }
  }

  // 移除收藏
  const removeFavorite = (blockId: string) => {
    const index = favorites.value.indexOf(blockId)
    if (index > -1) {
      favorites.value.splice(index, 1)
    }
  }

  // 切换收藏状态
  const toggleFavorite = (blockId: string) => {
    if (favorites.value.includes(blockId)) {
      removeFavorite(blockId)
    } else {
      addFavorite(blockId)
    }
  }

  // 检查是否已收藏
  const isFavorite = (blockId: string): boolean => {
    return favorites.value.includes(blockId)
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite
  }
})
