<template>
  <div class="canvas-toolbar">
    <div class="toolbar-group">
      <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
        <el-button 
          :icon="RefreshLeft" 
          circle 
          size="small" 
          :disabled="!canUndo"
          @click="$emit('action', 'undo')" 
        />
      </el-tooltip>
      <el-tooltip content="重做 (Ctrl+Y)" placement="bottom">
        <el-button 
          :icon="RefreshRight" 
          circle 
          size="small" 
          :disabled="!canRedo"
          @click="$emit('action', 'redo')" 
        />
      </el-tooltip>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-group">
      <el-tooltip content="放大" placement="bottom">
        <el-button :icon="ZoomIn" circle size="small" @click="$emit('action', 'zoom-in')" />
      </el-tooltip>
      <el-tooltip content="缩小" placement="bottom">
        <el-button :icon="ZoomOut" circle size="small" @click="$emit('action', 'zoom-out')" />
      </el-tooltip>
      <el-tooltip content="适应画布" placement="bottom">
        <el-button :icon="FullScreen" circle size="small" @click="$emit('action', 'zoom-fit')" />
      </el-tooltip>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-group">
      <el-tooltip content="清空画布" placement="bottom">
        <el-button :icon="Delete" circle size="small" type="danger" @click="$emit('action', 'clear')" />
      </el-tooltip>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-group">
      <el-button :icon="FolderOpened" @click="$emit('action', 'load')">
        打开项目
      </el-button>
      <el-button type="primary" :icon="DocumentChecked" @click="$emit('action', 'save')">
        保存项目
      </el-button>
      <el-button :icon="Download" @click="$emit('action', 'export')">
        导出代码
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Delete,
  DocumentChecked,
  Download,
  FolderOpened
} from '@element-plus/icons-vue'

defineProps<{
  canUndo?: boolean
  canRedo?: boolean
}>()

defineEmits<{
  (e: 'action', action: string): void
}>()
</script>

<style lang="scss" scoped>
.canvas-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-spacer {
  flex: 1;
}

.el-divider {
  height: 24px;
  margin: 0 4px;
}
</style>
