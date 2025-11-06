<script setup lang="ts">
import { ref } from 'vue'

import Button from 'primevue/button'
import Card from 'primevue/card'

import CodeEditor from '@/components/CodeEditor.vue'

const content = ref('')

const onClickEncode = () => {
  try {
    content.value = encodeURIComponent(content.value)
  } catch (error) {
    console.error('Encode error:', error)
  }
}

const onClickDecode = () => {
  try {
    content.value = decodeURIComponent(content.value)
  } catch (error) {
    console.error('Decode error:', error)
  }
}
</script>

<template>
  <Card>
    <template #title> URL Encoding </template>
    <template #subtitle> URL Encoding & Decoding </template>
    <template #content>
      <CodeEditor v-model="content" mode="plain_text" height="500px" />
    </template>
    <template #footer>
      <div class="p-inputgroup">
        <Button label="Encode" @click="onClickEncode" />
        <Button label="Decode" class="p-button-secondary" @click="onClickDecode" />
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.button {
  margin-right: 0.5rem;
}
</style>
