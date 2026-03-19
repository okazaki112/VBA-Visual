<template>
  <div class="code-preview">
    <div class="preview-header">
      <span class="preview-title">生成的 VBA 代码</span>
      <div class="preview-actions">
        <el-button size="small" :icon="CopyDocument" @click="$emit('copy')">
          复制
        </el-button>
        <el-button size="small" :icon="Download" @click="$emit('export')">
          导出
        </el-button>
      </div>
    </div>

    <div class="code-container" ref="codeContainerRef">
      <div class="line-numbers">
        <span 
          v-for="(_line, n) in codeLines" 
          :key="n"
          :data-line="n + 1"
          :data-block-id="getBlockIdForLine(n + 1)"
          :class="{ 'highlighted-line': isLineHighlighted(n + 1) }"
          @click="onLineClick(n + 1)"
        >{{ n + 1 }}</span>
      </div>
      <pre class="code-content">
        <code>
          <div 
            v-for="(line, n) in highlightedLines" 
            :key="n"
            class="code-line"
            :data-line="n + 1"
            :data-block-id="getBlockIdForLine(n + 1)"
            :class="{ 'highlighted-line': isLineHighlighted(n + 1) }"
            @click="onLineClick(n + 1)"
            @mouseenter="onLineHover(n + 1, $event)"
            @mouseleave="hideTooltip"
            v-html="line"
          ></div>
        </code>
      </pre>
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
import { ref, computed, onUnmounted } from 'vue'
import { CopyDocument, Download, ElementPlus } from '@element-plus/icons-vue'
import { highlightVBA } from '@/utils/vbaHighlight'
import type { CodeMapping } from '@/utils/codeGenerator'

const props = defineProps<{
  code: string
  mappings?: CodeMapping[]
  highlightedBlockId?: string | null
}>()

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'export'): void
  (e: 'line-click', blockId: string): void
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

// 将代码分割成行
const codeLines = computed(() => {
  const content = props.code || placeholderCode
  return content.split('\n')
})

// 高亮后的代码行
const highlightedLines = computed(() => {
  const content = props.code || placeholderCode
  const highlighted = highlightVBA(content)
  return highlighted.split('\n')
})

// 根据行号获取积木ID
const getBlockIdForLine = (lineNumber: number): string | undefined => {
  if (!props.mappings) return undefined
  const mapping = props.mappings.find(
    m => lineNumber >= m.lineStart && lineNumber <= m.lineEnd
  )
  return mapping?.blockId
}

// 根据行号获取积木名称
const getBlockLabelForLine = (lineNumber: number): string | undefined => {
  if (!props.mappings) return undefined
  const mapping = props.mappings.find(
    m => lineNumber >= m.lineStart && lineNumber <= m.lineEnd
  )
  return mapping?.blockLabel
}

// 检查行是否高亮
const isLineHighlighted = (lineNumber: number): boolean => {
  if (!props.highlightedBlockId || !props.mappings) return false
  const mapping = props.mappings.find(
    m => lineNumber >= m.lineStart && lineNumber <= m.lineEnd
  )
  return mapping?.blockId === props.highlightedBlockId
}

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

.code-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-primary);
}

.line-numbers {
  padding: 16px 12px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  text-align: right;
  user-select: none;

  span {
    display: block;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    cursor: pointer;
    padding: 0 4px;
    border-radius: 2px;
    transition: background 0.15s;

    &:hover {
      background: var(--bg-card);
      color: var(--text-secondary);
    }

    &.highlighted-line {
      background: rgba(99, 102, 241, 0.3);
      color: var(--primary-light);
    }
  }
}

.code-content {
  flex: 1;
  padding: 16px;
  margin: 0;
  overflow: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  background: transparent;

  code {
    white-space: pre;
    display: block;
  }

  .code-line {
    display: block;
    padding: 0 8px;
    border-radius: 2px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: rgba(99, 102, 241, 0.1);
    }

    &.highlighted-line {
      background: rgba(99, 102, 241, 0.2);
      border-left: 3px solid var(--primary-color);
      margin-left: -3px;
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
[data-theme='light'] .code-content {
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