<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import CopyButton from '@/components/display/CopyButton.vue'

import { useJsonFormatter, useJsonConvert } from '@/composables/useJsonFormatter'

const { state } = useJsonFormatter()

const inputRef = computed(() => state.input)

const { convertOutput, convertError, convertFormat, convertOutputMode, convertTo } =
  useJsonConvert(inputRef)
</script>

<template>
  <div class="editor-grid-2col">
    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-edit"></i>
        <span>JSON Input</span>
      </div>
      <CodeEditor
        v-model="state.input"
        mode="json"
        height="clamp(300px, calc(100vh - 520px), 600px)"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <Button
            label="To YAML"
            icon="pi pi-arrow-right"
            :disabled="!state.input"
            @click="convertTo('yaml')"
          />
          <Button
            label="To XML"
            icon="pi pi-arrow-right"
            severity="secondary"
            :disabled="!state.input"
            @click="convertTo('xml')"
          />
        </template>
      </Toolbar>
    </div>

    <div class="editor-panel">
      <div class="panel-label">
        <i class="pi pi-file-export"></i>
        <span>{{ convertFormat.toUpperCase() }} Output</span>
        <Tag
          v-if="convertOutput"
          :value="convertFormat.toUpperCase()"
          :severity="convertFormat === 'yaml' ? 'info' : 'warn'"
        />
      </div>
      <CodeEditor
        v-model="convertOutput"
        :mode="convertOutputMode"
        height="clamp(300px, calc(100vh - 520px), 600px)"
        :options="{ readOnly: true }"
      />
      <Toolbar class="editor-toolbar">
        <template #start>
          <CopyButton
            :value="convertOutput"
            label="Copy"
            :tooltip="`${convertFormat.toUpperCase()} copied to clipboard`"
            :disabled="!convertOutput"
          />
        </template>
      </Toolbar>
    </div>
  </div>

  <Message v-if="convertError" severity="error" :closable="false">
    <i class="pi pi-times-circle"></i>
    {{ convertError }}
  </Message>
</template>
