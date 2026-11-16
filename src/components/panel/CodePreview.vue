<template>
  <div class="code-preview">
    <div class="preview-header">
      <span class="preview-title">生成的 VBA 代码</span>
      <el-tag v-if="errors && errors.length" type="danger" size="small">
        {{ errors.length }} 个校验问题
      </el-tag>
      <div class="preview-actions">
        <el-button size="small" :icon="CopyDocument" @click="$emit('copy')">
          复制
        </el-button>
        <el-button size="small" :icon="Download" @click="$emit('export')">
          导出
        </el-button>
        <el-tooltip content="在代码中查找 (Ctrl+F)" placement="bottom">
          <el-button v-if="!searchVisible" size="small" :icon="Search" @click="toggleSearch" />
        </el-tooltip>
        <el-tooltip content="将高亮的积木移动到画布视图中央" placement="bottom">
          <el-button
            size="small"
            :icon="Aim"
            :disabled="!highlightedBlockId"
            @click="$emit('locate', highlightedBlockId!)"
          >
            定位积木
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- P-3 代码搜索 -->
    <div v-if="searchVisible" class="search-row">
      <el-input
        ref="searchInputRef"
        v-model="searchQuery"
        size="small"
        placeholder="在代码中查找..."
        clearable
        @input="onSearchInput"
        @keyup.enter="gotoMatch(1)"
      />
      <span class="search-count">{{ matchLines.length ? currentMatchIdx + 1 : 0 }}/{{ matchLines.length }}</span>
      <el-button size="small" text :icon="ArrowUp" @click="gotoMatch(-1)" />
      <el-button size="small" text :icon="ArrowDown" @click="gotoMatch(1)" />
      <el-button size="small" text @click="toggleSearch">关闭</el-button>
    </div>

    <!-- 行号与代码同行渲染，天然同步滚动 -->
    <div class="code-container" ref="codeContainerRef">
      <div
        v-for="(line, n) in highlightedLines"
        :key="n"
        class="code-row"
        :class="{
          'highlighted-line': isLineHighlighted(n + 1),
          'error-line': !!errorLineMap.get(n + 1),
          'search-hit': isSearchHit(n + 1),
          'search-hit-current': isCurrentMatch(n + 1)
        }"
        :data-line="n + 1"
        :title="lineErrorTitle(n + 1)"
        @click="onLineClick(n + 1)"
        @mouseenter="onLineHover(n + 1, $event)"
        @mouseleave="hideTooltip"
      >
        <span class="row-number">{{ n + 1 }}</span>
        <span class="row-content" v-html="line"></span>
      </div>
    </div>

    <!-- 悬停提示 -->
    <div
      v-if="tooltipVisible"
      class="block-tooltip"
      :style="tooltipStyle"
    >
      <el-icon class="tooltip-icon"><ElementPlus /></el-icon>
      <span>{{ tooltipText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { CopyDocument, Download, Aim, ElementPlus, ArrowUp, ArrowDown, Search } from '@element-plus/icons-vue'
import { highlightVBA } from '@/utils/vbaHighlight'
import type { CodeMapping } from '@/utils/codeGenerator'
import type { ValidationError } from '@/utils/vbaValidator'

const props = defineProps<{
  code: string
  mappings?: CodeMapping[]
  highlightedBlockId?: string | null
  errors?: ValidationError[]
}>()

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'export'): void
  (e: 'line-click', blockId: string): void
  (e: 'locate', blockId: string): void
}>()

const codeContainerRef = ref<HTMLElement>()

// 悬停提示状态
const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltipStyle = ref({ top: '0px', left: '0px' })

const placeholderCode = `' 在画布上添加积木块
' 代码将自动生成在这里

Sub MyMacro()
    ' TODO: 添加你的代码

End Sub`

// 高亮后的代码行
const highlightedLines = computed(() => {
  const content = props.code || placeholderCode
  const highlighted = highlightVBA(content)
  return highlighted.split('\n')
})

// 行号 → 积木映射（预计算一次，避免每行渲染时对 mappings 反复线性扫描）
const lineBlockMap = computed(() => {
  const map = new Map<number, { blockId: string; blockLabel: string }>()
  props.mappings?.forEach(m => {
    for (let line = m.lineStart; line <= m.lineEnd; line++) {
      map.set(line, { blockId: m.blockId, blockLabel: m.blockLabel })
    }
  })
  return map
})

// 根据行号获取积木ID
const getBlockIdForLine = (lineNumber: number): string | undefined => {
  return lineBlockMap.value.get(lineNumber)?.blockId
}

// 根据行号获取积木名称
const getBlockLabelForLine = (lineNumber: number): string | undefined => {
  return lineBlockMap.value.get(lineNumber)?.blockLabel
}

// 检查行是否高亮
const isLineHighlighted = (lineNumber: number): boolean => {
  if (!props.highlightedBlockId) return false
  return lineBlockMap.value.get(lineNumber)?.blockId === props.highlightedBlockId
}

// B2-2 校验错误行映射（行号 → 错误消息列表）
const errorLineMap = computed(() => {
  const map = new Map<number, string[]>()
  props.errors?.forEach(err => {
    const list = map.get(err.line) || []
    list.push(err.message)
    map.set(err.line, list)
  })
  return map
})

const lineErrorTitle = (lineNumber: number): string | undefined =>
  errorLineMap.value.get(lineNumber)?.join('\n')

// 点击代码行
const onLineClick = (lineNumber: number) => {
  const blockId = getBlockIdForLine(lineNumber)
  if (blockId) {
    emit('line-click', blockId)
  }
}

// 悬停在代码行上
const onLineHover = (lineNumber: number, event: MouseEvent) => {
  const blockLabel = getBlockLabelForLine(lineNumber)
  if (blockLabel) {
    tooltipText.value = blockLabel
    tooltipVisible.value = true

    // 计算提示框位置
    const container = codeContainerRef.value
    if (container) {
      const containerRect = container.getBoundingClientRect()
      tooltipStyle.value = {
        top: `${event.clientY - containerRect.top + 20}px`,
        left: `${event.clientX - containerRect.left + 10}px`
      }
    }
  }
}

// 隐藏提示
const hideTooltip = () => {
  tooltipVisible.value = false
}

// ==================== P-3 代码搜索 ====================
const searchVisible = ref(false)
const searchQuery = ref('')
const currentMatchIdx = ref(0)
const searchInputRef = ref()

const toggleSearch = () => {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) {
    nextTick(() => searchInputRef.value?.focus())
  } else {
    searchQuery.value = ''
  }
}

const focusSearch = () => {
  searchVisible.value = true
  nextTick(() => searchInputRef.value?.focus())
}
defineExpose({ focusSearch })

// 命中行（剥离语法高亮的 HTML 标签后匹配）
const matchLines = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []
  const out: number[] = []
  highlightedLines.value.forEach((line, i) => {
    const plain = line.replace(/<[^>]*>/g, '')
    if (plain.toLowerCase().includes(query)) out.push(i + 1)
  })
  return out
})

const isSearchHit = (lineNumber: number) => matchLines.value.includes(lineNumber)
const isCurrentMatch = (lineNumber: number) =>
  matchLines.value.length > 0 && matchLines.value[currentMatchIdx.value] === lineNumber

const onSearchInput = () => {
  currentMatchIdx.value = 0
  scrollToCurrentMatch()
}

const gotoMatch = (direction: number) => {
  const total = matchLines.value.length
  if (!total) return
  currentMatchIdx.value = (currentMatchIdx.value + direction + total) % total
  scrollToCurrentMatch()
}

const scrollToCurrentMatch = () => {
  const lineNumber = matchLines.value[currentMatchIdx.value]
  if (!lineNumber || !codeContainerRef.value) return
  nextTick(() => {
    codeContainerRef.value
      ?.querySelector(`[data-line="${lineNumber}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

// 清理
onUnmounted(() => {
  hideTooltip()
})
</script>

<style lang="scss" scoped>
.code-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);

  .el-input {
    width: 220px;
  }

  .search-count {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'JetBrains Mono', monospace;
    white-space: nowrap;
  }
}

.code-container {
  flex: 1;
  overflow: auto;
  padding: 16px 0;
  background: var(--bg-primary);
}

.code-row {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(99, 102, 241, 0.1);
  }

  &.highlighted-line {
    background: rgba(99, 102, 241, 0.2);
    box-shadow: inset 3px 0 0 var(--primary-color);
  }

  // B2-2 校验错误行
  &.error-line {
    background: rgba(239, 68, 68, 0.12);
    box-shadow: inset 3px 0 0 #ef4444;
  }

  // P-3 搜索命中
  &.search-hit {
    background: rgba(250, 204, 21, 0.18);
  }

  &.search-hit-current {
    background: rgba(250, 204, 21, 0.35);
    box-shadow: inset 3px 0 0 #f59e0b;
  }

  .row-number {
    flex-shrink: 0;
    width: 48px;
    padding-right: 12px;
    text-align: right;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    user-select: none;
  }

  .row-content {
    flex: 1;
    min-width: 0;
    white-space: pre;
    padding-right: 16px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-primary);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }
}

// VBA 语法高亮样式
:deep(.vba-keyword) {
  color: #c586c0;
  font-weight: 500;
}

:deep(.vba-function) {
  color: #dcdcaa;
}

:deep(.vba-type) {
  color: #4ec9b0;
}

:deep(.vba-object) {
  color: #4fc1ff;
}

:deep(.vba-string) {
  color: #ce9178;
}

:deep(.vba-number) {
  color: #b5cea8;
}

:deep(.vba-comment) {
  color: #6a9955;
  font-style: italic;
}

:deep(.vba-operator) {
  color: #d4d4d4;
}

// 悬停提示
.block-tooltip {
  position: absolute;
  z-index: 100;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
  pointer-events: none;
  animation: fadeIn 0.15s ease;

  .tooltip-icon {
    color: var(--primary-color);
    font-size: 16px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 浅色主题下的语法高亮
[data-theme='light'] .row-content {
  :deep(.vba-keyword) {
    color: #af00db;
  }

  :deep(.vba-function) {
    color: #795e26;
  }

  :deep(.vba-type) {
    color: #267f99;
  }

  :deep(.vba-object) {
    color: #0070c1;
  }

  :deep(.vba-string) {
    color: #a31515;
  }

  :deep(.vba-number) {
    color: #098658;
  }

  :deep(.vba-comment) {
    color: #008000;
  }

  :deep(.vba-operator) {
    color: #000000;
  }
}
</style>
