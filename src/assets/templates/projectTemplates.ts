import type { ProjectData } from '@/stores/canvasStore'
import { BlockType } from '@/types'

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'basic' | 'excel' | 'automation'
  icon: string
  data: ProjectData
}

// 模板说明：
// - Sub 过程使用 block-sub-define（生成器会自动将普通积木放入第一个 Sub 并补全 End Sub，
//   无需单独的 block-end-sub 积木）
// - 所有 definitionId 与属性键名均与 blockDefinitions.ts 中的定义一一对应
// - msgbox 的 message 为表达式类型，字符串需自带引号
export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'template-hello-world',
    name: 'Hello World',
    description: '简单的消息框示例',
    category: 'basic',
    icon: 'ChatDotRound',
    data: {
      version: '1.1.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub-define',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            subName: 'HelloWorld',
            parameters: '',
            bodyCode: ''
          },
          order: 1
        },
        {
          id: 'block-msgbox-2',
          definitionId: 'block-msgbox',
          type: BlockType.MSGBOX,
          position: { x: 100, y: 150 },
          properties: {
            message: '"Hello, World!"',
            title: '欢迎',
            buttons: 'vbOKOnly',
            icon: 'vbInformation'
          },
          order: 2
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-2', targetPortId: 'top' }
      ]
    }
  },
  {
    id: 'template-loop-array',
    name: '循环处理数组',
    description: '演示 For Each 循环遍历数组',
    category: 'basic',
    icon: 'Refresh',
    data: {
      version: '1.1.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub-define',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            subName: 'ProcessArray',
            parameters: '',
            bodyCode: ''
          },
          order: 1
        },
        {
          id: 'block-var-2',
          definitionId: 'block-variable-declare',
          type: BlockType.VARIABLE_DECLARE,
          position: { x: 100, y: 150 },
          properties: {
            varName: 'arr',
            varType: 'Variant'
          },
          order: 2
        },
        {
          id: 'block-var-3',
          definitionId: 'block-variable-declare',
          type: BlockType.VARIABLE_DECLARE,
          position: { x: 100, y: 230 },
          properties: {
            varName: 'item',
            varType: 'Variant'
          },
          order: 3
        },
        {
          id: 'block-assign-4',
          definitionId: 'block-assignment',
          type: BlockType.ASSIGNMENT,
          position: { x: 100, y: 310 },
          properties: {
            varName: 'arr',
            value: 'Array(1, 2, 3, 4, 5)'
          },
          order: 4
        },
        {
          id: 'block-foreach-5',
          definitionId: 'block-for-each-loop',
          type: BlockType.FOR_EACH_LOOP,
          position: { x: 100, y: 390 },
          properties: {
            element: 'item',
            collection: 'arr',
            loopBody: 'MsgBox "当前元素: " & item'
          },
          order: 5
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-var-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-var-3', sourcePortId: 'bottom', targetBlockId: 'block-assign-4', targetPortId: 'top' },
        { id: 'conn-4', sourceBlockId: 'block-assign-4', sourcePortId: 'bottom', targetBlockId: 'block-foreach-5', targetPortId: 'top' }
      ]
    }
  },
  {
    id: 'template-excel-basics',
    name: 'Excel 基础操作',
    description: '单元格读写和格式化',
    category: 'excel',
    icon: 'Document',
    data: {
      version: '1.1.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub-define',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            subName: 'ExcelBasics',
            parameters: '',
            bodyCode: ''
          },
          order: 1
        },
        {
          id: 'block-cell-write-2',
          definitionId: 'block-cell-write',
          type: BlockType.CELL_WRITE,
          position: { x: 100, y: 150 },
          properties: {
            refType: 'Range',
            cellRef: 'A1',
            value: '"Hello Excel"'
          },
          order: 2
        },
        {
          id: 'block-cell-read-3',
          definitionId: 'block-cell-read',
          type: BlockType.CELL_READ,
          position: { x: 100, y: 230 },
          properties: {
            refType: 'Range',
            cellRef: 'A1',
            varName: 'cellValue'
          },
          order: 3
        },
        {
          id: 'block-msgbox-4',
          definitionId: 'block-msgbox',
          type: BlockType.MSGBOX,
          position: { x: 100, y: 310 },
          properties: {
            message: '"A1 单元格的值是: " & cellValue',
            title: 'Excel 操作',
            buttons: 'vbOKOnly'
          },
          order: 4
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-cell-write-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-cell-write-2', sourcePortId: 'bottom', targetBlockId: 'block-cell-read-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-cell-read-3', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-4', targetPortId: 'top' }
      ]
    }
  },
  {
    id: 'template-condition-check',
    name: '条件判断示例',
    description: 'If-Else 条件分支',
    category: 'basic',
    icon: 'QuestionFilled',
    data: {
      version: '1.1.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub-define',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            subName: 'CheckCondition',
            parameters: '',
            bodyCode: ''
          },
          order: 1
        },
        {
          id: 'block-var-2',
          definitionId: 'block-variable-declare',
          type: BlockType.VARIABLE_DECLARE,
          position: { x: 100, y: 150 },
          properties: {
            varName: 'score',
            varType: 'Integer'
          },
          order: 2
        },
        {
          id: 'block-assign-3',
          definitionId: 'block-assignment',
          type: BlockType.ASSIGNMENT,
          position: { x: 100, y: 230 },
          properties: {
            varName: 'score',
            value: '85'
          },
          order: 3
        },
        {
          id: 'block-if-else-4',
          definitionId: 'block-if-else-statement',
          type: BlockType.IF_ELSE_STATEMENT,
          position: { x: 100, y: 310 },
          properties: {
            condition: 'score >= 60',
            thenCode: 'MsgBox "及格了！"',
            elseCode: 'MsgBox "不及格！"'
          },
          order: 4
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-assign-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-assign-3', sourcePortId: 'bottom', targetBlockId: 'block-if-else-4', targetPortId: 'top' }
      ]
    }
  },
  {
    id: 'template-data-cleaning',
    name: '数据清洗',
    description: '清理空白单元格和重复数据',
    category: 'automation',
    icon: 'Refresh',
    data: {
      version: '1.1.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub-define',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            subName: 'CleanData',
            parameters: '',
            bodyCode: ''
          },
          order: 1
        },
        {
          id: 'block-var-2',
          definitionId: 'block-variable-declare',
          type: BlockType.VARIABLE_DECLARE,
          position: { x: 100, y: 150 },
          properties: {
            varName: 'rng',
            varType: 'Object'
          },
          order: 2
        },
        {
          id: 'block-assign-3',
          definitionId: 'block-assignment',
          type: BlockType.ASSIGNMENT,
          position: { x: 100, y: 230 },
          properties: {
            varName: 'Set rng',
            value: 'Range("A1:A100")'
          },
          order: 3
        },
        {
          id: 'block-range-select-4',
          definitionId: 'block-range-select',
          type: BlockType.RANGE_SELECT,
          position: { x: 100, y: 310 },
          properties: {
            rangeRef: 'A1:A100'
          },
          order: 4
        },
        {
          id: 'block-comment-5',
          definitionId: 'block-comment',
          type: BlockType.COMMENT,
          position: { x: 100, y: 390 },
          properties: {
            comment: '在此继续添加清洗逻辑'
          },
          order: 5
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-assign-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-assign-3', sourcePortId: 'bottom', targetBlockId: 'block-range-select-4', targetPortId: 'top' },
        { id: 'conn-4', sourceBlockId: 'block-range-select-4', sourcePortId: 'bottom', targetBlockId: 'block-comment-5', targetPortId: 'top' }
      ]
    }
  },
  {
    id: 'template-chart-report',
    name: '图表报告',
    description: '生成带图表的数据报告',
    category: 'excel',
    icon: 'TrendCharts',
    data: {
      version: '1.1.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub-define',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            subName: 'CreateChartReport',
            parameters: '',
            bodyCode: ''
          },
          order: 1
        },
        {
          id: 'block-comment-2',
          definitionId: 'block-comment',
          type: BlockType.COMMENT,
          position: { x: 100, y: 150 },
          properties: {
            comment: '创建柱状图（积木自带 Dim 声明）'
          },
          order: 2
        },
        {
          id: 'block-chart-3',
          definitionId: 'block-chart-create',
          type: BlockType.CHART_CREATE,
          position: { x: 100, y: 230 },
          properties: {
            varName: 'cht',
            chartType: 'xlColumnClustered',
            left: 100,
            top: 100,
            width: 300,
            height: 200
          },
          order: 3
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-comment-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-comment-2', sourcePortId: 'bottom', targetBlockId: 'block-chart-3', targetPortId: 'top' }
      ]
    }
  },
  {
    id: 'template-batch-process',
    name: '批量处理工作表',
    description: '遍历所有工作表执行操作',
    category: 'automation',
    icon: 'Refresh',
    data: {
      version: '1.1.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub-define',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            subName: 'ProcessAllSheets',
            parameters: '',
            bodyCode: ''
          },
          order: 1
        },
        {
          id: 'block-foreach-2',
          definitionId: 'block-for-each-loop',
          type: BlockType.FOR_EACH_LOOP,
          position: { x: 100, y: 150 },
          properties: {
            element: 'ws',
            collection: 'ThisWorkbook.Worksheets',
            loopBody: 'MsgBox "处理工作表: " & ws.Name'
          },
          order: 2
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-foreach-2', targetPortId: 'top' }
      ]
    }
  }
]

export const getTemplatesByCategory = (category: string) => {
  return projectTemplates.filter(t => t.category === category)
}
