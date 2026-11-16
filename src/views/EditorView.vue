<template>
  <div class="editor-view">
    <!-- 左侧积木工具箱 -->
    <BlockToolbox :blocks="blockDefinitions" @drag-start="onDragStart" @quick-add="onQuickAdd" />

    <!-- 中间画布区域 -->
    <div class="canvas-area">
      <CanvasToolbar
        :can-undo="canvasStore.canUndo"
        :can-redo="canvasStore.canRedo"
        :zoom="canvasStore.zoom"
        @action="onToolbarAction"
      />
      <ShortcutHelp ref="shortcutHelpRef" />
      <div
        class="canvas-container"
        ref="canvasContainer"
        @dragover.prevent="onDragOver"
        @drop="onDrop"
        @dragleave="onDragLeave"
      >
        <div id="x6-canvas" ref="x6Canvas"></div>

        <!-- C-4 小地图 -->
        <div v-show="minimapVisible" ref="minimapContainer" class="minimap-container"></div>

        <!-- G-1 空画布引导 -->
        <div v-if="showCanvasGuide" class="canvas-guide">
          <div class="guide-steps">
            <div class="guide-step">
              <span class="guide-num">1</span>
              <span>从左侧工具箱<b>拖入积木</b>（或双击积木自动接续）</span>
            </div>
            <div class="guide-step">
              <span class="guide-num">2</span>
              <span>拖动端口<b>连线</b>定义执行顺序；拖进 If/For 容器编排循环体</span>
            </div>
            <div class="guide-step">
              <span class="guide-num">3</span>
              <span>右侧实时<b>预览生成代码</b>，一键复制/导出</span>
            </div>
          </div>
          <div class="guide-actions">
            <el-button size="small" type="primary" @click="guideLoadDemo">加载示例</el-button>
            <el-dropdown @command="loadGuideTemplate">
              <el-button size="small">从模板开始</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="tpl in projectTemplates"
                    :key="tpl.id"
                    :command="tpl.id"
                  >
                    {{ tpl.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" @click="shortcutHelpRef?.open()">查看快捷键 (F1)</el-button>
          </div>
        </div>

        <!-- S-4 画布积木搜索 -->
        <div v-if="blockSearchVisible" class="block-search">
          <el-input
            ref="blockSearchInput"
            v-model="blockSearchQuery"
            size="small"
            placeholder="按标签或属性内容搜索画布积木..."
            clearable
            @keyup.esc="blockSearchVisible = false"
          />
          <div class="block-search-results">
            <div
              v-for="r in blockSearchResults"
              :key="r.id"
              class="block-search-item"
              @click="onSearchPick(r.id)"
            >
              <span class="search-order">#{{ r.order }}</span>
              <span>{{ r.label }}</span>
              <span v-if="r.parentId" class="search-child-tag">容器体</span>
            </div>
            <div v-if="blockSearchQuery && !blockSearchResults.length" class="block-search-empty">
              未找到匹配的积木
            </div>
          </div>
        </div>
      </div>

      <!-- S-1 底部状态栏 -->
      <div class="status-bar">
        <span>积木 {{ blockStore.blocks.length }}</span>
        <span>连线 {{ blockStore.connections.length }}</span>
        <span>缩放 {{ Math.round((canvasStore.zoom || 1) * 100) }}%</span>
        <span
          class="status-clickable"
          :class="{ 'status-problem': validationErrors.length }"
          title="点击查看代码预览"
          @click="activeTab = 'code'"
        >校验 {{ validationErrors.length }}</span>
        <span
          class="status-clickable"
          :class="{ 'status-problem': variableIssueCount }"
          title="点击查看变量面板"
          @click="activeTab = 'variables'"
        >变量问题 {{ variableIssueCount }}</span>
        <span class="status-spacer"></span>
        <span v-if="lastAutosaveAt">已自动保存 {{ autosaveTimeText }}</span>
        <span v-else>尚未自动保存</span>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div 
      class="right-panel" 
      :style="{ width: rightPanelWidth + 'px' }"
    >
      <!-- 拖拽调整宽度的分隔条 -->
      <div 
        class="resize-handle"
        @mousedown="startResize"
      >
        <div class="resize-line"></div>
      </div>
      <el-tabs v-model="activeTab" class="panel-tabs">
        <el-tab-pane label="属性" name="properties">
          <template #label>属性</template>
          <PropertyPanel
            :selected-node="selectedNode"
            :variables="variables"
            :undeclared-warnings="undeclaredWarnings"
            :suggest-option="suggestOption"
            @update="onPropertyUpdate"
            @move-up="onMoveUp"
            @move-down="onMoveDown"
            @edit-code="onEditCode"
            @restore-template="restoreCustomCode"
            @declare-variable="onDeclareVariable"
            @add-option="onAddOptionExplicit"
            @set-parent-slot="onSetParentSlot"
          />
        </el-tab-pane>
        <el-tab-pane name="variables">
          <template #label>
            变量
            <el-badge v-if="variableIssueCount" :value="variableIssueCount" type="warning" class="tab-badge" />
          </template>
          <VariablePanel
            :declarations="variableDeclarations"
            :occurrences="occurrenceIndex"
            :unused-variables="unusedVariables"
            :duplicate-declarations="duplicateDeclarations"
            :loop-bound-warnings="loopBoundWarnings"
            @locate="onCodeLocate"
          />
        </el-tab-pane>
        <el-tab-pane name="code">
          <template #label>
            代码预览
            <el-badge v-if="validationErrors.length" :value="validationErrors.length" type="danger" class="tab-badge" />
          </template>
          <CodePreview
          ref="codePreviewRef"
          :code="generatedCode"
          :mappings="codeMappings"
          :highlighted-block-id="highlightedBlockId"
          :errors="validationErrors"
          @copy="onCopyCode"
          @export="onExportCode"
          @line-click="onCodeLineClick"
          @locate="onCodeLocate"
        />
        </el-tab-pane>
        <el-tab-pane label="历史" name="history">
          <HistoryPanel @restore="onRestoreVersion" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 代码编辑弹窗 -->
    <el-dialog
      v-model="codeEditorVisible"
      title="编辑积木代码"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="code-editor-container">
        <el-input
          v-model="editingCode"
          type="textarea"
          :rows="15"
          placeholder="输入自定义代码..."
          class="code-textarea"
        />
      </div>
      <template #footer>
        <el-button v-if="hasCustomCode" @click="restoreCustomCode">恢复默认模板</el-button>
        <el-button @click="codeEditorVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCustomCode">保存</el-button>
      </template>
    </el-dialog>

    <!-- 属性编辑弹窗 -->
    <el-dialog
      v-model="propertyDialogVisible"
      :title="propertyDialogTitle"
      width="450px"
      :close-on-click-modal="false"
    >
      <div v-if="editingBlock" class="property-dialog-content">
        <div
          v-for="prop in editingBlockDefinition?.properties"
          :key="prop.id"
          class="property-dialog-item"
        >
          <label class="property-dialog-label">{{ prop.label }}</label>

          <!-- 文本输入 -->
          <el-input
            v-if="prop.type === 'text'"
            v-model="dialogProperties[prop.id]"
            :placeholder="prop.placeholder"
            size="small"
          />

          <!-- 数字输入 -->
          <el-input-number
            v-else-if="prop.type === 'number'"
            v-model="dialogProperties[prop.id]"
            :min="prop.validation?.min"
            :max="prop.validation?.max"
            size="small"
            controls-position="right"
          />

          <!-- 下拉选择 -->
          <el-select
            v-else-if="prop.type === 'select'"
            v-model="dialogProperties[prop.id]"
            size="small"
            style="width: 100%"
          >
            <el-option
              v-for="option in prop.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <!-- 布尔值 -->
          <el-switch
            v-else-if="prop.type === 'boolean'"
            v-model="dialogProperties[prop.id]"
          />

          <!-- 表达式输入 -->
          <el-input
            v-else-if="prop.type === 'expression'"
            v-model="dialogProperties[prop.id]"
            :placeholder="prop.placeholder"
            size="small"
          />

          <!-- 公式输入 -->
          <el-input
            v-else-if="prop.type === 'formula'"
            v-model="dialogProperties[prop.id]"
            :placeholder="prop.placeholder"
            size="small"
          />

          <!-- 代码输入（v1.10.0：高亮+智能缩进+变量 chips+骨架速插+配对提示） -->
          <VbaCodeEditor
            v-else-if="prop.type === 'code'"
            :model-value="String(dialogProperties[prop.id] ?? '')"
            :variables="variables"
            :rows="6"
            :placeholder="prop.placeholder"
            @update:model-value="dialogProperties[prop.id] = $event"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="propertyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePropertyDialog">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入代码对话框 -->
    <ImportCodeDialog
      v-model="importDialogVisible"
      @import="onImportCode"
    />

    <!-- v1.7.0 命令面板 (Ctrl+K) -->
    <CommandPalette
      v-model="paletteVisible"
      @execute="onPaletteCommand"
    />

    <!-- 节点/连线右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <template v-if="contextMenu.targetType === 'edge'">
        <div class="context-menu-item danger" @click="onEdgeMenuAction('delete')">
          <el-icon><Delete /></el-icon><span>删除连线</span>
        </div>
        <div class="context-menu-item" @click="onEdgeMenuAction('locate-source')">
          <el-icon><Aim /></el-icon><span>定位源积木</span>
        </div>
        <div class="context-menu-item" @click="onEdgeMenuAction('locate-target')">
          <el-icon><Aim /></el-icon><span>定位目标积木</span>
        </div>
      </template>
      <template v-else>
      <div class="context-menu-item" @click="onContextAction('edit')">
        <el-icon><Edit /></el-icon><span>编辑属性</span>
      </div>
      <div
        v-if="contextMenu.isContainer"
        class="context-menu-item"
        @click="onToggleCollapse(contextMenu.nodeId)"
      >
        <el-icon><Fold v-if="!contextMenuCollapsed" /><Expand v-else /></el-icon>
        <span>{{ contextMenuCollapsed ? '展开容器' : '折叠容器' }}</span>
      </div>
      <div class="context-menu-item" @click="onContextAction('copy')">
        <el-icon><CopyDocument /></el-icon><span>复制积木</span>
      </div>
      <div class="context-menu-item" @click="onContextAction('paste')">
        <el-icon><DocumentCopy /></el-icon><span>粘贴</span>
      </div>
      <div class="context-menu-item" @click="onContextAction('disconnect')">
        <el-icon><ConnectionIcon /></el-icon><span>断开所有连线</span>
      </div>
      <div class="context-menu-item danger" @click="onContextAction('delete')">
        <el-icon><Delete /></el-icon><span>删除积木</span>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { Graph } from '@antv/x6'
// @ts-ignore - X6 plugins don't have proper type declarations
import { History } from '@antv/x6-plugin-history'
// @ts-ignore
import { Keyboard } from '@antv/x6-plugin-keyboard'
// @ts-ignore
import { Selection } from '@antv/x6-plugin-selection'
// @ts-ignore
import { Snapline } from '@antv/x6-plugin-snapline'
// @ts-ignore
import { Clipboard } from '@antv/x6-plugin-clipboard'
// @ts-ignore
import { Export } from '@antv/x6-plugin-export'
import { MiniMap } from '@antv/x6-plugin-minimap'
// @ts-ignore
import { Graph as LayoutGraph } from '@antv/graphlib'
// @ts-ignore
import { DagreLayout, GridLayout } from '@antv/layout'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, CopyDocument, DocumentCopy, Connection as ConnectionIcon, Delete, Aim, Fold, Expand } from '@element-plus/icons-vue'
import BlockToolbox from '@/components/blocks/BlockToolbox.vue'
import CanvasToolbar from '@/components/canvas/CanvasToolbar.vue'
import PropertyPanel from '@/components/panel/PropertyPanel.vue'
import CodePreview from '@/components/panel/CodePreview.vue'
import VariablePanel from '@/components/panel/VariablePanel.vue'
import HistoryPanel from '@/components/panel/HistoryPanel.vue'
import ImportCodeDialog from '@/components/panel/ImportCodeDialog.vue'
import ShortcutHelp from '@/components/common/ShortcutHelp.vue'
import CommandPalette, { type PaletteCommand } from '@/components/common/CommandPalette.vue'
import VbaCodeEditor from '@/components/panel/VbaCodeEditor.vue'
import { useBlockStore } from '@/stores/blockStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useThemeStore, getThemeColors } from '@/stores/themeStore'
import { blockDefinitions, getBlockDefinition } from '@/utils/blockDefinitions'
import { registerCustomNode, createBlockNode, createEdgeStyle, embedNode, unembedNode, canEmbed, updateNodeOrder, resizeContainer } from '@/utils/customNode'
import { generateBlockCode, generateCodeWithMappings, type CodeMapping } from '@/utils/codeGenerator'
import { buildProjectData, saveProjectToFile, loadProjectFromPath, addRecentProject } from '@/utils/projectIO'
import { scheduleAutosave, flushAutosave, getAutosaveData, clearAutosave, markSavedBaseline } from '@/utils/autosave'
import { collectVariables, findUndeclaredReferences, collectVariableDeclarations, buildOccurrenceIndex, findUnusedVariables, findDuplicateDeclarations, findLoopBoundWarnings, replaceIdentifierOccurrences, normalizeVarName, VARIABLE_FIELD_IDS, type VariableInfo, type UndeclaredWarning } from '@/utils/variableScanner'
import { validateVBACode, type ValidationError } from '@/utils/vbaValidator'
import { projectTemplates } from '@/assets/templates/projectTemplates'
import demoProjectRaw from '@/assets/examples/demo-project.json'
import type { BlockInstance, BlockDefinition, Connection } from '@/types'
import type { ProjectData } from '@/stores/canvasStore'
import type { Node, Cell, Edge } from '@antv/x6'

// 注册自定义节点
registerCustomNode()
createEdgeStyle()

const blockStore = useBlockStore()
const canvasStore = useCanvasStore()
const historyStore = useHistoryStore()
const themeStore = useThemeStore()

// U-2 页签偏好记忆
const activeTab = ref(localStorage.getItem('vba-visual-tab') || 'properties')
watch(activeTab, value => {
  try {
    localStorage.setItem('vba-visual-tab', value)
  } catch {
    // 存储不可用时忽略
  }
})
const selectedNode = ref<BlockInstance | null>(null)
const generatedCode = ref('')
const codeMappings = ref<CodeMapping[]>([])
const highlightedBlockId = ref<string | null>(null)
const canvasContainer = ref<HTMLElement>()
const x6Canvas = ref<HTMLElement>()
// C-4 小地图容器
const minimapContainer = ref<HTMLElement>()
// U-1 小地图显隐（偏好持久化）
const MINIMAP_KEY = 'vba-visual-minimap'
const minimapVisible = ref(localStorage.getItem(MINIMAP_KEY) !== '0')
const toggleMinimap = () => {
  minimapVisible.value = !minimapVisible.value
  try {
    localStorage.setItem(MINIMAP_KEY, minimapVisible.value ? '1' : '0')
  } catch {
    // 存储不可用时忽略
  }
}

// 右侧面板宽度调整（P-1 持久化记忆）
const PANEL_WIDTH_KEY = 'vba-visual-panel-width'
const rightPanelWidth = ref(Number(localStorage.getItem(PANEL_WIDTH_KEY)) || 320)
const isResizing = ref(false)

// 快捷键帮助
const shortcutHelpRef = ref<InstanceType<typeof ShortcutHelp> | null>(null)

// 代码编辑器
const codeEditorVisible = ref(false)
const editingCode = ref('')
const editingBlockId = ref<string | null>(null)

// 属性编辑对话框
const propertyDialogVisible = ref(false)
const editingBlock = ref<BlockInstance | null>(null)
const dialogProperties = ref<Record<string, unknown>>({})

// 导入代码对话框
const importDialogVisible = ref(false)

// v1.7.0 命令面板（Ctrl+K）
const paletteVisible = ref(false)

// 节点右键菜单（U1）
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  nodeId: '',
  targetType: 'node' as 'node' | 'edge',
  edgeId: '',
  isContainer: false
})

// H-2 容器折叠状态（仅视图层，生成与保存不受影响）
const collapsedContainers = ref(new Set<string>())
const contextMenuCollapsed = computed(() => collapsedContainers.value.has(contextMenu.nodeId))

// 项目加载中标记：批量重建画布时跳过逐节点的排序/代码重算（防 O(n²) 事件风暴）
let isLoadingProject = false

// 对话框中积木的定义
const editingBlockDefinition = computed<BlockDefinition | null>(() => {
  if (!editingBlock.value) return null
  return getBlockDefinition(editingBlock.value.definitionId)
})

// 对话框标题
const propertyDialogTitle = computed(() => {
  return editingBlockDefinition.value?.label ? `编辑: ${editingBlockDefinition.value.label}` : '编辑属性'
})

let graph: Graph | null = null

// 更新画布主题颜色
const updateCanvasTheme = () => {
  if (!graph) return
  const colors = getThemeColors()
  
  // 更新背景颜色
  graph.drawBackground({ color: colors.bgSecondary })
  
  // 更新网格颜色
  graph.drawGrid({
    type: 'dot',
    args: {
      color: colors.borderColor,
      thickness: 1
    }
  })
  
  // 更新所有节点颜色 - 使用节点存储的积木颜色
  const nodes = graph.getNodes()
  nodes.forEach(node => {
    const nodeColor = node.getData()?.color || colors.primary
    node.setAttrs({
      body: {
        stroke: nodeColor,
        fill: colors.bgCard
      },
      orderBadge: {
        fill: nodeColor
      }
    })
  })
  
  // 更新所有连线颜色
  const edges = graph.getEdges()
  edges.forEach(edge => {
    edge.setAttrs({
      line: {
        stroke: colors.primary
      }
    })
  })
}

// 初始化画布
onMounted(() => {
  initCanvas()
  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize)
  // 全局点击隐藏右键菜单
  document.addEventListener('mousedown', handleDocMouseDownForMenu)
  // 检查自动保存草稿
  maybeRestoreAutosave()
})

// 监听主题变化
watch(() => themeStore.theme, () => {
  // 延迟更新以确保CSS变量已更新
  nextTick(() => {
    updateCanvasTheme()
  })
})

onUnmounted(() => {
  // 离开前补写自动保存草稿（与保存基线一致时自动跳过）
  flushAutosave(getProjectSnapshot)
  graph?.dispose()
  window.removeEventListener('resize', handleWindowResize)
  document.removeEventListener('mousedown', handleDocMouseDownForMenu)
  // 清理右键框选事件监听器
  if (rubberbandCleanup) {
    rubberbandCleanup()
  }
})

// 全局按下鼠标时隐藏右键菜单（点击菜单项除外）
const handleDocMouseDownForMenu = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.context-menu')) {
    contextMenu.visible = false
  }
}

// 右键框选清理函数
let rubberbandCleanup: (() => void) | null = null

// 处理窗口大小变化
const handleWindowResize = () => {
  if (graph && x6Canvas.value) {
    const container = x6Canvas.value.parentElement
    if (container) {
      graph.resize(container.offsetWidth, container.offsetHeight)
    }
  }
}

const initCanvas = () => {
  if (!x6Canvas.value) return

  // 获取当前主题颜色
  const themeColors = getThemeColors()
  
  // @ts-ignore - X6 Graph 配置
  graph = new Graph({
    container: x6Canvas.value,
    width: x6Canvas.value.offsetWidth,
    height: x6Canvas.value.offsetHeight,
    background: {
      color: themeColors.bgSecondary
    },
    grid: {
      visible: true,
      type: 'dot',
      size: 20,
      args: {
        color: themeColors.borderColor,
        thickness: 1
      }
    },
    // 节点移动时吸附到网格
    scroller: {
      enabled: true,
      pannable: true,
      pageVisible: false,
      pageBreak: false
    },
    panning: {
      enabled: true,
      modifiers: []
    },
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl']
    },
    connecting: {
      anchor: {
        name: 'midSide',
        args: {
          dx: 10
        }
      },
      connectionPoint: 'boundary',
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: true,
      allowEdge: true,  // 允许边作为连接源（重新连接）
      allowPort: true,
      highlight: true,
      connector: 'rounded',
      router: {
        name: 'manhattan',
        args: {
          padding: 20
        }
      },
      validateConnection({ sourceCell, targetCell, edge }: {
        sourceCell?: Cell
        targetCell?: Cell
        edge?: Edge
      }) {
        if (!sourceCell || !targetCell) return false
        // 禁止自环
        if (sourceCell.id === targetCell.id) return false
        // 禁止重复连线与反向连线（重连当前边自身除外）
        const duplicate = graph!.getEdges().some(e => {
          if (edge && e.id === edge.id) return false
          const s = e.getSourceCellId()
          const t = e.getTargetCellId()
          return (s === sourceCell.id && t === targetCell.id) ||
                 (s === targetCell.id && t === sourceCell.id)
        })
        return !duplicate
      },
      createEdge() {
        const colors = getThemeColors()
        return graph!.createEdge({
          shape: 'custom-edge',
          attrs: {
            line: {
              stroke: colors.primary,
              strokeWidth: 3,
              sourceMarker: {
                name: 'circle',
                r: 5
              },
              targetMarker: {
                name: 'block',
                width: 10,
                height: 10
              }
            }
          },
          router: {
            name: 'manhattan',
            args: {
              padding: 20
            }
          },
          connector: {
            name: 'rounded',
            args: {
              radius: 8
            }
          }
        })
      }
    },
    highlighting: {
      magnetAvailable: {
        name: 'stroke',
        args: {
          padding: 4,
          attrs: {
            'stroke-width': 3,
            stroke: getThemeColors().primary,
            fill: getThemeColors().primary + '33'
          }
        }
      }
    },
    interacting: {
      nodeMovable: true,
      edgeMovable: true,
      edgeLabelMovable: true,
      magnetConnectable: true,
      arrowheadMovable: true
    }
  } as any)

  // 使用插件
  // History：过滤纯样式类变更（悬停高亮/端口透明度/编号徽章/主题刷新），
  // 撤销栈只保留用户内容操作
  graph.use(new History({
    enabled: true,
    beforeAddCommand: (_event: string, args: { key?: string }) => {
      const key = args?.key
      return !(key === 'attrs' || key === 'ports' || key === 'tools' || key === 'zIndex')
    }
  } as any))
  graph.use(new Keyboard({ enabled: true }))
  // Selection 插件配置：
  // - rubberband: false 禁用左键框选（空白区域右键拖动框选）
  // - modifiers: ['ctrl'] Ctrl+点击多选（与快捷键帮助一致）
  // - movable: true 允许批量移动选中节点
  // - showNodeSelectionBox: true 显示选中框
  graph.use(new Selection({
    enabled: true,
    multiple: true,
    rubberband: false,
    modifiers: ['ctrl'],
    movable: true,
    showNodeSelectionBox: true
  }))
  graph.use(new Snapline({ enabled: true }))
  graph.use(new Clipboard({ enabled: true }))
  graph.use(new Export())

  // C-4 小地图
  if (minimapContainer.value) {
    graph.use(new MiniMap({
      container: minimapContainer.value,
      width: 160,
      height: 100
    } as any))
  }

  // 键盘快捷键
  const keyboard = graph.getPlugin('keyboard') as Keyboard
  if (keyboard) {
    // 撤销: Ctrl+Z
    keyboard.bindKey('ctrl+z', () => {
      graph?.undo()
      updateUndoRedoState()
    })
    // 重做: Ctrl+Y
    keyboard.bindKey('ctrl+y', () => {
      graph?.redo()
      updateUndoRedoState()
    })
    // 删除: Delete / Backspace（容器级联删除全部子积木）
    keyboard.bindKey(['delete', 'backspace'], () => {
      const cells = graph?.getSelectedCells()
      if (cells && cells.length) {
        graph?.removeCells(cells, { deep: true } as any)
      }
    })
    // 复制: Ctrl+C（容器连同子积木一起复制）
    keyboard.bindKey('ctrl+c', () => {
      const cells = graph?.getSelectedCells()
      if (cells && cells.length) {
        graph?.copy(cells, { deep: true } as any)
        ElMessage.success('已复制')
      }
    })
    // 粘贴: Ctrl+V（粘贴后统一同步父子关系）
    keyboard.bindKey('ctrl+v', () => {
      if (graph?.isClipboardEmpty()) {
        return
      }
      const cells = graph?.paste({ offset: 32 })
      if (cells) {
        graph?.cleanSelection()
        graph?.select(cells)
        syncGraphToStore()
        autoSortBlocks()
        updateGeneratedCode()
      }
    })
    // 全选: Ctrl+A
    keyboard.bindKey('ctrl+a', () => {
      const nodes = graph?.getNodes()
      if (nodes && nodes.length) {
        graph?.select(nodes)
      }
    })
    // 保存: Ctrl+S
    keyboard.bindKey('ctrl+s', (e: KeyboardEvent) => {
      e.preventDefault()
      saveProject()
    })
    // P-3 代码查找: Ctrl+F
    keyboard.bindKey('ctrl+f', (e: KeyboardEvent) => {
      e.preventDefault()
      activeTab.value = 'code'
      nextTick(() => codePreviewRef.value?.focusSearch())
    })
    // 帮助: F1
    keyboard.bindKey('f1', (e: KeyboardEvent) => {
      e.preventDefault()
      shortcutHelpRef.value?.open()
    })
    // C-3 Esc: 取消选择 / 收右键菜单 / 关积木搜索
    keyboard.bindKey('esc', () => {
      graph?.cleanSelection()
      contextMenu.visible = false
      blockSearchVisible.value = false
    })
    // v1.7.0 命令面板: Ctrl+K
    keyboard.bindKey('ctrl+k', (e: KeyboardEvent) => {
      e.preventDefault()
      paletteVisible.value = true
    })
    // 方向键移动节点
    const moveStep = 10
    const moveSelectedNodes = (dx: number, dy: number) => {
      const cells = graph?.getSelectedCells()
      if (cells && cells.length) {
        cells.forEach(cell => {
          if (cell.isNode()) {
            const pos = cell.position()
            cell.position(pos.x + dx, pos.y + dy)
            // 更新 store
            blockStore.updateBlockPosition(cell.id, pos.x + dx, pos.y + dy)
          }
        })
      }
    }
    keyboard.bindKey('up', () => moveSelectedNodes(0, -moveStep))
    keyboard.bindKey('down', () => moveSelectedNodes(0, moveStep))
    keyboard.bindKey('left', () => moveSelectedNodes(-moveStep, 0))
    keyboard.bindKey('right', () => moveSelectedNodes(moveStep, 0))
    // Shift + 方向键微调 (1px)
    keyboard.bindKey('shift+up', () => moveSelectedNodes(0, -1))
    keyboard.bindKey('shift+down', () => moveSelectedNodes(0, 1))
    keyboard.bindKey('shift+left', () => moveSelectedNodes(-1, 0))
    keyboard.bindKey('shift+right', () => moveSelectedNodes(1, 0))
  }

  // 监听节点选择
  graph.on('node:selected', ({ node }) => {
    const block = blockStore.getBlockById(node.id)
    selectedNode.value = block
    // 更新节点数据到 store
    if (block) {
      node.setData({ properties: block.properties })
    }
    // 添加选中效果：红色边框
    node.setAttrs({
      body: {
        stroke: '#ef4444',
        strokeWidth: 3
      }
    })
    // 高亮对应代码行（保持当前页签不变，避免打断属性编辑）
    highlightedBlockId.value = node.id
  })

  graph.on('node:unselected', ({ node }) => {
    // 恢复节点存储的积木颜色
    const nodeColor = node.getData()?.color || getThemeColors().primary
    node.setAttrs({
      body: {
        stroke: nodeColor,
        strokeWidth: 2
      }
    })
    highlightedBlockId.value = null
  })

  // 监听选择变化（处理多选）
  graph.on('selection:changed', ({ selected }) => {
    // 更新 selectedNode（多选时显示第一个）
    if (selected.length > 0) {
      const firstNode = selected[0]
      if (firstNode.isNode()) {
        const block = blockStore.getBlockById(firstNode.id)
        selectedNode.value = block
      }
      // 多选时为所有选中节点添加高亮效果
      if (selected.length > 1) {
        selected.forEach(cell => {
          if (cell.isNode()) {
            cell.setAttrs({
              body: {
                stroke: '#ef4444',
                strokeWidth: 3
              }
            })
          }
        })
      }
    } else {
      selectedNode.value = null
    }
  })

  // 双击节点打开属性编辑对话框
  graph.on('node:dblclick', ({ node }) => {
    const block = blockStore.getBlockById(node.id)
    if (block) {
      selectedNode.value = block
      // 确保节点被选中
      graph!.select(node.id)
      // 打开属性编辑对话框
      openPropertyDialog(block)
    }
  })

  // 端口显示/隐藏交互 - 端口默认半透明可见
  graph.on('node:mouseenter', ({ node }) => {
    node.getPorts().forEach(port => {
      node.portProp(port.id!, {
        attrs: {
          circle: {
            style: { visibility: 'visible', opacity: '1' },
            strokeWidth: 3
          }
        }
      })
    })
    // V-1 变量焦点高亮：悬停声明积木时，高亮画布上引用其变量的积木
    highlightVariableReferences(node)
  })

  graph.on('node:mouseleave', ({ node }) => {
    node.getPorts().forEach(port => {
      node.portProp(port.id!, {
        attrs: {
          circle: {
            style: { visibility: 'visible', opacity: '0.5' },
            strokeWidth: 2
          }
        }
      })
    })
    clearVariableHighlights()
  })

  // 监听节点移动
  graph.on('node:moved', ({ node }) => {
    let position = node.position()
    
    // 网格吸附：将位置对齐到 20px 网格
    const gridSize = 20
    const snappedX = Math.round(position.x / gridSize) * gridSize
    const snappedY = Math.round(position.y / gridSize) * gridSize
    
    // 如果位置有变化，更新节点位置
    if (position.x !== snappedX || position.y !== snappedY) {
      node.position(snappedX, snappedY)
      position = { x: snappedX, y: snappedY }
    }
    
    blockStore.updateBlockPosition(node.id, position.x, position.y)

    // 检查是否需要嵌入容器
    checkAndEmbed(node)

    // 始终按位置自动排序并更新代码
    autoSortBlocks()
    updateGeneratedCode()
  })

  // 检查并嵌入容器节点
  const checkAndEmbed = (node: Node) => {
    const nodeData = node.getData()
    // 容器节点不需要检查嵌入
    if (nodeData?.nestingType === 'container') return

    // 获取节点位置
    const nodeBBox = node.getBBox()
    const nodeCenter = nodeBBox.getCenter()

    // 查找所有容器节点
    const allNodes = graph?.getNodes() || []
    const containerNodes = allNodes.filter(n => {
      const data = n.getData()
      return data?.nestingType === 'container' && n.id !== node.id
    })

    // 检查节点是否在某个容器内
    for (const container of containerNodes) {
      const containerBBox = container.getBBox()
      if (containerBBox.containsPoint(nodeCenter)) {
        // 嵌入节点
        if (canEmbed(container, node)) {
          embedNode(graph!, container, node)
          blockStore.setBlockParent(node.id, container.id)
          ElMessage.info(`已嵌入到 ${container.getData()?.blockType || '容器'} 中`)
        }
        return
      }
    }

    // 如果不在任何容器内，检查是否需要从容器中移除
    const parent = node.getParent()
    if (parent && parent.isNode()) {
      const parentBBox = parent.getBBox()
      if (!parentBBox.containsPoint(nodeCenter)) {
        unembedNode(graph!, parent as Node, node)
        blockStore.setBlockParent(node.id, undefined)
      }
    }
  }

  // 监听节点删除
  graph.on('node:removed', ({ node }) => {
    if (isLoadingProject) return
    blockStore.removeBlock(node.id)
    // 删除节点后自动排序
    autoSortBlocks()
    updateGeneratedCode()
    updateUndoRedoState()
  })

  // 监听连接变化
  graph.on('edge:connected', ({ edge }) => {
    const connectionData = {
      id: edge.id,
      sourceBlockId: edge.getSourceCellId() || '',
      sourcePortId: edge.getSourcePortId() || '',
      targetBlockId: edge.getTargetCellId() || '',
      targetPortId: edge.getTargetPortId() || ''
    }

    // 检查是否已存在此连接（重新连接的情况）
    const existingIndex = blockStore.connections.findIndex(c => c.id === edge.id)
    if (existingIndex >= 0) {
      // 更新现有连接
      blockStore.connections[existingIndex] = connectionData
    } else {
      // 添加新连接（连接状态统一存 blockStore，与生成/保存链路一致）
      blockStore.addConnection(connectionData)
    }

    // 环检测：沿连线方向若能回到起点说明成环
    if (connectionData.targetBlockId &&
        isReachable(connectionData.targetBlockId, connectionData.sourceBlockId)) {
      ElMessage.warning('该连接形成了循环流程，循环中的积木可能不会出现在生成代码里')
    }

    // 连线后自动排序
    autoSortBlocks()
    updateGeneratedCode()
    updateUndoRedoState()
  })

  // 边悬停时显示可拖动端点工具
  graph.on('edge:mouseenter', ({ edge }) => {
    edge.setAttrs({
      line: {
        strokeWidth: 3,
        stroke: '#818cf8'
      }
    })
    // 添加端点拖动工具
    edge.addTools([
      {
        name: 'source-arrowhead',
        args: {
          attrs: {
            fill: '#818cf8',
            stroke: '#fff',
            'stroke-width': 2,
            cursor: 'move'
          }
        }
      },
      {
        name: 'target-arrowhead',
        args: {
          attrs: {
            fill: '#818cf8',
            stroke: '#fff',
            'stroke-width': 2,
            cursor: 'move'
          }
        }
      }
    ])
  })

  graph.on('edge:mouseleave', ({ edge }) => {
    const colors = getThemeColors()
    edge.setAttrs({
      line: {
        strokeWidth: 3,
        stroke: colors.primary
      }
    })
    // 移除端点拖动工具
    edge.removeTools()
  })

  graph.on('edge:removed', ({ edge }) => {
    if (isLoadingProject) return
    blockStore.removeConnection(edge.id)
    // 删除连线后自动排序
    autoSortBlocks()
    updateGeneratedCode()
    updateUndoRedoState()
  })

  // 监听历史变化
  graph.on('history:change', () => {
    updateUndoRedoState()
  })

  // 监听撤销事件，同步 blockStore
  graph.on('history:undo', () => {
    syncGraphToStore()
    autoSortBlocks()
    updateGeneratedCode()
  })

  // 监听重做事件，同步 blockStore
  graph.on('history:redo', () => {
    syncGraphToStore()
    autoSortBlocks()
    updateGeneratedCode()
  })

  // 监听节点添加（包括粘贴操作）
  graph.on('cell:added', ({ cell }) => {
    if (cell.isNode()) {
      const data = cell.getData()
      // 检查是否已存在于 store（避免重复添加拖放节点）
      if (!blockStore.getBlockById(cell.id) && data?.definitionId) {
        // 获取积木定义以获取默认属性
        const blockDef = getBlockDefinition(data.definitionId)
        const defaultProperties: Record<string, unknown> = {}
        if (blockDef) {
          blockDef.properties.forEach(prop => {
            defaultProperties[prop.id] = prop.defaultValue
          })
        }
        
        // 合并已有属性和默认属性
        const properties = { ...defaultProperties, ...data.properties }
        
        const blockInstance: BlockInstance = {
          id: cell.id,
          definitionId: data.definitionId,
          type: data.blockType,
          position: { x: cell.position().x, y: cell.position().y },
          properties,
          order: blockStore.blocks.length + 1,
          parentId: cell.getParent()?.isNode() ? (cell.getParent() as Node).id : undefined,
          parentSlot: data?.parentSlot
        }
        blockStore.addBlock(blockInstance)
        
        // 更新节点数据，确保包含完整属性
        cell.setData({
          ...data,
          properties
        })
        
        autoSortBlocks()
        updateGeneratedCode()
      }
    }
  })

  // 监听缩放变化
  graph.on('scale', ({ sx }) => {
    canvasStore.updateZoom(sx)
  })

  // ========== 右键框选功能（使用原生 DOM 事件）==========
  let isRightMouseDown = false
  let rubberbandRect: HTMLDivElement | null = null
  let rubberbandStart: { x: number; y: number } | null = null
  let rubberbandEnd: { x: number; y: number } | null = null

  const container = graph!.container

  // 右键按下 - 开始框选
  const handleRightMouseDown = (e: MouseEvent) => {
    // 只处理右键
    if (e.button !== 2) return
    
    // 检查是否点击在空白区域（不是节点上）
    const target = e.target as HTMLElement
    if (target.closest('.x6-node')) return
    
    e.preventDefault()
    isRightMouseDown = true
    
    // 获取画布坐标
    const rect = container.getBoundingClientRect()
    const translate = graph!.translate()
    const x = (e.clientX - rect.left - translate.tx) / graph!.zoom()
    const y = (e.clientY - rect.top - translate.ty) / graph!.zoom()
    
    rubberbandStart = { x, y }
    rubberbandEnd = { x, y }
    
    // 创建框选矩形
    rubberbandRect = document.createElement('div')
    rubberbandRect.style.cssText = `
      position: fixed;
      border: 2px dashed #3b82f6;
      background: rgba(59, 130, 246, 0.15);
      pointer-events: none;
      z-index: 10000;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      width: 0px;
      height: 0px;
    `
    document.body.appendChild(rubberbandRect)
  }

  // 鼠标移动 - 更新框选区域
  const handleMouseMove = (e: MouseEvent) => {
    if (!isRightMouseDown || !rubberbandRect || !rubberbandStart) return
    
    // 获取画布坐标
    const rect = container.getBoundingClientRect()
    const translate = graph!.translate()
    const x = (e.clientX - rect.left - translate.tx) / graph!.zoom()
    const y = (e.clientY - rect.top - translate.ty) / graph!.zoom()
    
    rubberbandEnd = { x, y }
    
    // 重新计算起始屏幕位置
    const startScreenX = rect.left + rubberbandStart.x * graph!.zoom() + translate.tx
    const startScreenY = rect.top + rubberbandStart.y * graph!.zoom() + translate.ty
    
    const screenLeft = Math.min(startScreenX, e.clientX)
    const screenTop = Math.min(startScreenY, e.clientY)
    const screenWidth = Math.abs(e.clientX - startScreenX)
    const screenHeight = Math.abs(e.clientY - startScreenY)
    
    rubberbandRect.style.left = `${screenLeft}px`
    rubberbandRect.style.top = `${screenTop}px`
    rubberbandRect.style.width = `${screenWidth}px`
    rubberbandRect.style.height = `${screenHeight}px`
  }

  // 右键松开 - 完成框选
  const handleRightMouseUp = (_e: MouseEvent) => {
    if (!isRightMouseDown || !rubberbandStart || !rubberbandEnd) return
    
    const startX = rubberbandStart.x
    const startY = rubberbandStart.y
    const endX = rubberbandEnd.x
    const endY = rubberbandEnd.y
    
    // 计算框选区域
    const left = Math.min(startX, endX)
    const top = Math.min(startY, endY)
    const width = Math.abs(endX - startX)
    const height = Math.abs(endY - startY)
    
    // 只有拖动距离足够大才进行框选
    if (width > 5 || height > 5) {
      // 创建选择区域
      const selectionRect = { x: left, y: top, width, height }
      
      // 查找区域内的节点
      const nodes = graph!.getNodes()
      const selectedNodes: Node[] = []
      
      nodes.forEach(node => {
        const bbox = node.getBBox()
        // 检查节点是否与框选区域相交
        if (
          bbox.x < selectionRect.x + selectionRect.width &&
          bbox.x + bbox.width > selectionRect.x &&
          bbox.y < selectionRect.y + selectionRect.height &&
          bbox.y + bbox.height > selectionRect.y
        ) {
          selectedNodes.push(node)
        }
      })
      
      // 选中节点
      if (selectedNodes.length > 0) {
        graph!.select(selectedNodes)
        ElMessage.success(`已选中 ${selectedNodes.length} 个积木`)
      }
    }
    
    // 清理
    if (rubberbandRect && rubberbandRect.parentNode) {
      rubberbandRect.parentNode.removeChild(rubberbandRect)
    }
    rubberbandRect = null
    rubberbandStart = null
    rubberbandEnd = null
    isRightMouseDown = false
  }

  // 阻止右键菜单 / 节点右键弹出自定义菜单
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    // C-1 连线右键 → 连线菜单
    const edgeEl = target.closest('.x6-edge') as HTMLElement | null
    if (edgeEl) {
      e.preventDefault()
      const cellId = edgeEl.getAttribute('data-cell-id')
      if (cellId) {
        contextMenu.targetType = 'edge'
        contextMenu.edgeId = cellId
        contextMenu.x = e.clientX
        contextMenu.y = e.clientY
        contextMenu.visible = true
      }
      return
    }
    // 节点右键 → 自定义上下文菜单
    const nodeEl = target.closest('.x6-node') as HTMLElement | null
    if (nodeEl) {
      e.preventDefault()
      const cellId = nodeEl.getAttribute('data-cell-id')
      if (cellId) {
        contextMenu.targetType = 'node'
        contextMenu.nodeId = cellId
        const menuDef = getBlockDefinition(blockStore.getBlockById(cellId)?.definitionId ?? '')
        contextMenu.isContainer = menuDef?.nestingType === 'container'
        contextMenu.x = e.clientX
        contextMenu.y = e.clientY
        contextMenu.visible = true
      }
      return
    }
    // 空白区域：框选过程中阻止默认菜单
    if (isRightMouseDown) {
      e.preventDefault()
    }
  }

  // 绑定原生事件
  container.addEventListener('mousedown', handleRightMouseDown)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleRightMouseUp)
  container.addEventListener('contextmenu', handleContextMenu)

  // 设置清理函数
  rubberbandCleanup = () => {
    container.removeEventListener('mousedown', handleRightMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleRightMouseUp)
    container.removeEventListener('contextmenu', handleContextMenu)
  }

  canvasStore.setGraph(graph)

  // 检查是否有待加载的项目数据（从首页加载示例）
  const projectData = canvasStore.consumeProjectData()
  if (projectData && projectData.blocks) {
    restoreProjectToCanvas(projectData)
  }
}

// 恢复项目数据到画布
const restoreProjectToCanvas = (projectData: { blocks: BlockInstance[]; connections: Connection[] }) => {
  if (!graph) return

  // 过滤有效积木（定义缺失的块不建节点也不进生成链路，避免"隐形积木"干扰代码生成）
  const validBlocks = projectData.blocks.filter(b => getBlockDefinition(b.definitionId))
  const skipped = projectData.blocks.length - validBlocks.length
  if (skipped > 0) {
    ElMessage.warning(`${skipped} 个积木的积木定义缺失，已在画布上跳过`)
  }

  // 父容器缺失的子积木回归顶层（兼容旧数据/脏数据）
  const validIds = new Set(validBlocks.map(b => b.id))
  validBlocks.forEach(b => {
    if (b.parentId && !validIds.has(b.parentId)) {
      delete b.parentId
    }
  })

  // 先添加所有 blocks 到 store（必须在创建节点之前）
  validBlocks.forEach(block => {
    if (!blockStore.getBlockById(block.id)) {
      blockStore.addBlock(block)
    }
  })

  // 创建所有节点
  validBlocks.forEach(block => {
    const blockDef = getBlockDefinition(block.definitionId)
    if (blockDef) {
      const node = createBlockNode(graph!, blockDef, block.position.x, block.position.y, block.id, block.order || 1)
      // 更新节点数据
      node.setData({
        definitionId: block.definitionId,
        blockType: block.type,
        nestingType: blockDef.nestingType,
        color: blockDef.color,
        properties: { ...block.properties },
        parentSlot: block.parentSlot
      })
    }
  })

  // H-2 恢复容器折叠状态（折叠标记存于节点数据；graphData 路径自动恢复可见性，
  // blocks 重建路径在此按节点数据折叠）
  graph!.getNodes().forEach(node => {
    if (node.getData()?.collapsed) {
      setContainerCollapsed(node.id, true)
    }
  })

  // 建立容器父子关系（子积木拖入容器自动嵌入的持久化恢复）
  validBlocks.forEach(block => {
    if (!block.parentId) return
    const parentNode = graph!.getCellById(block.parentId)
    const childNode = graph!.getCellById(block.id)
    if (parentNode && parentNode.isNode() && childNode && childNode.isNode()) {
      parentNode.addChild(childNode)
      resizeContainer(parentNode)
    }
  })

  // 创建所有连接（兼容旧端口 ID 和缺失端口 ID；两端积木均有效才建边）
  projectData.connections.forEach(conn => {
    if (!validIds.has(conn.sourceBlockId) || !validIds.has(conn.targetBlockId)) return

    // 兼容旧的端口 ID：out -> bottom, in -> top
    // 同时处理 undefined 的情况，默认使用 bottom/top
    const sourcePort = conn.sourcePortId === 'out' ? 'bottom' : (conn.sourcePortId || 'bottom')
    const targetPort = conn.targetPortId === 'in' ? 'top' : (conn.targetPortId || 'top')

    // 连接写入 blockStore（跳过重复），保证代码生成与保存格式完整
    if (!blockStore.connections.some(c => c.id === conn.id)) {
      blockStore.addConnection({
        id: conn.id,
        sourceBlockId: conn.sourceBlockId,
        sourcePortId: sourcePort,
        targetBlockId: conn.targetBlockId,
        targetPortId: targetPort
      })
    }

    graph?.addEdge({
      id: conn.id,
      shape: 'custom-edge',
      source: { cell: conn.sourceBlockId, port: sourcePort },
      target: { cell: conn.targetBlockId, port: targetPort }
    })
  })

  // 恢复项目后自动排序
  autoSortBlocks()
  updateGeneratedCode()
}

// 沿连线方向检查 from 是否可达 to（环检测）
const isReachable = (from: string, to: string): boolean => {
  if (!graph || from === to) return false
  const visited = new Set<string>()
  const stack = [from]
  while (stack.length) {
    const current = stack.pop()!
    if (current === to) return true
    if (visited.has(current)) continue
    visited.add(current)
    graph.getEdges().forEach(e => {
      if (e.getSourceCellId() === current) {
        stack.push(e.getTargetCellId())
      }
    })
  }
  return false
}

// 更新撤销/重做状态
const updateUndoRedoState = () => {
  if (graph) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history = graph.getPlugin('history') as any
    if (history) {
      canvasStore.updateUndoRedoState(history.canUndo(), history.canRedo())
    }
  }
}

// 从图形同步数据到 blockStore（用于撤销/重做后同步）
const syncGraphToStore = () => {
  if (!graph) return

  const nodes = graph.getNodes()
  const edges = graph.getEdges()

  // 获取当前图形中的所有节点 ID
  const currentNodeIds = new Set(nodes.map(n => n.id))

  // 删除 store 中不存在于图形的积木
  blockStore.blocks = blockStore.blocks.filter(b => currentNodeIds.has(b.id))

  // 更新或添加图形中的节点到 store
  nodes.forEach(node => {
    const data = node.getData()
    const pos = node.position()
    const existingBlock = blockStore.getBlockById(node.id)
    const parentNode = node.getParent()
    const parentId = parentNode && parentNode.isNode() ? parentNode.id : undefined

    if (existingBlock) {
      // 更新现有积木的位置和属性
      existingBlock.position = { x: pos.x, y: pos.y }
      if (data?.properties) {
        existingBlock.properties = { ...data.properties }
      }
      // 同步父子关系与分支槽位
      if (parentId) {
        existingBlock.parentId = parentId
        if (data?.parentSlot) {
          existingBlock.parentSlot = data.parentSlot
        } else {
          delete existingBlock.parentSlot
        }
      } else {
        delete existingBlock.parentId
        delete existingBlock.parentSlot
      }
    } else if (data?.definitionId) {
      // 添加新积木（撤销恢复的节点）
      const blockInstance: BlockInstance = {
        id: node.id,
        definitionId: data.definitionId,
        type: data.blockType,
        position: { x: pos.x, y: pos.y },
        properties: { ...data.properties },
        order: blockStore.blocks.length + 1,
        parentId,
        parentSlot: data?.parentSlot
      }
      blockStore.addBlock(blockInstance)
    }
  })

  // 同步连接
  blockStore.connections = edges.map(edge => ({
    id: edge.id,
    sourceBlockId: edge.getSourceCellId() || '',
    sourcePortId: edge.getSourcePortId() || '',
    targetBlockId: edge.getTargetCellId() || '',
    targetPortId: edge.getTargetPortId() || ''
  }))
}

// 处理拖放
const onDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!graph || !canvasContainer.value) return
  clearDragHoverHighlight()

  const blockId = event.dataTransfer?.getData('blockId')
  if (!blockId) return

  const blockDef = getBlockDefinition(blockId)
  if (!blockDef) return

  // 使用 X6 的 clientToLocal 方法正确转换坐标
  const point = graph.clientToLocal(event.clientX, event.clientY)

  // A3-1: 落点命中连线时，将新积木插入该连线中间（过程/Option 类积木不参与）
  const hitEdge = findEdgeNear(point)
  if (hitEdge && !isStructureBlock(blockId)) {
    insertBlockIntoEdge(blockDef, point, hitEdge)
    return
  }

  // A1-2: 落点位于容器内部时作为子积木嵌入容器体（v1.6.0：If-Else 容器右半=Else 体）
  const container = findContainerAt(point)
  let parentSlot: string | undefined
  if (container) {
    const containerDef = getBlockDefinition(container.getData()?.definitionId)
    const bbox = container.getBBox()
    if (containerDef?.id === 'block-if-else-statement' &&
        point.x > bbox.x + bbox.width / 2) {
      parentSlot = 'else'
    }
  }
  createBlockAt(blockDef, point, container?.id, parentSlot)
}

// 过程/Option 类积木不参与连线插入
const isStructureBlock = (definitionId: string) =>
  ['block-option-statement', 'block-sub-define', 'block-function-define'].includes(definitionId)

// 创建积木（拖放/双击接续共用）：写入 store → 建节点 → 视容器归属建立父子关系
const createBlockAt = (
  blockDef: BlockDefinition,
  point: { x: number; y: number },
  parentId?: string,
  parentSlot?: string
): Node | null => {
  if (!graph) return null

  const nodeWidth = blockDef.nestingType === 'container' ? 110 : 90
  const nodeHeight = blockDef.nestingType === 'container' ? 60 : 30
  const nodeId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

  const defaultProperties: Record<string, unknown> = {}
  blockDef.properties.forEach(prop => {
    defaultProperties[prop.id] = prop.defaultValue
  })

  // I-4 变量名冲突防呆：默认名与现有变量重名时自动加序号后缀
  const existingNames = new Set(variables.value.map(v => v.name.toLowerCase()))
  Object.keys(defaultProperties).forEach(propId => {
    if (!VARIABLE_FIELD_IDS.includes(propId)) return
    const val = defaultProperties[propId]
    if (typeof val === 'string' && val.trim() && existingNames.has(val.trim().toLowerCase())) {
      let seq = 2
      while (existingNames.has(`${val}${seq}`.toLowerCase())) seq++
      defaultProperties[propId] = `${val}${seq}`
    }
  })

  // 先添加到 store（必须在创建节点之前，否则 cell:added 事件会重复添加）
  const blockInstance: BlockInstance = {
    id: nodeId,
    definitionId: blockDef.id,
    type: blockDef.type,
    position: { x: point.x - nodeWidth, y: point.y - nodeHeight },
    properties: { ...defaultProperties },
    order: 1,
    parentId,
    parentSlot
  }
  blockStore.addBlock(blockInstance)

  const node = createBlockNode(graph, blockDef, point.x - nodeWidth, point.y - nodeHeight, nodeId, 1)

  node.setData({
    definitionId: blockDef.id,
    blockType: blockDef.type,
    nestingType: blockDef.nestingType,
    color: blockDef.color,
    properties: { ...defaultProperties },
    parentSlot
  })

  // 嵌入父容器：父子关系 = 容器体；连线 = 流程先后
  if (parentId) {
    const parentNode = graph.getCellById(parentId)
    if (parentNode && parentNode.isNode()) {
      parentNode.addChild(node)
      resizeContainer(parentNode)
    }
  }

  // U-3 新积木自动选中：属性面板立即跟随
  graph.cleanSelection()
  graph.select(node)

  autoSortBlocks()
  updateGeneratedCode()

  ElMessage.success(parentId ? `已嵌入容器: ${blockDef.label}` : `已添加: ${blockDef.label}`)
  return node
}

// 找到包含落点的容器节点（取面积最小者，避免多层容器歧义）
const findContainerAt = (point: { x: number; y: number }): Node | null => {
  if (!graph) return null
  let hit: Node | null = null
  let hitArea = Infinity
  graph.getNodes().forEach(n => {
    const def = getBlockDefinition(n.getData()?.definitionId)
    if (def?.nestingType !== 'container') return
    const bbox = n.getBBox()
    if (bbox.containsPoint(point) && bbox.width * bbox.height < hitArea) {
      hitArea = bbox.width * bbox.height
      hit = n
    }
  })
  return hit
}

// 计算点到线段的距离
const distToSegment = (
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

// 找落点附近的连线（源/目标中心点连线段近似，阈值 40px）
const findEdgeNear = (point: { x: number; y: number }, threshold = 40): Edge | null => {
  if (!graph) return null
  let best: Edge | null = null
  let bestDist = threshold
  graph.getEdges().forEach(edge => {
    const src = edge.getSourceCell()
    const tgt = edge.getTargetCell()
    if (!src?.isNode() || !tgt?.isNode()) return
    const dist = distToSegment(point, (src as Node).getBBox().getCenter(), (tgt as Node).getBBox().getCenter())
    if (dist < bestDist) {
      bestDist = dist
      best = edge
    }
  })
  return best
}

// 把新积木插入连线中间：断开原边 → 新块落位 → 重建两侧连线
const insertBlockIntoEdge = (
  blockDef: BlockDefinition,
  point: { x: number; y: number },
  edge: Edge
) => {
  if (!graph) return
  const g = graph
  const sourceId = edge.getSourceCellId()
  const targetId = edge.getTargetCellId()
  const oldConnectionId = edge.id

  const node = createBlockAt(blockDef, point)
  if (!node || !sourceId || !targetId) return

  g.removeCell(edge)
  blockStore.removeConnection(oldConnectionId)

  addFlowConnection(sourceId, node.id)
  addFlowConnection(node.id, targetId)

  autoSortBlocks()
  updateGeneratedCode()
  ElMessage.success(`已插入: ${blockDef.label}`)
}

// A3-2: 双击工具箱积木自动接续到当前选中积木的下游
const onQuickAdd = (blockDef: BlockDefinition) => {
  if (!graph) return
  const anchor = selectedNode.value
  if (!anchor) {
    ElMessage.info('请先选中一个积木，再双击工具箱积木自动接续')
    return
  }

  const node = createBlockAt(blockDef, { x: anchor.position.x + 60, y: anchor.position.y + 90 }, anchor.parentId)
  if (!node) return

  // 选中积木 → 新积木（同容器内的体内容连线 / 顶层流程连线）
  addFlowConnection(anchor.id, node.id)
  autoSortBlocks()
  updateGeneratedCode()
}

// 建立流程连线（画布边 + store 连接同步）
const addFlowConnection = (fromId: string, toId: string) => {
  if (!graph) return
  const connId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  graph.addEdge({
    id: connId,
    shape: 'custom-edge',
    source: { cell: fromId, port: 'bottom' },
    target: { cell: toId, port: 'top' }
  })
  blockStore.addConnection({
    id: connId,
    sourceBlockId: fromId,
    sourcePortId: 'bottom',
    targetBlockId: toId,
    targetPortId: 'top'
  })
}

// R-2: 未声明变量一键声明（落位引用块左上方 + 自动插入其上游连线）
const onDeclareVariable = (identifier: string, refBlockId: string) => {
  if (!graph) return
  const refBlock = blockStore.getBlockById(refBlockId)
  if (!refBlock) return
  const def = getBlockDefinition('block-variable-declare')
  if (!def) return

  const node = createBlockAt(def, { x: refBlock.position.x + 70, y: refBlock.position.y - 40 }, refBlock.parentId)
  if (!node) return

  blockStore.updateBlockProperty(node.id, 'varName', identifier)
  const declaredNode = graph.getCellById(node.id)
  if (declaredNode) {
    declaredNode.setData({
      properties: { ...declaredNode.getData()?.properties, varName: identifier }
    })
  }

  // 自动插入引用块所在流的上游（存在同层入边时；容器体内部与顶层同样适用）
  const incoming = graph.getEdges().find(e => {
    if (e.getTargetCellId() !== refBlockId) return false
    const source = e.getSourceCell()
    const sameScope = refBlock.parentId
      ? source?.getParent()?.id === refBlock.parentId
      : !source?.getParent()?.isNode()
    return sameScope
  })
  if (incoming) {
    const sourceId = incoming.getSourceCellId()
    graph.removeCell(incoming)
    blockStore.removeConnection(incoming.id)
    if (sourceId) addFlowConnection(sourceId, node.id)
    addFlowConnection(node.id, refBlockId)
  }

  autoSortBlocks()
  updateGeneratedCode()
  ElMessage.success(`已声明变量 ${identifier}`)
}

// v1.6.0 双体容器：切换子积木分支归属（Then 体 / Else 体）
const onSetParentSlot = (nodeId: string, slot: string) => {
  const block = blockStore.getBlockById(nodeId)
  if (!block) return
  if (slot === 'else') {
    block.parentSlot = 'else'
  } else {
    delete block.parentSlot
  }
  const node = graph?.getCellById(nodeId)
  if (node) {
    node.setData({ parentSlot: slot === 'else' ? 'else' : undefined })
  }
  updateAllNodeOrders()
  updateGeneratedCode()
  ElMessage.success(slot === 'else' ? '已移入 Else 体' : '已移入 Then 体')
}

// v1.7.0 命令面板分发
const onPaletteCommand = (cmd: PaletteCommand) => {
  switch (cmd.type) {
    case 'action':
      onToolbarAction(cmd.payload!)
      break
    case 'template':
      onToolbarAction('template', { templateId: cmd.payload })
      break
    case 'locate':
      onCodeLineClick(cmd.payload!)
      onCodeLocate(cmd.payload!)
      break
    case 'block': {
      const def = getBlockDefinition(cmd.payload!)
      if (!def) return
      if (selectedNode.value) {
        onQuickAdd(def)
      } else {
        // 无选中：落在当前视口中心
        const containerRect = x6Canvas.value?.getBoundingClientRect()
        const point = graph
          ? graph.clientToLocal(
              (containerRect?.left ?? 0) + (containerRect?.width ?? 800) / 2,
              (containerRect?.top ?? 0) + (containerRect?.height ?? 600) / 2
            )
          : { x: 200, y: 200 }
        createBlockAt(def, point)
      }
      break
    }
  }
}

// R-3: 一键插入 Option Explicit（强制声明模式）
const onAddOptionExplicit = () => {
  if (!graph) return
  const def = getBlockDefinition('block-option-statement')
  if (!def) return
  createBlockAt(def, { x: 120, y: 40 })
}

const onDragStart = (block: BlockDefinition, event: DragEvent) => {
  event.dataTransfer?.setData('blockId', block.id)
  event.dataTransfer?.setData('blockType', block.type)
  event.dataTransfer!.effectAllowed = 'copy'
}

const onToolbarAction = (action: string, payload?: Record<string, unknown>) => {
  const history = graph?.getPlugin('history') as History | undefined
  
  switch (action) {
    case 'undo':
      history?.undo()
      updateUndoRedoState()
      break
    case 'redo':
      history?.redo()
      updateUndoRedoState()
      break
    case 'zoom-in':
      graph?.zoom(0.1)
      break
    case 'zoom-out':
      graph?.zoom(-0.1)
      break
    case 'zoom-fit':
      graph?.zoomToFit({ padding: 20 })
      break
    case 'zoom-reset':
      graph?.zoomTo(1)
      break
    case 'zoom-set': {
      // 按工具栏输入的百分比直接设定缩放
      const percent = payload?.percent as number | undefined
      if (percent && percent >= 20 && percent <= 400) {
        graph?.zoomTo(percent / 100)
      }
      break
    }
    case 'clear':
      ElMessageBox.confirm(
        '确定要清空画布吗？此操作不可撤销。',
        '清空画布',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        graph?.startBatch('clear-canvas')
        graph?.clearCells()
        blockStore.clearBlocks()
        generatedCode.value = ''
        graph?.stopBatch('clear-canvas')
        history?.clean()
        updateUndoRedoState()
        ElMessage.success('画布已清空')
      }).catch(() => {
        // 用户取消
      })
      break
    case 'save':
      saveProject()
      break
    case 'load':
      loadProject()
      break
    case 'export-code':
      exportCode()
      break
    case 'export-png':
      exportAsImage('png')
      break
    case 'export-svg':
      exportAsImage('svg')
      break
    case 'import-code':
      importDialogVisible.value = true
      break
    case 'template': {
      // G-2 编辑器内模板入口
      const templateId = payload?.templateId as string
      const template = projectTemplates.find(t => t.id === templateId)
      if (!template) return
      ElMessageBox.confirm(
        `载入模板「${template.name}」将替换当前画布内容，是否继续？`,
        '载入模板',
        { confirmButtonText: '载入', cancelButtonText: '取消', type: 'warning' }
      )
        .then(() => {
          applyProjectData(template.data)
          ElMessage.success(`已载入模板: ${template.name}`)
        })
        .catch(() => {})
      break
    }
    case 'search-block':
      openBlockSearch()
      break
    case 'toggle-minimap':
      toggleMinimap()
      break
    case 'layout':
      if (payload) {
        autoLayout(payload.type as string, payload)
      }
      break
  }
}

const onPropertyUpdate = (nodeId: string, propertyId: string, value: unknown) => {
  // R-1 重命名联动：修改变量声明名时，确认后同步更新全画布引用
  const block = blockStore.getBlockById(nodeId)
  const def = block ? getBlockDefinition(block.definitionId) : null
  const propDef = def?.properties.find(p => p.id === propertyId)
  if (block && propDef && propDef.type === 'text' && VARIABLE_FIELD_IDS.includes(propertyId)) {
    const oldName = normalizeVarName(String(block.properties[propertyId] ?? ''))
    const newName = normalizeVarName(String(value ?? ''))
    if (oldName && newName && oldName.toLowerCase() !== newName.toLowerCase()) {
      const refCount = occurrenceIndex.value.filter(
        o => o.identifier.toLowerCase() === oldName.toLowerCase() && o.blockId !== nodeId
      ).length
      ElMessageBox.confirm(
        `将把「${oldName}」重命名为「${newName}」，同步更新画布上 ${refCount} 处引用。是否继续？`,
        '重命名变量',
        { confirmButtonText: '重命名', cancelButtonText: '取消', type: 'info' }
      )
        .then(() => {
          const changes = replaceIdentifierOccurrences(blockStore.blocks, oldName, newName, nodeId)
          changes.forEach(({ blockId, propName }) => {
            const changedBlock = blockStore.getBlockById(blockId)
            const node = graph?.getCellById(blockId)
            if (node && changedBlock) {
              node.setData({
                properties: { ...node.getData()?.properties, [propName]: changedBlock.properties[propName] }
              })
            }
          })
          blockStore.updateBlockProperty(nodeId, propertyId, value)
          const selfNode = graph?.getCellById(nodeId)
          if (selfNode) {
            selfNode.setData({ properties: { ...selfNode.getData()?.properties, [propertyId]: value } })
          }
          updateGeneratedCode()
          ElMessage.success(`已重命名并同步 ${refCount} 处引用`)
        })
        .catch(() => {
          // 用户取消：回写旧值，保持面板与画布一致
          const reverted = block.properties[propertyId]
          blockStore.updateBlockProperty(nodeId, propertyId, reverted)
          const selfNode = graph?.getCellById(nodeId)
          if (selfNode) {
            selfNode.setData({ properties: { ...selfNode.getData()?.properties, [propertyId]: reverted } })
          }
          updateGeneratedCode()
        })
      return
    }
  }

  blockStore.updateBlockProperty(nodeId, propertyId, value)
  // 更新画布节点数据（按目标积木 ID 定位，防抖提交时选中可能已切换）
  const node = graph?.getCellById(nodeId)
  if (node) {
    node.setData({
      properties: {
        ...node.getData()?.properties,
        [propertyId]: value
      }
    })
  }
  updateGeneratedCode()
}

// 上移积木（无连线时生效；连线模式下顺序由自动排序接管）
const onMoveUp = () => {
  if (selectedNode.value) {
    blockStore.moveBlockUp(selectedNode.value.id)
    updateAllNodeOrders()
    updateGeneratedCode()
  }
}

// 下移积木
const onMoveDown = () => {
  if (selectedNode.value) {
    blockStore.moveBlockDown(selectedNode.value.id)
    updateAllNodeOrders()
    updateGeneratedCode()
  }
}

// 更新所有节点的编号显示（顶层=流程顺序；容器子积木=体内容顺序）
const updateAllNodeOrders = () => {
  if (!graph) return
  blockStore.sortedBlocks.forEach(block => {
    const node = graph?.getCellById(block.id)
    if (node && node.isNode()) {
      updateNodeOrder(node, block.order)
    }
  })
  // 容器子积木按 Y 坐标显示体内容序号（Else 体带 E 后缀，v1.6.0 双体容器）
  let thenSeq = 0
  let elseSeq = 0
  blockStore.blocks
    .filter(b => b.parentId)
    .sort((a, b) => a.position.y - b.position.y)
    .forEach(block => {
      const node = graph?.getCellById(block.id)
      if (!node || !node.isNode()) return
      if (block.parentSlot === 'else') {
        elseSeq++
        updateNodeOrder(node, `${elseSeq}E`)
      } else {
        thenSeq++
        updateNodeOrder(node, thenSeq)
      }
    })
}

// 自动排序积木（有连线时按连线顺序，无连线时按 Y 坐标）
const autoSortBlocks = () => {
  if (!graph) return

  const edges = graph.getEdges()
  const hasConnections = edges.length > 0

  if (hasConnections) {
    // 有连线：按连线顺序排序，锁定顺序
    sortBlocksByConnections()
  } else {
    // 无连线：按位置排序
    sortBlocksByPosition()
  }

  // 更新节点编号显示
  updateAllNodeOrders()
  
  // 更新排序模式（用于代码生成时的逻辑判断）
  blockStore.setSortMode(hasConnections ? 'connection' : 'position')
}

// 按连线顺序排序（有连线时使用；容器子积木不参与线性流程排序）
const sortBlocksByConnections = () => {
  if (!graph) return

  const nodes = graph.getNodes().filter(n => !n.getParent()?.isNode())
  const edges = graph.getEdges().filter(e => {
    const s = e.getSourceCell()
    const t = e.getTargetCell()
    return s?.isNode() && t?.isNode() && !s.getParent()?.isNode() && !t.getParent()?.isNode()
  })

  if (edges.length === 0) {
    sortBlocksByPosition()
    return
  }

  // 构建连接映射
  const connectionMap = new Map<string, string[]>()
  edges.forEach(edge => {
    const sourceId = edge.getSourceCellId()
    const targetId = edge.getTargetCellId()
    if (sourceId && targetId) {
      const existing = connectionMap.get(sourceId) || []
      existing.push(targetId)
      connectionMap.set(sourceId, existing)
    }
  })

  // 找出入口节点（没有被连接作为目标的节点）
  const targetIds = new Set(edges.map(e => e.getTargetCellId()))
  const entryNodes = nodes.filter(n => !targetIds.has(n.id))

  // 按连线顺序遍历
  const visited = new Set<string>()
  const ordered: { id: string; order: number }[] = []
  let order = 1

  const traverse = (nodeId: string) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    ordered.push({ id: nodeId, order: order++ })

    const nextIds = connectionMap.get(nodeId) || []
    // 按 Y 坐标排序分支节点
    const sortedNextIds = [...nextIds].sort((a, b) => {
      const nodeA = nodes.find(n => n.id === a)
      const nodeB = nodes.find(n => n.id === b)
      if (nodeA && nodeB) {
        return nodeA.position().y - nodeB.position().y
      }
      return 0
    })
    sortedNextIds.forEach(traverse)
  }

  // 从入口节点开始遍历（按 Y 坐标排序）
  entryNodes.sort((a, b) => a.position().y - b.position().y).forEach(node => {
    traverse(node.id)
  })

  // 处理孤立节点（未连接到流程中的节点，按 Y 坐标排序放在最后）
  const orphanNodes = nodes.filter(n => !visited.has(n.id))
    .sort((a, b) => a.position().y - b.position().y)
  orphanNodes.forEach(node => {
    ordered.push({ id: node.id, order: order++ })
  })

  blockStore.batchUpdateOrders(ordered)
}

// 按位置排序（Y 坐标优先，X 坐标次之；容器子积木不参与线性流程排序）
const sortBlocksByPosition = () => {
  if (!graph) return

  const nodes = graph.getNodes().filter(n => !n.getParent()?.isNode())
  
  // 按 Y 坐标排序，Y 相同按 X 排序
  const sorted = [...nodes].sort((a, b) => {
    const posA = a.position()
    const posB = b.position()
    if (posA.y !== posB.y) return posA.y - posB.y
    return posA.x - posB.x
  })

  // 生成编号更新列表
  const orders = sorted.map((node, index) => ({
    id: node.id,
    order: index + 1
  }))

  // 批量更新编号
  blockStore.batchUpdateOrders(orders)
}

// 一键自动排版
const autoLayout = async (type: string, options: Record<string, unknown> = {}) => {
  if (!graph) return

  const nodes = graph.getNodes()
  const edges = graph.getEdges()

  if (nodes.length === 0) {
    ElMessage.warning('画布上没有节点')
    return
  }

  // U-4 批量操作单次撤销：整段布局合并为一条撤销命令
  graph.startBatch('auto-layout')

  // 构建 @antv/graphlib 需要的数据格式
  const layoutNodes = nodes.map(n => {
    const size = n.getSize()
    return {
      id: n.id,
      data: {
        width: size.width || 180,
        height: size.height || 60
      }
    }
  })

  const layoutEdges = edges.map(e => ({
    id: e.id,
    source: e.getSourceCellId() || '',
    target: e.getTargetCellId() || ''
  }))

  // 创建 LayoutGraph 实例
  const layoutGraph = new LayoutGraph({
    nodes: layoutNodes,
    edges: layoutEdges as any
  })

  let layoutResult: { nodes: { id: string; data: { x: number; y: number; width: number; height: number } }[] } = { nodes: [] }

  if (type === 'dagre') {
    // Dagre 层次布局
    const direction = (options.direction as string) || 'TB'
    const dagreLayout = new DagreLayout({
      rankdir: direction as any,
      nodesep: 80,
      ranksep: 100,
      nodeSize: [180, 60]
    } as any)
    layoutResult = await dagreLayout.execute(layoutGraph as any) as any
    ElMessage.success(`已应用${direction === 'TB' ? '从上到下' : '从左到右'}布局`)
  } else if (type === 'grid') {
    // 网格布局（蛇形排列：按执行顺序，奇数行从左到右，偶数行从右到左）
    const cols = (options.cols as number) || 3
    const customRows = options.rows as number | undefined
    const rows = customRows || Math.ceil(nodes.length / cols)
    
    // 按执行顺序获取节点
    const sortedBlocks = blockStore.sortedBlocks
    
    // 计算每个节点的位置（蛇形排列）
    const nodeWidth = 180
    const nodeHeight = 60
    const gapX = 40  // 水平间距
    const gapY = 40  // 垂直间距
    const startX = 100
    const startY = 100
    
    sortedBlocks.forEach((block, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      // 蛇形排列：偶数行从左到右，奇数行从右到左
      const actualCol = row % 2 === 0 ? col : cols - 1 - col
      
      const x = startX + actualCol * (nodeWidth + gapX)
      const y = startY + row * (nodeHeight + gapY)
      
      const graphNode = graph?.getCellById(block.id)
      if (graphNode && graphNode.isNode()) {
        graphNode.position(x, y)
        blockStore.updateBlockPosition(block.id, x, y)
      }
    })
    
    // 更新连线端口（根据蛇形排列方向）
    const edges = graph?.getEdges()
    edges?.forEach(edge => {
      const sourceId = edge.getSourceCellId()
      const targetId = edge.getTargetCellId()
      
      const sourceBlock = sortedBlocks.find(b => b.id === sourceId)
      const targetBlock = sortedBlocks.find(b => b.id === targetId)
      
      if (sourceBlock && targetBlock) {
        const sourceIndex = sortedBlocks.indexOf(sourceBlock)
        const targetIndex = sortedBlocks.indexOf(targetBlock)
        
        const sourceRow = Math.floor(sourceIndex / cols)
        const targetRow = Math.floor(targetIndex / cols)
        
        if (sourceRow === targetRow) {
          // 同一行：横向连接
          const isLeftToRight = sourceRow % 2 === 0
          edge.setSource({ cell: sourceId!, port: isLeftToRight ? 'right' : 'left' })
          edge.setTarget({ cell: targetId!, port: isLeftToRight ? 'left' : 'right' })
        } else {
          // 跨行：纵向连接
          edge.setSource({ cell: sourceId!, port: 'bottom' })
          edge.setTarget({ cell: targetId!, port: 'top' })
        }
      }
    })
    
    ElMessage.success(`已应用蛇形网格布局 (${cols}列 × ${rows}行)`)

    // 重新排序
    autoSortBlocks()
    updateGeneratedCode()
    graph?.stopBatch('auto-layout')

    // 适应画布
    setTimeout(() => {
      graph?.zoomToFit({ padding: 50, maxScale: 1 })
    }, 100)
    return
  }

  // 应用布局结果到节点
  layoutResult.nodes.forEach(node => {
    const graphNode = graph?.getCellById(node.id)
    if (graphNode && graphNode.isNode()) {
      // 布局返回的是节点中心点坐标，需要转换为左上角坐标
      const x = node.data.x - (node.data.width || 180) / 2
      const y = node.data.y - (node.data.height || 60) / 2
      graphNode.position(x, y)
      // 更新 store 中的位置
      blockStore.updateBlockPosition(node.id, x, y)
    }
  })

  // 重新排序
  autoSortBlocks()
  updateGeneratedCode()
  graph?.stopBatch('auto-layout')

  // 适应画布
  setTimeout(() => {
    graph?.zoomToFit({ padding: 50, maxScale: 1 })
  }, 100)
}

// 更新生成的代码
const updateGeneratedCode = () => {
  const result = generateCodeWithMappings(blockStore.blocks, blockStore.connections)
  generatedCode.value = result.code
  codeMappings.value = result.mappings
  // F-5 空容器体视觉提示
  updateContainerBodyStyles()
  // 内容变更 → 排入防抖自动保存
  scheduleAutosave(getProjectSnapshot, 10000, (time) => { lastAutosaveAt.value = time })
}

// F-5 空容器体提示：既无子积木也无备用文本的容器显示琥珀色底
const updateContainerBodyStyles = () => {
  if (!graph) return
  const cardColor = getThemeColors().bgCard
  graph.getNodes().forEach(node => {
    const def = getBlockDefinition(node.getData()?.definitionId)
    if (def?.nestingType !== 'container') return
    const block = blockStore.getBlockById(node.id)
    const hasChildren = blockStore.blocks.some(b => b.parentId === node.id)
    const hasText = def.properties.some(
      p => p.type === 'code' && String(block?.properties[p.id] ?? '').trim()
    )
    node.setAttrs({ body: { fill: hasChildren || hasText ? cardColor : '#f59e0b22' } })
  })
}

// ==================== B 线规则智能数据流 ====================
// B1-1 变量表（画布扫描）
const variables = computed<VariableInfo[]>(() => collectVariables(blockStore.blocks))

// V-1 变量焦点高亮（悬停声明积木 → 标记全部引用积木，离开恢复）
const varHighlightedNodeIds = new Set<string>()

const highlightVariableReferences = (node: Node) => {
  if (!graph) return
  const g = graph
  const block = blockStore.getBlockById(node.id)
  if (!block) return
  const declared = collectVariables([block])
  if (declared.length === 0) return

  const names = new Set(declared.map(v => v.name.toLowerCase()))
  const selectedIds = new Set(g.getSelectedCells().map(c => c.id))

  blockStore.blocks.forEach(other => {
    if (other.id === node.id || selectedIds.has(other.id)) return
    const refs = occurrenceIndex.value.some(
      o => o.blockId === other.id && names.has(o.identifier.toLowerCase())
    )
    if (!refs) return
    const target = g.getCellById(other.id)
    if (target?.isNode()) {
      target.setAttrs({ body: { stroke: '#f59e0b', strokeWidth: 3 } })
      varHighlightedNodeIds.add(other.id)
    }
  })
}

const clearVariableHighlights = () => {
  if (!graph) return
  const g = graph
  const selectedIds = new Set(g.getSelectedCells().map(c => c.id))
  varHighlightedNodeIds.forEach(id => {
    if (selectedIds.has(id)) return
    const target = g.getCellById(id)
    if (target?.isNode()) {
      target.setAttrs({
        body: { stroke: target.getData()?.color || getThemeColors().primary, strokeWidth: 2 }
      })
    }
  })
  varHighlightedNodeIds.clear()
}
// B1-3 未声明引用警告
const undeclaredWarnings = computed<UndeclaredWarning[]>(() =>
  findUndeclaredReferences(blockStore.blocks, variables.value)
)
// B2-1 生成代码静态校验
const validationErrors = computed<ValidationError[]>(() =>
  generatedCode.value ? validateVBACode(generatedCode.value) : []
)

// ==================== v1.3.0 规则智能深化 ====================
// 全部声明（含重复，F-3）
const variableDeclarations = computed<VariableInfo[]>(() => collectVariableDeclarations(blockStore.blocks))
// 出现索引（F-2/R-1/V-1 反查基座）
const occurrenceIndex = computed(() => buildOccurrenceIndex(blockStore.blocks))
// F-2 未使用变量
const unusedVariables = computed(() => findUnusedVariables(variableDeclarations.value, occurrenceIndex.value))
// F-3 重复声明
const duplicateDeclarations = computed(() => findDuplicateDeclarations(variableDeclarations.value))
// F-4 循环边界启发式检查
const loopBoundWarnings = computed(() => findLoopBoundWarnings(blockStore.blocks))
// R-3 Option Explicit 建议（画布有变量但无 Option 声明）
const suggestOption = computed(() =>
  variables.value.length > 0 &&
  !blockStore.blocks.some(b => b.definitionId === 'block-option-statement')
)

// ==================== v1.4.0 好用专项 ====================
// S-3 页签徽标：变量页签问题数
const variableIssueCount = computed(() =>
  unusedVariables.value.length +
  duplicateDeclarations.value.length +
  loopBoundWarnings.value.length
)

// G-1 空画布引导（无积木时显示）
const showCanvasGuide = computed(() => blockStore.blocks.length === 0)

// G-1 引导：加载示例项目
const guideLoadDemo = () => {
  const demo = demoProjectRaw as unknown as ProjectData
  restoreProjectToCanvas(demo)
  ElMessage.success('示例已载入，试着双击工具箱积木自动接续')
}

// G-1 引导：空画布下从模板开始（无需确认替换）
const loadGuideTemplate = (templateId: string) => {
  const template = projectTemplates.find(t => t.id === templateId)
  if (!template) return
  restoreProjectToCanvas(template.data)
  ElMessage.success(`已载入模板: ${template.name}`)
}

// S-1 状态栏：自动保存时间
const lastAutosaveAt = ref<number | null>(null)
const autosaveTimeText = computed(() => {
  if (!lastAutosaveAt.value) return ''
  return new Date(lastAutosaveAt.value).toLocaleTimeString('zh-CN', { hour12: false })
})

// C-2 容器拖放目标高亮
let dragHoverContainerId: string | null = null
const clearDragHoverHighlight = () => {
  if (dragHoverContainerId && graph) {
    const node = graph.getCellById(dragHoverContainerId)
    if (node?.isNode()) {
      node.setAttrs({
        body: { strokeWidth: 2, stroke: node.getData()?.color || getThemeColors().primary }
      })
    }
  }
  dragHoverContainerId = null
}

const onDragOver = (event: DragEvent) => {
  if (!graph) return
  const point = graph.clientToLocal(event.clientX, event.clientY)
  const container = findContainerAt(point)
  if (container?.id !== dragHoverContainerId) {
    clearDragHoverHighlight()
    if (container) {
      container.setAttrs({ body: { strokeWidth: 4, stroke: '#10b981' } })
      dragHoverContainerId = container.id
    }
  }
}

const onDragLeave = () => {
  clearDragHoverHighlight()
}

// S-4 画布积木搜索
const blockSearchVisible = ref(false)
const blockSearchQuery = ref('')
const blockSearchInput = ref()

const openBlockSearch = () => {
  blockSearchVisible.value = true
  nextTick(() => blockSearchInput.value?.focus())
}

const blockSearchResults = computed(() => {
  const query = blockSearchQuery.value.trim().toLowerCase()
  if (!query) return []
  return blockStore.blocks
    .map(block => {
      const def = getBlockDefinition(block.definitionId)
      const label = def?.label || block.definitionId
      const propText = Object.values(block.properties)
        .filter(v => typeof v === 'string')
        .join(' ')
      const hit = label.toLowerCase().includes(query) || propText.toLowerCase().includes(query)
      return hit
        ? { id: block.id, order: block.order, label, parentId: block.parentId }
        : null
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .slice(0, 8)
})

const onSearchPick = (blockId: string) => {
  blockSearchVisible.value = false
  blockSearchQuery.value = ''
  onCodeLineClick(blockId)
  onCodeLocate(blockId)
}

// P-3 代码预览搜索（Ctrl+F 聚焦）
const codePreviewRef = ref<InstanceType<typeof CodePreview> | null>(null)

// 代码行点击事件处理（仅高亮选中，不移动画布）
const onCodeLineClick = (blockId: string) => {
  // 高亮对应的积木
  highlightedBlockId.value = blockId

  // 选中对应的节点
  const node = graph?.getCellById(blockId)
  if (node && node.isNode()) {
    graph?.cleanSelection()
    graph?.select(node)

    // 更新 selectedNode
    const block = blockStore.getBlockById(blockId)
    selectedNode.value = block
  }
}

// 在画布中定位高亮积木（显式按钮操作，浏览代码不再自动平移画布）
const onCodeLocate = (blockId: string) => {
  if (!blockId) return
  const node = graph?.getCellById(blockId)
  if (node && node.isNode()) {
    graph?.centerCell(node)
  } else {
    ElMessage.warning('未找到对应的积木（可能已被删除）')
  }
}

const onCopyCode = async () => {
  await window.electronAPI?.clipboard.write(generatedCode.value)
  ElMessage.success('代码已复制到剪贴板')
}

const onExportCode = async () => {
  const result = await window.electronAPI?.dialog.save({
    filters: [{ name: 'VBA 模块', extensions: ['bas'] }],
    defaultPath: 'module.bas'
  })
  if (result && !result.canceled && result.filePath) {
    const writeResult = await window.electronAPI?.fs.writeFile(result.filePath, generatedCode.value)
    if (writeResult?.success) {
      ElMessage.success('代码已导出')
    } else {
      ElMessage.error(`导出失败: ${writeResult?.error}`)
    }
  }
}

const saveProject = async (): Promise<boolean> => {
  const projectData = buildProjectData(blockStore.blocks, blockStore.connections, graph?.toJSON())
  const filePath = await saveProjectToFile(projectData)
  if (!filePath) return false

  // 保存成功后创建版本快照并记录最近项目
  historyStore.saveVersion(
    blockStore.blocks,
    blockStore.connections,
    `保存: ${filePath.split(/[/\\]/).pop()}`
  )
  addRecentProject(filePath)
  markSavedBaseline(getProjectSnapshot)
  ElMessage.success('项目已保存')
  return true
}

// 项目数据快照（自动保存用）
const getProjectSnapshot = () => ({ blocks: blockStore.blocks, connections: blockStore.connections })

// 应用项目数据到画布（统一入口，兼容含/不含 graphData 的新旧项目文件）
const applyProjectData = (projectData: ProjectData) => {
  if (!graph) return
  isLoadingProject = true
  // U-4 整体载入合并为一条撤销命令
  graph.startBatch('apply-project')
  try {
    graph.clearCells()
    blockStore.clearBlocks()

    if (projectData.graphData) {
      // 新格式：直接恢复画布（含节点位置与样式），再同步 store
      graph.fromJSON(projectData.graphData as any)
      syncGraphToStore()
    } else {
      // 旧格式（仅 blocks/connections，如旧版标题栏保存的文件）：重建画布
      restoreProjectToCanvas(projectData)
    }

    autoSortBlocks()
    updateGeneratedCode()
  } finally {
    graph.stopBatch('apply-project')
    isLoadingProject = false
  }
}

const loadProject = async () => {
  if (!window.electronAPI) {
    ElMessage.error('当前环境不支持文件读取（缺少 Electron API）')
    return
  }
  const result = await window.electronAPI.dialog.open({
    filters: [{ name: 'VBA 项目', extensions: ['vba.json'] }],
    properties: ['openFile']
  })
  if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
    const projectData = await loadProjectFromPath(result.filePaths[0])
    if (projectData) {
      applyProjectData(projectData)
      addRecentProject(result.filePaths[0])
      ElMessage.success('项目已加载')
    }
  }
}

const exportCode = () => {
  // 复制代码到剪贴板
  navigator.clipboard.writeText(generatedCode.value).then(() => {
    ElMessage.success('代码已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const exportAsImage = async (format: 'png' | 'svg') => {
  if (!graph) return
  
  const nodes = graph.getNodes()
  if (nodes.length === 0) {
    ElMessage.warning('画布为空，无法导出')
    return
  }

  const defaultFilename = `vba-flowchart-${Date.now()}`
  
  // 使用 Electron 对话框选择保存位置
  const result = await window.electronAPI?.dialog.save({
    title: '保存图片',
    defaultPath: defaultFilename,
    filters: [
      { name: format === 'png' ? 'PNG 图片' : 'SVG 图片', extensions: [format] }
    ]
  })

  console.log('Dialog result:', result)

  if (!result || result.canceled || !result.filePath) {
    return
  }

  const filePath = result.filePath
  console.log('Save to:', filePath)

  if (format === 'png') {
    // 使用 canvas 方式导出 PNG
    try {
      // 获取画布容器
      const container = document.getElementById('x6-canvas')
      if (!container) {
        ElMessage.error('无法找到画布容器')
        return
      }
      
      // 获取 SVG 元素
      const svgElement = container.querySelector('svg.x6-graph-svg') as SVGSVGElement
      if (!svgElement) {
        ElMessage.error('无法找到画布 SVG')
        return
      }

      // 克隆 SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
      
      // 获取画布边界
      const bbox = graph.getContentBBox()
      const padding = 20
      const width = bbox.width + padding * 2
      const height = bbox.height + padding * 2
      
      // 设置 SVG 属性
      clonedSvg.setAttribute('width', String(width))
      clonedSvg.setAttribute('height', String(height))
      clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`)
      
      // 添加背景色
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bgRect.setAttribute('x', String(bbox.x - padding))
      bgRect.setAttribute('y', String(bbox.y - padding))
      bgRect.setAttribute('width', String(width))
      bgRect.setAttribute('height', String(height))
      bgRect.setAttribute('fill', '#1a1a2e')
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild)
      
      // 序列化 SVG
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
      
      // 创建图片
      const img = new Image()
      img.onload = async () => {
        // 创建 canvas
        const canvas = document.createElement('canvas')
        canvas.width = width * 2  // 2x for high DPI
        canvas.height = height * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          ElMessage.error('无法创建 canvas')
          return
        }
        
        // 设置背景色
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 绘制 SVG
        ctx.scale(2, 2)
        ctx.drawImage(img, 0, 0)
        
        // 转换为 data URL
        const dataUrl = canvas.toDataURL('image/png')
        
        // 保存文件
        const saveResult = await window.electronAPI?.fs.saveImage(filePath, dataUrl)
        console.log('saveImage result:', saveResult)
        
        if (saveResult?.success) {
          ElMessage.success('PNG 图片已导出')
        } else {
          ElMessage.error('导出失败: ' + (saveResult?.error || '未知错误'))
        }
        
        URL.revokeObjectURL(svgUrl)
      }
      
      img.onerror = () => {
        ElMessage.error('图片加载失败')
        URL.revokeObjectURL(svgUrl)
      }
      
      img.src = svgUrl
      
    } catch (error) {
      console.error('导出 PNG 失败:', error)
      ElMessage.error('导出失败')
    }
  } else {
    // 导出为 SVG
    try {
      // 获取画布容器
      const container = document.getElementById('x6-canvas')
      if (!container) {
        ElMessage.error('无法找到画布容器')
        return
      }
      
      // 获取 SVG 元素
      const svgElement = container.querySelector('svg.x6-graph-svg') as SVGSVGElement
      if (!svgElement) {
        ElMessage.error('无法找到画布 SVG')
        return
      }

      // 克隆 SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
      
      // 获取画布边界
      const bbox = graph.getContentBBox()
      const padding = 20
      const width = bbox.width + padding * 2
      const height = bbox.height + padding * 2
      
      // 设置 SVG 属性
      clonedSvg.setAttribute('width', String(width))
      clonedSvg.setAttribute('height', String(height))
      clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`)
      
      // 添加背景色
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bgRect.setAttribute('x', String(bbox.x - padding))
      bgRect.setAttribute('y', String(bbox.y - padding))
      bgRect.setAttribute('width', String(width))
      bgRect.setAttribute('height', String(height))
      bgRect.setAttribute('fill', '#1a1a2e')
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild)
      
      // 序列化 SVG
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      
      const saveResult = await window.electronAPI?.fs.saveSVG(filePath, svgData)
      console.log('saveSVG result:', saveResult)
      
      if (saveResult?.success) {
        ElMessage.success('SVG 图片已导出')
      } else {
        ElMessage.error('导出失败: ' + (saveResult?.error || '未知错误'))
      }
    } catch (error) {
      console.error('导出 SVG 失败:', error)
      ElMessage.error('导出失败')
    }
  }
}

// ==================== 右侧面板宽度调整 ====================
const startResize = (_e: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', handlePanelResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handlePanelResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  const containerRect = document.querySelector('.editor-view')?.getBoundingClientRect()
  if (containerRect) {
    const newWidth = containerRect.right - e.clientX
    rightPanelWidth.value = Math.max(280, Math.min(600, newWidth))
  }
}

const stopResize = () => {
  try {
    localStorage.setItem(PANEL_WIDTH_KEY, String(rightPanelWidth.value))
  } catch {
    // 存储不可用时忽略
  }
  isResizing.value = false
  document.removeEventListener('mousemove', handlePanelResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ==================== 代码编辑功能 ====================
const onEditCode = () => {
  if (selectedNode.value) {
    // 生成当前积木的实际代码（属性已替换）
    const actualCode = generateBlockCode(selectedNode.value)
    editingCode.value = actualCode
    editingBlockId.value = selectedNode.value.id
    codeEditorVisible.value = true
  }
}

// 当前积木是否被自定义代码覆盖（覆盖时属性面板改动对生成代码无效）
const hasCustomCode = computed(() => {
  const code = selectedNode.value?.properties?._customCode
  return typeof code === 'string' && code.trim().length > 0
})

const saveCustomCode = () => {
  if (selectedNode.value && editingCode.value) {
    // 保存自定义代码到积木属性
    blockStore.updateBlockProperty(selectedNode.value.id, '_customCode', editingCode.value)
    updateGeneratedCode()
    codeEditorVisible.value = false
    ElMessage.success('代码已保存')
  }
}

// 清除自定义代码，恢复按属性模板生成
const restoreCustomCode = () => {
  if (selectedNode.value) {
    onPropertyUpdate(selectedNode.value.id, '_customCode', '')
    codeEditorVisible.value = false
    ElMessage.success('已恢复为按属性模板生成代码')
  }
}

// ==================== 属性编辑对话框 ====================
const openPropertyDialog = (block: BlockInstance) => {
  editingBlock.value = block
  dialogProperties.value = { ...block.properties }
  propertyDialogVisible.value = true
}

const savePropertyDialog = () => {
  if (editingBlock.value) {
    // 批量更新属性（同步画布节点数据，保证保存的 graphData 携带最新属性）
    Object.entries(dialogProperties.value).forEach(([key, value]) => {
      blockStore.updateBlockProperty(editingBlock.value!.id, key, value)
      const node = graph?.getCellById(editingBlock.value!.id)
      if (node) {
        node.setData({
          properties: {
            ...node.getData()?.properties,
            [key]: value
          }
        })
      }
    })
    updateGeneratedCode()
    propertyDialogVisible.value = false
    ElMessage.success('属性已保存')
  }
}

// ==================== 版本历史功能 ====================
const onRestoreVersion = (version: { blocks: BlockInstance[]; connections: Connection[] }) => {
  if (!graph) return

  // 批量重建期间挂起逐节点事件处理（避免撤销栈与排序抖动）
  isLoadingProject = true
  graph.startBatch('restore-version')
  try {
    // 清空当前画布
    graph.clearCells()
    blockStore.clearBlocks()

    // 恢复版本数据
    restoreProjectToCanvas(version)
  } finally {
    graph.stopBatch('restore-version')
    isLoadingProject = false
  }
  updateUndoRedoState()
}

// ==================== 导入代码功能 ====================
const onImportCode = (data: { blocks: BlockInstance[]; connections: Connection[] }) => {
  if (!graph) return

  // 将导入的积木添加到画布（连接同步写入 blockStore，见 restoreProjectToCanvas）
  restoreProjectToCanvas(data)

  // 创建版本快照
  historyStore.saveVersion(
    blockStore.blocks,
    blockStore.connections,
    '导入 VBA 代码'
  )
}

// ==================== 自动保存恢复 ====================
const maybeRestoreAutosave = async () => {
  if (!graph) return
  // 已从首页带入项目数据时不提示
  if (blockStore.blocks.length > 0) return

  const draft = getAutosaveData()
  if (!draft) return

  const savedAtText = draft.savedAt
    ? new Date(draft.savedAt).toLocaleString('zh-CN', { hour12: false })
    : '时间未知'

  try {
    await ElMessageBox.confirm(
      `检测到上次会话的自动保存草稿（${savedAtText}，共 ${draft.blocks.length} 个积木），是否恢复？`,
      '恢复自动保存',
      {
        confirmButtonText: '恢复',
        cancelButtonText: '不恢复',
        type: 'info'
      }
    )
    restoreProjectToCanvas(draft)
    ElMessage.success('已恢复自动保存的内容')
  } catch {
    // 用户放弃恢复
  }
  // 无论是否恢复都清除草稿，避免重复提示
  clearAutosave()
}

// ==================== 路由离开拦截 ====================
onBeforeRouteLeave(async (_to, _from, next) => {
  if (blockStore.blocks.length === 0) {
    next()
    return
  }
  try {
    await ElMessageBox.confirm(
      '编辑器中存在未保存的项目，离开前请确认。系统已自动保存草稿，下次进入编辑器时可恢复。',
      '未保存的更改',
      {
        confirmButtonText: '离开',
        cancelButtonText: '留在编辑器',
        type: 'warning'
      }
    )
    flushAutosave(getProjectSnapshot)
    next()
  } catch {
    next(false)
  }
})

// ==================== 节点右键菜单动作 ====================
const onContextAction = (action: string) => {
  const nodeId = contextMenu.nodeId
  contextMenu.visible = false
  if (!graph || !nodeId) return
  const cell = graph.getCellById(nodeId)
  if (!cell) return

  switch (action) {
    case 'edit': {
      const block = blockStore.getBlockById(nodeId)
      if (block) {
        selectedNode.value = block
        graph.select(nodeId)
        openPropertyDialog(block)
      }
      break
    }
    case 'copy':
      graph.copy([cell])
      ElMessage.success('已复制，可 Ctrl+V 或右键粘贴')
      break
    case 'paste': {
      if (graph.isClipboardEmpty()) {
        ElMessage.info('剪贴板为空')
        return
      }
      const cells = graph.paste({ offset: 32 })
      if (cells) {
        graph.cleanSelection()
        graph.select(cells)
      }
      break
    }
    case 'disconnect': {
      const connectedEdges = graph.getEdges().filter(e =>
        e.getSourceCellId() === nodeId || e.getTargetCellId() === nodeId
      )
      if (connectedEdges.length === 0) {
        ElMessage.info('该积木没有连线')
        return
      }
      graph.removeCells(connectedEdges)
      ElMessage.success(`已断开 ${connectedEdges.length} 条连线`)
      break
    }
    case 'delete':
      // 容器级联删除全部子积木
      graph.removeCell(cell, { deep: true } as any)
      break
  }
}

// H-2 容器折叠/展开：隐藏子积木与体内容连线，容器标题显示子积木数
const setContainerCollapsed = (containerId: string, collapsed: boolean) => {
  if (!graph) return
  const g = graph
  const container = g.getCellById(containerId)
  if (!container?.isNode()) return

  const childBlocks = blockStore.blocks.filter(b => b.parentId === containerId)
  const childIds = new Set(childBlocks.map(b => b.id))

  g.getEdges().forEach(edge => {
    if (childIds.has(edge.getSourceCellId()) || childIds.has(edge.getTargetCellId())) {
      edge.setVisible(!collapsed)
    }
  })
  childBlocks.forEach(b => {
    const childNode = g.getCellById(b.id)
    if (childNode) childNode.setVisible(!collapsed)
  })

  const origLabel = container.getData()?.label || ''
  if (collapsed) {
    collapsedContainers.value = new Set([...collapsedContainers.value, containerId])
    container.attr('label/text', `${origLabel}（▸ ${childBlocks.length} 子积木）`)
    container.resize(220, 60)
  } else {
    const next = new Set(collapsedContainers.value)
    next.delete(containerId)
    collapsedContainers.value = next
    container.attr('label/text', origLabel)
    resizeContainer(container)
  }
  container.setData({ collapsed })
}

const onToggleCollapse = (containerId: string) => {
  contextMenu.visible = false
  setContainerCollapsed(containerId, !collapsedContainers.value.has(containerId))
}

// C-1 连线右键菜单动作
const onEdgeMenuAction = (action: string) => {
  const edgeId = contextMenu.edgeId
  contextMenu.visible = false
  if (!graph || !edgeId) return
  const edge = graph.getEdges().find(e => e.id === edgeId)
  if (!edge) return

  switch (action) {
    case 'delete':
      graph.removeCell(edge)
      ElMessage.success('连线已删除')
      break
    case 'locate-source':
      onSearchPick(edge.getSourceCellId())
      break
    case 'locate-target':
      onSearchPick(edge.getTargetCellId())
      break
  }
}
</script>

<style lang="scss" scoped>
.editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

#x6-canvas {
  width: 100%;
  height: 100%;
}

.right-panel {
  min-width: 280px;
  max-width: 600px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: relative;
}

.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover .resize-line {
    background: var(--primary-color);
  }
}

.resize-line {
  width: 2px;
  height: 40px;
  background: var(--border-color);
  border-radius: 1px;
  transition: background 0.2s;
}

.panel-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-left: 6px;

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 16px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color);
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: auto;
    padding: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.code-editor-container {
  width: 100%;
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

// 节点右键菜单
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 140px;
  padding: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-fast);

    .el-icon {
      font-size: 14px;
      color: var(--text-secondary);
    }

    &:hover {
      background: var(--bg-tertiary);

      .el-icon {
        color: var(--primary-color);
      }
    }

    &.danger {
      color: var(--error, #ef4444);

      .el-icon {
        color: var(--error, #ef4444);
      }

      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }
  }
}

// G-1 空画布引导
.canvas-guide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  pointer-events: none;
  z-index: 5;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 24px;
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.guide-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);

  b {
    color: var(--text-primary);
  }
}

.guide-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.guide-actions {
  display: flex;
  gap: 10px;
  pointer-events: auto;
}

// C-4 小地图
.minimap-container {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 164px;
  height: 104px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  z-index: 10;
}

// S-4 画布积木搜索
.block-search {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 280px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 20;
  padding: 8px;
}

.block-search-results {
  margin-top: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.block-search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;

  &:hover {
    background: var(--bg-tertiary);
  }

  .search-order {
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }

  .search-child-tag {
    margin-left: auto;
    font-size: 10px;
    color: #f59e0b;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 0 6px;
  }
}

.block-search-empty {
  padding: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

// S-1 底部状态栏
.status-bar {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  color: var(--text-secondary);
  user-select: none;

  .status-spacer {
    flex: 1;
  }

  .status-problem {
    color: #ef4444;
    font-weight: 600;
  }

  .status-clickable {
    cursor: pointer;

    &:hover {
      color: var(--primary-color);
    }
  }
}

// S-3 页签徽标
.tab-badge {
  margin-left: 6px;
  transform: translateY(-1px);
}

// 属性编辑对话框样式
.property-dialog-content {
  max-height: 400px;
  overflow-y: auto;
}

.property-dialog-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.property-dialog-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}
</style>
