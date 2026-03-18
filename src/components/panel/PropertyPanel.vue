<template>
  <div class="property-panel">
    <div v-if="selectedNode" class="property-content">
      <div class="property-header">
        <el-icon class="block-icon" :style="{ color: blockDefinition?.color }">
          <component :is="blockDefinition?.icon" />
        </el-icon>
        <div class="block-title">
          <h4>{{ blockDefinition?.label }}</h4>
          <span>{{ blockDefinition?.description }}</span>
        </div>
      </div>

      <el-divider />

      <!-- 执行顺序控制 -->
      <div class="order-control">
        <label class="property-label">执行顺序</label>
        <div class="order-input-group">
          <div class="order-display">
            <span class="order-current">{{ selectedNode.order }}</span>
            <span class="order-separator">/</span>
            <span class="order-total">{{ totalBlocks }}</span>
          </div>
        </div>
        <div class="sort-mode-badge">
          <el-icon><Connection v-if="isConnectionMode" /><Location v-else /></el-icon>
          <span>{{ sortModeText }}</span>
        </div>
      </div>

      <el-divider />

      <!-- 编辑代码按钮 -->
      <div class="code-edit-section">
        <el-button 
          type="primary" 
          size="small" 
          @click="editCode"
          class="edit-code-btn"
        >
          <el-icon><Edit /></el-icon>
          编辑代码
        </el-button>
      </div>

      <el-divider />

      <div class="property-list">
        <div
          v-for="prop in blockDefinition?.properties"
          :key="prop.id"
          class="property-item"
        >
          <label class="property-label">{{ prop.label }}</label>

          <!-- 文本输入 -->
          <el-input
            v-if="prop.type === 'text'"
            v-model="localProperties[prop.id]"
            :placeholder="prop.placeholder"
            size="small"
            @input="onPropertyChange(prop.id, $event)"
          />

          <!-- 数字输入 -->
          <el-input-number
            v-else-if="prop.type === 'number'"
            v-model="localProperties[prop.id]"
            :min="prop.validation?.min"
            :max="prop.validation?.max"
            size="small"
            controls-position="right"
            @change="onPropertyChange(prop.id, $event)"
          />

          <!-- 下拉选择 -->
          <el-select
            v-else-if="prop.type === 'select'"
            v-model="localProperties[prop.id]"
            size="small"
            @change="onPropertyChange(prop.id, $event)"
          >
            <el-option
              v-for="opt in prop.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- 表达式输入 -->
          <el-input
            v-else-if="prop.type === 'expression'"
            v-model="localProperties[prop.id]"
            :placeholder="prop.placeholder"
            size="small"
            @input="onPropertyChange(prop.id, $event)"
          >
            <template #prefix>
              <span class="expr-prefix">fx</span>
            </template>
          </el-input>

          <!-- 布尔值 -->
          <el-switch
            v-else-if="prop.type === 'boolean'"
            v-model="localProperties[prop.id]"
            @change="onPropertyChange(prop.id, $event)"
          />

          <!-- 代码输入（多行） -->
          <el-input
            v-else-if="prop.type === 'code'"
            v-model="localProperties[prop.id]"
            type="textarea"
            :rows="5"
            :placeholder="prop.placeholder"
            @input="onPropertyChange(prop.id, $event)"
          />
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-icon :size="48"><Select /></el-icon>
      <p>选择一个积木块以编辑属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Select, Connection, Location, Edit } from '@element-plus/icons-vue'
import type { BlockInstance, BlockDefinition } from '@/types'
import { getBlockDefinition } from '@/utils/blockDefinitions'
import { useBlockStore } from '@/stores/blockStore'

const props = defineProps<{
  selectedNode: BlockInstance | null
}>()

const emit = defineEmits<{
  (e: 'update', propertyId: string, value: unknown): void
  (e: 'editCode'): void
}>()

const blockStore = useBlockStore()
const localProperties = ref<Record<string, unknown>>({})

const blockDefinition = computed<BlockDefinition | null>(() => {
  if (!props.selectedNode) return null
  return getBlockDefinition(props.selectedNode.definitionId)
})

const totalBlocks = computed(() => blockStore.maxOrder)

// 排序模式相关
const isConnectionMode = computed(() => blockStore.sortMode === 'connection')

const sortModeText = computed(() => {
  return blockStore.sortMode === 'connection' ? '按连线排序' : '按位置排序'
})

// 监听选中节点变化，更新本地属性
watch(
  () => props.selectedNode,
  (node) => {
    if (node) {
      localProperties.value = { ...node.properties }
    } else {
      localProperties.value = {}
    }
  },
  { immediate: true }
)

// 监听选中节点属性变化（编辑代码后属性会更新）
watch(
  () => props.selectedNode?.properties,
  (properties) => {
    if (properties) {
      localProperties.value = { ...properties }
    }
  },
  { deep: true }
)

const onPropertyChange = (propertyId: string, value: unknown) => {
  emit('update', propertyId, value)
}

const editCode = () => {
  emit('editCode')
}
</script>

<style lang="scss" scoped>
.property-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.property-content {
  padding: 16px;
  overflow-y: auto;
}

.property-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.block-icon {
  font-size: 32px;
}

.block-title {
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
  }

  span {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.order-control {
  margin-bottom: 8px;
}

.order-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.order-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 8px 20px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  min-width: 80px;
  justify-content: center;
}

.order-current {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.order-separator {
  font-size: 16px;
  color: var(--text-muted);
}

.order-total {
  font-size: 16px;
  color: var(--text-secondary);
}

.sort-mode-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-secondary);

  .el-icon {
    font-size: 14px;
    color: var(--primary-color);
  }
}

.code-edit-section {
  display: flex;
  justify-content: center;
}

.edit-code-btn {
  .el-icon {
    margin-right: 6px;
  }
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.expr-prefix {
  font-family: monospace;
  font-weight: 600;
  color: var(--primary-color);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 12px;

  p {
    font-size: 14px;
  }
}
</style>
