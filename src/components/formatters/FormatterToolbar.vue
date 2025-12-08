<script setup lang="ts">
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import { useClipboardToast } from '@/composables/useClipboardToast'

interface Stat {
  label: string
  value: string | number
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'
  icon?: string
}

interface Props {
  // Action button states
  formatDisabled?: boolean
  minifyDisabled?: boolean
  copyDisabled?: boolean
  clearDisabled?: boolean
  loadSampleDisabled?: boolean
  downloadDisabled?: boolean

  // Stats display
  showStats?: boolean
  stats?: Stat[]

  // Copy value (for direct copy functionality)
  copyValue?: string
  copyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  formatDisabled: false,
  minifyDisabled: false,
  copyDisabled: false,
  clearDisabled: false,
  loadSampleDisabled: false,
  downloadDisabled: false,
  showStats: false,
  stats: () => [],
  copyValue: '',
  copyMessage: 'Copied to clipboard',
})

const emit = defineEmits<{
  format: []
  minify: []
  clear: []
  'load-sample': []
  download: []
  copy: []
}>()

const { copy } = useClipboardToast()

// Action handlers
const handleFormat = () => {
  emit('format')
}

const handleMinify = () => {
  emit('minify')
}

const handleClear = () => {
  emit('clear')
}

const handleLoadSample = () => {
  emit('load-sample')
}

const handleDownload = () => {
  emit('download')
}

const handleCopy = () => {
  if (props.copyValue) {
    void copy(props.copyValue, { detail: props.copyMessage })
  }
  emit('copy')
}
</script>

<template>
  <div class="formatter-toolbar-wrapper">
    <!-- Main Toolbar -->
    <Toolbar class="formatter-toolbar">
      <template #start>
        <!-- Format Button -->
        <slot name="format">
          <Button
            label="Format"
            icon="pi pi-check"
            :disabled="formatDisabled"
            @click="handleFormat"
          />
        </slot>

        <!-- Minify Button -->
        <slot name="minify">
          <Button
            label="Minify"
            icon="pi pi-compress"
            severity="secondary"
            :disabled="minifyDisabled"
            @click="handleMinify"
          />
        </slot>

        <!-- Custom start actions -->
        <slot name="start-actions" />

        <!-- Copy Button (in start section) -->
        <slot name="copy-start">
          <Button
            v-if="!copyDisabled && copyValue"
            label="Copy"
            icon="pi pi-copy"
            severity="secondary"
            @click="handleCopy"
          />
        </slot>
      </template>

      <template #end>
        <!-- Custom end actions -->
        <slot name="end-actions" />

        <!-- Copy Button (in end section, alternative placement) -->
        <slot name="copy-end" />

        <!-- Load Sample Button -->
        <slot name="load-sample">
          <Button
            v-tooltip.top="'Load Sample'"
            icon="pi pi-file"
            severity="info"
            text
            :disabled="loadSampleDisabled"
            @click="handleLoadSample"
          />
        </slot>

        <!-- Download Button -->
        <slot name="download">
          <Button
            v-if="!downloadDisabled"
            v-tooltip.top="'Download'"
            icon="pi pi-download"
            severity="success"
            text
            @click="handleDownload"
          />
        </slot>

        <!-- Clear Button -->
        <slot name="clear">
          <Button
            v-tooltip.top="'Clear'"
            icon="pi pi-trash"
            severity="danger"
            text
            :disabled="clearDisabled"
            @click="handleClear"
          />
        </slot>
      </template>
    </Toolbar>

    <!-- Stats Display -->
    <div v-if="showStats && stats.length > 0" class="stats-section">
      <div class="stats-display">
        <Tag
          v-for="(stat, index) in stats"
          :key="index"
          :value="typeof stat.value === 'number' ? `${stat.label}: ${stat.value}` : stat.value"
          :severity="stat.severity ?? 'secondary'"
          :icon="stat.icon"
        />
      </div>
    </div>

    <!-- Custom content slot (for additional toolbar content) -->
    <slot name="additional-content" />
  </div>
</template>

<style lang="scss" scoped>
.formatter-toolbar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.formatter-toolbar {
  background: transparent;
  border: none;
  padding: 0.5rem 0;

  :deep(.p-toolbar-start),
  :deep(.p-toolbar-end) {
    gap: 0.5rem;
  }
}

.stats-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stats-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
}
</style>
