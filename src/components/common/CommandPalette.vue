<template>
  <el-dialog
    v-model="visible"
    width="580px"
    :show-close="false"
    top="8vh"
    class="command-palette-dialog"
    @opened="onOpened"
  >
    <el-input
      ref="inputRef"
      v-model="query"
      size="large"
      placeholder="搜索命令 / 积木 / 模板 / 画布积木…（↑↓ 选择，回车执行）"
      :prefix-icon="Search"
      @keydown="onKeydown"
    />

    <div class="cmd-groups">
      <template v-if="flatCommands.length">
        <div v-for="group in filteredGroups" :key="group.title" class="cmd-group">
          <h5 class="group-title">{{ group.title }}</h5>
          <div
            v-for="cmd in group.items"
            :key="cmd.key"
            class="cmd-item"
            :class="{ active: cmd.key === activeKey }"
            @click="run(cmd)"
            @mousemove="activeKey = cmd.key"
          >
            <el-icon class="cmd-icon"><component :is="cmd.icon" /></el-icon>
            <span class="cmd-label">{{ cmd.label }}</span>
            <span v-if="cmd.hint" class="cmd-hint">{{ cmd.hint }}</span>
          </div>
        </div>
      </template>
      <div v-else class="cmd-empty">未找到匹配项</div>
    </div>

    <div class="cmd-footer">Enter 执行 · ↑↓ 切换 · Esc 关闭</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { blockDefinitions } from '@/utils/blockDefinitions'
import { projectTemplates } from '@/assets/templates/projectTemplates'
import { useBlockStore } from '@/stores/blockStore'

export interface PaletteCommand {
  key: string
  type: 'block' | 'template' | 'action' | 'locate'
  label: string
  hint?: string
  icon: string
  payload?: string
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'execute', command: PaletteCommand): void
}>()

const blockStore = useBlockStore()
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const ACTION_COMMANDS: PaletteCommand[] = [
  { key: 'a-save', type: 'action', label: '保存项目', hint: 'Ctrl+S', icon: 'DocumentChecked', payload: 'save' },
  { key: 'a-load', type: 'action', label: '打开项目', icon: 'FolderOpened', payload: 'load' },
  { key: 'a-import', type: 'action', label: '导入 VBA 代码', icon: 'Upload', payload: 'import-code' },
  { key: 'a-export-code', type: 'action', label: '导出 VBA 代码', icon: 'Download', payload: 'export-code' },
  { key: 'a-export-png', type: 'action', label: '导出为 PNG 图片', icon: 'Download', payload: 'export-png' },
  { key: 'a-export-svg', type: 'action', label: '导出为 SVG 图片', icon: 'Download', payload: 'export-svg' },
  { key: 'a-layout-tb', type: 'action', label: '自动排版：从上到下', icon: 'SortDown', payload: 'layout-tb' },
  { key: 'a-layout-lr', type: 'action', label: '自动排版：从左到右', icon: 'DArrowRight', payload: 'layout-lr' },
  { key: 'a-layout-grid', type: 'action', label: '自动排版：网格 3 列', icon: 'Grid', payload: 'layout-grid' },
  { key: 'a-zoom-fit', type: 'action', label: '适应画布', icon: 'FullScreen', payload: 'zoom-fit' },
  { key: 'a-zoom-reset', type: 'action', label: '重置缩放', icon: 'FullScreen', payload: 'zoom-reset' },
  { key: 'a-search', type: 'action', label: '搜索画布积木', icon: 'Search', payload: 'search-block' },
  { key: 'a-minimap', type: 'action', label: '显示/隐藏小地图', icon: 'MapLocation', payload: 'toggle-minimap' },
  { key: 'a-clear', type: 'action', label: '清空画布', icon: 'Delete', payload: 'clear' }
]

const blockCommands = computed<PaletteCommand[]>(() =>
  blockDefinitions.map(def => ({
    key: 'b-' + def.id,
    type: 'block' as const,
    label: def.label,
    hint: def.category === 'excel' ? 'Excel' : def.description,
    icon: def.icon,
    payload: def.id
  }))
)

const templateCommands = computed<PaletteCommand[]>(() =>
  projectTemplates.map(tpl => ({
    key: 't-' + tpl.id,
    type: 'template' as const,
    label: '模板：' + tpl.name,
    hint: tpl.description,
    icon: tpl.icon,
    payload: tpl.id
  }))
)

const canvasCommands = computed<PaletteCommand[]>(() =>
  blockStore.blocks.map(block => ({
    key: 'c-' + block.id,
    type: 'locate' as const,
    label: `#${block.order} ${block.definitionId.replace('block-', '')}`,
    hint: '画布积木定位',
    icon: 'Location',
    payload: block.id
  }))
)

const filteredGroups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const groups = [
    { title: '画布动作', items: ACTION_COMMANDS },
    { title: '载入模板', items: templateCommands.value },
    { title: '画布积木定位', items: canvasCommands.value },
    { title: '插入积木', items: blockCommands.value }
  ]
  return groups
    .map(g => ({
      title: g.title,
      items: (q ? g.items.filter(c => c.label.toLowerCase().includes(q)) : g.items).slice(0, 8)
    }))
    .filter(g => g.items.length > 0)
})

const flatCommands = computed(() => filteredGroups.value.flatMap(g => g.items))

const activeKey = computed(() => flatCommands.value[activeIndex.value]?.key ?? '')

const onOpened = () => {
  query.value = ''
  activeIndex.value = 0
  nextTick(() => inputRef.value?.focus())
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (flatCommands.value.length) {
      activeIndex.value = (activeIndex.value + 1) % flatCommands.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (flatCommands.value.length) {
      activeIndex.value = (activeIndex.value - 1 + flatCommands.value.length) % flatCommands.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const cmd = flatCommands.value[activeIndex.value]
    if (cmd) run(cmd)
  } else {
    // 输入变化时重置选中项
    nextTick(() => { activeIndex.value = 0 })
  }
}

const run = (cmd: PaletteCommand) => {
  visible.value = false
  emit('execute', cmd)
}
</script>

<style lang="scss" scoped>
.cmd-groups {
  max-height: 46vh;
  overflow-y: auto;
  margin-top: 10px;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 10px 0 4px;
  padding: 0 4px;
  text-transform: uppercase;
}

.cmd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);

  &.active {
    background: var(--bg-tertiary);

    .cmd-icon {
      color: var(--primary-color);
    }
  }

  .cmd-icon {
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .cmd-label {
    font-size: 13px;
    color: var(--text-primary);
  }

  .cmd-hint {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-muted);
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.cmd-empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.cmd-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}
</style>
