// 行为测试套件（常驻仓库版）：由 scripts/behavior-tests/run.mjs 构建被测模块后执行
const path = require('node:path')
const BUNDLE_DIR = process.env.VBA_BUNDLE_DIR || '.'

const { parseVBACode } = require(require('node:path').resolve(BUNDLE_DIR, 'vbaParser.cjs'))
const { generateCodeWithMappings } = require(require('node:path').resolve(BUNDLE_DIR, 'codeGenerator.cjs'))
const { projectTemplates } = require(require('node:path').resolve(BUNDLE_DIR, 'projectTemplates.cjs'))
const { blockDefinitions: blockDefList } = require(require('node:path').resolve(BUNDLE_DIR, 'blockDefinitions.cjs'))
const blockDefIds = new Set(blockDefList.map(d => d.id))

let pass = 0, fail = 0
const assert = (cond, name, detail = '') => {
  if (cond) { pass++; console.log('  PASS', name) }
  else { fail++; console.log('  FAIL', name, detail) }
}

// ========== T1: F1 导入 Sub+For+If/Else 嵌套（原缺陷场景，整体保真）==========
console.log('[T1] 导入含 If/For 嵌套的 VBA')
const code1 = `Option Explicit

Sub ProcessData()
    Dim ws As Worksheet
    Set ws = ActiveSheet
    For i = 2 To 10
        If ws.Cells(i, 1).Value > 100 Then
            ws.Cells(i, 2).Value = "高"
        Else
            ws.Cells(i, 2).Value = "低"
        End If
    Next i
    MsgBox "done"
End Sub`
const r1 = parseVBACode(code1)
const sub = r1.blocks.find(b => b.definitionId === 'block-sub-define')
assert(r1.success && r1.blocks.length === 2, 'Option+Sub 两个积木', `got ${r1.blocks.length}`)
assert(!!sub && sub.properties.subName === 'ProcessData', 'Sub 名保留')
assert(sub && String(sub.properties.bodyCode).includes('For i = 2 To 10') && String(sub.properties.bodyCode).includes('Else') && String(sub.properties.bodyCode).includes('"低"'), '循环体/Else/嵌套赋值全部保留')
const gen1 = generateCodeWithMappings(r1.blocks, r1.connections.map((c, i) => ({ id: 'c' + i, ...c })))
assert(gen1.code.includes('Sub ProcessData()') && gen1.code.includes('For i = 2 To 10') && gen1.code.includes('End If') && gen1.code.includes('End Sub'), '生成代码结构完整')

// ========== T2: 顶层裸语句逐条映射 ==========
console.log('[T2] 顶层语句映射')
const r2 = parseVBACode(`Dim x As Integer
x = 5
MsgBox "hello"`)
assert(r2.blocks.length === 3 && r2.connections.length === 2, '3 积木 2 连线', `got ${r2.blocks.length}/${r2.connections.length}`)

// ========== T3: 各语句类型 definitionId 映射（顶层）==========
console.log('[T3] 语句类型映射')
const r3 = parseVBACode(`Dim a As String
Const K = 1
Set d = CreateObject("Scripting.Dictionary")
On Error Resume Next
On Error GoTo ErrHandler
Call Helper(1)
Worksheets("S1").Activate
Worksheets("S1").Select
Do Until x > 3
x = x + 1
Loop
While y < 3
y = y + 1
Wend
Select Case z
Case 1
a = "one"
End Select
With Range("A1")
.Value = 9
End With
Exit Sub`)
const ids3 = {}
r3.blocks.forEach(b => { ids3[b.definitionId] = (ids3[b.definitionId] || 0) + 1 })
console.log('  分布:', JSON.stringify(ids3))
const invalid = r3.blocks.filter(b => !blockDefIds.has(b.definitionId))
assert(invalid.length === 0, '无失效 definitionId', JSON.stringify(invalid.map(b => b.definitionId)))
assert(ids3['block-variable-declare'] === 1 && ids3['block-constant-declare'] === 1, 'Dim/Const 正确映射')
assert(ids3['block-assignment'] === 1, '顶层 Set 映射赋值积木(Set 前缀)', JSON.stringify(ids3))
assert(ids3['block-error-handler'] === 2, 'On Error x2 映射错误处理积木')
assert(ids3['block-sheet-activate'] === 1, 'Worksheets Activate 映射激活工作表')
assert(ids3['block-do-while-loop'] === 1, 'While→Do While 等价映射')
assert(ids3['block-with-statement'] === 1, 'With 映射 With 积木')
assert(ids3['block-custom-code'] === 5, 'Call/Select/Do Until/Exit/Select 行回退 custom-code', JSON.stringify(ids3))
const with3 = r3.blocks.find(b => b.definitionId === 'block-with-statement')
assert(with3 && String(with3.properties.bodyCode).includes('.Value = 9'), 'With 块体进入 bodyCode')
const eh3 = r3.blocks.filter(b => b.definitionId === 'block-error-handler')
assert(eh3[1] && eh3[1].properties.label === 'ErrHandler', 'On Error GoTo 标签捕获', eh3[1] && JSON.stringify(eh3[1].properties))

// ========== T4: 顶层单行 If ==========
console.log('[T4] 单行 If')
const r4 = parseVBACode(`If x > 1 Then y = 2
MsgBox "next"`)
assert(r4.blocks.length === 2, '单行 If + MsgBox', `got ${r4.blocks.length}: ` + JSON.stringify(r4.blocks.map(b => b.definitionId)))
const if4 = r4.blocks.find(b => b.definitionId === 'block-if-statement')
assert(if4 && if4.properties.thenCode === 'y = 2' && if4.properties.condition === 'x > 1', '单行 If 条件/thenCode 正确', if4 && JSON.stringify(if4.properties))

// ========== T5: 顶层 If-Else 拆分 ==========
console.log('[T5] If-Else 拆分')
const r5 = parseVBACode(`If a > 1 Then
b = 1
c = 3
Else
b = 2
End If`)
const if5 = r5.blocks.find(b => b.definitionId === 'block-if-else-statement')
assert(!!if5, '拆分为 block-if-else-statement', JSON.stringify(r5.blocks.map(b => b.definitionId)))
assert(if5 && String(if5.properties.thenCode).includes('b = 1') && String(if5.properties.elseCode).trim() === 'b = 2', 'then/else 正确拆分', if5 && JSON.stringify(if5.properties))
const gen5 = generateCodeWithMappings(r5.blocks, r5.connections.map((c, i) => ({ id: 'c' + i, ...c })))
assert(gen5.code.includes('If a > 1 Then') && gen5.code.includes('Else') && gen5.code.includes('End If') && gen5.code.trim().endsWith('End Sub'), '生成完整 If-Else(以 End Sub 收尾)', gen5.code)

// ========== T6: 模板引用完整性 + 生成冒烟 ==========
console.log('[T6] 项目模板校验')
const defMap = new Map(blockDefList.map(d => [d.id, d]))
let t6pass = true
projectTemplates.forEach(t => {
  t.data.blocks.forEach(b => {
    const def = defMap.get(b.definitionId)
    if (!def) { t6pass = false; console.log(`  FAIL ${t.id}: 引用不存在的 ${b.definitionId}`) }
    else Object.keys(b.properties).forEach(k => {
      if (!def.properties.some(p => p.id === k)) { t6pass = false; console.log(`  FAIL ${t.id}: ${b.definitionId} 属性键 ${k} 不在定义中`) }
    })
  })
})
assert(t6pass, '7 个模板引用与属性键全部有效')
const genT = projectTemplates.map(t => generateCodeWithMappings(t.data.blocks, t.data.connections))
assert(genT.every(g => g.code.includes('End Sub')), '全部模板可生成含 End Sub 的代码')
const genCond = genT[3]
assert(genCond.code.includes('If score >= 60 Then') && genCond.code.includes('MsgBox') && genCond.code.includes('End If'), '条件模板生成 If-Else 完整', genCond.code)
const genLoop = genT[1]
assert(genLoop.code.includes('For Each item In arr') && genLoop.code.includes('Next item'), '循环模板生成 For Each', genLoop.code)

// ========== T7: F1 子块兄弟链（原 prevBlockId 缺陷场景）==========
console.log('[T7] 顶层连续语句连线')
const r7 = parseVBACode(`a = 1
b = 2
c = 3`)
assert(r7.connections.length === 2 && r7.connections[0].targetBlockId === r7.blocks[1].id && r7.connections[1].sourceBlockId === r7.blocks[1].id, '顺序连线 a→b→c 无断链', JSON.stringify(r7.connections))

console.log(`\n结果: PASS=${pass} FAIL=${fail}`)
process.exit(fail ? 1 : 0)
