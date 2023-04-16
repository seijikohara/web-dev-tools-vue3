<template>
  <Card>
    <template #title> JSON to TypeScript </template>
    <template #subtitle> Convert JSON to TypeScript interface </template>
    <template #content>
      <div class="grid">
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="JSON">
            <CodeEditor v-model:value="state.json" mode="json" height="500px" />
          </Panel>
        </div>
        <div class="col-12 md:col-6 lg:col-6">
          <Panel header="TypeScript interface">
            <CodeEditor
              v-model:value="state.typeScript"
              mode="typescript"
              height="500px"
            />
          </Panel>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import JsonToTS from 'json-to-ts'

import Card from 'primevue/card'
import Panel from 'primevue/panel'

import CodeEditor from '@/components/CodeEditor.vue'

const state = reactive({
  json: '{}',
  typeScript: '',
})

watch(
  () => state.json,
  (json: string) => {
    const jsonToObject = (json: string): unknown => {
      try {
        return JSON.parse(json)
      } catch (e) {
        return {}
      }
    }

    const object = jsonToObject(json)
    state.typeScript = JsonToTS(object).join('\r\n\r\n')
  },
)
</script>

<style lang="scss" scoped>
.buttons {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
