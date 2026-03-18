import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/editor',
    name: 'Editor',
    component: () => import('@/views/EditorView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
