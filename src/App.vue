<template>
  <div class="app-container">
    <TitleBar />
    <div class="app-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleBar from '@/components/layout/TitleBar.vue'
import { useThemeStore } from '@/stores/themeStore'

// 使用主题 store（初始化主题）
void useThemeStore()
</script>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
