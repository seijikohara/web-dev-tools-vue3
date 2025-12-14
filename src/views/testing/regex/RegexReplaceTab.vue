<script setup lang="ts">
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Toolbar from 'primevue/toolbar'
import CodeEditor from '@/components/editors/CodeEditor.vue'
import SectionDivider from '@/components/layout/SectionDivider.vue'
import CopyButton from '@/components/display/CopyButton.vue'

interface Props {
  testString: string
  replacement: string
  replacedText: string
  pattern: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:testString': [value: string]
  'update:replacement': [value: string]
}>()
</script>

<template>
  <div class="replace-section">
    <div class="option-item">
      <label for="testStringReplace">
        <i class="pi pi-file-edit"></i>
        Test String
      </label>
      <CodeEditor
        :model-value="testString"
        mode="plain_text"
        height="150px"
        @update:model-value="emit('update:testString', $event)"
      />
    </div>

    <div class="option-item">
      <label for="replacement">
        <i class="pi pi-pencil"></i>
        Replacement
      </label>
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-arrow-right"></i>
        </InputGroupAddon>
        <InputText
          id="replacement"
          :model-value="replacement"
          class="w-full"
          placeholder="Replacement string (use $1, $2 for groups)"
          @update:model-value="emit('update:replacement', $event ?? '')"
        />
      </InputGroup>
      <small class="hint-text">
        <i class="pi pi-info-circle"></i>
        Use $1, $2, etc. to reference captured groups
      </small>
    </div>

    <div v-if="testString && pattern" class="results-section">
      <SectionDivider icon="check-circle">Result</SectionDivider>

      <CodeEditor
        :model-value="replacedText"
        mode="plain_text"
        height="150px"
        :options="{ readOnly: true }"
      />
      <Toolbar class="editor-toolbar">
        <template #end>
          <CopyButton
            :value="replacedText"
            label="Copy Result"
            tooltip="Result copied to clipboard"
          />
        </template>
      </Toolbar>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-info-circle"></i>
      <span>Enter pattern and test string to see replacement result</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/scss/tool-common';

.replace-section {
  padding: 0.5rem 0;
}
</style>
