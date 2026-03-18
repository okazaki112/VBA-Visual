import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import path from 'node:path'
import fs from 'node:fs'

// 自定义插件：直接复制 preload 文件
const copyPreloadPlugin = () => ({
  name: 'copy-preload',
  writeBundle() {
    const src = 'electron/preload/index.js'
    const dest = 'dist-electron/preload/index.cjs'
    const dir = path.dirname(dest)
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // 直接复制文件
    fs.copyFileSync(src, dest)
    console.log('✓ Preload script copied directly')
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // 主进程入口
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: 'index.mjs'
              }
            }
          }
        }
      },
      {
        // 预加载脚本 - 使用自定义插件处理
        entry: 'electron/preload/index.js',
        onstart(options) {
          options.reload()
        },
        vite: {
          plugins: [copyPreloadPlugin()],
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: 'index.cjs'
              }
            }
          }
        }
      }
    ])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/variables.scss" as *;`
      }
    }
  },
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173
  }
})