<script setup lang="ts">
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import Toolbar from 'primevue/toolbar'
import Textarea from 'primevue/textarea'

import PanelHeader from '@/components/layout/PanelHeader.vue'

import { useCurlBuilder } from '@/composables/useCurlBuilder'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { showSuccess } = useClipboardToast()

const { parsedInput, parseCurlCommand } = useCurlBuilder()

const onClickParse = () => {
  parseCurlCommand()
  showSuccess('Parsed', 'cURL command parsed successfully')
}
</script>

<template>
  <div class="parser-section">
    <Panel>
      <template #header>
        <PanelHeader icon="upload">Paste cURL Command</PanelHeader>
      </template>

      <Textarea
        v-model="parsedInput"
        rows="6"
        placeholder="Paste your cURL command here..."
        class="parse-input"
      />

      <Toolbar class="editor-toolbar">
        <template #end>
          <Button
            icon="pi pi-arrow-right"
            label="Parse"
            :disabled="!parsedInput"
            @click="onClickParse"
          />
        </template>
      </Toolbar>
    </Panel>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.parser-section {
  .parse-input {
    width: 100%;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
}
</style>
