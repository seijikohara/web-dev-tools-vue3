<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { LAYOUT } from '@/constants/layout'

const uiStore = useUIStore()

const onClickMenu = () => {
  if (window.innerWidth <= LAYOUT.BREAKPOINT) {
    uiStore.openDrawer()
  } else {
    uiStore.toggleSidebar()
  }
}
</script>

<template>
  <div class="layout-topbar">
    <a class="menu-button" @click="onClickMenu"><i class="pi pi-bars"></i></a>
    <router-link to="/" class="logo-link">
      <object type="image/svg+xml" data="/img/logo.svg" class="logo-svg"></object>
      <span class="logo-text">WEB DEV TOOLS</span>
    </router-link>
  </div>
</template>

<style lang="scss">
.layout-topbar {
  background-color: $topbarBgColor;
  height: $topbarHeight;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 997;
  box-shadow: 0 0 5px rgba(89, 96, 109, 0.5);
  border-bottom: 1px solid var(--surface-d);
  display: flex;
  align-items: center;
  padding: 0 35px;

  .menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    transition: background-color $transitionDuration;
    cursor: pointer;
    font-size: 1.25rem;
    margin-right: 0.5rem;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    gap: 0.75rem;
  }

  .logo-svg {
    width: 50px;
    height: 50px;
    pointer-events: none;
  }

  .logo-text {
    color: $topbarLogoColor;
    font-family: 'Inconsolata', monospace;
    font-size: 1.5rem;
    font-weight: 400;
    letter-spacing: 0.15em;
  }
}

@media screen and (max-width: $breakpoint) {
  .layout-topbar {
    flex-wrap: wrap;
    padding: 0;

    .menu-button {
      width: 70px;
      height: $topbarHeight;
      border-radius: 0;
      margin-right: 0;
    }

    .logo-svg {
      width: 40px;
      height: 40px;
    }

    .logo-text {
      font-size: 1.1rem;
    }

    .logo-svg {
      width: 40px;
      height: 40px;
    }

    .logo-text {
      font-size: 1.1rem;
    }
  }
}
</style>
