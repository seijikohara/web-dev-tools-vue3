<script setup lang="ts">
import { reactive } from 'vue'
import { useClipboard } from '@vueuse/core'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'

import CodeEditor from '@/components/CodeEditor.vue'

type FormatOption = {
  text: string
  value: string
}

const formatOptions = [
  { text: '2 Spaces', value: ' '.repeat(2) },
  { text: '4 Spaces', value: ' '.repeat(4) },
  { text: '1 Tab', value: '\t' },
  { text: 'Compact', value: '' },
] as FormatOption[]
const state = reactive({
  content: '{}',
  formatOptionValue: formatOptions[0]?.value ?? '  ',
})

const { copy, copied } = useClipboard()

const onClickFormat = () => {
  const parsed = JSON.parse(state.content)
  const padString = state.formatOptionValue
  state.content = JSON.stringify(parsed, undefined, padString)
}

const onClickCopy = () => {
  copy(state.content)
}
</script>

<template>
  <Card>
    <template #title> JSON Formatter </template>
    <template #subtitle> Formatting JSON </template>
    <template #content>
      <CodeEditor v-model:value="state.content" mode="json" height="500px" />
    </template>
    <template #footer>
      <div class="p-inputgroup">
        <Button label="Format" @click="onClickFormat" />
        <Button
          :label="copied ? 'Copied!' : 'Copy'"
          :severity="copied ? 'success' : 'secondary'"
          @click="onClickCopy"
        />
        <Dropdown
          v-model="state.formatOptionValue"
          :options="formatOptions"
          optionLabel="text"
          optionValue="value"
        />
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.buttons {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
