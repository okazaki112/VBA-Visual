<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <div class="app-logo" @click="goHome" title="返回首页">
        <svg viewBox="0 0 24 24" class="logo-icon" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span class="app-title">VBA 可视化编辑器</span>
        <!-- S-2 未保存指示 -->
        <span v-if="dirtyFlag" class="unsaved-dot" title="有未保存的更改"></span>
      </div>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn minimize" @click="minimize" title="最小化">
        <svg viewBox="0 0 12 12">
          <rect y="5" width="12" height="2" />
        </svg>
      </button>
      <button class="control-btn maximize" @click="maximize" title="最大化">
        <svg viewBox="0 0 12 12">
          <rect x="1" y="1" width="10" height="10" stroke-width="2" fill="none" />
        </svg>
      </button>
      <button class="control-btn close" @click="close" title="关闭">
        <svg viewBox="0 0 12 12">
          <path d="M1 1l10 10M11 1l-10 10" stroke-width="2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useBlockStore } from '@/stores/blockStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { buildProjectData, saveProjectToFile } from '@/utils/projectIO'
import { flushAutosave, dirtyFlag } from '@/utils/autosave'

const router = useRouter()
const route = useRoute()
const blockStore = useBlockStore()
const canvasStore = useCanvasStore()

// 保存当前项目（与编辑器保存共用同一数据格式）
const saveCurrentProject = async (): Promise<boolean> => {
  const projectData = buildProjectData(
    blockStore.blocks,
    blockStore.connections,
    canvasStore.graph?.toJSON()
  )
  const filePath = await saveProjectToFile(projectData)
  if (filePath) {
    ElMessage.success('项目已保存')
    return true
  }
  return false
}

const goHome = async () => {
  // 检查是否有未保存的内容（在编辑器页面且有积木）
  if (route.path === '/editor' && blockStore.blocks.length > 0) {
    try {
      await ElMessageBox.confirm(
        '返回首页将丢失未保存的项目，是否保存后返回？',
        '提示',
        {
          confirmButtonText: '保存并返回',
          cancelButtonText: '直接返回',
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      )
      // 用户点击"保存并返回"
      const saved = await saveCurrentProject()
      if (saved) {
        router.push('/')
      }
      // 用户取消保存对话框，留在当前页面
    } catch (action: unknown) {
      if (action === 'cancel') {
        // 用户点击"直接返回"
        router.push('/')
      }
      // 用户点击关闭按钮，不做任何操作
    }
  } else {
    router.push('/')
  }
}

const minimize = async () => {
  await window.electronAPI?.window.minimize()
}

const maximize = async () => {
  await window.electronAPI?.window.maximize()
}

const close = async () => {
  // 编辑器有未保存内容时先确认
  if (route.path === '/editor' && blockStore.blocks.length > 0) {
    try {
      await ElMessageBox.confirm(
        '存在未保存的项目内容，关闭前是否保存？',
        '关闭确认',
        {
          confirmButtonText: '保存并关闭',
          cancelButtonText: '直接关闭',
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      )
      // 保存并关闭（保存失败或取消对话框则不关闭）
      const saved = await saveCurrentProject()
      if (!saved) return
    } catch (action: unknown) {
      // 非"直接关闭"（点了对话框关闭按钮）→ 不关闭窗口
      if (action !== 'cancel') return
    }
  }
  // 离开前补写自动保存草稿（崩溃恢复用）
  flushAutosave(() => ({ blocks: blockStore.blocks, connections: blockStore.connections }))
  await window.electronAPI?.window.close()
}
</script>

<style lang="scss" scoped>
.title-bar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  user-select: none;
}

.title-bar-drag {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  -webkit-app-region: drag;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: opacity var(--transition-fast);

  &:hover {
    opacity: 0.8;
  }
}

.logo-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-color);
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.unsaved-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  margin-left: 8px;
  flex-shrink: 0;
}

.title-bar-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background-color var(--transition-fast);

  svg {
    width: 12px;
    height: 12px;
    stroke: var(--text-secondary);
    fill: none;
  }

  &:hover {
    background: var(--bg-tertiary);

    svg {
      stroke: var(--text-primary);
    }
  }

  &.close:hover {
    background: var(--error);

    svg {
      stroke: white;
    }
  }
}
</style>
