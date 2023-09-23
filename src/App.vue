
<script setup lang="ts">
import LayoutWrapper from '@/components/layout/LayoutWrapper.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppContent from '@/components/layout/AppContent.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <LayoutWrapper>
    <AppTopbar />
    <AppSidebar />
    <AppContent />
    <AppFooter />
  </LayoutWrapper>
</template>
