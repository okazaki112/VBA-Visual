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

    <div class="code-container">
      <div class="line-numbers">
        <span v-for="n in lineCount" :key="n">{{ n }}</span>
      </div>
      <pre class="code-content"><code>{{ code || placeholderCode }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CopyDocument, Download } from '@element-plus/icons-vue'

const props = defineProps<{
  code: string
}>()

defineEmits<{
  (e: 'copy'): void
  (e: 'export'): void
}>()

const placeholderCode = `' 在画布上添加积木块
' 代码将自动生成在这里

Sub MyMacro()
    ' TODO: 添加你的代码
    
End Sub`

const lineCount = computed(() => {
  const content = props.code || placeholderCode
  return content.split('\n').length
})
</script>

<style lang="scss" scoped>
.code-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  }
}
</style>
