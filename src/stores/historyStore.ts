import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BlockInstance, Connection } from '@/types'

// 版本快照接口
export interface VersionSnapshot {
  id: string
  name: string
  timestamp: number
  blocks: BlockInstance[]
  connections: Connection[]
  description?: string
}

// 最大版本数量
const MAX_VERSIONS = 20

export const useHistoryStore = defineStore('history', () => {
  // 版本历史列表
  const versions = ref<VersionSnapshot[]>([])

  // 当前版本索引 (-1 表示最新)
  const currentIndex = ref(-1)

  // 创建版本快照
  const createSnapshot = (
    blocks: BlockInstance[],
    connections: Connection[],
    description?: string
  ): VersionSnapshot => {
    return {
      id: `version-${Date.now()}`,
      name: `版本 ${versions.value.length + 1}`,
      timestamp: Date.now(),
      blocks: JSON.parse(JSON.stringify(blocks)),
      connections: JSON.parse(JSON.stringify(connections)),
      description
    }
  }

  // 保存版本
  const saveVersion = (
    blocks: BlockInstance[],
    connections: Connection[],
    description?: string
  ) => {
    const snapshot = createSnapshot(blocks, connections, description)
    
    // 如果当前不在最新版本，删除后面的版本
    if (currentIndex.value > 0) {
      versions.value = versions.value.slice(currentIndex.value)
    }
    
    // 添加新版本到开头
    versions.value.unshift(snapshot)
    
    // 限制版本数量
    if (versions.value.length > MAX_VERSIONS) {
      versions.value = versions.value.slice(0, MAX_VERSIONS)
    }
    
    // 重置当前索引
    currentIndex.value = -1
    
    // 持久化到 localStorage
    persistVersions()
    
    return snapshot
  }

  // 跳转到指定版本
  const jumpToVersion = (index: number): VersionSnapshot | null => {
    if (index < 0 || index >= versions.value.length) return null
    
    currentIndex.value = index
    persistVersions()
    
    return versions.value[index]
  }

  // 删除指定版本
  const deleteVersion = (id: string) => {
    const index = versions.value.findIndex(v => v.id === id)
    if (index === -1) return
    
    versions.value.splice(index, 1)
    
    // 调整当前索引
    if (currentIndex.value >= index && currentIndex.value > 0) {
      currentIndex.value--
    }
    
    persistVersions()
  }

  // 清空所有版本
  const clearVersions = () => {
    versions.value = []
    currentIndex.value = -1
    localStorage.removeItem('vba-visual-history')
  }

  // 持久化到 localStorage
  const persistVersions = () => {
    try {
      const data = {
        versions: versions.value,
        currentIndex: currentIndex.value
      }
      localStorage.setItem('vba-visual-history', JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to persist history:', e)
    }
  }

  // 从 localStorage 恢复
  const restoreVersions = () => {
    try {
      const saved = localStorage.getItem('vba-visual-history')
      if (saved) {
        const data = JSON.parse(saved)
        versions.value = data.versions || []
        currentIndex.value = data.currentIndex ?? -1
      }
    } catch (e) {
      console.warn('Failed to restore history:', e)
    }
  }

  // 初始化时恢复
  restoreVersions()

  return {
    versions,
    currentIndex,
    saveVersion,
    jumpToVersion,
    deleteVersion,
    clearVersions,
    restoreVersions
  }
})
