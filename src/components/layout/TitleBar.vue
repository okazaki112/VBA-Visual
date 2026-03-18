<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <div class="app-logo">
        <svg viewBox="0 0 24 24" class="logo-icon" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span class="app-title">VBA 可视化编辑器</span>
      </div>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn minimize" @click="minimize" title="最小化">
        <svg viewBox="0 0 12 12">
          <rect y="5" width="12" height="2" />
        </svg>
      </button>
      <button class="control-btn maximize" @click="maximize" title="最大化">
        <svg viewBox="0 0 12 12">
          <rect x="1" y="1" width="10" height="10" stroke-width="2" fill="none" />
        </svg>
      </button>
      <button class="control-btn close" @click="close" title="关闭">
        <svg viewBox="0 0 12 12">
          <path d="M1 1l10 10M11 1l-10 10" stroke-width="2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const minimize = async () => {
  await window.electronAPI?.window.minimize()
}

const maximize = async () => {
  await window.electronAPI?.window.maximize()
}

const close = async () => {
  await window.electronAPI?.window.close()
}
</script>

<style lang="scss" scoped>
.title-bar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  user-select: none;
}

.title-bar-drag {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  -webkit-app-region: drag;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.logo-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-color);
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.title-bar-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background-color var(--transition-fast);

  svg {
    width: 12px;
    height: 12px;
    stroke: var(--text-secondary);
    fill: none;
  }

  &:hover {
    background: var(--bg-tertiary);

    svg {
      stroke: var(--text-primary);
    }
  }

  &.close:hover {
    background: var(--error);

    svg {
      stroke: white;
    }
  }
}
</style>
