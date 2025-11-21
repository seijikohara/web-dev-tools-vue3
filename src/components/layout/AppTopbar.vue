<script setup lang="ts">
import { useDrawerStore } from '@/stores/drawer'

const drawerStore = useDrawerStore()
const onClickMenu = () => drawerStore.open()
</script>

<template>
  <div class="layout-topbar">
    <a class="menu-button" @click="onClickMenu"><i class="pi pi-bars"></i></a>
    <router-link to="/">
      <img src="/img/logo-top.png" height="60" />
    </router-link>
  </div>
</template>

<style lang="scss">
.layout-topbar {
  background-color: #59606d;
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
    display: none;
    color: var(--primary-color-text);
    width: 70px;
    height: $topbarHeight;
    line-height: 70px;
    text-align: center;
    transition: background-color $transitionDuration;
    cursor: pointer;
  }
}
@media screen and (max-width: $breakpoint) {
  .layout-topbar {
    flex-wrap: wrap;
    padding: 0;
    .menu-button {
      display: block;
    }
  }
}
</style>
