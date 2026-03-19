import { Graph, Node } from '@antv/x6'
import type { BlockDefinition } from '@/types'

// 标记是否已注册
let customNodeRegistered = false

// 获取CSS变量值的辅助函数
export const getCSSVariable = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// 获取主题颜色
export const getThemeColors = () => {
  return {
    primary: getCSSVariable('--primary-color') || '#10b981',
    primaryLight: getCSSVariable('--primary-light') || '#34d399',
    bgPrimary: getCSSVariable('--bg-primary') || '#f0fdf4',
    bgSecondary: getCSSVariable('--bg-secondary') || '#ffffff',
    bgCard: getCSSVariable('--bg-card') || '#ffffff',
    textPrimary: getCSSVariable('--text-primary') || '#1e293b',
    textSecondary: getCSSVariable('--text-secondary') || '#64748b',
    borderColor: getCSSVariable('--border-color') || '#d1fae5',
    borderLight: getCSSVariable('--border-light') || '#a7f3d0'
  }
}

// 注册自定义节点
export const registerCustomNode = () => {
  // 避免重复注册
  if (customNodeRegistered) {
    return
  }
  customNodeRegistered = true
  
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
          fill: 'var(--primary-color)',
          stroke: 'var(--bg-secondary)',
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
          fill: 'var(--bg-secondary)',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif'
        }
      }
    ],
    attrs: {
      body: {
        strokeWidth: 2,
        stroke: 'var(--border-color)',
        fill: 'var(--bg-card)',
        rx: 8,
        ry: 8,
        filter: {
          name: 'dropShadow',
          args: {
            dx: 0,
            dy: 2,
            blur: 4,
            color: 'rgba(0,0,0,0.1)'
          }
        }
      },
      label: {
        refX: '50%',
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        fill: 'var(--text-primary)',
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
              stroke: 'var(--primary-color)',
              strokeWidth: 2,
              fill: 'var(--bg-secondary)',
              style: { visibility: 'visible', opacity: '0.5' },
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
          fill: 'var(--block-control)',
          stroke: 'var(--bg-secondary)',
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
          fill: 'var(--bg-secondary)',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif'
        }
      }
    ],
    attrs: {
      body: {
        strokeWidth: 2,
        stroke: 'var(--block-control)',
        strokeDasharray: '5,5',
        fill: 'var(--bg-card)',
        rx: 12,
        ry: 12,
        filter: {
          name: 'dropShadow',
          args: {
            dx: 0,
            dy: 2,
            blur: 6,
            color: 'rgba(245,158,11,0.2)'
          }
        }
      },
      label: {
        refX: 10,
        refY: 10,
        textAnchor: 'start',
        textVerticalAnchor: 'top',
        fill: 'var(--block-control)',
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
        stroke: 'var(--border-light)',
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
              stroke: 'var(--block-control)',
              strokeWidth: 2,
              fill: 'var(--bg-secondary)',
              style: { visibility: 'visible', opacity: '0.5' },
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

  // 创建8个固定端口：四边中点 + 四个角
  const ports: Array<{ id: string; group: string; args: { x: number; y: number } }> = [
    // 四边中点
    { id: 'top', group: 'port', args: { x: width / 2, y: 0 } },           // 上
    { id: 'bottom', group: 'port', args: { x: width / 2, y: height } },   // 下
    { id: 'left', group: 'port', args: { x: 0, y: height / 2 } },         // 左
    { id: 'right', group: 'port', args: { x: width, y: height / 2 } },    // 右
    // 四个角
    { id: 'tl', group: 'port', args: { x: 0, y: 0 } },                    // 左上
    { id: 'tr', group: 'port', args: { x: width, y: 0 } },                // 右上
    { id: 'bl', group: 'port', args: { x: 0, y: height } },               // 左下
    { id: 'br', group: 'port', args: { x: width, y: height } }            // 右下
  ]

  const node = graph.addNode({
    id,
    shape,
    x,
    y,
    width,
    height,
    label: block.label,
    // 使用积木定义的颜色设置节点样式
    attrs: {
      body: {
        stroke: block.color,  // 边框颜色使用积木颜色
      },
      orderBadge: {
        fill: block.color,  // 编号徽章使用积木颜色
      },
      orderText: {
        text: String(order)
      }
    },
    ports,
    data: {
      definitionId: block.id,
      blockType: block.type,
      nestingType: block.nestingType,
      color: block.color,
      properties: {}
    }
  })

  return node
}

// 更新节点编号显示
export const updateNodeOrder = (node: Node, order: number) => {
  node.setAttrs({
    orderText: {
      text: String(order)
    }
  } as unknown as never)
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

// 标记 edge 是否已注册
let customEdgeRegistered = false

// 创建连接边样式
export const createEdgeStyle = () => {
  // 避免重复注册
  if (customEdgeRegistered) return
  customEdgeRegistered = true
  
  Graph.registerEdge('custom-edge', {
    inherit: 'edge',
    attrs: {
      line: {
        stroke: 'var(--primary-color)',
        strokeWidth: 3,
        strokeDasharray: 5,
        style: {
          animation: 'ant-line 30s infinite linear'
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