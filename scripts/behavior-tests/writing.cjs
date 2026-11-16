// v1.10.0 写代码交互纯函数测试（智能缩进/插入/配对/选区缩进）
const {
  nextIndentAfter, applySmartEnter, insertAtCursor, indentSelection,
  countOpenBlocks, CODE_SKELETONS
} = require(require('node:path').resolve(process.env.VBA_BUNDLE_DIR || '.', 'vbaEditor.cjs'))

let pass = 0, fail = 0
const assert = (cond, name, detail = '') => {
  if (cond) { pass++; console.log('  PASS', name) }
  else { fail++; console.log('  FAIL', name, detail) }
}
const U = '    '

// ========== T24: 智能缩进 ==========
console.log('[T24] 智能缩进')
assert(nextIndentAfter('For i = 1 To 10', U) === U, 'For 开启 → +1 级')
assert(nextIndentAfter('If x > 1 Then', U) === U, 'If..Then(行尾) → +1 级')
assert(nextIndentAfter('If x > 1 Then y = 2', U) === '', '单行 If → 不缩进')
assert(nextIndentAfter('With Range("A1")', U) === U, 'With → +1 级')
assert(nextIndentAfter('Select Case x', U) === U, 'Select Case → +1 级')
assert(nextIndentAfter('Else', U) === '', 'Else → 同级')
assert(nextIndentAfter('Case 1', U) === '', 'Case → 同级')
assert(nextIndentAfter('End If', U) === '', 'End If → -1 级(归零)')
assert(nextIndentAfter(U + 'Next i', U) === '', '带缩进 Next → -1 级归零')
assert(nextIndentAfter(U.repeat(3) + 'End If', U) === U.repeat(2), '嵌套 End If → -1 级保留两层')
assert(nextIndentAfter('x = 1', U) === '', '普通语句 → 同级')
assert(nextIndentAfter('private sub foo()', U) === U, 'Private Sub(大小写不敏感) → +1 级')
assert(nextIndentAfter('', U) === '', '空文本 → 空缩进')

// applySmartEnter 光标落点
const r1 = applySmartEnter('For i = 1 To 10', 15)
assert(r1.text === 'For i = 1 To 10\n' + U, 'Enter 插入换行+缩进')
assert(r1.caret === 16 + U.length, '光标落在新行缩进末尾', String(r1.caret))

// ========== T25: 光标插入 ==========
console.log('[T25] 光标插入')
const r2 = insertAtCursor('abc', 2, 2, 'X')
assert(r2.text === 'abXc' && r2.caret === 3, '无选区光标处插入')
const r3 = insertAtCursor('abc', 1, 2, 'X')
assert(r3.text === 'aXc' && r3.caret === 2, '选区替换')
const r4 = insertAtCursor('total + 1', 0, 0, 'grandTotal')
assert(r4.text === 'grandTotaltotal + 1' && r4.caret === 10, '骨架整段插入光标在尾')

// ========== T26: 选区缩进 ==========
console.log('[T26] 选区缩进')
const text5 = 'a\nb\nc'
const rin = indentSelection(text5, 0, text5.length, 'in')
assert(rin.text === U + 'a\n' + U + 'b\n' + U + 'c', '选区覆盖的行全部缩进', JSON.stringify(rin.text))
const rout = indentSelection(rin.text, 0, rin.text.length, 'out')
assert(rout.text === text5, '反缩进还原(幂等)')
const rout2 = indentSelection('\tline', 0, 6, 'out')
assert(rout2.text === 'line', 'Tab 缩进也能反缩进')

// ========== T27: 片段结构配对 ==========
console.log('[T27] 结构配对提示')
const b1 = countOpenBlocks('For i = 1 To 10\nx = i')
assert(b1.openCount === 1 && b1.openers[0] === 'For' && !b1.balanced, '未闭合 For 检出', JSON.stringify(b1))
const b2 = countOpenBlocks('For i = 1 To 10\nIf x Then\nEnd If\nNext i')
assert(b2.balanced && b2.openCount === 0, '完整嵌套配对平衡')
const b3 = countOpenBlocks("For i = 1 To 10\n' 注释里的 End If\nNext i")
assert(b3.balanced, '注释中的关闭词不计入')
const b4 = countOpenBlocks('If x Then\nEnd If\nEnd If')
assert(b4.balanced, '多余关闭词不误报(无对应开启即忽略)')
assert(CODE_SKELETONS.length === 7, '骨架清单 7 项')

console.log(`\n结果: PASS=${pass} FAIL=${fail}`)
process.exit(fail ? 1 : 0)
