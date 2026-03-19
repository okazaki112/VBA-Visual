<template>
  <el-dialog
    v-model="visible"
    title="快捷键帮助"
    width="500px"
    :close-on-click-modal="true"
    class="shortcut-help-dialog"
  >
    <div class="shortcut-list">
      <div v-for="group in shortcutGroups" :key="group.title" class="shortcut-group">
        <h4 class="group-title">{{ group.title }}</h4>
        <div class="shortcut-items">
          <div v-for="item in group.items" :key="item.desc" class="shortcut-item">
            <span class="shortcut-desc">{{ item.desc }}</span>
            <div class="shortcut-keys">
              <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)

const shortcutGroups = [
  {
    title: '编辑操作',
    items: [
      { desc: '撤销', keys: ['Ctrl', 'Z'] },
      { desc: '重做', keys: ['Ctrl', 'Y'] },
      { desc: '复制', keys: ['Ctrl', 'C'] },
      { desc: '粘贴', keys: ['Ctrl', 'V'] },
      { desc: '删除', keys: ['Delete'] },
      { desc: '全选', keys: ['Ctrl', 'A'] }
    ]
  },
  {
    title: '画布操作',
    items: [
      { desc: '平移画布', keys: ['拖拽空白处'] },
      { desc: '缩放画布', keys: ['Ctrl', '滚轮'] },
      { desc: '适应画布', keys: ['工具栏按钮'] }
    ]
  },
  {
    title: '积木操作',
    items: [
      { desc: '多选积木', keys: ['Ctrl', '点击'] },
      { desc: '移动积木', keys: ['方向键'] },
      { desc: '微调位置', keys: ['Shift', '方向键'] },
      { desc: '编辑属性', keys: ['双击积木'] }
    ]
  },
  {
    title: '连接操作',
    items: [
      { desc: '创建连接', keys: ['拖拽端口'] },
      { desc: '重连端点', keys: ['拖拽连接线端点'] },
      { desc: '删除连接', keys: ['选中后 Delete'] }
    ]
  },
  {
    title: '其他',
    items: [
      { desc: '显示帮助', keys: ['F1'] },
      { desc: '保存项目', keys: ['Ctrl', 'S'] }
    ]
  }
]

const open = () => {
  visible.value = true
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.shortcut-help-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
    max-height: 60vh;
    overflow-y: auto;
  }
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shortcut-group {
  .group-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
  }
}

.shortcut-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.shortcut-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

kbd {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-family: 'Consolas', monospace;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
