// 行为测试套件（常驻仓库版）：由 scripts/behavior-tests/run.mjs 构建被测模块后执行
const path = require('node:path')
const BUNDLE_DIR = process.env.VBA_BUNDLE_DIR || '.'

const { generateCodeWithMappings } = require(require('node:path').resolve(BUNDLE_DIR, 'codeGenerator.cjs'))
const { collectVariables, findUndeclaredReferences } = require(require('node:path').resolve(BUNDLE_DIR, 'variableScanner.cjs'))
const { validateVBACode } = require(require('node:path').resolve(BUNDLE_DIR, 'vbaValidator.cjs'))

let pass = 0, fail = 0
const assert = (cond, name, detail = '') => {
  if (cond) { pass++; console.log('  PASS', name) }
  else { fail++; console.log('  FAIL', name, detail) }
}

// ========== T8: A1 容器生成——For 容器 + 子积木 ==========
console.log('[T8] 容器生成：For + 子积木')
const blocks = [
  { id: 'sub1', definitionId: 'block-sub-define', type: 'sub_define', position: {x:0,y:0}, properties: { subName: 'Test', parameters: '', bodyCode: '' }, order: 1 },
  { id: 'for1', definitionId: 'block-for-loop', type: 'for_loop', position: {x:0,y:100}, properties: { counter: 'i', start: 1, end: 10, step: 1, loopBody: '' }, order: 2 },
  { id: 'w1', definitionId: 'block-cell-write', type: 'cell_write', position: {x:0,y:200}, properties: { refType: 'Cells', cellRef: '1, 1', value: '"x"' }, order: 3, parentId: 'for1' },
  { id: 'm1', definitionId: 'block-msgbox', type: 'msgbox', position: {x:0,y:300}, properties: { message: '"done"', buttons: 'vbOKOnly' }, order: 4 },
  { id: 'm2', definitionId: 'block-msgbox', type: 'msgbox', position: {x:0,y:400}, properties: { message: '"after"', buttons: 'vbOKOnly' }, order: 5, parentId: 'for1' }
]
const conns = [
  { id: 'c1', sourceBlockId: 'sub1', sourcePortId: 'bottom', targetBlockId: 'for1', targetPortId: 'top' },
  { id: 'c2', sourceBlockId: 'for1', sourcePortId: 'bottom', targetBlockId: 'm1', targetPortId: 'top' }
]
const gen = generateCodeWithMappings(blocks, conns)
assert(gen.code.includes('For i = 1 To 10'), 'For 头生成')
assert(gen.code.includes('Cells(1, 1).Value = "x"'), '子积木 1 进入循环体')
assert(gen.code.includes('"after"'), '子积木 2 进入循环体')
assert((gen.code.match(/MsgBox/g) || []).length === 2, '两个 MsgBox 都在')
assert(!gen.code.includes('{{'), '无残留占位符', gen.code)
const lines = gen.code.split('\n')
const forIdx = lines.findIndex(l => l.includes('For i = 1 To 10'))
const childIdx = lines.findIndex(l => l.includes('Cells(1, 1)'))
assert(childIdx > forIdx && lines[childIdx].startsWith('        '), '子积木缩进正确（8 空格）', JSON.stringify(lines[childIdx]))
assert(lines.some(l => l.trim() === 'Next i'), 'Next i 收尾')
const afterIdx = lines.findIndex(l => l.includes('"after"'))
const nextIdx = lines.findIndex(l => l.trim() === 'Next i')
assert(afterIdx < nextIdx, '子积木在 Next 之前')

// ========== T9: A1 容器回退——无子积木时用文本属性（旧数据兼容）==========
console.log('[T9] 容器文本回退')
const blocks2 = [
  { id: 'for2', definitionId: 'block-for-loop', type: 'for_loop', position: {x:0,y:0}, properties: { counter: 'j', start: 1, end: 5, step: 1, loopBody: 'x = j + 1' }, order: 1 }
]
const gen2 = generateCodeWithMappings(blocks2, [])
assert(gen2.code.includes('x = j + 1'), 'loopBody 文本回退生效')
assert(!gen2.code.includes('{{'), '无残留占位符', gen2.code)

// ========== T10: F-1 双重缩进修复 ==========
console.log('[T10] 缩进修复')
const block3 = [
  { id: 'sub3', definitionId: 'block-sub-define', type: 'sub_define', position: {x:0,y:0}, properties: { subName: 'S', parameters: '', bodyCode: '' }, order: 1 },
  { id: 'if3', definitionId: 'block-if-statement', type: 'if_statement', position: {x:0,y:100}, properties: { condition: 'a > 1', thenCode: 'b = 2' }, order: 2, parentId: undefined }
]
const conns3 = [{ id: 'c1', sourceBlockId: 'sub3', sourcePortId: 'bottom', targetBlockId: 'if3', targetPortId: 'top' }]
const gen3 = generateCodeWithMappings(block3, conns3)
const ifLine = gen3.code.split('\n').find(l => l.includes('If a > 1'))
const thenLine = gen3.code.split('\n').find(l => l.includes('b = 2'))
assert(thenLine && thenLine.length - thenLine.replace(/^ +/, '').length === 8, 'thenCode 体缩进=8 空格(非 12)', JSON.stringify(thenLine))
assert(ifLine && ifLine.length - ifLine.replace(/^ +/, '').length === 4, 'If 头缩进=4 空格', JSON.stringify(ifLine))

// ========== T11: B1-1 变量收集 ==========
console.log('[T11] 变量收集')
const vb = [
  { id: 'b1', definitionId: 'block-variable-declare', type: 'variable_declare', position: {x:0,y:0}, properties: { varName: 'total', varType: 'Long' }, order: 1 },
  { id: 'b2', definitionId: 'block-constant-declare', type: 'constant_declare', position: {x:0,y:50}, properties: { constName: 'MAX', constValue: '10' }, order: 2 },
  { id: 'b3', definitionId: 'block-for-loop', type: 'for_loop', position: {x:0,y:100}, properties: { counter: 'i', start: 1, end: 'MAX', step: 1 }, order: 3 },
  { id: 'b4', definitionId: 'block-assignment', type: 'assignment', position: {x:0,y:150}, properties: { varName: 'Set ws', value: 'ActiveSheet' }, order: 4 },
  { id: 'b5', definitionId: 'block-assignment', type: 'assignment', position: {x:0,y:200}, properties: { varName: 'total', value: 'total + 1' }, order: 5 }
]
const vars = collectVariables(vb)
assert(vars.map(v => v.name).join(',') === 'total,MAX,i,ws', '变量收集与去重/Set 剥离', JSON.stringify(vars))

// ========== T12: B1-3 未声明引用 ==========
console.log('[T12] 未声明引用')
const warns = findUndeclaredReferences([
  { id: 'b1', definitionId: 'block-if-statement', type: 'if_statement', position: {x:0,y:0}, properties: { condition: 'score >= 60 && total > MAX', thenCode: '' }, order: 1 },
  { id: 'b2', definitionId: 'block-assignment', type: 'assignment', position: {x:0,y:50}, properties: { varName: 'x', value: '"n = 5"' }, order: 2 }
], vars)
const ids = warns.map(w => w.identifier)
assert(ids.includes('score'), 'score 未声明被检出', JSON.stringify(warns))
assert(!ids.includes('total'), 'total 已声明不误报')
assert(!ids.includes('MAX'), 'MAX 已声明不误报')
assert(!ids.includes('n'), '字符串字面量不误报')

// ========== T13: B2-1 校验引擎 ==========
console.log('[T13] 静态校验')
const ok = validateVBACode(`Sub T()
For i = 1 To 10
If i > 5 Then
x = i
End If
Next i
End Sub`)
assert(ok.length === 0, '合法代码零错误', JSON.stringify(ok))

const bad = validateVBACode(`Sub T()
For i = 1 To 10
If i > 5 Then
End If
End Sub`)
assert(bad.length >= 1 && bad.some(e => e.message.includes('不匹配')), 'End If 多余被检出', JSON.stringify(bad))

const missing = validateVBACode(`Sub T()
For i = 1 To 10
x = i
End Sub`)
assert(missing.some(e => e.message.includes('缺少') || e.message.includes('Next')), '缺 Next 被检出', JSON.stringify(missing))

const paren = validateVBACode(`Sub T()
x = (1 + 2
End Sub`)
assert(paren.some(e => e.message.includes('括号')), '括号不配平被检出', JSON.stringify(paren))

const empty = validateVBACode(`Sub T()
End Sub`)
assert(empty.some(e => e.severity === 'warning' && e.message.includes('空')), '空 Sub 警告', JSON.stringify(empty))

const strParens = validateVBACode(`Sub T()
x = "abc)((("
y = 1
End Sub`)
assert(strParens.filter(e => e.message.includes('括号')).length === 0, '字符串内括号不误报', JSON.stringify(strParens))

console.log(`\n结果: PASS=${pass} FAIL=${fail}`)
process.exit(fail ? 1 : 0)
