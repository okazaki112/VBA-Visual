import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 扩展主题类型：绿色(默认)、蓝色、橙色、深色、黑色
export type ThemeMode = 'green-light' | 'blue-light' | 'orange-light' | 'dark' | 'black'

// 获取CSS变量值的辅助函数
export const getCSSVariable = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// 获取主题颜色
export const getThemeColors = () => {
  return {
    primary: getCSSVariable('--primary-color') || '#2abb78',
    primaryLight: getCSSVariable('--primary-light') || '#4ed99a',
    bgPrimary: getCSSVariable('--bg-primary') || '#b8e0cc',
    bgSecondary: getCSSVariable('--bg-secondary') || '#c8ead8',
    bgCard: getCSSVariable('--bg-card') || '#c8ead8',
    textPrimary: getCSSVariable('--text-primary') || '#1e293b',
    textSecondary: getCSSVariable('--text-secondary') || '#64748b',
    borderColor: getCSSVariable('--border-color') || '#5cc490',
    borderLight: getCSSVariable('--border-light') || '#3dba7a'
  }
}

// 主题配置
export interface ThemeConfig {
  id: ThemeMode
  name: string
  icon: string
  primaryColor: string
  description: string
}

// 主题列表配置
export const themeList: ThemeConfig[] = [
  {
    id: 'green-light',
    name: '清新绿',
    icon: 'Sunny',
    primaryColor: '#2abb78',
    description: '清新绿色'
  },
  {
    id: 'blue-light',
    name: '商务蓝',
    icon: 'Sunny',
    primaryColor: '#5ba8e8',
    description: '专业蓝色'
  },
  {
    id: 'orange-light',
    name: '活力橙',
    icon: 'Sunny',
    primaryColor: '#D06F0C',
    description: '活力橙色'
  },
  {
    id: 'dark',
    name: '深色模式',
    icon: 'Moon',
    primaryColor: '#6366f1',
    description: '深色背景，夜间护眼'
  },
  {
    id: 'black',
    name: '纯黑模式',
    icon: 'Moon',
    primaryColor: '#00d4ff',
    description: '纯黑背景，极致暗黑'
  }
]

export const useThemeStore = defineStore('theme', () => {
  // 从 localStorage 读取主题设置，默认绿色主题
  const getInitialTheme = (): ThemeMode => {
    const saved = localStorage.getItem('vba-visual-theme')
    // 兼容旧的主题值
    if (saved === 'light') {
      return 'green-light'
    }
    if (saved && themeList.some(t => t.id === saved)) {
      return saved as ThemeMode
    }
    // 默认使用绿色主题
    return 'green-light'
  }

  const theme = ref<ThemeMode>(getInitialTheme())

  // 应用主题到 DOM
  const applyTheme = (mode: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', mode)
    // 更新 Element Plus 的主题
    if (mode === 'dark' || mode === 'black') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // 初始化时应用主题
  applyTheme(theme.value)

  // 监听主题变化
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
    localStorage.setItem('vba-visual-theme', newTheme)
  })

  // 切换主题（循环切换）
  const toggleTheme = () => {
    const currentIndex = themeList.findIndex(t => t.id === theme.value)
    const nextIndex = (currentIndex + 1) % themeList.length
    theme.value = themeList[nextIndex].id
  }

  // 设置特定主题
  const setTheme = (mode: ThemeMode) => {
    theme.value = mode
  }

  // 获取当前主题配置
  const getCurrentThemeConfig = () => {
    return themeList.find(t => t.id === theme.value) || themeList[0]
  }

  // 判断是否为深色主题
  const isDark = () => theme.value === 'dark' || theme.value === 'black'

  return {
    theme,
    themeList,
    toggleTheme,
    setTheme,
    getCurrentThemeConfig,
    isDark
  }
})