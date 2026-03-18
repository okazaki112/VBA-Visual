// 积木类型枚举
export enum BlockType {
  // 基础积木
  VARIABLE_DECLARE = 'variable_declare',
  CONSTANT_DECLARE = 'constant_declare',
  ASSIGNMENT = 'assignment',
  COMMENT = 'comment',

  // 流程控制
  IF_STATEMENT = 'if_statement',
  IF_ELSE_STATEMENT = 'if_else_statement',
  SELECT_CASE = 'select_case',
  FOR_LOOP = 'for_loop',
  FOR_EACH_LOOP = 'for_each_loop',
  DO_WHILE_LOOP = 'do_while_loop',
  DO_UNTIL_LOOP = 'do_until_loop',
  EXIT_FOR = 'exit_for',
  EXIT_DO = 'exit_do',

  // Excel 操作
  CELL_READ = 'cell_read',
  CELL_WRITE = 'cell_write',
  RANGE_SELECT = 'range_select',
  SHEET_ACTIVATE = 'sheet_activate',
  SHEET_CREATE = 'sheet_create',
  WORKBOOK_OPEN = 'workbook_open',
  WORKBOOK_SAVE = 'workbook_save',
  FORMULA_SET = 'formula_set',
  FORMAT_SET = 'format_set',

  // 数据处理
  STRING_CONCAT = 'string_concat',
  STRING_SUBSTRING = 'string_substring',
  TYPE_CONVERT = 'type_convert',
  MATH_OPERATION = 'math_operation',
  DATE_OPERATION = 'date_operation',

  // 交互
  MSGBOX = 'msgbox',
  INPUTBOX = 'inputbox',
  STATUSBAR = 'statusbar',

  // 文件操作
  FILE_OPEN_DIALOG = 'file_open_dialog',
  FILE_SAVE_DIALOG = 'file_save_dialog',
  FILE_READ = 'file_read',
  FILE_WRITE = 'file_write',

  // 高级
  FUNCTION_DEFINE = 'function_define',
  SUB_DEFINE = 'sub_define',
  ERROR_HANDLER = 'error_handler',
  ARRAY_DECLARE = 'array_declare',
  DICTIONARY_CREATE = 'dictionary_create',
}

// 积木分类枚举
export enum BlockCategory {
  BASIC = 'basic',
  CONTROL_FLOW = 'control_flow',
  EXCEL = 'excel',
  DATA = 'data',
  INTERACTION = 'interaction',
  FILE = 'file',
  ADVANCED = 'advanced'
}

// 端口类型
export type PortType = 'flow' | 'data'

// 端口定义
export interface BlockPort {
  id: string
  name: string
  type: PortType
  dataType?: string
  required: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

// 属性类型
export type PropertyType = 'text' | 'number' | 'select' | 'boolean' | 'expression' | 'code' | 'formula'

// 属性验证规则
export interface PropertyValidation {
  required?: boolean
  pattern?: string
  min?: number
  max?: number
}

// 属性定义
export interface BlockProperty {
  id: string
  name: string
  type: PropertyType
  label: string
  defaultValue: unknown
  options?: Array<{ label: string; value: unknown }>
  validation?: PropertyValidation
  placeholder?: string
}

// 积木块定义
export interface BlockDefinition {
  id: string
  type: BlockType
  category: BlockCategory
  label: string
  description: string
  icon: string
  color: string
  inputs: BlockPort[]
  outputs: BlockPort[]
  properties: BlockProperty[]
  codeTemplate: string
  nestingType?: 'container' | 'leaf'
  canNest?: BlockType[]
}

// 积木实例（画布上的节点）
export interface BlockInstance {
  id: string
  definitionId: string
  type: BlockType
  position: { x: number; y: number }
  properties: Record<string, unknown>
  order: number  // 执行顺序编号
  children?: BlockInstance[]
}

// 项目定义
export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  blocks: BlockInstance[]
  connections: Connection[]
}

// 连接定义
export interface Connection {
  id: string
  sourceBlockId: string
  sourcePortId: string
  targetBlockId: string
  targetPortId: string
}

// 生成的代码
export interface GeneratedCode {
  content: string
  language: 'vba'
  errors: CodeError[]
}

// 代码错误
export interface CodeError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

// Electron API 类型声明
export interface ElectronAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
  }
  clipboard: {
    write: (text: string) => Promise<boolean>
    read: () => Promise<string>
  }
  dialog: {
    save: (options: { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<{ canceled: boolean; filePath?: string }>
    open: (options: { title?: string; filters?: Array<{ name: string; extensions: string[] }>; properties?: string[] }) => Promise<{ canceled: boolean; filePaths?: string[] }>
  }
  fs: {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
