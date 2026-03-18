<template>
  <div class="block-toolbox">
    <div class="toolbox-header">
      <h3>积木工具箱</h3>
      <el-input
        v-model="searchQuery"
        placeholder="搜索积木..."
        :prefix-icon="Search"
        size="small"
        clearable
      />
    </div>

    <el-collapse v-model="activeCategories" class="category-collapse">
      <el-collapse-item
        v-for="category in categories"
        :key="category.id"
        :name="category.id"
      >
        <template #title>
          <div class="category-title">
            <span class="category-dot" :style="{ background: category.color }"></span>
            <span>{{ category.label }}</span>
            <span class="category-count">{{ getBlocksByCategory(category.id).length }}</span>
          </div>
        </template>

        <div class="block-list">
          <div
            v-for="block in getBlocksByCategory(category.id)"
            :key="block.id"
            class="block-item"
            :style="{ borderLeftColor: block.color }"
            draggable="true"
            @dragstart="onDragStart($event, block)"
            @dragend="onDragEnd"
          >
            <el-icon class="block-icon" :style="{ color: block.color }">
              <component :is="block.icon" />
            </el-icon>
            <div class="block-info">
              <span class="block-label">{{ block.label }}</span>
              <span class="block-desc">{{ block.description }}</span>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { BlockCategory, type BlockDefinition } from '@/types'
import { getBlocksByCategory as getBlocks } from '@/utils/blockDefinitions'

const props = defineProps<{
  blocks: BlockDefinition[]
}>()

const emit = defineEmits<{
  (e: 'drag-start', block: BlockDefinition, event: DragEvent): void
}>()

const searchQuery = ref('')
const activeCategories = ref(['basic', 'control_flow', 'excel'])

const categories = [
  { id: BlockCategory.BASIC, label: '基础', color: '#6366f1' },
  { id: BlockCategory.CONTROL_FLOW, label: '流程控制', color: '#f59e0b' },
  { id: BlockCategory.EXCEL, label: 'Excel 操作', color: '#10b981' },
  { id: BlockCategory.DATA, label: '数据处理', color: '#3b82f6' },
  { id: BlockCategory.INTERACTION, label: '交互', color: '#ec4899' },
  { id: BlockCategory.FILE, label: '文件操作', color: '#8b5cf6' },
  { id: BlockCategory.ADVANCED, label: '高级', color: '#ef4444' }
]

const getBlocksByCategory = (categoryId: BlockCategory) => {
  let blocks = getBlocks(categoryId)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    blocks = blocks.filter(
      b => b.label.toLowerCase().includes(query) ||
           b.description.toLowerCase().includes(query)
    )
  }
  return blocks
}

const onDragStart = (event: DragEvent, block: BlockDefinition) => {
  event.dataTransfer?.setData('blockId', block.id)
  event.dataTransfer?.setData('blockType', block.type)
  event.dataTransfer!.effectAllowed = 'copy'
  emit('drag-start', block, event)
}

const onDragEnd = () => {
  // 拖拽结束处理
}
</script>

<style lang="scss" scoped>
.block-toolbox {
  width: 260px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbox-header {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 10px;
  }
}

.category-collapse {
  flex: 1;
  overflow-y: auto;
  border: none;

  :deep(.el-collapse-item__header) {
    height: 36px;
    line-height: 36px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 13px;
    padding: 0 12px;

    &:hover {
      background: var(--bg-card);
    }
  }

  :deep(.el-collapse-item__wrap) {
    background: transparent;
    border-bottom: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 8px;
  }
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.category-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-card);
  padding: 2px 8px;
  border-radius: 10px;
}

.block-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left-width: 3px;
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
    transform: translateX(4px);
    box-shadow: var(--shadow-sm);
  }

  &:active {
    cursor: grabbing;
  }
}

.block-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.block-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.block-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.block-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
