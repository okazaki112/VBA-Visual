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

      <!-- R-3 Option Explicit 一键补齐 -->
      <el-alert v-if="suggestOption" type="info" :closable="false" class="undeclared-alert">
        <template #title>
          画布已使用变量，建议启用强制声明模式
        </template>
        <el-button size="small" type="primary" @click="$emit('add-option')">
          插入 Option Explicit
        </el-button>
      </el-alert>

      <!-- B1-3 未声明引用警告（非阻断）+ R-2 一键声明 -->
      <el-alert
        v-if="selectedBlockWarnings.length"
        type="warning"
        :closable="false"
        class="undeclared-alert"
      >
        <template #title>
          引用未声明变量（点击「声明」自动补齐）：
        </template>
        <div
          v-for="w in selectedBlockWarnings"
          :key="w.propName + w.identifier"
          class="warning-row"
        >
          <span class="warning-name">{{ w.identifier }}</span>
          <el-button
            size="small"
            text
            type="primary"
            @click="$emit('declare-variable', w.identifier, w.blockId)"
          >
            声明
          </el-button>
        </div>
      </el-alert>

      <!-- I-3 循环方向自动适配 -->
      <el-alert v-if="reverseLoopHint" type="warning" :closable="false" class="undeclared-alert">
        <template #title>
          起点大于终点且步长为正，循环体不会执行
        </template>
        <el-button size="small" type="primary" @click="onFixReverseLoop">
          补 Step -1
        </el-button>
      </el-alert>

      <!-- v1.6.0 双体容器：分支归属切换（仅 If-Else 容器的子积木显示） -->
      <div v-if="showBranchSwitch" class="branch-switch">
        <label class="property-label">分支归属</label>
        <el-radio-group
          :model-value="currentSlot"
          size="small"
          @change="onSetBranch"
        >
          <el-radio-button value="then">Then 体</el-radio-button>
          <el-radio-button value="else">Else 体</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 执行顺序控制 -->
      <div class="order-control">
        <label class="property-label">执行顺序</label>
        <div class="order-input-group">
          <el-button
            size="small"
            circle
            :icon="ArrowUp"
            :disabled="!canMoveUp"
            title="上移"
            @click="$emit('move-up')"
          />
          <div class="order-display">
            <span class="order-current">{{ selectedNode.order }}</span>
            <span class="order-separator">/</span>
            <span class="order-total">{{ totalBlocks }}</span>
          </div>
          <el-button
            size="small"
            circle
            :icon="ArrowDown"
            :disabled="!canMoveDown"
            title="下移"
            @click="$emit('move-down')"
          />
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
        <el-tag v-if="hasCustomCode" type="warning" size="small">已自定义</el-tag>
        <el-button
          v-if="hasCustomCode"
          size="small"
          text
          type="danger"
          @click="$emit('restore-template')"
        >
          恢复模板
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

          <!-- 变量类文本输入：自动补全已声明变量（B1-2）+ I-1 即时校验 -->
          <div v-if="prop.type === 'text' && isVariableField(prop.id)" class="var-field">
            <el-autocomplete
              v-model="localProperties[prop.id]"
              :fetch-suggestions="queryVariables"
              value-key="value"
              :placeholder="prop.placeholder"
              size="small"
              clearable
              hide-loading
              :class="{ 'invalid-input': isVarNameInvalid(localProperties[prop.id]) }"
              @select="onVarSelect(prop.id, $event)"
              @input="onPropertyChange(prop.id, $event)"
            />
            <div v-if="isVarNameInvalid(localProperties[prop.id])" class="field-error">
              变量名只能由字母/数字/下划线组成，且以字母开头
            </div>
          </div>

          <!-- 文本输入 -->
          <el-input
            v-else-if="prop.type === 'text'"
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

          <!-- 表达式输入：后缀下拉一键插入变量/常用模板（B1-2 / B3-1） -->
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
            <template #suffix>
              <el-dropdown
                trigger="click"
                @command="(cmd: string) => onInsertSuggestion(prop.id, cmd)"
              >
                <el-icon class="insert-btn" title="插入变量 / 常用模板"><ArrowDown /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="variables.length">
                      <div class="dropdown-hint">插入变量</div>
                      <el-dropdown-item
                        v-for="v in variables"
                        :key="'v-' + v.name"
                        :command="v.name"
                      >
                        {{ v.name }}
                      </el-dropdown-item>
                    </template>
                    <template v-if="prop.id === 'condition'">
                      <div class="dropdown-hint">运算符（I-2 条件速填）</div>
                      <el-dropdown-item
                        v-for="op in conditionOperators"
                        :key="op"
                        :command="op"
                      >
                        {{ op.trim() }}
                      </el-dropdown-item>
                    </template>
                    <template v-if="isExcelBlock">
                      <div class="dropdown-hint">常用模板</div>
                      <el-dropdown-item
                        v-for="tpl in excelTemplates"
                        :key="tpl"
                        :command="tpl"
                      >
                        {{ tpl }}
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-input>

          <!-- 布尔值 -->
          <el-switch
            v-else-if="prop.type === 'boolean'"
            v-model="localProperties[prop.id]"
            @change="onPropertyChange(prop.id, $event)"
          />

          <!-- 代码输入（v1.10.0：高亮+智能缩进+变量 chips+骨架速插+配对提示） -->
          <VbaCodeEditor
            v-else-if="prop.type === 'code'"
            :model-value="String(localProperties[prop.id] ?? '')"
            :variables="variables"
            :undeclared="selectedBlockWarnings.map(w => w.identifier)"
            :rows="6"
            :placeholder="prop.placeholder"
            @update:model-value="onPropertyChange(prop.id, $event)"
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
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Select, Connection, Location, Edit, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import type { BlockInstance, BlockDefinition } from '@/types'
import { getBlockDefinition } from '@/utils/blockDefinitions'
import { useBlockStore } from '@/stores/blockStore'
import { normalizeVarName, type VariableInfo, type UndeclaredWarning } from '@/utils/variableScanner'
import VbaCodeEditor from '@/components/panel/VbaCodeEditor.vue'

const props = defineProps<{
  selectedNode: BlockInstance | null
  variables: VariableInfo[]
  undeclaredWarnings: UndeclaredWarning[]
  suggestOption?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', nodeId: string, propertyId: string, value: unknown): void
  (e: 'editCode'): void
  (e: 'move-up'): void
  (e: 'move-down'): void
  (e: 'restore-template'): void
  (e: 'declare-variable', identifier: string, blockId: string): void
  (e: 'add-option'): void
  (e: 'set-parent-slot', nodeId: string, slot: string): void
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

// 执行顺序上下移可用性
const canMoveUp = computed(() => (props.selectedNode?.order ?? 0) > 1)
const canMoveDown = computed(() => (props.selectedNode?.order ?? 0) < totalBlocks.value)

// 当前积木是否被自定义代码覆盖（覆盖时属性改动不影响生成代码）
const hasCustomCode = computed(() => {
  const code = props.selectedNode?.properties?._customCode
  return typeof code === 'string' && code.trim().length > 0
})

// ==================== B 线规则智能 ====================
// 视为变量引用的属性字段（自动补全用）
const VARIABLE_FIELD_IDS = ['varName', 'constName', 'counter', 'element', 'keyVar', 'dictName', 'chartName', 'pivotName', 'regexName']
const isVariableField = (propId: string) => VARIABLE_FIELD_IDS.includes(propId)

// B1-2 变量建议列表
const queryVariables = (
  queryString: string,
  cb: (items: Array<{ value: string; kind: string }>) => void
) => {
  const q = queryString.trim().toLowerCase()
  const all = props.variables.map(v => ({ value: v.name, kind: v.kind }))
  cb(q ? all.filter(item => item.value.toLowerCase().includes(q)) : all)
}

const onVarSelect = (propId: string, item: { value: string }) => {
  onPropertyChange(propId, item.value)
}

// B1-3 当前选中积木的未声明引用
const selectedBlockWarnings = computed(() =>
  props.selectedNode
    ? props.undeclaredWarnings.filter(w => w.blockId === props.selectedNode!.id)
    : []
)

// v1.6.0 双体容器：父容器为 If-Else 时显示分支归属切换
const parentContainerDef = computed(() => {
  const pid = props.selectedNode?.parentId
  if (!pid) return null
  const parentBlock = blockStore.getBlockById(pid)
  return parentBlock ? getBlockDefinition(parentBlock.definitionId) : null
})
const showBranchSwitch = computed(() => parentContainerDef.value?.id === 'block-if-else-statement')
const currentSlot = computed(() => (props.selectedNode?.parentSlot === 'else' ? 'else' : 'then'))
const onSetBranch = (slot: string | number | boolean | undefined) => {
  if (!props.selectedNode) return
  emit('set-parent-slot', props.selectedNode.id, slot === 'else' ? 'else' : 'then')
}

// I-1 变量名即时校验（空值不标红，属初始态）
const isVarNameInvalid = (value: unknown): boolean => {
  const name = normalizeVarName(String(value ?? ''))
  if (!name) return false
  return !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
}

// I-2 条件表达式运算符速填
const conditionOperators = ['=', '<>', '>=', '<', '>', 'And', 'Or', 'Not', 'Mod']

// I-3 循环方向检测（For 积木：数字起止方向矛盾）
const reverseLoopHint = computed(() => {
  const node = props.selectedNode
  if (!node || node.definitionId !== 'block-for-loop') return false
  const start = Number(node.properties.start)
  const end = Number(node.properties.end)
  const stepRaw = node.properties.step
  const step = Number(stepRaw === undefined || stepRaw === '' ? 1 : stepRaw)
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step)) return false
  return (start > end && step > 0) || (start < end && step < 0)
})

const onFixReverseLoop = () => {
  if (!props.selectedNode) return
  const node = props.selectedNode
  const start = Number(node.properties.start)
  const end = Number(node.properties.end)
  emit('update', node.id, 'step', start > end ? -1 : 1)
}

// B3-1 Excel 积木的常用表达式模板
const isExcelBlock = computed(() => blockDefinition.value?.category === 'excel')
const excelTemplates = [
  'Range("A1").Value',
  'Cells(1, 1).Value',
  'ActiveSheet.Name',
  'ThisWorkbook.Worksheets(1)',
  'Selection.Copy'
]

// 追加插入到表达式末尾
const onInsertSuggestion = (propId: string, text: string) => {
  const current = String(localProperties.value[propId] ?? '').trimEnd()
  localProperties.value[propId] = current ? `${current} ${text}` : text
  onPropertyChange(propId, localProperties.value[propId])
}

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

// ==================== 属性更新防抖 ====================
// 连续输入合并为一次更新；记录目标积木 ID，切换选中后不会误写到新积木
const pendingTargetNodeId = ref<string | null>(null)
const pendingUpdates = new Map<string, unknown>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const flushPendingUpdates = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  const nodeId = pendingTargetNodeId.value
  if (!nodeId) return
  pendingUpdates.forEach((value, key) => emit('update', nodeId, key, value))
  pendingUpdates.clear()
  pendingTargetNodeId.value = null
}

const onPropertyChange = (propertyId: string, value: unknown) => {
  if (!props.selectedNode) return
  // 目标积木变化时，先提交上一个积木的未落盘修改
  if (pendingTargetNodeId.value && pendingTargetNodeId.value !== props.selectedNode.id) {
    flushPendingUpdates()
  }
  pendingTargetNodeId.value = props.selectedNode.id
  pendingUpdates.set(propertyId, value)
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(flushPendingUpdates, 300)
}

// 卸载前提交未落盘的修改
onBeforeUnmount(flushPendingUpdates)

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
  gap: 10px;
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
  align-items: center;
  justify-content: center;
  gap: 10px;
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

.insert-btn {
  cursor: pointer;
  color: var(--text-secondary);

  &:hover {
    color: var(--primary-color);
  }
}

.undeclared-alert {
  margin-bottom: 8px;
}

.branch-switch {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dropdown-hint {
  padding: 4px 16px;
  font-size: 11px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}

.var-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .el-autocomplete {
    width: 100%;
  }
}

.field-error {
  font-size: 11px;
  color: #ef4444;
}

.invalid-input {
  :deep(.el-input__inner),
  :deep(.el-input__wrapper) {
    color: #ef4444;
    box-shadow: 0 0 0 1px #ef4444 inset;
  }
}

.warning-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 0;

  .warning-name {
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
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
