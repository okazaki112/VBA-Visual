[English](./README.md) | [简体中文](./README_CN.md)

<div align="center">
  <video src="public/test1.mp4" controls width="600" poster="public/test.png">
    您的浏览器不支持视频播放
  </video>
  
  <h1>VBA 可视化编辑器</h1>
  
  <p><strong>拖拽积木，轻松生成 VBA 代码</strong></p>
  
  <p>
    <a href="#功能特性">功能特性</a> •
    <a href="#安装">安装</a> •
    <a href="#使用方法">使用方法</a> •
    <a href="#开发">开发</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Electron-28-47848F?logo=electron" alt="Electron">
    <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js" alt="Vue 3">
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  </p>
</div>

---

## 功能特性

- **可视化积木编程** - 拖拽积木块即可生成 VBA 代码，无需手写代码
- **7 大积木分类** - 基础、流程控制、Excel 操作、数据处理、交互、文件操作、高级
- **实时代码预览** - 即时查看生成的 VBA 代码，支持语法高亮
- **项目管理** - 支持项目保存、加载和管理
- **原生桌面应用** - 基于 Electron 构建，支持跨平台
- **现代化界面** - 基于 Element Plus 的简洁直观界面

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

## 安装

### 下载安装包

从 [Releases](../../releases) 页面下载最新版本。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/your-username/vba-visual.git
cd vba-visual

# 安装依赖
pnpm install

# 构建生产版本
pnpm build
```

---

## 使用方法

1. **新建项目** - 从空白画布开始
2. **拖拽积木** - 从工具箱选择积木拖放到画布
3. **连接积木** - 将积木连接起来定义程序流程
4. **配置属性** - 在属性面板中设置积木属性
5. **预览代码** - 实时查看生成的 VBA 代码
6. **导出** - 复制代码或保存项目以备后用

---

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建应用
pnpm build

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) | 跨平台桌面应用框架 |
| [Vue 3](https://vuejs.org/) | 渐进式 JavaScript 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全的 JavaScript |
| [Vite](https://vitejs.dev/) | 下一代前端构建工具 |
| [AntV X6](https://x6.antv.antgroup.com/) | 图可视化引擎 |
| [Element Plus](https://element-plus.org/) | Vue 3 UI 组件库 |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | 代码编辑器 |
| [Pinia](https://pinia.vuejs.org/) | 状态管理 |

### 项目结构

```
vba-visual/
├── electron/           # Electron 主进程
│   ├── main/          # 主进程入口
│   └── preload/       # 预加载脚本
├── src/
│   ├── components/    # Vue 组件
│   │   ├── blocks/    # 积木工具箱
│   │   ├── canvas/    # 画布工具栏
│   │   ├── layout/    # 布局组件
│   │   └── panel/     # 属性面板和代码面板
│   ├── stores/        # Pinia 状态存储
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 工具函数
│   └── views/         # 页面视图
└── public/            # 静态资源
```

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

本项目基于 MIT 许可证开源 - 详情请查看 [LICENSE](LICENSE) 文件。

---

## 致谢

- [AntV X6](https://x6.antv.antgroup.com/) - 强大的图编辑引擎
- [Element Plus](https://element-plus.org/) - 精美的 UI 组件库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 优秀的代码编辑器

---

<div align="center">
  <p>Made with ❤️ by VBA Visual Team</p>
</div>