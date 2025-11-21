<template>
  <div class="layout-wrapper">
    <slot></slot>
  </div>
</template>

<style lang="scss">
.layout-wrapper {
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
}
</style>
