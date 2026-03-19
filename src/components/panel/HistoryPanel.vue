<template>
  <div class="history-panel">
    <div class="history-header">
      <span class="history-title">版本历史</span>
      <el-button 
        v-if="historyStore.versions.length > 0"
        type="danger" 
        size="small" 
        text
        @click="clearAllVersions"
      >
        清空
      </el-button>
    </div>
    
    <div class="history-content">
      <div v-if="historyStore.versions.length === 0" class="no-history">
        <el-icon :size="32"><Clock /></el-icon>
        <p>暂无版本历史</p>
        <p class="hint">保存项目时会自动创建版本快照</p>
      </div>
      
      <div v-else class="version-list">
        <div 
          v-for="(version, index) in historyStore.versions" 
          :key="version.id"
          class="version-item"
          :class="{ 
            active: index === historyStore.currentIndex,
            current: index === 0 
          }"
          @click="selectVersion(index)"
        >
          <div class="version-info">
            <span class="version-name">{{ version.name }}</span>
            <span v-if="index === 0" class="version-badge">当前</span>
          </div>
          <div class="version-meta">
            <span class="version-time">{{ formatTime(version.timestamp) }}</span>
            <span class="version-blocks">{{ version.blocks.length }} 个积木</span>
          </div>
          <div v-if="version.description" class="version-desc">
            {{ version.description }}
          </div>
          <div class="version-actions">
            <el-button 
              type="primary" 
              size="small" 
              text
              @click.stop="restoreVersion(index)"
            >
              恢复
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              text
              @click.stop="deleteVersion(version.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock } from '@element-plus/icons-vue'
import { useHistoryStore } from '@/stores/historyStore'

const historyStore = useHistoryStore()

const emit = defineEmits<{
  (e: 'restore', version: { blocks: any[]; connections: any[] }): void
}>()

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  // 其他
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 选择版本
const selectVersion = (index: number) => {
  historyStore.jumpToVersion(index)
}

// 恢复版本
const restoreVersion = async (index: number) => {
  const version = historyStore.versions[index]
  if (!version) return
  
  try {
    await ElMessageBox.confirm(
      '恢复到此版本将覆盖当前编辑内容，是否继续？',
      '恢复版本',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    emit('restore', {
      blocks: version.blocks,
      connections: version.connections
    })
    
    ElMessage.success(`已恢复到 ${version.name}`)
  } catch {
    // 用户取消
  }
}

// 删除版本
const deleteVersion = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此版本吗？',
      '删除版本',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    historyStore.deleteVersion(id)
    ElMessage.success('版本已删除')
  } catch {
    // 用户取消
  }
}

// 清空所有版本
const clearAllVersions = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有版本历史吗？此操作不可撤销。',
      '清空版本历史',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    historyStore.clearVersions()
    ElMessage.success('版本历史已清空')
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.no-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  text-align: center;
  
  .el-icon {
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  p {
    margin: 4px 0;
    font-size: 14px;
  }
  
  .hint {
    font-size: 12px;
    opacity: 0.7;
  }
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary-color);
    background: rgba(99, 102, 241, 0.1);
  }
  
  &.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
  
  &.current {
    background: rgba(99, 102, 241, 0.15);
  }
}

.version-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.version-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.version-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
}

.version-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.version-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.version-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}
</style>
