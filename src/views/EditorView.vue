<template>
  <div class="editor-view">
    <!-- 左侧积木工具箱 -->
    <BlockToolbox :blocks="blockDefinitions" @drag-start="onDragStart" />

    <!-- 中间画布区域 -->
    <div class="canvas-area">
      <CanvasToolbar 
        :can-undo="canvasStore.canUndo"
        :can-redo="canvasStore.canRedo"
        @action="onToolbarAction" 
      />
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
          <CodePreview :code="generatedCode" @copy="onCopyCode" @export="onExportCode" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, computed } from 'vue'
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
import { ElMessage } from 'element-plus'
import BlockToolbox from '@/components/blocks/BlockToolbox.vue'
import CanvasToolbar from '@/components/canvas/CanvasToolbar.vue'
import PropertyPanel from '@/components/panel/PropertyPanel.vue'
import CodePreview from '@/components/panel/CodePreview.vue'
import { useBlockStore } from '@/stores/blockStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { blockDefinitions, getBlockDefinition } from '@/utils/blockDefinitions'
import { registerCustomNode, createBlockNode, createEdgeStyle, embedNode, unembedNode, canEmbed, updateNodeOrder } from '@/utils/customNode'
import { generateCode, generateBlockCode } from '@/utils/codeGenerator'
import type { BlockInstance, BlockDefinition, Connection } from '@/types'
import type { Node } from '@antv/x6'

// 注册自定义节点
registerCustomNode()
createEdgeStyle()

const blockStore = useBlockStore()
const canvasStore = useCanvasStore()

const activeTab = ref('properties')
const selectedNode = ref<BlockInstance | null>(null)
const generatedCode = ref('')
const canvasContainer = ref<HTMLElement>()
const x6Canvas = ref<HTMLElement>()

// 右侧面板宽度调整
const rightPanelWidth = ref(320)
const isResizing = ref(false)

// 代码编辑器
const codeEditorVisible = ref(false)
const editingCode = ref('')
const editingBlockId = ref<string | null>(null)

// 属性编辑对话框
const propertyDialogVisible = ref(false)
const editingBlock = ref<BlockInstance | null>(null)
const dialogProperties = ref<Record<string, unknown>>({})

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

// 初始化画布
onMounted(() => {
  initCanvas()
  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  graph?.dispose()
  window.removeEventListener('resize', handleWindowResize)
})

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

  graph = new Graph({
    container: x6Canvas.value,
    width: x6Canvas.value.offsetWidth,
    height: x6Canvas.value.offsetHeight,
    background: {
      color: '#1a1a2e'
    },
    grid: {
      visible: true,
      type: 'dot',
      size: 20,
      args: {
        color: '#2a2a4a',
        thickness: 1
      }
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
      allowEdge: false,
      allowPort: true,
      highlight: true,
      connector: 'rounded',
      router: {
        name: 'manhattan',
        args: {
          padding: 20
        }
      },
      validateConnection({ targetMagnet }) {
        return !!targetMagnet
      },
      createEdge() {
        return graph!.createEdge({
          shape: 'custom-edge',
          attrs: {
            line: {
              stroke: '#6366f1',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 8,
                height: 8
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
            stroke: '#6366f1',
            fill: '#6366f133'
          }
        }
      }
    },
    interacting: {
      nodeMovable: true,
      edgeMovable: true,
      edgeLabelMovable: true,
      magnetConnectable: true
    }
  })

  // 使用插件
  graph.use(new History({ enabled: true }))
  graph.use(new Keyboard({ enabled: true }))
  graph.use(new Selection({ enabled: true, multiple: true, rubberband: true }))
  graph.use(new Snapline({ enabled: true }))
  graph.use(new Clipboard({ enabled: true }))

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
  })

  graph.on('node:unselected', () => {
    selectedNode.value = null
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

  // 端口显示/隐藏交互
  graph.on('node:mouseenter', ({ node }) => {
    node.getPorts().forEach(port => {
      node.portProp(port.id!, {
        attrs: {
          circle: {
            style: { visibility: 'visible' }
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
            style: { visibility: 'hidden' }
          }
        }
      })
    })
  })

  // 监听节点移动
  graph.on('node:moved', ({ node }) => {
    const position = node.position()
    blockStore.updateBlockPosition(node.id, position.x, position.y)

    // 检查是否需要嵌入容器
    checkAndEmbed(node)

    // 如果没有连线，按位置自动排序
    if (!blockStore.hasConnections) {
      autoSortBlocks()
    }
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
    canvasStore.addConnection({
      id: edge.id,
      sourceBlockId: edge.getSourceCellId() || '',
      sourcePortId: edge.getSourcePortId() || '',
      targetBlockId: edge.getTargetCellId() || '',
      targetPortId: edge.getTargetPortId() || ''
    })
    // 连线后自动排序
    autoSortBlocks()
    updateGeneratedCode()
    updateUndoRedoState()
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

  // 创建所有节点
  projectData.blocks.forEach(block => {
    const blockDef = getBlockDefinition(block.definitionId)
    if (blockDef) {
      createBlockNode(graph!, blockDef, block.position.x, block.position.y, block.id, 1)
    }
  })

  // 创建所有连接
  projectData.connections.forEach(conn => {
    graph?.addEdge({
      id: conn.id,
      shape: 'custom-edge',
      source: { cell: conn.sourceBlockId, port: conn.sourcePortId },
      target: { cell: conn.targetBlockId, port: conn.targetPortId }
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

  // 创建节点（order 先设为 1，后面会自动排序）
  createBlockNode(graph, blockDef, point.x - nodeWidth, point.y - nodeHeight, nodeId, 1)

  // 添加到 store
  const blockInstance: BlockInstance = {
    id: nodeId,
    definitionId: blockId,
    type: blockDef.type,
    position: { x: point.x - nodeWidth, y: point.y - nodeHeight },
    properties: {},
    order: 1
  }

  // 初始化默认属性
  blockDef.properties.forEach(prop => {
    blockInstance.properties[prop.id] = prop.defaultValue
  })

  blockStore.addBlock(blockInstance)
  
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

const onToolbarAction = (action: string) => {
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
    case 'clear':
      graph?.clearCells()
      blockStore.clearBlocks()
      generatedCode.value = ''
      history?.clean()
      updateUndoRedoState()
      break
    case 'save':
      saveProject()
      break
    case 'load':
      loadProject()
      break
    case 'export':
      exportProject()
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
      const blockDef = getBlockDefinition(block.definitionId)
      updateNodeOrder(node, block.order, blockDef?.color)
    }
  })
}

// 自动排序积木（始终按 Y 坐标排序显示编号）
const autoSortBlocks = () => {
  if (!graph) return

  const edges = graph.getEdges()
  const hasConnections = edges.length > 0

  // 始终按位置排序（Y 坐标优先）
  sortBlocksByPosition()

  // 更新节点编号显示
  updateAllNodeOrders()
  
  // 更新排序模式（用于代码生成时的逻辑判断）
  blockStore.setSortMode(hasConnections ? 'connection' : 'position')
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

// 更新生成的代码
const updateGeneratedCode = () => {
  generatedCode.value = generateCode(blockStore.blocks, blockStore.connections)
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

const saveProject = async () => {
  const result = await window.electronAPI?.dialog.save({
    filters: [{ name: 'VBA 项目', extensions: ['vba.json'] }],
    defaultPath: 'project.vba.json'
  })
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
      ElMessage.success('项目已保存')
    } else {
      ElMessage.error(`保存失败: ${writeResult?.error}`)
    }
  }
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

const exportProject = () => {
  // 导出项目就是保存项目
  saveProject()
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
