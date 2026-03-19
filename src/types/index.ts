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
  WITH_STATEMENT = 'with_statement',

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
  // 图表操作
  CHART_CREATE = 'chart_create',
  CHART_SET_SOURCE = 'chart_set_source',
  CHART_SET_TITLE = 'chart_set_title',
  CHART_DELETE = 'chart_delete',
  // 条件格式
  CONDITIONAL_FORMAT = 'conditional_format',
  CONDITIONAL_FORMAT_CLEAR = 'conditional_format_clear',
  // 数据透视表
  PIVOT_CREATE = 'pivot_create',
  PIVOT_ADD_FIELD = 'pivot_add_field',
  PIVOT_REFRESH = 'pivot_refresh',
  PIVOT_DELETE = 'pivot_delete',

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
  DICTIONARY_ADD = 'dictionary_add',
  DICTIONARY_GET = 'dictionary_get',
  DICTIONARY_EXISTS = 'dictionary_exists',
  DICTIONARY_REMOVE = 'dictionary_remove',
  DICTIONARY_LOOP = 'dictionary_loop',
  REGEX_CREATE = 'regex_create',
  REGEX_TEST = 'regex_test',
  REGEX_REPLACE = 'regex_replace',
  REGEX_EXECUTE = 'regex_execute',

  // 事件处理
  EVENT_WORKBOOK_OPEN = 'event_workbook_open',
  EVENT_WORKBOOK_CLOSE = 'event_workbook_close',
  EVENT_WORKBOOK_SAVE = 'event_workbook_save',
  EVENT_SHEET_CHANGE = 'event_sheet_change',
  EVENT_SHEET_ACTIVATE = 'event_sheet_activate',
  EVENT_BUTTON_CLICK = 'event_button_click',
  EVENT_WORKSHEET_CHANGE = 'event_worksheet_change',
  EVENT_SELECTION_CHANGE = 'event_selection_change',

  // Windows API
  WINAPI_DECLARE = 'winapi_declare',
  WINAPI_CALL = 'winapi_call',
  WINAPI_CONST = 'winapi_const',
  WINAPI_TYPE = 'winapi_type',
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
    saveImage: (filePath: string, dataUrl: string) => Promise<{ success: boolean; error?: string }>
    saveSVG: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
