<script setup lang="ts">
import { ref, watch } from 'vue'
import JsonToTS from 'json-to-ts'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'

import CodeEditor from '@/components/CodeEditor.vue'
import DualPanelLayout from '@/components/DualPanelLayout.vue'

const toast = useToast()
const json = ref('')
const typeScript = ref('')

const convertJsonToTypeScript = (jsonString: string): string => {
  if (!jsonString.trim()) {
    return ''
  }

  try {
    const parsed = JSON.parse(jsonString)
    const interfaces = JsonToTS(parsed)
    return interfaces.join('\n\n')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON format'
    toast.add({
      severity: 'error',
      summary: 'JSON Parse Error',
      detail: message,
      life: 3000,
    })
    console.error('JSON parse error:', error)
    return ''
  }
}

watch(
  json,
  newJson => {
    typeScript.value = convertJsonToTypeScript(newJson)
  },
  { immediate: true },
)
</script>

<template>
  <Card>
    <template #title> JSON to TypeScript </template>
    <template #subtitle> Convert JSON to TypeScript interface </template>
    <template #content>
      <DualPanelLayout left-header="JSON" right-header="TypeScript interface">
        <template #left>
          <CodeEditor v-model="json" mode="json" height="500px" />
        </template>
        <template #right>
          <CodeEditor v-model="typeScript" mode="typescript" height="500px" />
        </template>
      </DualPanelLayout>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.buttons {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
