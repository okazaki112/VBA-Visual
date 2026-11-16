# =====================================================================
# VBA 可视化编辑器 - 发布版构建脚本
# 兼容 Windows PowerShell 5.1 及以上版本 (Windows 10/11 默认自带)
# 用法: 将本脚本放在项目根目录, 执行:
#       powershell -ExecutionPolicy Bypass -File .\build-release.ps1
# 说明: 无输入参数; 版本号读取自 package.json;
#       构建命令 = vue-tsc -b && vite build && electron-builder (pnpm run build)
# 注意: 本文件必须保存为 UTF-8 with BOM 编码, 否则中文在 PS 5.1 下会乱码
# =====================================================================

$ErrorActionPreference = 'Stop'

# ---------- 路径与配置(全部内部定义, 无输入参数) ----------
$ProjectRoot  = $PSScriptRoot
$VersionFile  = Join-Path $ProjectRoot 'package.json'
$ReleaseDir   = Join-Path $ProjectRoot 'release'      # electron-builder 产物目录, 与 package.json build.directories.output 一致
$PublishRoot  = Join-Path $ProjectRoot '发布版'        # 发布版根目录
$BuildCommand = 'pnpm run build'

# ---------- 日志辅助 ----------
function Write-Step { param([string]$Message) Write-Host "`n[步骤] $Message" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Message) Write-Host "[成功] $Message" -ForegroundColor Green }
function Write-Fail { param([string]$Message) Write-Host "[错误] $Message" -ForegroundColor Red }

try {
    # ---------- 1. 读取版本号 ----------
    Write-Step "读取版本号 ($VersionFile)"
    if (-not (Test-Path $VersionFile)) {
        throw "未找到 package.json: $VersionFile"
    }
    $Version = (Get-Content $VersionFile -Raw -Encoding UTF8 | ConvertFrom-Json).version
    if ([string]::IsNullOrWhiteSpace($Version)) {
        throw "package.json 中未定义 version 字段"
    }
    Write-Ok "当前版本: v$Version"

    # ---------- 2. 准备目标目录 ./发布版/<版本号>/ ----------
    $TargetDir = Join-Path $PublishRoot $Version
    Write-Step "准备发布目录: $TargetDir"
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Ok "目录就绪"

    # ---------- 3. 清理上次构建产物(仅 release 顶层文件, 保证后续只复制本次产物) ----------
    Write-Step "清理旧构建产物 ($ReleaseDir)"
    if (Test-Path $ReleaseDir) {
        Get-ChildItem $ReleaseDir -File | Remove-Item -Force
    }
    Write-Ok "清理完成"

    # ---------- 4. 执行构建 ----------
    Write-Step "开始构建: $BuildCommand (数分钟, 请等待)"
    cmd /c $BuildCommand
    if ($LASTEXITCODE -ne 0) {
        throw "构建失败, 退出码: $LASTEXITCODE。请确认已安装 pnpm、依赖已安装 (pnpm install), 并检查上方构建日志。"
    }
    Write-Ok "构建成功"

    # ---------- 5. 复制发布文件到 ./发布版/<版本号>/ ----------
    Write-Step "复制发布文件到 $TargetDir"
    $Artifacts = Get-ChildItem $ReleaseDir -File |
        Where-Object { $_.Extension -in '.exe', '.blockmap' }
    if (-not $Artifacts) {
        throw "release 目录中未找到发布文件 (*.exe / *.blockmap): $ReleaseDir"
    }
    foreach ($file in $Artifacts) {
        Copy-Item $file.FullName -Destination $TargetDir -Force
        Write-Host ("  已复制: {0} ({1:N1} MB)" -f $file.Name, ($file.Length / 1MB)) -ForegroundColor Gray
    }
    Write-Ok "复制完成: $($Artifacts.Count) 个文件"

    # ---------- 6. 完成 ----------
    Write-Host ""
    Write-Ok "发布版构建全部完成 -> $TargetDir"
    exit 0
}
catch {
    Write-Fail $_.Exception.Message
    exit 1
}
