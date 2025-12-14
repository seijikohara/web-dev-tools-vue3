<script setup lang="ts">
import Button from 'primevue/button'
import { useClipboardToast } from '@/composables/useClipboardToast'

const props = defineProps<{
  value: string
  label?: string
  tooltip?: string
  disabled?: boolean
}>()

const { copy } = useClipboardToast()

const handleCopy = () => {
  void copy(props.value, { detail: props.tooltip ?? 'Copied to clipboard' })
}
</script>

<template>
  <Button
    v-tooltip.top="tooltip ?? 'Copy'"
    :label="label"
    icon="pi pi-copy"
    severity="secondary"
    :text="!label"
    :rounded="!label"
    :disabled="disabled || !value"
    @click="handleCopy"
  />
</template>
