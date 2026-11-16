import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BlockInstance, Connection } from '@/types'

// 排序模式类型
export type SortMode = 'connection' | 'position'

export const useBlockStore = defineStore('block', () => {
  const blocks = ref<BlockInstance[]>([])
  const connections = ref<Connection[]>([])
  
  // 当前排序模式
  const sortMode = ref<SortMode>('position')

  // 是否有连线
  const hasConnections = computed(() => connections.value.length > 0)

  // 添加积木块（自动分配编号）
  const addBlock = (block: BlockInstance) => {
    // 自动分配编号（如果未指定）
    if (block.order === undefined) {
      const maxOrder = blocks.value.length > 0 
        ? Math.max(...blocks.value.map(b => b.order || 0)) 
        : 0
      block.order = maxOrder + 1
    }
    blocks.value.push(block)
  }

  // 获取积木块
  const getBlockById = (id: string) => {
    return blocks.value.find(b => b.id === id) || null
  }

  // 更新积木属性
  const updateBlockProperty = (blockId: string, propertyId: string, value: unknown) => {
    const block = blocks.value.find(b => b.id === blockId)
    if (block) {
      block.properties[propertyId] = value
    }
  }

  // 更新积木位置
  const updateBlockPosition = (blockId: string, x: number, y: number) => {
    const block = blocks.value.find(b => b.id === blockId)
    if (block) {
      block.position = { x, y }
    }
  }

  // 更新积木编号（并重排其他积木）
  const updateBlockOrder = (blockId: string, newOrder: number) => {
    const block = blocks.value.find(b => b.id === blockId)
    if (!block) return
    
    const oldOrder = block.order
    if (newOrder === oldOrder) return
    
    const maxOrder = blocks.value.length
    
    // 限制范围
    newOrder = Math.max(1, Math.min(maxOrder, newOrder))
    
    // 重新计算所有积木的编号
    blocks.value.forEach(b => {
      if (b.id === blockId) {
        b.order = newOrder
      } else if (newOrder > oldOrder && b.order > oldOrder && b.order <= newOrder) {
        // 向后移动：中间的积木编号减1
        b.order--
      } else if (newOrder < oldOrder && b.order >= newOrder && b.order < oldOrder) {
        // 向前移动：中间的积木编号加1
        b.order++
      }
    })
  }

  // 上移积木
  const moveBlockUp = (blockId: string) => {
    const block = blocks.value.find(b => b.id === blockId)
    if (block && block.order > 1) {
      updateBlockOrder(blockId, block.order - 1)
    }
  }

  // 下移积木
  const moveBlockDown = (blockId: string) => {
    const block = blocks.value.find(b => b.id === blockId)
    const maxOrder = blocks.value.length
    if (block && block.order < maxOrder) {
      updateBlockOrder(blockId, block.order + 1)
    }
  }

  // 批量更新积木编号（用于自动排序）
  const batchUpdateOrders = (orders: { id: string; order: number }[]) => {
    orders.forEach(({ id, order }) => {
      const block = blocks.value.find(b => b.id === id)
      if (block) {
        block.order = order
      }
    })
  }

  // 设置排序模式
  const setSortMode = (mode: SortMode) => {
    sortMode.value = mode
  }

  // 删除积木块（容器积木级联删除其全部子孙积木）
  const removeBlock = (blockId: string) => {
    // 收集待删除集合：自身 + 全部后代
    const toRemove = new Set<string>([blockId])
    let grew = true
    while (grew) {
      grew = false
      blocks.value.forEach(b => {
        if (b.parentId && toRemove.has(b.parentId) && !toRemove.has(b.id)) {
          toRemove.add(b.id)
          grew = true
        }
      })
    }

    const removedIds = [...toRemove]
    const block = blocks.value.find(b => b.id === blockId)
    const removedOrder = block?.order || 0

    blocks.value = blocks.value.filter(b => !toRemove.has(b.id))

    // 重新计算编号（删除后后面的积木编号减1）
    blocks.value.forEach(b => {
      if (!b.parentId && b.order > removedOrder) {
        b.order--
      }
    })

    // 同时删除相关连接
    connections.value = connections.value.filter(
      c => !removedIds.includes(c.sourceBlockId) && !removedIds.includes(c.targetBlockId)
    )
  }

  // 设置积木的父容器（拖入/拖出容器时调用；undefined 表示顶层）
  const setBlockParent = (blockId: string, parentId: string | undefined) => {
    const block = blocks.value.find(b => b.id === blockId)
    if (block) {
      if (parentId) {
        block.parentId = parentId
      } else {
        delete block.parentId
      }
    }
  }

  // 清空所有积木
  const clearBlocks = () => {
    blocks.value = []
    connections.value = []
  }

  // 添加连接
  const addConnection = (connection: Connection) => {
    connections.value.push(connection)
  }

  // 删除连接
  const removeConnection = (connectionId: string) => {
    const index = connections.value.findIndex(c => c.id === connectionId)
    if (index > -1) {
      connections.value.splice(index, 1)
    }
  }

  // 获取排序后的顶层积木（按 order 排序；容器子积木不参与线性流程）
  const sortedBlocks = computed(() => {
    return blocks.value
      .filter(b => !b.parentId)
      .sort((a, b) => a.order - b.order)
  })

  // 获取顶层积木数量
  const maxOrder = computed(() => {
    return blocks.value.filter(b => !b.parentId).length
  })

  return {
    blocks,
    connections,
    sortedBlocks,
    maxOrder,
    sortMode,
    hasConnections,
    addBlock,
    getBlockById,
    updateBlockProperty,
    updateBlockPosition,
    updateBlockOrder,
    moveBlockUp,
    moveBlockDown,
    batchUpdateOrders,
    setSortMode,
    setBlockParent,
    removeBlock,
    clearBlocks,
    addConnection,
    removeConnection
  }
})
