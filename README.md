[English](./README.md) | [简体中文](./README_CN.md)

<div align="center">
  <img src="public/demo.gif" alt="VBA Visual Demo" width="600">
  
  <h1>VBA Visual Editor</h1>
  
  <p><strong>Drag-and-drop VBA code generator for Excel automation</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#development">Development</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Electron-28-47848F?logo=electron" alt="Electron">
    <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js" alt="Vue 3">
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  </p>
</div>

---

## Features

- **Visual Block Programming** - Drag and drop blocks to build VBA code visually
- **7 Block Categories** - Basic, Control Flow, Excel Operations, Data Processing, Interaction, File Operations, Advanced
- **Real-time Code Preview** - See generated VBA code instantly with syntax highlighting
- **Project Management** - Save, load, and manage your VBA projects
- **Native Desktop App** - Built with Electron for cross-platform support
- **Modern UI** - Clean and intuitive interface powered by Element Plus

### Block Categories

| Category | Description |
|----------|-------------|
| **Basic** | Variable declaration, constants, assignments, comments |
| **Control Flow** | If/Else, For loops, Do While, Select Case |
| **Excel Operations** | Cell read/write, range selection, sheet operations, formulas |
| **Data Processing** | String manipulation, math operations, date handling |
| **Interaction** | MsgBox, InputBox, status bar |
| **File Operations** | File dialogs, read/write files |
| **Advanced** | Sub/Function definitions, error handling, arrays, dictionaries |

---

## Installation

### Download Release

Download the latest release from the [Releases](../../releases) page.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/your-username/vba-visual.git
cd vba-visual

# Install dependencies
pnpm install

# Build for production
pnpm build
```

---

## Usage

1. **Create New Project** - Start with a blank canvas
2. **Drag Blocks** - Select blocks from the toolbox and drag to canvas
3. **Connect Blocks** - Link blocks together to define program flow
4. **Configure Properties** - Set block properties in the property panel
5. **Preview Code** - View generated VBA code in real-time
6. **Export** - Copy code or save project for later use

---

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build application
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| [Electron](https://www.electronjs.org/) | Cross-platform desktop apps |
| [Vue 3](https://vuejs.org/) | Progressive JavaScript framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Vite](https://vitejs.dev/) | Next generation frontend tooling |
| [AntV X6](https://x6.antv.antgroup.com/) | Graph visualization engine |
| [Element Plus](https://element-plus.org/) | Vue 3 UI component library |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | Code editor |
| [Pinia](https://pinia.vuejs.org/) | State management |

### Project Structure

```
vba-visual/
├── electron/           # Electron main process
│   ├── main/          # Main process entry
│   └── preload/       # Preload scripts
├── src/
│   ├── components/    # Vue components
│   │   ├── blocks/    # Block toolbox
│   │   ├── canvas/    # Canvas toolbar
│   │   ├── layout/    # Layout components
│   │   └── panel/     # Property & code panels
│   ├── stores/        # Pinia stores
│   ├── types/         # TypeScript definitions
│   ├── utils/         # Utilities
│   └── views/         # Page views
└── public/            # Static assets
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [AntV X6](https://x6.antv.antgroup.com/) for the powerful graph engine
- [Element Plus](https://element-plus.org/) for the beautiful UI components
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor

---

<div align="center">
  <p>Made with ❤️ by VBA Visual Team</p>
</div>