<template>
  <div class="editor-view">
    <!-- 左侧积木工具箱 -->
    <BlockToolbox :blocks="blockDefinitions" @drag-start="onDragStart" />

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
        @dragover.prevent
        @drop="onDrop"
      >
        <div id="x6-canvas" ref="x6Canvas"></div>
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
          <PropertyPanel :selected-node="selectedNode" @update="onPropertyUpdate" @move-up="onMoveUp" @move-down="onMoveDown" @edit-code="onEditCode" />
        </el-tab-pane>
        <el-tab-pane label="代码预览" name="code">
          <CodePreview 
          :code="generatedCode" 
          :mappings="codeMappings"
          :highlighted-block-id="highlightedBlockId"
          @copy="onCopyCode" 
          @export="onExportCode"
          @line-click="onCodeLineClick"
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

          <!-- 代码输入 -->
          <el-input
            v-else-if="prop.type === 'code'"
            v-model="dialogProperties[prop.id]"
            type="textarea"
            :rows="5"
            :placeholder="prop.placeholder"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, computed, watch, nextTick } from 'vue'
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
// @ts-ignore
import { Graph as LayoutGraph } from '@antv/graphlib'
// @ts-ignore
import { DagreLayout, GridLayout } from '@antv/layout'
import { ElMessage, ElMessageBox } from 'element-plus'
import BlockToolbox from '@/components/blocks/BlockToolbox.vue'
import CanvasToolbar from '@/components/canvas/CanvasToolbar.vue'
import PropertyPanel from '@/components/panel/PropertyPanel.vue'
import CodePreview from '@/components/panel/CodePreview.vue'
import HistoryPanel from '@/components/panel/HistoryPanel.vue'
import ImportCodeDialog from '@/components/panel/ImportCodeDialog.vue'
import ShortcutHelp from '@/components/common/ShortcutHelp.vue'
import { useBlockStore } from '@/stores/blockStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useThemeStore, getThemeColors } from '@/stores/themeStore'
import { blockDefinitions, getBlockDefinition } from '@/utils/blockDefinitions'
import { registerCustomNode, createBlockNode, createEdgeStyle, embedNode, unembedNode, canEmbed, updateNodeOrder } from '@/utils/customNode'
import { generateBlockCode, generateCodeWithMappings, type CodeMapping } from '@/utils/codeGenerator'
import type { BlockInstance, BlockDefinition, Connection } from '@/types'
import type { Node } from '@antv/x6'

// 注册自定义节点
registerCustomNode()
createEdgeStyle()

const blockStore = useBlockStore()
const canvasStore = useCanvasStore()
const historyStore = useHistoryStore()
const themeStore = useThemeStore()

const activeTab = ref('properties')
const selectedNode = ref<BlockInstance | null>(null)
const generatedCode = ref('')
const codeMappings = ref<CodeMapping[]>([])
const highlightedBlockId = ref<string | null>(null)
const canvasContainer = ref<HTMLElement>()
const x6Canvas = ref<HTMLElement>()

// 右侧面板宽度调整
const rightPanelWidth = ref(320)
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
})

// 监听主题变化
watch(() => themeStore.theme, () => {
  // 延迟更新以确保CSS变量已更新
  nextTick(() => {
    updateCanvasTheme()
  })
})

onUnmounted(() => {
  graph?.dispose()
  window.removeEventListener('resize', handleWindowResize)
  // 清理右键框选事件监听器
  if (rubberbandCleanup) {
    rubberbandCleanup()
  }
})

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
      validateConnection({ targetMagnet }: { targetMagnet: unknown }) {
        return !!targetMagnet
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
  graph.use(new History({ enabled: true }))
  graph.use(new Keyboard({ enabled: true }))
  // Selection 插件配置：
  // - rubberband: false 禁用左键框选
  // - modifiers: [] 移除修饰键限制
  // - movable: true 允许批量移动选中节点
  // - showNodeSelectionBox: true 显示选中框
  graph.use(new Selection({ 
    enabled: true, 
    multiple: true, 
    rubberband: false, 
    modifiers: [],
    movable: true,
    showNodeSelectionBox: true
  }))
  graph.use(new Snapline({ enabled: true }))
  graph.use(new Clipboard({ enabled: true }))
  graph.use(new Export())

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
    // 删除: Delete / Backspace
    keyboard.bindKey(['delete', 'backspace'], () => {
      const cells = graph?.getSelectedCells()
      if (cells && cells.length) {
        graph?.removeCells(cells)
      }
    })
    // 复制: Ctrl+C
    keyboard.bindKey('ctrl+c', () => {
      const cells = graph?.getSelectedCells()
      if (cells && cells.length) {
        graph?.copy(cells)
        ElMessage.success('已复制')
      }
    })
    // 粘贴: Ctrl+V
    keyboard.bindKey('ctrl+v', () => {
      if (graph?.isClipboardEmpty()) {
        return
      }
      const cells = graph?.paste({ offset: 32 })
      if (cells) {
        graph?.cleanSelection()
        graph?.select(cells)
      }
    })
    // 全选: Ctrl+A
    keyboard.bindKey('ctrl+a', () => {
      const nodes = graph?.getNodes()
      if (nodes && nodes.length) {
        graph?.select(nodes)
      }
    })
    // 帮助: F1
    keyboard.bindKey('f1', (e: KeyboardEvent) => {
      e.preventDefault()
      shortcutHelpRef.value?.open()
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
    // 高亮对应代码行
    highlightedBlockId.value = node.id
    // 切换到代码预览标签页
    activeTab.value = 'code'
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
      }
    }
  }

  // 监听节点删除
  graph.on('node:removed', ({ node }) => {
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
      // 添加新连接
      canvasStore.addConnection(connectionData)
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
          order: blockStore.blocks.length + 1
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

  // 阻止右键菜单
  const handleContextMenu = (e: MouseEvent) => {
    // 在框选过程中阻止右键菜单
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

  // 先添加所有 blocks 到 store（必须在创建节点之前）
  projectData.blocks.forEach(block => {
    if (!blockStore.getBlockById(block.id)) {
      blockStore.addBlock(block)
    }
  })

  // 创建所有节点
  projectData.blocks.forEach(block => {
    const blockDef = getBlockDefinition(block.definitionId)
    if (blockDef) {
      const node = createBlockNode(graph!, blockDef, block.position.x, block.position.y, block.id, block.order || 1)
      // 更新节点数据
      node.setData({
        definitionId: block.definitionId,
        blockType: block.type,
        nestingType: blockDef.nestingType,
        color: blockDef.color,
        properties: { ...block.properties }
      })
    }
  })

  // 创建所有连接（兼容旧端口 ID 和缺失端口 ID）
  projectData.connections.forEach(conn => {
    // 兼容旧的端口 ID：out -> bottom, in -> top
    // 同时处理 undefined 的情况，默认使用 bottom/top
    const sourcePort = conn.sourcePortId === 'out' ? 'bottom' : (conn.sourcePortId || 'bottom')
    const targetPort = conn.targetPortId === 'in' ? 'top' : (conn.targetPortId || 'top')
    
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

    if (existingBlock) {
      // 更新现有积木的位置和属性
      existingBlock.position = { x: pos.x, y: pos.y }
      if (data?.properties) {
        existingBlock.properties = { ...data.properties }
      }
    } else if (data?.definitionId) {
      // 添加新积木（撤销恢复的节点）
      const blockInstance: BlockInstance = {
        id: node.id,
        definitionId: data.definitionId,
        type: data.blockType,
        position: { x: pos.x, y: pos.y },
        properties: { ...data.properties },
        order: blockStore.blocks.length + 1
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

  const blockId = event.dataTransfer?.getData('blockId')
  if (!blockId) return

  const blockDef = getBlockDefinition(blockId)
  if (!blockDef) return

  // 使用 X6 的 clientToLocal 方法正确转换坐标
  // 传入客户端坐标，自动处理缩放和平移
  const point = graph.clientToLocal(event.clientX, event.clientY)

  // 节点宽度一半作为偏移，使节点中心在鼠标位置
  const nodeWidth = blockDef.nestingType === 'container' ? 110 : 90
  const nodeHeight = blockDef.nestingType === 'container' ? 60 : 30

  // 创建节点 ID
  const nodeId = `block-${Date.now()}`

  // 初始化默认属性
  const defaultProperties: Record<string, unknown> = {}
  blockDef.properties.forEach(prop => {
    defaultProperties[prop.id] = prop.defaultValue
  })

  // 先添加到 store（必须在创建节点之前，否则 cell:added 事件会重复添加）
  const blockInstance: BlockInstance = {
    id: nodeId,
    definitionId: blockId,
    type: blockDef.type,
    position: { x: point.x - nodeWidth, y: point.y - nodeHeight },
    properties: { ...defaultProperties },
    order: 1
  }
  blockStore.addBlock(blockInstance)

  // 创建节点（order 先设为 1，后面会自动排序）
  const node = createBlockNode(graph, blockDef, point.x - nodeWidth, point.y - nodeHeight, nodeId, 1)
  
  // 更新节点数据，包含完整属性
  node.setData({
    definitionId: blockId,
    blockType: blockDef.type,
    nestingType: blockDef.nestingType,
    color: blockDef.color,
    properties: { ...defaultProperties }
  })
  
  // 添加节点后自动排序
  autoSortBlocks()
  updateGeneratedCode()

  ElMessage.success(`已添加: ${blockDef.label}`)
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
        graph?.clearCells()
        blockStore.clearBlocks()
        generatedCode.value = ''
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
    case 'layout':
      if (payload) {
        autoLayout(payload.type as string, payload)
      }
      break
  }
}

const onPropertyUpdate = (propertyId: string, value: unknown) => {
  if (selectedNode.value) {
    blockStore.updateBlockProperty(selectedNode.value.id, propertyId, value)
    // 更新画布节点数据
    const node = graph?.getCellById(selectedNode.value.id)
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
}

// 上移积木
const onMoveUp = () => {
  if (selectedNode.value) {
    updateAllNodeOrders()
    updateGeneratedCode()
  }
}

// 下移积木
const onMoveDown = () => {
  if (selectedNode.value) {
    updateAllNodeOrders()
    updateGeneratedCode()
  }
}

// 更新所有节点的编号显示
const updateAllNodeOrders = () => {
  if (!graph) return
  blockStore.sortedBlocks.forEach(block => {
    const node = graph?.getCellById(block.id)
    if (node && node.isNode()) {
      updateNodeOrder(node, block.order)
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

// 按连线顺序排序（有连线时使用）
const sortBlocksByConnections = () => {
  if (!graph) return

  const nodes = graph.getNodes()
  const edges = graph.getEdges()
  
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

// 按位置排序（Y 坐标优先，X 坐标次之）
const sortBlocksByPosition = () => {
  if (!graph) return

  const nodes = graph.getNodes()
  
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
}

// 代码行点击事件处理
const onCodeLineClick = (blockId: string) => {
  // 高亮对应的积木
  highlightedBlockId.value = blockId
  
  // 选中对应的节点
  const node = graph?.getCellById(blockId)
  if (node && node.isNode()) {
    graph?.cleanSelection()
    graph?.select(node)
    
    // 将节点滚动到视图中
    node.toFront()
    graph?.centerCell(node)
    
    // 更新 selectedNode
    const block = blockStore.getBlockById(blockId)
    selectedNode.value = block
    
    // 3秒后取消高亮
    setTimeout(() => {
      highlightedBlockId.value = null
    }, 3000)
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
  console.log('saveProject called, electronAPI:', !!window.electronAPI)
  const result = await window.electronAPI?.dialog.save({
    filters: [{ name: 'VBA 项目', extensions: ['vba.json'] }],
    defaultPath: 'project.vba.json'
  })
  console.log('dialog.save result:', result)
  if (result && !result.canceled && result.filePath) {
    const projectData = {
      version: '1.0.0',
      blocks: blockStore.blocks,
      connections: blockStore.connections,
      graphData: graph?.toJSON()
    }
    const writeResult = await window.electronAPI?.fs.writeFile(
      result.filePath, 
      JSON.stringify(projectData, null, 2)
    )
    if (writeResult?.success) {
      // 保存成功后创建版本快照
      historyStore.saveVersion(
        blockStore.blocks,
        blockStore.connections,
        `保存: ${result.filePath.split(/[/\\]/).pop()}`
      )
      ElMessage.success('项目已保存')
      return true
    } else {
      ElMessage.error(`保存失败: ${writeResult?.error}`)
      return false
    }
  }
  // 用户取消了保存对话框
  return false
}

const loadProject = async () => {
  const result = await window.electronAPI?.dialog.open({
    filters: [{ name: 'VBA 项目', extensions: ['vba.json'] }],
    properties: ['openFile']
  })
  if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
    const readResult = await window.electronAPI?.fs.readFile(result.filePaths[0])
    if (readResult?.success && readResult.content) {
      try {
        const projectData = JSON.parse(readResult.content)
        
        // 清空当前画布
        graph?.clearCells()
        blockStore.clearBlocks()
        
        // 恢复画布数据
        if (projectData.graphData) {
          graph?.fromJSON(projectData.graphData)
        }
        
        // 恢复积木数据
        if (projectData.blocks) {
          projectData.blocks.forEach((block: BlockInstance) => {
            blockStore.addBlock(block)
          })
        }
        
        // 恢复连接数据
        if (projectData.connections) {
          projectData.connections.forEach((conn: Connection) => {
            blockStore.addConnection(conn)
          })
        }
        
        updateGeneratedCode()
        ElMessage.success('项目已加载')
      } catch (e) {
        ElMessage.error('项目文件格式错误')
      }
    } else {
      ElMessage.error(`加载失败: ${readResult?.error}`)
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

const saveCustomCode = () => {
  if (selectedNode.value && editingCode.value) {
    // 保存自定义代码到积木属性
    blockStore.updateBlockProperty(selectedNode.value.id, '_customCode', editingCode.value)
    updateGeneratedCode()
    codeEditorVisible.value = false
    ElMessage.success('代码已保存')
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
    // 批量更新属性
    Object.entries(dialogProperties.value).forEach(([key, value]) => {
      blockStore.updateBlockProperty(editingBlock.value!.id, key, value)
    })
    updateGeneratedCode()
    propertyDialogVisible.value = false
    ElMessage.success('属性已保存')
  }
}

// ==================== 版本历史功能 ====================
const onRestoreVersion = (version: { blocks: BlockInstance[]; connections: Connection[] }) => {
  if (!graph) return

  // 清空当前画布
  graph.clearCells()
  blockStore.clearBlocks()

  // 恢复版本数据
  restoreProjectToCanvas(version)
}

// ==================== 导入代码功能 ====================
const onImportCode = (data: { blocks: BlockInstance[]; connections: Connection[] }) => {
  if (!graph) return

  // 将导入的积木添加到画布
  restoreProjectToCanvas(data)
  
  // 创建版本快照
  historyStore.saveVersion(
    blockStore.blocks,
    blockStore.connections,
    '导入 VBA 代码'
  )
}

// 提供画布实例
provide('graph', graph)
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
