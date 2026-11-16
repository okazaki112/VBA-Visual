<div align="center">

# VBA-Visual

**拖拽积木，轻松生成 VBA 代码 —— Excel 自动化的可视化开发工具**

[![Version](https://img.shields.io/badge/version-1.10.0-blue)](https://github.com/okazaki112/VBA-Visual/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-lightgrey)](#快速开始)
[![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[快速开始](#快速开始) · [功能特性](#功能特性) · [使用方法](#使用方法) · [从源码构建](#从源码构建) · [Roadmap](#roadmap) · [LICENSE](LICENSE)

</div>

---

## 目录

- [为什么需要它](#为什么需要它)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [使用方法](#使用方法)
- [从源码构建](#从源码构建)
- [测试与门禁](#测试与门禁)
- [架构](#架构)
- [已知限制](#已知限制)
- [Roadmap](#roadmap)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 为什么需要它

VBA 是 Excel 自动化的主力语言，但手写代码门槛不低：语法记不住、对象模型复杂、缩进与括号一错就报错。

**VBA-Visual 把 VBA 开发变成"搭积木"**：从工具箱拖出积木块，在画布上连接编排程序流程，应用实时生成规范的 VBA 代码，复制进 Excel 即可运行。

| 痛点 | VBA-Visual 的解法 |
|------|------------------|
| 语法记不住 | 积木块自带语法模板，填参数即可 |
| 流程逻辑理不清 | If / For / Do / With 容器化嵌套，流程在画布上一目了然 |
| 变量用错没人提醒 | 规则智能：未声明告警、一键声明、重命名联动、静态校验 |
| 代码与逻辑对不上 | 行级映射：代码行与画布积木双向定位 |
| 重复劳动 | 项目保存 / 模板 / 命令面板 Ctrl+K 快速调用 |

---

## 功能特性

| 功能 | 说明 |
|------|------|
| **可视化积木编程** | 拖拽积木块即可生成 VBA 代码，无需手写 |
| **容器化流程编排** | If / For / Do / With 即容器，循环体与分支体直接在画布上嵌套编排（If-Else 双体：拖入右半区进入 Else 体） |
| **规则智能** | 变量感知与自动补全、未声明引用告警、一键声明 / 重命名联动、生成代码静态校验与错误定位、未使用 / 重复声明 / 循环边界检查 |
| **代码编辑智能** | code 属性编辑器全面升级：代码补全、语法高亮、查找 |
| **命令面板** | `Ctrl+K` 统一搜索命令 / 积木 / 模板 / 画布积木 |
| **实时代码预览** | 行级映射，代码行与画布积木双向定位，支持语法高亮与代码内查找 |
| **操作顺手化** | 批量单次撤销、拖入自动选中、偏好设置持久化 |
| **项目管理** | 保存 / 加载 / 最近项目 / 自动保存草稿与崩溃恢复 / 版本快照 |
| **7 大积木分类** | 基础、流程控制、Excel 操作、数据处理、交互、文件操作、高级 |
| **好用专项** | 空态引导、边右键菜单、小地图、状态栏、页签徽标、画布搜索 |
| **原生桌面应用** | 基于 Electron 构建，绿色便携版免安装 |

### 积木分类

| 分类 | 说明 |
|------|------|
| **基础** | 变量声明、常量声明、赋值语句、注释 |
| **流程控制** | If 条件判断、For 循环、Do While 循环、Select Case |
| **Excel 操作** | 单元格读写、区域选择、工作表操作、公式设置 |
| **数据处理** | 字符串处理、数学运算、日期时间操作 |
| **交互** | 消息框、输入框、状态栏 |
| **文件操作** | 文件对话框、文件读写 |
| **高级** | Sub/Function 定义、错误处理、数组、字典 |

---

## 快速开始

### 系统要求

- Windows 10 / 11
- 从源码构建需要：Node.js ≥ 18、pnpm ≥ 8

### 下载安装

- **稳定版**：前往 [Latest Release](https://github.com/okazaki112/VBA-Visual/releases/latest) 下载 `VBA-Visual-v*.*.*-portable.exe`
- **尝鲜版**：想第一时间体验 main 分支最新功能，下载 [Nightly Build](https://github.com/okazaki112/VBA-Visual/releases/tag/nightly)（预发布，随每次推送自动替换，可能不够稳定）

两者均为便携版（免安装，双击即用），系统要求 Windows 10 / 11。

### 从源码运行

```powershell
# 克隆仓库
git clone https://github.com/okazaki112/VBA-Visual.git
cd VBA-Visual

# 安装依赖
pnpm install

# 启动开发模式
pnpm dev
```

---

## 使用方法

1. **新建项目** — 从空白画布开始，或打开已有项目
2. **拖拽积木** — 从工具箱选择积木拖放到画布
3. **连接积木** — 将积木连接起来定义程序流程
4. **配置属性** — 在属性面板中设置积木属性（code 编辑器支持补全与高亮）
5. **预览代码** — 实时查看生成的 VBA 代码，点击代码行可反向定位画布积木
6. **导出** — 复制代码粘贴进 Excel VBA 编辑器，或保存项目以备后用

> 按 `F1` 打开帮助文档（含入门指南），`Ctrl+K` 唤起命令面板。

---

## 从源码构建

```powershell
# 安装依赖
pnpm install

# 启动开发服务器（热更新）
pnpm dev

# 构建生产版本（vue-tsc 类型检查 + vite build + electron-builder）
pnpm build

# 代码检查 / 格式化
pnpm lint
pnpm format
```

### 发布版构建

使用项目自带的发布脚本，产物输出到 `release/` 与 `发布版/` 目录：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-release.ps1
```

- 版本号自动读取自 `package.json`
- 构建命令：`vue-tsc -b && vite build && electron-builder`
- 兼容 Windows PowerShell 5.1+（Windows 10/11 自带）

### 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) 28 | 跨平台桌面应用框架 |
| [Vue 3](https://vuejs.org/) 3.5 | 渐进式 JavaScript 框架 |
| [TypeScript](https://www.typescriptlang.org/) 5.9 | 类型安全的 JavaScript |
| [Vite](https://vitejs.dev/) 5 | 下一代前端构建工具 |
| [AntV X6](https://x6.antv.antgroup.com/) | 图可视化编辑引擎（画布与积木连线） |
| [Element Plus](https://element-plus.org/) | Vue 3 UI 组件库 |
| [Pinia](https://pinia.vuejs.org/) | 状态管理 |

---

## 测试与门禁

项目内置行为测试套件（对打包产物运行端到端行为断言）：

```powershell
# 运行行为测试（需要先执行 pnpm build 生成产物）
pnpm test
```

| 判据 | 说明 |
|------|------|
| 全部用例通过 | 测试进程退出码为 0 |
| 测试对象 | `dist/` + `dist-electron/` 构建产物 |

---

## 架构

<details>
<summary><strong>项目结构（点击展开）</strong></summary>

```
VBA-Visual/
├── electron/           # Electron 主进程
│   ├── main/           #   主进程入口
│   └── preload/        #   预加载脚本
├── src/
│   ├── components/     # Vue 组件
│   ├── composables/    # 组合式函数
│   ├── stores/         # Pinia 状态存储
│   ├── router/         # 路由
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── views/          # 页面视图
│   └── assets/         # 静态资源
├── scripts/
│   └── behavior-tests/ # 行为测试套件
├── public/             # 静态资源（图标、示例 .bas 文件）
├── build-release.ps1   # 发布版构建脚本
└── vite.config.ts      # Vite 配置
```

</details>

---

## 已知限制

<details>
<summary><strong>如实披露（点击展开）</strong></summary>

- **平台**：目前仅提供 Windows 打包产物（portable exe）；Electron 本身支持跨平台，macOS / Linux 打包尚未配置
- **演示媒体**：大体积演示动图与截图不入版本库（控制仓库体积），请到 [Releases](https://github.com/okazaki112/VBA-Visual/releases) 查看资产
- **运行环境**：桌面应用基于 Chromium 渲染，首次启动可能需要短暂加载时间

</details>

---

## Roadmap

- [x] v1.10.0 写代码交互智能化 — code 属性编辑器全面升级
- [x] v1.9.0 工程质量收官 — vendor 拆分 / 图标按需注册 / 行为测试常态化
- [x] v1.7.0 命令面板 Ctrl+K
- [x] v1.6.0 双体容器 — If-Else 的 Else 分支支持子积木编排
- [x] v1.4.0~v1.5.0 好用专项 + 操作顺手化
- [ ] macOS / Linux 打包
- [ ] 积木分类扩展（Word / Outlook 操作）
- [ ] 多语言界面（English UI）

> 迭代历史详见各版本的 [Release Notes](https://github.com/okazaki112/VBA-Visual/releases)。

---

## 贡献指南

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源——可自由使用、修改、再分发（含商用），
只需保留版权声明。软件按"现状"提供，**数据操作请自担风险**。

---

<div align="center">

**VBA-Visual** — 让 Excel 自动化像搭积木一样简单

</div>
