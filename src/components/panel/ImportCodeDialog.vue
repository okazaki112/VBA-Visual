<template>
  <el-dialog
    v-model="visible"
    title="导入 VBA 代码"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="import-dialog-content">
      <!-- 代码输入区域 -->
      <div class="code-input-section">
        <div class="section-header">
          <span class="section-title">粘贴 VBA 代码</span>
          <el-button type="primary" text size="small" @click="loadSampleCode">
            加载示例
          </el-button>
        </div>
        <el-input
          v-model="vbaCode"
          type="textarea"
          :rows="12"
          placeholder="请粘贴 VBA 代码..."
          class="code-textarea"
          @input="onCodeChange"
        />
      </div>

      <!-- 解析预览 -->
      <div v-if="parseResult" class="parse-result-section">
        <div class="section-header">
          <span class="section-title">解析预览</span>
          <el-tag :type="parseResult.success ? 'success' : 'danger'" size="small">
            {{ parseResult.success ? '解析成功' : '解析有问题' }}
          </el-tag>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="parseResult.errors.length > 0" class="error-list">
          <el-alert
            v-for="(error, index) in parseResult.errors"
            :key="index"
            :title="error"
            type="error"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 警告提示 -->
        <div v-if="parseResult.warnings.length > 0" class="warning-list">
          <el-alert
            v-for="(warning, index) in parseResult.warnings.slice(0, 5)"
            :key="index"
            :title="warning"
            type="warning"
            :closable="false"
            show-icon
          />
          <el-tag v-if="parseResult.warnings.length > 5" type="warning" size="small">
            还有 {{ parseResult.warnings.length - 5 }} 条警告...
          </el-tag>
        </div>

        <!-- 积木预览 -->
        <div v-if="parseResult.blocks.length > 0" class="blocks-preview">
          <div class="preview-header">
            <span>将生成 {{ parseResult.blocks.length }} 个积木块</span>
          </div>
          <div class="blocks-list">
            <div 
              v-for="block in parseResult.blocks.slice(0, 10)" 
              :key="block.id"
              class="block-preview-item"
            >
              <el-icon><Document /></el-icon>
              <span class="block-label">{{ getBlockLabel(block) }}</span>
            </div>
            <div v-if="parseResult.blocks.length > 10" class="more-blocks">
              +{{ parseResult.blocks.length - 10 }} 个更多...
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!canImport"
          @click="handleImport"
        >
          导入到画布
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { parseVBACode, type ParseResult } from '@/utils/vbaParser'
import { getBlockDefinition } from '@/utils/blockDefinitions'
import type { BlockInstance, Connection } from '@/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'import', data: { blocks: BlockInstance[]; connections: Connection[] }): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const vbaCode = ref('')
const parseResult = ref<ParseResult | null>(null)

// 是否可以导入
const canImport = computed(() => {
  return parseResult.value && 
         parseResult.value.success && 
         parseResult.value.blocks.length > 0
})

// 代码变化时解析
const onCodeChange = () => {
  if (vbaCode.value.trim()) {
    parseResult.value = parseVBACode(vbaCode.value)
  } else {
    parseResult.value = null
  }
}

// 获取积木标签
const getBlockLabel = (block: BlockInstance): string => {
  const def = getBlockDefinition(block.definitionId)
  if (def) {
    // 尝试获取有意义的名称
    const props = block.properties
    if (props.varName) return `${def.label}: ${props.varName}`
    if (props.subName) return `${def.label}: ${props.subName}`
    if (props.funcName) return `${def.label}: ${props.funcName}`
    if (props.message) return `${def.label}: ${String(props.message).substring(0, 20)}...`
    return def.label
  }
  return '未知积木'
}

// 加载示例代码
const loadSampleCode = () => {
  vbaCode.value = `Sub ProcessData()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    
    ' 获取活动工作表
    Set ws = ActiveSheet
    
    ' 获取最后一行
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' 循环处理数据
    For i = 2 To lastRow
        If ws.Cells(i, 1).Value > 100 Then
            ws.Cells(i, 2).Value = "高"
        Else
            ws.Cells(i, 2).Value = "低"
        End If
    Next i
    
    MsgBox "处理完成！共处理 " & (lastRow - 1) & " 行数据"
End Sub`
  onCodeChange()
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  vbaCode.value = ''
  parseResult.value = null
}

// 导入到画布
const handleImport = () => {
  if (!parseResult.value || parseResult.value.blocks.length === 0) {
    ElMessage.warning('没有可导入的积木')
    return
  }

  // 创建连接
  const connections: Connection[] = parseResult.value.connections.map((conn, index) => ({
    id: `conn-${Date.now()}-${index}`,
    sourceBlockId: conn.sourceBlockId,
    sourcePortId: 'out',
    targetBlockId: conn.targetBlockId,
    targetPortId: 'in'
  }))

  emit('import', {
    blocks: parseResult.value.blocks,
    connections
  })

  ElMessage.success(`成功导入 ${parseResult.value.blocks.length} 个积木`)
  handleClose()
}

// 监听对话框打开
watch(visible, (val) => {
  if (val) {
    vbaCode.value = ''
    parseResult.value = null
  }
})
</script>

<style lang="scss" scoped>
.import-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.code-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    line-height: 1.5;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
}

.parse-result-section {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.error-list,
.warning-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.blocks-preview {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 12px;
}

.preview-header {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.blocks-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.block-preview-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  
  .el-icon {
    color: var(--primary-color);
  }
}

.more-blocks {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
