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

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'template-hello-world',
    name: 'Hello World',
    description: '简单的消息框示例',
    category: 'basic',
    icon: 'ChatDotRound',
    data: {
      version: '1.0.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            name: 'HelloWorld',
            parameters: '',
            isPrivate: false
          },
          order: 1
        },
        {
          id: 'block-msgbox-2',
          definitionId: 'block-msgbox',
          type: BlockType.MSGBOX,
          position: { x: 100, y: 150 },
          properties: {
            message: 'Hello, World!',
            title: '欢迎',
            buttons: 'vbOKOnly',
            icon: 'vbInformation'
          },
          order: 2
        },
        {
          id: 'block-end-sub-3',
          definitionId: 'block-end-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 250 },
          properties: {},
          order: 3
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-msgbox-2', sourcePortId: 'bottom', targetBlockId: 'block-end-sub-3', targetPortId: 'top' }
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
      version: '1.0.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            name: 'ProcessArray',
            parameters: '',
            isPrivate: false
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
          definitionId: 'block-assign',
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
          definitionId: 'block-foreach',
          type: BlockType.FOR_EACH_LOOP,
          position: { x: 100, y: 390 },
          properties: {
            varName: 'item',
            collection: 'arr'
          },
          order: 5
        },
        {
          id: 'block-msgbox-6',
          definitionId: 'block-msgbox',
          type: BlockType.MSGBOX,
          position: { x: 150, y: 490 },
          properties: {
            message: '当前元素: ' + 'item',
            title: '数组遍历',
            buttons: 'vbOKOnly'
          },
          order: 6
        },
        {
          id: 'block-next-7',
          definitionId: 'block-next',
          type: BlockType.FOR_EACH_LOOP,
          position: { x: 100, y: 590 },
          properties: {},
          order: 7
        },
        {
          id: 'block-end-sub-8',
          definitionId: 'block-end-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 670 },
          properties: {},
          order: 8
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-var-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-var-3', sourcePortId: 'bottom', targetBlockId: 'block-assign-4', targetPortId: 'top' },
        { id: 'conn-4', sourceBlockId: 'block-assign-4', sourcePortId: 'bottom', targetBlockId: 'block-foreach-5', targetPortId: 'top' },
        { id: 'conn-5', sourceBlockId: 'block-foreach-5', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-6', targetPortId: 'top' },
        { id: 'conn-6', sourceBlockId: 'block-msgbox-6', sourcePortId: 'bottom', targetBlockId: 'block-next-7', targetPortId: 'top' },
        { id: 'conn-7', sourceBlockId: 'block-next-7', sourcePortId: 'bottom', targetBlockId: 'block-end-sub-8', targetPortId: 'top' }
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
      version: '1.0.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            name: 'ExcelBasics',
            parameters: '',
            isPrivate: false
          },
          order: 1
        },
        {
          id: 'block-range-set-2',
          definitionId: 'block-range-set',
          type: BlockType.CELL_WRITE,
          position: { x: 100, y: 150 },
          properties: {
            range: 'A1',
            value: 'Hello Excel'
          },
          order: 2
        },
        {
          id: 'block-range-get-3',
          definitionId: 'block-range-get',
          type: BlockType.CELL_READ,
          position: { x: 100, y: 230 },
          properties: {
            range: 'A1',
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
            message: 'A1 单元格的值是: ' + 'cellValue',
            title: 'Excel 操作',
            buttons: 'vbOKOnly'
          },
          order: 4
        },
        {
          id: 'block-end-sub-5',
          definitionId: 'block-end-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 390 },
          properties: {},
          order: 5
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-range-set-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-range-set-2', sourcePortId: 'bottom', targetBlockId: 'block-range-get-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-range-get-3', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-4', targetPortId: 'top' },
        { id: 'conn-4', sourceBlockId: 'block-msgbox-4', sourcePortId: 'bottom', targetBlockId: 'block-end-sub-5', targetPortId: 'top' }
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
      version: '1.0.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            name: 'CheckCondition',
            parameters: '',
            isPrivate: false
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
          definitionId: 'block-assign',
          type: BlockType.ASSIGNMENT,
          position: { x: 100, y: 230 },
          properties: {
            varName: 'score',
            value: '85'
          },
          order: 3
        },
        {
          id: 'block-if-4',
          definitionId: 'block-if',
          type: BlockType.IF_STATEMENT,
          position: { x: 100, y: 310 },
          properties: {
            condition: 'score >= 60'
          },
          order: 4
        },
        {
          id: 'block-msgbox-5',
          definitionId: 'block-msgbox',
          type: BlockType.MSGBOX,
          position: { x: 150, y: 410 },
          properties: {
            message: '及格了！',
            title: '成绩',
            buttons: 'vbOKOnly'
          },
          order: 5
        },
        {
          id: 'block-else-6',
          definitionId: 'block-else',
          type: BlockType.IF_ELSE_STATEMENT,
          position: { x: 150, y: 490 },
          properties: {},
          order: 6
        },
        {
          id: 'block-msgbox-7',
          definitionId: 'block-msgbox',
          type: BlockType.MSGBOX,
          position: { x: 200, y: 570 },
          properties: {
            message: '不及格！',
            title: '成绩',
            buttons: 'vbOKOnly'
          },
          order: 7
        },
        {
          id: 'block-end-if-8',
          definitionId: 'block-end-if',
          type: BlockType.IF_STATEMENT,
          position: { x: 100, y: 650 },
          properties: {},
          order: 8
        },
        {
          id: 'block-end-sub-9',
          definitionId: 'block-end-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 730 },
          properties: {},
          order: 9
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-assign-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-assign-3', sourcePortId: 'bottom', targetBlockId: 'block-if-4', targetPortId: 'top' },
        { id: 'conn-4', sourceBlockId: 'block-if-4', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-5', targetPortId: 'top' },
        { id: 'conn-5', sourceBlockId: 'block-msgbox-5', sourcePortId: 'bottom', targetBlockId: 'block-else-6', targetPortId: 'top' },
        { id: 'conn-6', sourceBlockId: 'block-else-6', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-7', targetPortId: 'top' },
        { id: 'conn-7', sourceBlockId: 'block-msgbox-7', sourcePortId: 'bottom', targetBlockId: 'block-end-if-8', targetPortId: 'top' },
        { id: 'conn-8', sourceBlockId: 'block-end-if-8', sourcePortId: 'bottom', targetBlockId: 'block-end-sub-9', targetPortId: 'top' }
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
      version: '1.0.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            name: 'CleanData',
            parameters: '',
            isPrivate: false
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
            varType: 'Range'
          },
          order: 2
        },
        {
          id: 'block-assign-3',
          definitionId: 'block-assign',
          type: BlockType.ASSIGNMENT,
          position: { x: 100, y: 230 },
          properties: {
            varName: 'rng',
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
            comment: '删除空白单元格'
          },
          order: 5
        },
        {
          id: 'block-end-sub-6',
          definitionId: 'block-end-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 470 },
          properties: {},
          order: 6
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-assign-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-assign-3', sourcePortId: 'bottom', targetBlockId: 'block-range-select-4', targetPortId: 'top' },
        { id: 'conn-4', sourceBlockId: 'block-range-select-4', sourcePortId: 'bottom', targetBlockId: 'block-comment-5', targetPortId: 'top' },
        { id: 'conn-5', sourceBlockId: 'block-comment-5', sourcePortId: 'bottom', targetBlockId: 'block-end-sub-6', targetPortId: 'top' }
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
      version: '1.0.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            name: 'CreateChartReport',
            parameters: '',
            isPrivate: false
          },
          order: 1
        },
        {
          id: 'block-var-2',
          definitionId: 'block-variable-declare',
          type: BlockType.VARIABLE_DECLARE,
          position: { x: 100, y: 150 },
          properties: {
            varName: 'cht',
            varType: 'Chart'
          },
          order: 2
        },
        {
          id: 'block-comment-3',
          definitionId: 'block-comment',
          type: BlockType.COMMENT,
          position: { x: 100, y: 230 },
          properties: {
            comment: '创建柱状图'
          },
          order: 3
        },
        {
          id: 'block-end-sub-4',
          definitionId: 'block-end-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 310 },
          properties: {},
          order: 4
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-comment-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-comment-3', sourcePortId: 'bottom', targetBlockId: 'block-end-sub-4', targetPortId: 'top' }
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
      version: '1.0.0',
      blocks: [
        {
          id: 'block-sub-1',
          definitionId: 'block-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 50 },
          properties: {
            name: 'ProcessAllSheets',
            parameters: '',
            isPrivate: false
          },
          order: 1
        },
        {
          id: 'block-var-2',
          definitionId: 'block-variable-declare',
          type: BlockType.VARIABLE_DECLARE,
          position: { x: 100, y: 150 },
          properties: {
            varName: 'ws',
            varType: 'Worksheet'
          },
          order: 2
        },
        {
          id: 'block-foreach-3',
          definitionId: 'block-foreach',
          type: BlockType.FOR_EACH_LOOP,
          position: { x: 100, y: 230 },
          properties: {
            varName: 'ws',
            collection: 'ThisWorkbook.Worksheets'
          },
          order: 3
        },
        {
          id: 'block-msgbox-4',
          definitionId: 'block-msgbox',
          type: BlockType.MSGBOX,
          position: { x: 150, y: 330 },
          properties: {
            message: '处理工作表: ' + 'ws.Name',
            title: '批量处理',
            buttons: 'vbOKOnly'
          },
          order: 4
        },
        {
          id: 'block-next-5',
          definitionId: 'block-next',
          type: BlockType.FOR_EACH_LOOP,
          position: { x: 100, y: 430 },
          properties: {},
          order: 5
        },
        {
          id: 'block-end-sub-6',
          definitionId: 'block-end-sub',
          type: BlockType.SUB_DEFINE,
          position: { x: 100, y: 510 },
          properties: {},
          order: 6
        }
      ],
      connections: [
        { id: 'conn-1', sourceBlockId: 'block-sub-1', sourcePortId: 'bottom', targetBlockId: 'block-var-2', targetPortId: 'top' },
        { id: 'conn-2', sourceBlockId: 'block-var-2', sourcePortId: 'bottom', targetBlockId: 'block-foreach-3', targetPortId: 'top' },
        { id: 'conn-3', sourceBlockId: 'block-foreach-3', sourcePortId: 'bottom', targetBlockId: 'block-msgbox-4', targetPortId: 'top' },
        { id: 'conn-4', sourceBlockId: 'block-msgbox-4', sourcePortId: 'bottom', targetBlockId: 'block-next-5', targetPortId: 'top' },
        { id: 'conn-5', sourceBlockId: 'block-next-5', sourcePortId: 'bottom', targetBlockId: 'block-end-sub-6', targetPortId: 'top' }
      ]
    }
  }
]

export const getTemplatesByCategory = (category: string) => {
  return projectTemplates.filter(t => t.category === category)
}
