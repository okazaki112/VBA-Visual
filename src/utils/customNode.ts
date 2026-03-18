import { Graph, Node } from '@antv/x6'
import type { BlockDefinition } from '@/types'

// 注册自定义节点
export const registerCustomNode = () => {
  // 普通积木节点
  Graph.registerNode('block-node', {
    inherit: 'rect',
    width: 180,
    height: 60,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
      // 编号徽章背景
      { 
        tagName: 'circle', 
        selector: 'orderBadge',
        attrs: {
          refX: 0,
          refY: 0,
          r: 12,
          fill: '#6366f1',
          stroke: '#1a1a2e',
          strokeWidth: 2
        }
      },
      // 编号文字
      { 
        tagName: 'text', 
        selector: 'orderText',
        attrs: {
          refX: 0,
          refY: 0,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#ffffff',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif'
        }
      }
    ],
    attrs: {
      body: {
        strokeWidth: 2,
        stroke: '#2a2a4a',
        fill: '#1e1e3f',
        rx: 8,
        ry: 8,
        filter: {
          name: 'dropShadow',
          args: {
            dx: 0,
            dy: 2,
            blur: 4,
            color: 'rgba(0,0,0,0.3)'
          }
        }
      },
      label: {
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fill: '#ffffff',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif'
      },
      orderBadge: {
        refX: 10,
        refY: 10
      },
      orderText: {
        refX: 10,
        refY: 10
      }
    },
    ports: {
      groups: {
        // 通用端口组 - 使用 absolute 布局精确定位
        port: {
          position: {
            name: 'absolute',
            args: { x: 0, y: 0 }
          },
          attrs: {
            circle: {
              r: 5,
              magnet: true,
              stroke: '#6366f1',
              strokeWidth: 2,
              fill: '#1a1a2e',
              style: { visibility: 'hidden' },  // 默认隐藏
              cursor: 'crosshair'
            }
          }
        }
      }
    },
    portMarkup: [
      {
        tagName: 'circle',
        selector: 'circle'
      }
    ]
  })

  // 容器积木节点（可嵌套子节点）
  Graph.registerNode('container-node', {
    inherit: 'rect',
    width: 220,
    height: 120,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
      { tagName: 'rect', selector: 'contentArea' },
      // 编号徽章背景
      { 
        tagName: 'circle', 
        selector: 'orderBadge',
        attrs: {
          refX: 0,
          refY: 0,
          r: 12,
          fill: '#f59e0b',
          stroke: '#1a1a2e',
          strokeWidth: 2
        }
      },
      // 编号文字
      { 
        tagName: 'text', 
        selector: 'orderText',
        attrs: {
          refX: 0,
          refY: 0,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#ffffff',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif'
        }
      }
    ],
    attrs: {
      body: {
        strokeWidth: 2,
        stroke: '#f59e0b',
        strokeDasharray: '5,5',
        fill: '#1e1e3f',
        rx: 12,
        ry: 12,
        filter: {
          name: 'dropShadow',
          args: {
            dx: 0,
            dy: 2,
            blur: 6,
            color: 'rgba(245,158,11,0.3)'
          }
        }
      },
      label: {
        refX: 10,
        refY: 10,
        textAnchor: 'start',
        textVerticalAnchor: 'top',
        fill: '#f59e0b',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif'
      },
      // 嵌套区域标识
      contentArea: {
        refWidth: '100%',
        refHeight: '80%',
        refY: 30,
        fill: 'transparent',
        stroke: '#3a3a5a',
        strokeDasharray: '2,2',
        strokeWidth: 1
      },
      orderBadge: {
        refX: 10,
        refY: 10
      },
      orderText: {
        refX: 10,
        refY: 10
      }
    },
    ports: {
      groups: {
        // 通用端口组 - 使用 absolute 布局精确定位
        port: {
          position: {
            name: 'absolute',
            args: { x: 0, y: 0 }
          },
          attrs: {
            circle: {
              r: 5,
              magnet: true,
              stroke: '#f59e0b',
              strokeWidth: 2,
              fill: '#1a1a2e',
              style: { visibility: 'hidden' },
              cursor: 'crosshair'
            }
          }
        }
      }
    },
    portMarkup: [
      {
        tagName: 'circle',
        selector: 'circle'
      }
    ]
  })
}

// 创建积木节点
export const createBlockNode = (
  graph: Graph,
  block: BlockDefinition,
  x: number,
  y: number,
  id: string,
  order: number = 1
): Node => {
  const isContainer = block.nestingType === 'container'
  const shape = isContainer ? 'container-node' : 'block-node'
  const width = isContainer ? 220 : 180
  const height = isContainer ? 120 : 60

  const node = graph.addNode({
    id,
    shape,
    x,
    y,
    width,
    height,
    label: block.label,
    attrs: {
      body: {
        stroke: block.color,
        fill: `${block.color}15`
      },
      label: {
        fill: block.color
      },
      orderBadge: {
        fill: block.color
      },
      orderText: {
        text: String(order)
      }
    },
    ports: [
      // 四个角
      { id: 'tl', group: 'port', args: { x: 0, y: 0 } },
      { id: 'tr', group: 'port', args: { x: '100%', y: 0 } },
      { id: 'bl', group: 'port', args: { x: 0, y: '100%' } },
      { id: 'br', group: 'port', args: { x: '100%', y: '100%' } },
      // 四条边中点
      { id: 't', group: 'port', args: { x: '50%', y: 0 } },
      { id: 'b', group: 'port', args: { x: '50%', y: '100%' } },
      { id: 'l', group: 'port', args: { x: 0, y: '50%' } },
      { id: 'r', group: 'port', args: { x: '100%', y: '50%' } }
    ],
    data: {
      blockId: block.id,
      blockType: block.type,
      nestingType: block.nestingType,
      properties: {}
    }
  })

  return node
}

// 更新节点编号显示
export const updateNodeOrder = (node: Node, order: number, color?: string) => {
  const attrs: Record<string, unknown> = {
    orderText: {
      text: String(order)
    }
  }
  if (color) {
    attrs.orderBadge = { fill: color }
  }
  node.setAttrs(attrs as unknown as never)
}

// 将子节点嵌入容器节点
export const embedNode = (
  _graph: Graph,
  parentNode: Node,
  childNode: Node
) => {
  // 检查父节点是否是容器类型
  const parentData = parentNode.getData()
  if (parentData?.nestingType !== 'container') {
    console.warn('Parent node is not a container type')
    return false
  }

  // 嵌入子节点
  parentNode.addChild(childNode)

  // 调整容器大小以适应子节点
  resizeContainer(parentNode)

  return true
}

// 从容器中移除子节点
export const unembedNode = (
  _graph: Graph,
  parentNode: Node,
  childNode: Node
) => {
  parentNode.removeChild(childNode)
  resizeContainer(parentNode)
}

// 调整容器大小
const resizeContainer = (containerNode: Node) => {
  const children = containerNode.getChildren()
  if (!children || children.length === 0) {
    containerNode.resize(220, 120)
    return
  }

  // 计算子节点的边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  children.forEach(child => {
    const bbox = child.getBBox()
    minX = Math.min(minX, bbox.x)
    minY = Math.min(minY, bbox.y)
    maxX = Math.max(maxX, bbox.x + bbox.width)
    maxY = Math.max(maxY, bbox.y + bbox.height)
  })

  // 计算新尺寸（添加内边距）
  const padding = 40
  const headerHeight = 30
  const newWidth = Math.max(220, (maxX - minX) + padding * 2)
  const newHeight = Math.max(120, (maxY - minY) + padding + headerHeight)

  containerNode.resize(newWidth, newHeight)
}

// 检查节点是否可以嵌入容器
export const canEmbed = (
  parentNode: Node,
  childNode: Node
): boolean => {
  const parentData = parentNode.getData()
  const childData = childNode.getData()

  // 父节点必须是容器类型
  if (parentData?.nestingType !== 'container') {
    return false
  }

  // 子节点不能是容器类型（避免多层嵌套）
  if (childData?.nestingType === 'container') {
    return false
  }

  // 不能嵌入自己
  if (parentNode.id === childNode.id) {
    return false
  }

  return true
}

// 创建连接边样式
export const createEdgeStyle = () => {
  Graph.registerEdge('custom-edge', {
    inherit: 'edge',
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
