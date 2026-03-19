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
      <!-- 收藏分类 -->
      <el-collapse-item name="favorites">
        <template #title>
          <div class="category-title">
            <el-icon class="category-icon" style="color: #fbbf24"><Star /></el-icon>
            <span>收藏</span>
            <span class="category-count">{{ favoriteBlocks.length }}</span>
          </div>
        </template>

        <div v-if="favoriteBlocks.length === 0" class="empty-favorites">
          <el-icon :size="24"><Star /></el-icon>
          <span>暂无收藏积木</span>
          <span class="tip">点击积木右侧星星添加收藏</span>
        </div>

        <div v-else class="block-list">
          <div
            v-for="block in favoriteBlocks"
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
              <span class="block-label" :style="{ color: block.color }">{{ block.label }}</span>
              <span class="block-desc">{{ block.description }}</span>
            </div>
            <el-icon 
              class="favorite-star favorited" 
              @click.stop="favoritesStore.toggleFavorite(block.id)"
            >
              <StarFilled />
            </el-icon>
          </div>
        </div>
      </el-collapse-item>

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
              <span class="block-label" :style="{ color: block.color }">{{ block.label }}</span>
              <span class="block-desc">{{ block.description }}</span>
            </div>
            <el-icon 
              class="favorite-star"
              :class="{ favorited: favoritesStore.isFavorite(block.id) }"
              @click.stop="favoritesStore.toggleFavorite(block.id)"
            >
              <StarFilled v-if="favoritesStore.isFavorite(block.id)" />
              <Star v-else />
            </el-icon>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Star, StarFilled } from '@element-plus/icons-vue'
import { BlockCategory, type BlockDefinition } from '@/types'
import { getBlocksByCategory as getBlocks, getAllBlocks } from '@/utils/blockDefinitions'
import { useFavoritesStore } from '@/stores/favoritesStore'

const props = defineProps<{
  blocks: BlockDefinition[]
}>()

const emit = defineEmits<{
  (e: 'drag-start', block: BlockDefinition, event: DragEvent): void
}>()

const favoritesStore = useFavoritesStore()

const searchQuery = ref('')
const activeCategories = ref(['favorites', 'basic', 'control_flow', 'excel'])

const categories = [
  { id: BlockCategory.BASIC, label: '基础', color: '#6366f1' },
  { id: BlockCategory.CONTROL_FLOW, label: '流程控制', color: '#f59e0b' },
  { id: BlockCategory.EXCEL, label: 'Excel 操作', color: '#10b981' },
  { id: BlockCategory.DATA, label: '数据处理', color: '#3b82f6' },
  { id: BlockCategory.INTERACTION, label: '交互', color: '#ec4899' },
  { id: BlockCategory.FILE, label: '文件操作', color: '#8b5cf6' },
  { id: BlockCategory.ADVANCED, label: '高级', color: '#ef4444' }
]

// 获取收藏的积木
const favoriteBlocks = computed(() => {
  const allBlocks = getAllBlocks()
  return favoritesStore.favorites
    .map(id => allBlocks.find(b => b.id === id))
    .filter((b): b is BlockDefinition => b !== undefined)
})

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

.category-icon {
  font-size: 16px;
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
  gap: 8px;
  padding: 6px 10px;
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

    .favorite-star {
      opacity: 1;
    }
  }

  &:active {
    cursor: grabbing;
  }
}

.block-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.block-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.block-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.block-desc {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-star {
  font-size: 16px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.3;
  transition: all var(--transition-fast);
  flex-shrink: 0;

  &:hover {
    color: #fbbf24;
    transform: scale(1.2);
  }

  &.favorited {
    color: #fbbf24;
    opacity: 1;
  }
}

.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  color: var(--text-muted);
  gap: 8px;
  text-align: center;

  .tip {
    font-size: 11px;
    opacity: 0.7;
  }
}
</style>
