<template>
  <div class="variable-panel">
    <!-- 智能检查：未使用 / 重复声明 / 循环边界 -->
    <div class="panel-section">
      <h4 class="section-title">智能检查</h4>

      <div v-if="!hasIssues" class="all-clear">
        <el-icon><CircleCheck /></el-icon>
        <span>未发现变量问题</span>
      </div>

      <div v-else class="issue-list">
        <div
          v-for="warning in loopBoundWarnings"
          :key="'loop-' + warning.blockId"
          class="issue-item"
          @click="$emit('locate', warning.blockId)"
        >
          <el-icon class="issue-icon"><Warning /></el-icon>
          <span class="issue-text">{{ warning.message }}</span>
          <el-button size="small" text type="primary">定位</el-button>
        </div>

        <div
          v-for="dup in duplicateDeclarations"
          :key="'dup-' + dup.name"
          class="issue-item"
          @click="$emit('locate', dup.blocks[0])"
        >
          <el-icon class="issue-icon"><Warning /></el-icon>
          <span class="issue-text">变量「{{ dup.name }}」被声明 {{ dup.blocks.length }} 次</span>
          <el-button size="small" text type="primary">定位</el-button>
        </div>

        <div
          v-for="v in unusedVariables"
          :key="'unused-' + v.sourceBlockId + v.name"
          class="issue-item"
          @click="$emit('locate', v.sourceBlockId)"
        >
          <el-icon class="issue-icon"><Remove /></el-icon>
          <span class="issue-text">变量「{{ v.name }}」声明后未使用</span>
          <el-button size="small" text type="primary">定位</el-button>
        </div>
      </div>
    </div>

    <!-- 变量总览表 -->
    <div class="panel-section">
      <h4 class="section-title">变量（{{ tableRows.length }}）</h4>
      <el-table
        v-if="tableRows.length"
        :data="tableRows"
        size="small"
        class="variable-table"
        @row-click="onRowClick"
      >

        <el-table-column prop="name" label="名称" min-width="90" />
        <el-table-column prop="kindLabel" label="类别" width="70" />
        <el-table-column prop="refCount" label="引用" width="60" />
        <el-table-column label="操作" width="60">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click.stop="$emit('locate', row.sourceBlockId)">
              定位
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty-hint">画布上还没有变量（拖入变量声明/赋值积木后自动收集）</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, Warning, Remove } from '@element-plus/icons-vue'
import type { VariableInfo, VariableOccurrence, DuplicateDeclaration, LoopBoundWarning } from '@/utils/variableScanner'

const props = defineProps<{
  declarations: VariableInfo[]
  occurrences: VariableOccurrence[]
  unusedVariables: VariableInfo[]
  duplicateDeclarations: DuplicateDeclaration[]
  loopBoundWarnings: LoopBoundWarning[]
}>()

const emit = defineEmits<{
  (e: 'locate', blockId: string): void
}>()

const KIND_LABELS: Record<string, string> = {
  declare: '声明',
  const: '常量',
  loop: '循环',
  assign: '赋值',
  input: '输入',
  read: '读取'
}

const hasIssues = computed(() =>
  props.loopBoundWarnings.length > 0 ||
  props.duplicateDeclarations.length > 0 ||
  props.unusedVariables.length > 0
)

// 按名称聚合的变量表（去重展示，引用计数排除自身声明块上的出现）
const tableRows = computed(() => {
  const selfDeclFields = new Set(
    props.declarations.map(d => `${d.sourceBlockId}|${d.name.toLowerCase()}`)
  )
  const refCounts = new Map<string, number>()
  props.occurrences.forEach(o => {
    if (selfDeclFields.has(`${o.blockId}|${o.identifier.toLowerCase()}`)) return
    const key = o.identifier.toLowerCase()
    refCounts.set(key, (refCounts.get(key) || 0) + 1)
  })

  const seen = new Set<string>()
  const rows: Array<{
    name: string
    kindLabel: string
    refCount: number
    sourceBlockId: string
  }> = []

  props.declarations.forEach(d => {
    const key = d.name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    rows.push({
      name: d.name,
      kindLabel: KIND_LABELS[d.kind] || d.kind,
      refCount: refCounts.get(key) || 0,
      sourceBlockId: d.sourceBlockId
    })
  })

  return rows
})

const onRowClick = (row: { sourceBlockId: string }) => {
  emit('locate', row.sourceBlockId)
}
</script>

<style lang="scss" scoped>
.variable-panel {
  height: 100%;
  padding: 16px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px;
}

.all-clear {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: var(--radius-md);
  color: #10b981;
  font-size: 13px;
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-card);
  }

  .issue-icon {
    color: #f59e0b;
    flex-shrink: 0;
  }

  .issue-text {
    flex: 1;
    font-size: 12px;
    color: var(--text-primary);
  }
}

.variable-table {
  width: 100%;

  :deep(.el-table__row) {
    cursor: pointer;
  }
}

.empty-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 0;
}
</style>
