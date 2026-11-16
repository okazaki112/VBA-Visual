<template>
  <el-dialog
    v-model="visible"
    title="帮助"
    width="560px"
    :close-on-click-modal="true"
    class="shortcut-help-dialog"
  >
    <el-tabs v-model="activeTab">
      <!-- 入门指南（H-1） -->
      <el-tab-pane label="入门指南" name="guide">
        <div class="guide-content">
          <div class="guide-block">
            <h5>三步上手</h5>
            <ol>
              <li>从左侧工具箱<b>拖入积木</b>（或选中积木后双击工具箱积木自动接续）</li>
              <li>拖动端口<b>连线</b>定义执行顺序；把积木拖进 If/For 容器即进入循环体（If-Else 容器右半为 Else 体）</li>
              <li>右侧实时<b>预览生成代码</b>，一键复制 / 导出 .bas / 导出图片</li>
            </ol>
          </div>
          <div class="guide-block">
            <h5>高频技巧</h5>
            <ul>
              <li><b>Ctrl+K</b> 命令面板：搜命令 / 积木 / 模板 / 画布定位</li>
              <li><b>变量感知</b>：属性输入框自动补全已声明变量；引用未声明变量会黄色告警，点「声明」自动补齐</li>
              <li><b>重命名联动</b>：修改变量声明名，全画布引用自动同步</li>
              <li><b>静态校验</b>：代码预览红行 = 结构问题，点击行跳对应积木</li>
              <li><b>右键</b>：积木右键=编辑/复制/删除；连线右键=删除连线；空白右键拖拽=框选</li>
              <li><b>自动保存</b>：内容变更 10 秒后自动存草稿，误关可恢复；底部状态栏可见保存时间</li>
            </ul>
          </div>
        </div>
      </el-tab-pane>

      <!-- 快捷键 -->
      <el-tab-pane label="快捷键" name="shortcuts">
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
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const activeTab = ref('guide')

const shortcutGroups = [
  {
    title: '编辑操作',
    items: [
      { desc: '撤销', keys: ['Ctrl', 'Z'] },
      { desc: '重做', keys: ['Ctrl', 'Y'] },
      { desc: '复制', keys: ['Ctrl', 'C'] },
      { desc: '粘贴', keys: ['Ctrl', 'V'] },
      { desc: '删除', keys: ['Delete'] },
      { desc: '全选', keys: ['Ctrl', 'A'] },
      { desc: '保存项目', keys: ['Ctrl', 'S'] }
    ]
  },
  {
    title: '画布操作',
    items: [
      { desc: '平移画布', keys: ['拖拽空白处'] },
      { desc: '缩放画布', keys: ['Ctrl', '滚轮'] },
      { desc: '框选积木', keys: ['右键拖拽空白处'] },
      { desc: '适应画布', keys: ['工具栏按钮'] }
    ]
  },
  {
    title: '积木操作',
    items: [
      { desc: '多选积木', keys: ['Ctrl', '点击'] },
      { desc: '移动积木', keys: ['方向键'] },
      { desc: '微调位置', keys: ['Shift', '方向键'] },
      { desc: '编辑属性', keys: ['双击积木'] },
      { desc: '右键菜单', keys: ['右键点击积木'] }
    ]
  },
  {
    title: '连接操作',
    items: [
      { desc: '创建连接', keys: ['拖拽端口'] },
      { desc: '重连端点', keys: ['拖拽连接线端点'] },
      { desc: '删除连接', keys: ['右键连线'] }
    ]
  },
  {
    title: '其他',
    items: [
      { desc: '显示帮助', keys: ['F1'] },
      { desc: '命令面板（搜命令/积木/模板）', keys: ['Ctrl', 'K'] },
      { desc: '代码内查找', keys: ['Ctrl', 'F'] }
    ]
  }
]

const open = () => {
  visible.value = true
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.guide-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-block {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 12px 16px;

  h5 {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--text-primary);
  }

  ol,
  ul {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.9;

    b {
      color: var(--text-primary);
    }
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
