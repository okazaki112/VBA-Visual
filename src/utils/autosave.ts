/**
 * 自动保存与崩溃恢复
 * 画布变更防抖写入 localStorage 草稿，启动时可恢复
 * 以「保存基线」去重：内容与最近一次手动保存一致时不再生成草稿
 */
import { ref } from 'vue'
import type { ProjectData } from '@/stores/canvasStore'

const AUTOSAVE_KEY = 'vba-visual-autosave'

export interface AutosaveData extends ProjectData {
  savedAt?: number
}

export interface ProjectSnapshot {
  blocks: ProjectData['blocks']
  connections: ProjectData['connections']
}

let timer: ReturnType<typeof setTimeout> | null = null
// 最近一次手动保存的内容序列化（基线），用于跳过无变化的草稿
let savedBaseline: string | null = null

// S-2 未保存指示（响应式：标题栏红点）
export const dirtyFlag = ref(false)

const serializeSnapshot = (snapshot: ProjectSnapshot): string => {
  try {
    return JSON.stringify(snapshot)
  } catch {
    return ''
  }
}

// 写入草稿（内容为空或与保存基线一致时跳过）
const persistDraft = (snapshot: ProjectSnapshot) => {
  if (!snapshot.blocks.length) return
  const serialized = serializeSnapshot(snapshot)
  if (!serialized || serialized === savedBaseline) return
  dirtyFlag.value = true
  try {
    const data: AutosaveData = {
      version: '1.1.0',
      blocks: JSON.parse(serialized),
      connections: JSON.parse(JSON.stringify(snapshot.connections)),
      savedAt: Date.now()
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
  } catch {
    // 存储配额不足时静默跳过，不影响编辑
  }
}

// 防抖自动保存（默认 10 秒后落盘；onSaved 供状态栏显示时间）
export const scheduleAutosave = (
  getData: () => ProjectSnapshot,
  delay = 10000,
  onSaved?: (time: number) => void
) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    persistDraft(getData())
    if (onSaved && dirtyFlag.value) onSaved(Date.now())
  }, delay)
}

// 立即落盘（用于离开页面前保存）
export const flushAutosave = (getData: () => ProjectSnapshot) => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  persistDraft(getData())
}

// 手动保存成功后调用：清除草稿并记录基线
export const markSavedBaseline = (getData: () => ProjectSnapshot) => {
  savedBaseline = serializeSnapshot(getData())
  localStorage.removeItem(AUTOSAVE_KEY)
  dirtyFlag.value = false
}

// 读取自动保存草稿
export const getAutosaveData = (): AutosaveData | null => {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    if (!saved) return null
    const data = JSON.parse(saved) as AutosaveData
    if (!Array.isArray(data.blocks) || data.blocks.length === 0) return null
    return data
  } catch {
    return null
  }
}

// 清除草稿（用户放弃恢复后调用）
export const clearAutosave = () => {
  localStorage.removeItem(AUTOSAVE_KEY)
}
