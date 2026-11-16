<template>
  <div class="vba-code-editor">
    <!-- 变量 chips（点击插入到光标处）：声明=绿、未声明引用=红 -->
    <div v-if="variables.length || undeclaredNames.length" class="var-chips">
      <span class="chips-title">变量插入:</span>
      <button
        v-for="v in variables"
        :key="'v-' + v.name"
        type="button"
        class="chip chip-ok"
        :title="`${v.kind} · 点击插入到光标处`"
        @click.prevent="insertText(v.name)"
      >
        {{ v.name }}
      </button>
      <button
        v-for="name in undeclaredNames"
        :key="'u-' + name"
        type="button"
        class="chip chip-warn"
        title="未声明变量 · 点击插入到光标处"
        @click.prevent="insertText(name)"
      >
        {{ name }} ⚠
      </button>
    </div>

    <!-- 骨架速插 -->
    <div class="skeleton-chips">
      <span class="chips-title">骨架:</span>
      <button
        v-for="s in skeletons"
        :key="s.label"
        type="button"
        class="chip chip-skeleton"
        :title="'插入 ' + s.label + ' 骨架'"
        @click.prevent="insertText(s.snippet)"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- 高亮层 + 透明输入层（经典 overlay 方案） -->
    <div class="editor-shell" :style="{ height: shellHeight }">
      <pre
        ref="hlLayer"
        class="hl-layer"
        aria-hidden="true"
        v-html="highlightedHtml"
      ></pre>
      <textarea
        ref="taRef"
        class="input-layer"
        :value="modelValue"
        spellcheck="false"
        wrap="off"
        :rows="rows"
        :placeholder="placeholder"
        @input="onInput"
        @keydown="onKeydown"
        @scroll="syncScroll"
      ></textarea>
    </div>

    <!-- 片段结构配对提示 -->
    <div class="balance-bar" :class="balance.balanced ? 'ok' : 'warn'">
      <span v-if="balance.balanced">✓ 结构配对完整</span>
      <span v-else>⚠ 未闭合结构: {{ balance.openers.join(' × ') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { highlightVBA } from '@/utils/vbaHighlight'
import {
  applySmartEnter,
  insertAtCursor,
  indentSelection,
  countOpenBlocks,
  CODE_SKELETONS
} from '@/utils/vbaEditor'
import type { VariableInfo } from '@/utils/variableScanner'

const props = defineProps<{
  modelValue: string
  variables?: VariableInfo[]
  undeclared?: string[]
  rows?: number
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const skeletons = CODE_SKELETONS
const taRef = ref<HTMLTextAreaElement>()
const hlLayer = ref<HTMLElement>()

const shellHeight = computed(() => `${(props.rows ?? 6) * 19 + 16}px`)

// 高亮 HTML（写侧复用只读预览的 vbaHighlight）
const highlightedHtml = computed(() => highlightVBA(props.modelValue || ''))

// 变量 chips：声明=绿（B1-2 升级为光标插入）；未声明引用=红（B1-3 写侧可视化）
const variables = computed(() => props.variables ?? [])
const undeclaredNames = computed(() => {
  const declared = new Set(variables.value.map(v => v.name.toLowerCase()))
  return [...new Set(props.undeclared ?? [])].filter(n => !declared.has(n.toLowerCase()))
})

// 片段结构配对实时提示
const balance = computed(() => countOpenBlocks(props.modelValue || ''))

const emitValue = (text: string, caret?: number) => {
  emit('update:modelValue', text)
  if (caret !== undefined) {
    nextTick(() => {
      const ta = taRef.value
      if (!ta) return
      ta.selectionStart = ta.selectionEnd = caret
      syncScroll()
    })
  }
}

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

// Tab 缩进 / Shift+Tab 反缩进 / Enter 智能缩进（S-2）
const onKeydown = (e: KeyboardEvent) => {
  const ta = e.target as HTMLTextAreaElement
  if (e.key === 'Tab') {
    e.preventDefault()
    if (ta.selectionStart !== ta.selectionEnd) {
      const r = indentSelection(ta.value, ta.selectionStart, ta.selectionEnd, e.shiftKey ? 'out' : 'in')
      emitValue(r.text, r.caret)
    } else {
      const r = insertAtCursor(ta.value, ta.selectionStart, ta.selectionEnd, '    ')
      emitValue(r.text, r.caret)
    }
    return
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault()
    const r = applySmartEnter(ta.value, ta.selectionStart)
    emitValue(r.text, r.caret)
  }
}

// chips / 骨架插入到光标处（S-3/S-4）
const insertText = (text: string) => {
  const ta = taRef.value
  if (!ta) return
  const r = insertAtCursor(ta.value, ta.selectionStart, ta.selectionEnd, text)
  emitValue(r.text, r.caret)
  ta.focus()
}

// 高亮层与输入层滚动同步
const syncScroll = () => {
  const ta = taRef.value
  const hl = hlLayer.value
  if (ta && hl) {
    hl.scrollTop = ta.scrollTop
    hl.scrollLeft = ta.scrollLeft
  }
}

// 外部值变化（重命名联动/恢复模板）后保持光标合理
watch(() => props.modelValue, () => {
  nextTick(syncScroll)
})
</script>

<style lang="scss" scoped>
.vba-code-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.var-chips,
.skeleton-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;

  .chips-title {
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
}

.chip {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: all var(--transition-fast);

  &.chip-ok {
    color: var(--primary-color);
    border-color: var(--primary-color);

    &:hover {
      background: rgba(16, 185, 129, 0.1);
    }
  }

  &.chip-warn {
    color: #ef4444;
    border-color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }

  &.chip-skeleton {
    color: var(--text-secondary);

    &:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
  }
}

.editor-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);

  &:focus-within {
    border-color: var(--primary-color);
  }
}

.hl-layer,
.input-layer {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 8px;
  border: 0;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre;
  overflow: auto;
  tab-size: 4;
}

.hl-layer {
  pointer-events: none;
  color: var(--text-primary);
  z-index: 1;
  word-break: break-all;
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;

  :deep(.vba-keyword) { color: #c586c0; font-weight: 500; }
  :deep(.vba-string) { color: #ce9178; }
  :deep(.vba-comment) { color: #6a9955; font-style: italic; }
  :deep(.vba-number) { color: #b5cea8; }
  :deep(.vba-function) { color: #dcdcaa; }
}

.input-layer {
  z-index: 2;
  background: transparent;
  color: transparent;
  caret-color: var(--text-primary);
  resize: none;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  outline: none;

  &::placeholder {
    color: var(--text-muted);
  }

  &::selection {
    background: rgba(99, 102, 241, 0.35);
  }
}

.balance-bar {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);

  &.ok {
    color: #10b981;
  }

  &.warn {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.08);
  }
}
</style>
