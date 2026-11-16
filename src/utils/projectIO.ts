/**
 * 项目保存/加载统一入口
 * 编辑器、标题栏、首页共用同一数据格式与最近项目记录
 */
import { ElMessage } from 'element-plus'
import type { ProjectData } from '@/stores/canvasStore'
import type { BlockInstance, Connection } from '@/types'

const RECENT_KEY = 'vba-visual-recent-projects'
const MAX_RECENT = 5

export interface RecentProject {
  id: string       // 文件路径（作为唯一标识）
  name: string     // 文件名
  date: string     // 保存时间显示文本
  path: string
}

// 序列化当前项目（blocks/connections + 画布节点位置 graphData）
export const buildProjectData = (
  blocks: BlockInstance[],
  connections: Connection[],
  graphData?: unknown
): ProjectData => {
  return {
    version: '1.1.0',
    blocks: JSON.parse(JSON.stringify(blocks)),
    connections: JSON.parse(JSON.stringify(connections)),
    graphData: graphData as ProjectData['graphData']
  }
}

// 打开保存对话框并写入项目文件
// 返回保存后的文件路径（未保存/失败返回 null）
export const saveProjectToFile = async (projectData: ProjectData): Promise<string | null> => {
  if (!window.electronAPI) {
    ElMessage.error('当前环境不支持文件保存（缺少 Electron API）')
    return null
  }

  const result = await window.electronAPI.dialog.save({
    filters: [{ name: 'VBA 项目', extensions: ['vba.json'] }],
    defaultPath: 'project.vba.json'
  })

  if (!result || result.canceled || !result.filePath) {
    return null
  }

  const writeResult = await window.electronAPI.fs.writeFile(
    result.filePath,
    JSON.stringify(projectData, null, 2)
  )

  if (!writeResult.success) {
    ElMessage.error(`保存失败: ${writeResult.error || '未知错误'}`)
    return null
  }

  return result.filePath
}

// 从文件路径读取项目数据（格式错误返回 null 并提示）
export const loadProjectFromPath = async (filePath: string): Promise<ProjectData | null> => {
  if (!window.electronAPI) {
    ElMessage.error('当前环境不支持文件读取（缺少 Electron API）')
    return null
  }

  const readResult = await window.electronAPI.fs.readFile(filePath)
  if (!readResult.success || !readResult.content) {
    ElMessage.error(`加载失败: ${readResult.error || '未知错误'}`)
    return null
  }

  try {
    const projectData = JSON.parse(readResult.content) as ProjectData
    if (!Array.isArray(projectData.blocks)) {
      throw new Error('缺少 blocks 数据')
    }
    return projectData
  } catch {
    ElMessage.error('项目文件格式错误')
    return null
  }
}

// ==================== 最近项目记录 ====================

export const getRecentProjects = (): RecentProject[] => {
  try {
    const saved = localStorage.getItem(RECENT_KEY)
    return saved ? (JSON.parse(saved) as RecentProject[]) : []
  } catch {
    return []
  }
}

export const addRecentProject = (filePath: string) => {
  const name = filePath.split(/[/\\]/).pop() || filePath
  const list = getRecentProjects().filter(p => p.path !== filePath)
  list.unshift({
    id: filePath,
    name,
    date: new Date().toLocaleString('zh-CN', { hour12: false }),
    path: filePath
  })
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
  } catch {
    // 存储配额不足时忽略
  }
}

export const removeRecentProject = (filePath: string) => {
  const list = getRecentProjects().filter(p => p.path !== filePath)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list))
}
