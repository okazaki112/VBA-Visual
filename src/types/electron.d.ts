// Electron 类型声明
declare namespace Electron {
  interface SaveDialogOptions {
    title?: string
    defaultPath?: string
    buttonLabel?: string
    filters?: Array<{
      name: string
      extensions: string[]
    }>
    message?: string
  }

  interface OpenDialogOptions {
    title?: string
    defaultPath?: string
    buttonLabel?: string
    filters?: Array<{
      name: string
      extensions: string[]
    }>
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'>
    message?: string
  }

  interface SaveDialogReturnValue {
    canceled: boolean
    filePath?: string
  }

  interface OpenDialogReturnValue {
    canceled: boolean
    filePaths: string[]
  }

  interface FsResult {
    success: boolean
    content?: string
    error?: string
  }
}

interface ElectronAPI {
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
    save: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
    open: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
  }
  fs: {
    readFile: (filePath: string) => Promise<Electron.FsResult>
    writeFile: (filePath: string, content: string) => Promise<Electron.FsResult>
    saveImage: (filePath: string, dataUrl: string) => Promise<Electron.FsResult>
    saveSVG: (filePath: string, content: string) => Promise<Electron.FsResult>
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
