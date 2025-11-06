<script setup lang="ts">
import { reactive } from 'vue'
import { useClipboard, useLocalStorage } from '@vueuse/core'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'

import CodeEditor from '@/components/CodeEditor.vue'
import { useFormatters } from '@/composables/useFormatters'
import { FORMAT_OPTIONS, DEFAULT_FORMAT_OPTION } from '@/constants/formatOptions'

// Persist format option in localStorage
const persistedFormatOption = useLocalStorage(
  'json-formatter-option',
  DEFAULT_FORMAT_OPTION,
)

const state = reactive({
  content: '{}',
  formatOptionValue: persistedFormatOption.value,
})

const { copy, copied } = useClipboard()
const { formatJson, error: formatError } = useFormatters()

const onClickFormat = () => {
  try {
    state.content = formatJson(state.content, state.formatOptionValue)
    // Save preference
    persistedFormatOption.value = state.formatOptionValue
  } catch {
    // Error handling - could show a toast notification here
    console.error('Failed to format JSON:', formatError.value)
  }
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
      <CodeEditor v-model="state.content" mode="json" height="500px" />
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
          :options="FORMAT_OPTIONS"
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
