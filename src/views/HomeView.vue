<template>
  <div class="home-view">
    <div class="home-content">
      <div class="hero-section">
        <h1 class="hero-title">VBA 可视化编辑器</h1>
        <p class="hero-subtitle">拖拽积木，轻松生成 VBA 代码</p>
      </div>

      <div class="quick-actions">
        <el-card class="action-card" shadow="hover" @click="createNewProject">
          <div class="action-icon">
            <el-icon :size="48"><Plus /></el-icon>
          </div>
          <h3>新建项目</h3>
          <p>创建一个新的 VBA 项目</p>
        </el-card>

        <el-card class="action-card demo-card" shadow="hover" @click="loadDemoProject">
          <div class="action-icon">
            <el-icon :size="48"><Collection /></el-icon>
          </div>
          <h3>加载示例</h3>
          <p>查看演示项目</p>
        </el-card>

        <el-card class="action-card" shadow="hover" @click="openProject">
          <div class="action-icon">
            <el-icon :size="48"><FolderOpened /></el-icon>
          </div>
          <h3>打开项目</h3>
          <p>打开已保存的项目文件</p>
        </el-card>
      </div>

      <div class="recent-projects" v-if="recentProjects.length > 0">
        <h2>最近项目</h2>
        <div class="project-list">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="project-item"
            @click="openRecentProject(project)"
          >
            <el-icon><Document /></el-icon>
            <div class="project-info">
              <span class="project-name">{{ project.name }}</span>
              <span class="project-date">{{ project.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, FolderOpened, Document, Collection } from '@element-plus/icons-vue'
import { useBlockStore } from '@/stores/blockStore'
import { useCanvasStore } from '@/stores/canvasStore'
import type { ProjectData } from '@/stores/canvasStore'
import demoProjectRaw from '@/assets/examples/demo-project.json'

const demoProject = demoProjectRaw as unknown as ProjectData

const router = useRouter()
const blockStore = useBlockStore()
const canvasStore = useCanvasStore()

const recentProjects = ref<Array<{ id: string; name: string; date: string }>>([])

const createNewProject = () => {
  // 清空当前项目
  blockStore.clearBlocks()
  canvasStore.clearConnections()
  router.push('/editor')
}

const loadDemoProject = () => {
  // 清空当前项目
  blockStore.clearBlocks()
  canvasStore.clearConnections()
  
  // 加载示例项目数据
  if (demoProject.blocks) {
    demoProject.blocks.forEach((block: any) => {
      blockStore.addBlock(block)
    })
  }
  
  if (demoProject.connections) {
    demoProject.connections.forEach((conn: any) => {
      blockStore.addConnection(conn)
    })
  }
  
  // 存储示例项目的完整数据，供编辑器恢复画布
  canvasStore.setProjectData(demoProject)
  
  router.push('/editor')
}

const openProject = async () => {
  const result = await window.electronAPI?.dialog.open({
    filters: [{ name: 'VBA 项目', extensions: ['vba.json'] }],
    properties: ['openFile']
  })
  if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
    // TODO: 加载项目
    router.push('/editor')
  }
}

const openRecentProject = (_project: { id: string }) => {
  // TODO: 加载项目
  router.push('/editor')
}
</script>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.home-content {
  max-width: 900px;
  padding: 40px;
  text-align: center;
}

.hero-section {
  margin-bottom: 48px;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.action-card {
  cursor: pointer;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  :deep(.el-card__body) {
    padding: 32px 24px;
    text-align: center;
  }

  .action-icon {
    color: var(--primary-color);
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
  }

  &.demo-card {
    border-color: var(--primary-color) !important;
    
    .action-icon {
      color: #10b981;
    }
    
    h3 {
      color: #10b981;
    }
  }
}

.recent-projects {
  text-align: left;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
  }
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
  }

  .el-icon {
    color: var(--primary-color);
    font-size: 24px;
  }
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.project-date {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
