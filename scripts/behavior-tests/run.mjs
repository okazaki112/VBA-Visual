// 行为测试运行器：esbuild 打包被测模块（含 @ 别名）→ 逐套件执行 → 汇总退出码
// 用法: pnpm test（或 node scripts/behavior-tests/run.mjs）
import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const root = process.cwd()
const outDir = path.join(root, 'scripts', 'behavior-tests', '.bundles')
fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

// 被测模块 → 源文件路径（projectTemplates 在 assets 下，其余在 utils）
const moduleEntries = {
  vbaParser: 'src/utils/vbaParser.ts',
  codeGenerator: 'src/utils/codeGenerator.ts',
  variableScanner: 'src/utils/variableScanner.ts',
  vbaValidator: 'src/utils/vbaValidator.ts',
  vbaEditor: 'src/utils/vbaEditor.ts',
  blockDefinitions: 'src/utils/blockDefinitions.ts',
  projectTemplates: 'src/assets/templates/projectTemplates.ts'
}

console.log('[行为测试] 构建被测模块...')
for (const [m, entry] of Object.entries(moduleEntries)) {
  await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    alias: { '@': path.join(root, 'src') },
    outfile: path.join(outDir, `${m}.cjs`),
    logLevel: 'silent'
  })
}

const suites = [
  'baseline.cjs', //   v1.1.0 导入/生成/模板 25 断言
  'structure.cjs', //  v1.2.0 容器/缩进/扫描/校验 23 断言
  'rules.cjs', //      v1.3.0 行映射/未使用/重复/边界/重命名 15 断言
  'dualbody.cjs', //   v1.6.0 双体容器 9 断言
  'writing.cjs' //     v1.10.0 智能缩进/插入/配对 26 断言
]

let failed = 0
for (const suite of suites) {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'behavior-tests', suite)], {
    stdio: 'inherit',
    env: { ...process.env, VBA_BUNDLE_DIR: outDir }
  })
  if (r.status !== 0) failed++
}

if (failed) {
  console.error(`\n[行为测试] ${failed} 个套件失败`)
  process.exit(1)
}
console.log('\n[行为测试] 全部套件通过')
