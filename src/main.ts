import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { iconRegistry } from './utils/iconRegistry'

import App from './App.vue'
import router from './router'
import './assets/styles/global.scss'

const app = createApp(App)

// v1.9.0 按需注册动态图标（积木/模板/命令面板的字符串解析），不再全量注册约 300 个
for (const [key, component] of Object.entries(iconRegistry)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { size: 'default', zIndex: 3000 })

app.mount('#app')