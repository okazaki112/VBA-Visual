import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Graph } from '@antv/x6'
import type { Connection, BlockInstance } from '@/types'

// 项目数据类型
export interface ProjectData {
  version: string
  name?: string
  description?: string
  blocks: BlockInstance[]
  connections: Connection[]
  graphData?: { cells: unknown[] }
}

export const useCanvasStore = defineStore('canvas', () => {
  const graph = shallowRef<Graph | null>(null)
  const zoom = ref(1)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const connections = ref<Connection[]>([])
  const projectData = shallowRef<ProjectData | null>(null)

  const setGraph = (g: Graph | null) => {
    graph.value = g
  }

  const addConnection = (connection: Connection) => {
    connections.value.push(connection)
  }

  const clearConnections = () => {
    connections.value = []
  }

  const updateZoom = (value: number) => {
    zoom.value = value
  }

  const updateUndoRedoState = (undo: boolean, redo: boolean) => {
    canUndo.value = undo
    canRedo.value = redo
  }

  // 设置待加载的项目数据
  const setProjectData = (data: ProjectData | null) => {
    projectData.value = data
  }

  // 获取并清除项目数据（一次性使用）
  const consumeProjectData = () => {
    const data = projectData.value
    projectData.value = null
    return data
  }

  return {
    graph,
    zoom,
    canUndo,
    canRedo,
    connections,
    projectData,
    setGraph,
    addConnection,
    clearConnections,
    updateZoom,
    updateUndoRedoState,
    setProjectData,
    consumeProjectData
  }
})
