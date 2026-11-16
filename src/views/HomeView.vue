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

      <!-- 项目模板 -->
      <div class="templates-section">
        <h2>项目模板</h2>
        <div class="template-categories">
          <el-radio-group v-model="selectedCategory" size="small">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="basic">基础</el-radio-button>
            <el-radio-button value="excel">Excel</el-radio-button>
            <el-radio-button value="automation">自动化</el-radio-button>
          </el-radio-group>
        </div>
        <div class="template-grid">
          <el-card 
            v-for="template in filteredTemplates" 
            :key="template.id"
            class="template-card"
            shadow="hover"
            @click="loadTemplate(template)"
          >
            <div class="template-icon">
              <el-icon :size="32"><component :is="getIcon(template.icon)" /></el-icon>
            </div>
            <div class="template-info">
              <h4>{{ template.name }}</h4>
              <p>{{ template.description }}</p>
            </div>
          </el-card>
        </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, FolderOpened, Document, Collection,
  ChatDotRound, Refresh, QuestionFilled
} from '@element-plus/icons-vue'
import { useBlockStore } from '@/stores/blockStore'
import { useCanvasStore } from '@/stores/canvasStore'
import type { ProjectData } from '@/stores/canvasStore'
import demoProjectRaw from '@/assets/examples/demo-project.json'
import { projectTemplates, type ProjectTemplate } from '@/assets/templates/projectTemplates'
import { loadProjectFromPath, addRecentProject, getRecentProjects, removeRecentProject, type RecentProject } from '@/utils/projectIO'

const demoProject = demoProjectRaw as unknown as ProjectData

const router = useRouter()
const blockStore = useBlockStore()
const canvasStore = useCanvasStore()

const recentProjects = ref<RecentProject[]>([])
const selectedCategory = ref('all')

onMounted(() => {
  recentProjects.value = getRecentProjects()
})

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') {
    return projectTemplates
  }
  return projectTemplates.filter(t => t.category === selectedCategory.value)
})

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    ChatDotRound,
    Refresh,
    Document,
    QuestionFilled
  }
  return icons[iconName] || Document
}

// 携带项目数据跳转编辑器（编辑器通过 consumeProjectData 恢复画布）
const openInEditor = (data: ProjectData) => {
  blockStore.clearBlocks()
  canvasStore.setProjectData(data)
  router.push('/editor')
}

const createNewProject = () => {
  // 清空当前项目
  blockStore.clearBlocks()
  canvasStore.setProjectData(null)
  router.push('/editor')
}

const loadDemoProject = () => {
  openInEditor(demoProject)
}

const loadTemplate = (template: ProjectTemplate) => {
  openInEditor(template.data)
}

// 打开项目文件并跳转编辑器
const openProject = async () => {
  if (!window.electronAPI) {
    ElMessage.error('当前环境不支持文件读取（缺少 Electron API）')
    return
  }
  const result = await window.electronAPI.dialog.open({
    filters: [{ name: 'VBA 项目', extensions: ['vba.json'] }],
    properties: ['openFile']
  })
  if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    const projectData = await loadProjectFromPath(filePath)
    if (projectData) {
      addRecentProject(filePath)
      openInEditor(projectData)
    }
  }
}

// 从最近项目列表打开
const openRecentProject = async (project: RecentProject) => {
  const projectData = await loadProjectFromPath(project.path)
  if (projectData) {
    addRecentProject(project.path)
    openInEditor(projectData)
  } else {
    // 文件可能已被移动或删除，从列表移除
    removeRecentProject(project.path)
    recentProjects.value = getRecentProjects()
    ElMessage.warning(`无法打开「${project.name}」，已从最近项目列表移除`)
  }
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
  overflow-y: auto;
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

.templates-section {
  margin-bottom: 48px;
  text-align: left;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
  }
}

.template-categories {
  margin-bottom: 16px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.template-card {
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color) !important;
    box-shadow: var(--shadow-md);
  }

  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
  }

  .template-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    color: var(--primary-color);
    flex-shrink: 0;
  }

  .template-info {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    p {
      font-size: 12px;
      color: var(--text-secondary);
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
