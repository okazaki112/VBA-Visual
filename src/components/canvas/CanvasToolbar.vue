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
      <!-- 缩放比例显示与输入 -->
      <div class="zoom-display">
        <el-input-number
          v-model="zoomInputPercent"
          class="zoom-input"
          size="small"
          :min="20"
          :max="400"
          :step="10"
          controls-position="right"
          @change="onZoomInputChange"
        />
        <span class="zoom-unit">%</span>
        <el-tooltip content="重置缩放" placement="bottom">
          <el-button
            v-if="zoomPercent !== 100"
            size="small"
            text
            @click="$emit('action', 'zoom-reset')"
          >
            重置
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <el-divider direction="vertical" />

    <!-- 一键排版 -->
    <div class="toolbar-group">
      <el-dropdown trigger="click" @command="handleLayoutCommand">
        <el-button :icon="Grid">
          一键排版 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="dagre-tb">
              <el-icon><SortDown /></el-icon>
              从上到下排列
            </el-dropdown-item>
            <el-dropdown-item command="dagre-lr">
              <el-icon><DArrowRight /></el-icon>
              从左到右排列
            </el-dropdown-item>
            <el-dropdown-item divided command="grid-2">
              网格布局 (2列)
            </el-dropdown-item>
            <el-dropdown-item command="grid-3">
              网格布局 (3列)
            </el-dropdown-item>
            <el-dropdown-item command="grid-4">
              网格布局 (4列)
            </el-dropdown-item>
            <el-dropdown-item divided command="grid-custom">
              <el-icon><Setting /></el-icon>
              自定义网格...
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-group">
      <el-tooltip content="清空画布" placement="bottom">
        <el-button :icon="Delete" circle size="small" type="danger" @click="$emit('action', 'clear')" />
      </el-tooltip>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-group">
      <!-- 主题切换下拉菜单 -->
      <el-dropdown trigger="click" @command="handleThemeCommand">
        <el-button class="theme-btn">
          <span 
            class="theme-color-dot" 
            :style="{ backgroundColor: currentThemeConfig?.primaryColor }"
          ></span>
          {{ currentThemeConfig?.name }}
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item 
              v-for="theme in themeList" 
              :key="theme.id" 
              :command="theme.id"
              :class="{ 'is-active': themeStore.theme === theme.id }"
            >
              <span 
                class="theme-color-dot" 
                :style="{ backgroundColor: theme.primaryColor }"
              ></span>
              <span class="theme-name">{{ theme.name }}</span>
              <span class="theme-desc">{{ theme.description }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="toolbar-group">
      <el-tooltip content="搜索画布积木 (S-4)" placement="bottom">
        <el-button :icon="Search" circle @click="$emit('action', 'search-block')" />
      </el-tooltip>
      <el-tooltip content="显示/隐藏小地图 (U-1)" placement="bottom">
        <el-button :icon="MapLocation" circle @click="$emit('action', 'toggle-minimap')" />
      </el-tooltip>
      <el-button :icon="Upload" @click="$emit('action', 'import-code')">
        导入代码
      </el-button>
      <el-button :icon="FolderOpened" @click="$emit('action', 'load')">
        打开项目
      </el-button>
      <el-button type="primary" :icon="DocumentChecked" @click="$emit('action', 'save')">
        保存项目
      </el-button>
      <el-dropdown trigger="click" @command="handleTemplateCommand">
        <el-button :icon="Files">
          模板 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="tpl in projectTemplates"
              :key="tpl.id"
              :command="tpl.id"
            >
              {{ tpl.name }}
              <span class="tpl-desc">{{ tpl.description }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown trigger="click" @command="(cmd: string) => $emit('action', cmd)">
        <el-button :icon="Download">
          导出 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="export-code">导出 VBA 代码</el-dropdown-item>
            <el-dropdown-item command="export-png">导出为 PNG 图片</el-dropdown-item>
            <el-dropdown-item command="export-svg">导出为 SVG 图片</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 自定义网格布局对话框 -->
    <el-dialog
      v-model="customGridDialogVisible"
      title="自定义网格布局"
      width="320px"
      :close-on-click-modal="false"
    >
      <div class="custom-grid-form">
        <div class="form-item">
          <label>列数（横向）</label>
          <el-input-number 
            v-model="customCols" 
            :min="1" 
            :max="20" 
            controls-position="right"
          />
        </div>
        <div class="form-item">
          <label>行数（竖向）</label>
          <el-input-number 
            v-model="customRows" 
            :min="1" 
            :max="20" 
            controls-position="right"
          />
          <span class="form-hint">留空则自动计算</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="customGridDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyCustomGrid">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Delete,
  DocumentChecked,
  Download,
  Upload,
  FolderOpened,
  ArrowDown,
  Grid,
  SortDown,
  DArrowRight,
  Setting,
  Search,
  Files,
  MapLocation
} from '@element-plus/icons-vue'
import { useThemeStore, themeList } from '@/stores/themeStore'
import { projectTemplates } from '@/assets/templates/projectTemplates'

const props = defineProps<{
  canUndo?: boolean
  canRedo?: boolean
  zoom?: number
}>()

const emit = defineEmits<{
  (e: 'action', action: string, payload?: Record<string, unknown>): void
}>()

const themeStore = useThemeStore()

// 当前主题配置
const currentThemeConfig = computed(() => themeStore.getCurrentThemeConfig())

// 处理主题切换
const handleThemeCommand = (command: string) => {
  themeStore.setTheme(command as any)
}

const zoomPercent = computed(() => {
  return Math.round((props.zoom || 1) * 100)
})

// 缩放输入框（跟随画布实际缩放变化；输入 20-400 直接设定缩放）
const zoomInputPercent = ref(zoomPercent.value)
watch(zoomPercent, (val) => {
  zoomInputPercent.value = val
})

const onZoomInputChange = (val: number | undefined) => {
  if (val && val !== zoomPercent.value) {
    emit('action', 'zoom-set', { percent: val })
  }
}

// 自定义网格布局
const customGridDialogVisible = ref(false)
const customCols = ref(3)
const customRows = ref<number | undefined>(undefined)

// 处理布局命令
const handleLayoutCommand = (command: string) => {
  if (command.startsWith('dagre-')) {
    const direction = command === 'dagre-tb' ? 'TB' : 'LR'
    emit('action', 'layout', { type: 'dagre', direction })
  } else if (command === 'grid-custom') {
    customGridDialogVisible.value = true
  } else if (command.startsWith('grid-')) {
    const cols = parseInt(command.split('-')[1]) || 3
    emit('action', 'layout', { type: 'grid', cols })
  }
}

// G-2 模板载入
const handleTemplateCommand = (templateId: string) => {
  emit('action', 'template', { templateId })
}

// 应用自定义网格布局
const applyCustomGrid = () => {
  emit('action', 'layout', { 
    type: 'grid', 
    cols: customCols.value,
    rows: customRows.value
  })
  customGridDialogVisible.value = false
}
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
  // 中间栏被右栏/工具箱压缩时，溢出按钮在容器内横向滚动，
  // 而不是溢出可见区被右侧面板盖住
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  // 按钮组保持完整不收缩，避免窄宽度下被压扁变形
  flex-shrink: 0;
}

.toolbar-spacer {
  flex: 1;
}

.el-divider {
  height: 24px;
  margin: 0 4px;
}

.zoom-display {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  min-width: 60px;
}

.zoom-input {
  width: 78px;

  :deep(.el-input__inner) {
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
}

.zoom-unit {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.custom-grid-form {
  .form-item {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .el-input-number {
      width: 100%;
    }
    
    .form-hint {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

// 主题切换按钮样式
.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.theme-name {
  margin-left: 8px;
  font-weight: 500;
}

.theme-desc {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.tpl-desc {
  margin-left: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

// 下拉菜单中的激活项
:deep(.el-dropdown-menu__item.is-active) {
  background-color: var(--bg-tertiary);
  color: var(--primary-color);
}
</style>
