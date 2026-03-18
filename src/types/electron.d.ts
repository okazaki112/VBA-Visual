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
}
