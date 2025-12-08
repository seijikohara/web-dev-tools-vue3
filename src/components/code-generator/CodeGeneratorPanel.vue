<script setup lang="ts">
import { computed } from 'vue'

import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import ToggleSwitch from 'primevue/toggleswitch'

import CodeEditor from '@/components/editors/CodeEditor.vue'
import {
  LANGUAGE_OPTIONS,
  downloadCodeAsFile,
  JAVA_CLASS_STYLE_OPTIONS,
  JAVA_SERIALIZATION_OPTIONS,
  KOTLIN_SERIALIZATION_OPTIONS,
  PYTHON_STYLE_OPTIONS,
  type TargetLanguage,
  type CodeGeneratorOptions,
} from '@/composables/useCodeGenerator'
import { useClipboardToast } from '@/composables/useClipboardToast'
import type { LanguageInfo } from '@/composables/codeGenerators/types'
import type { EditorMode } from '@/composables/codeGenerators/types'

const props = defineProps<{
  /** Input data as JSON string for code generation */
  jsonInput: string
  /** Currently selected target language */
  language: TargetLanguage
  /** Code generation options */
  options: CodeGeneratorOptions
  /** Generated code output */
  generatedCode: string
  /** Editor mode for syntax highlighting */
  editorMode: EditorMode
  /** Selected language info */
  selectedLanguageInfo: LanguageInfo
  /** Error message if any */
  error: string | null
  /** Input editor mode (json, xml, yaml) */
  inputMode?: 'json' | 'xml' | 'yaml'
  /** Custom input label */
  inputLabel?: string
  /** Input editor height */
  inputHeight?: string
  /** Output editor height */
  outputHeight?: string
}>()

const emit = defineEmits<{
  'update:language': [value: TargetLanguage]
  'update:options': [value: CodeGeneratorOptions]
  'reset-options': []
  'load-sample': []
}>()

const { copy, showSuccess } = useClipboardToast()

const inputModeValue = computed(() => props.inputMode ?? 'json')
const inputLabelText = computed(() => props.inputLabel ?? 'JSON Input')
const inputHeightValue = computed(() => props.inputHeight ?? '400px')
const outputHeightValue = computed(() => props.outputHeight ?? '400px')

const localLanguage = computed({
  get: () => props.language,
  set: (value: TargetLanguage) => emit('update:language', value),
})

const copyGeneratedCode = () => {
  void copy(props.generatedCode, {
    detail: `${props.selectedLanguageInfo.label} code copied to clipboard`,
  })
}

const downloadGeneratedCode = () => {
  downloadCodeAsFile(
    props.generatedCode,
    props.options.rootName,
    props.selectedLanguageInfo.extension,
  )
  showSuccess(
    'Downloaded',
    `File downloaded as ${props.options.rootName.toLowerCase()}.${props.selectedLanguageInfo.extension}`,
  )
}
</script>

<template>
  <div class="code-generator-panel">
    <Panel toggleable class="options-panel">
      <template #header>
        <div class="panel-header">
          <i class="pi pi-code"></i>
          <span>Code Generation Options</span>
        </div>
      </template>

      <div class="codegen-options">
        <div class="option-row">
          <div class="option-item">
            <label for="codeGenLanguage">Target Language</label>
            <Select
              id="codeGenLanguage"
              v-model="localLanguage"
              :options="LANGUAGE_OPTIONS"
              option-label="label"
              option-value="value"
              class="language-select"
            />
          </div>

          <div class="option-item">
            <label for="codeGenRootName">Root Type Name</label>
            <InputGroup>
              <InputGroupAddon>
                <i class="pi pi-tag"></i>
              </InputGroupAddon>
              <InputText
                id="codeGenRootName"
                :model-value="options.rootName"
                placeholder="Root"
                @update:model-value="
                  emit('update:options', { ...options, rootName: String($event) })
                "
              />
            </InputGroup>
          </div>
        </div>

        <Divider align="left">
          <span class="divider-text">
            <i class="pi pi-sliders-h"></i>
            Common Options
          </span>
        </Divider>

        <div class="toggle-options-row">
          <div class="toggle-option">
            <ToggleSwitch
              :model-value="options.optionalProperties"
              input-id="codeGenOptional"
              @update:model-value="
                emit('update:options', { ...options, optionalProperties: Boolean($event) })
              "
            />
            <label for="codeGenOptional">Optional properties</label>
          </div>
        </div>

        <!-- TypeScript specific options -->
        <div v-if="language === 'typescript'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              TypeScript Options
            </span>
          </Divider>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useInterface"
                input-id="tsInterface"
                @update:model-value="
                  emit('update:options', { ...options, useInterface: Boolean($event) })
                "
              />
              <label for="tsInterface">
                <Tag
                  :value="options.useInterface ? 'interface' : 'type'"
                  :severity="options.useInterface ? 'info' : 'secondary'"
                />
              </label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useExport"
                input-id="tsExport"
                @update:model-value="
                  emit('update:options', { ...options, useExport: Boolean($event) })
                "
              />
              <label for="tsExport">Add export</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useReadonly"
                input-id="tsReadonly"
                @update:model-value="
                  emit('update:options', { ...options, useReadonly: Boolean($event) })
                "
              />
              <label for="tsReadonly">Readonly properties</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.strictNullChecks"
                input-id="tsStrictNull"
                @update:model-value="
                  emit('update:options', { ...options, strictNullChecks: Boolean($event) })
                "
              />
              <label for="tsStrictNull">Strict null checks</label>
            </div>
          </div>
        </div>

        <!-- JavaScript specific options -->
        <div v-if="language === 'javascript'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              JavaScript Options
            </span>
          </Divider>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useClass"
                input-id="jsClass"
                @update:model-value="
                  emit('update:options', { ...options, useClass: Boolean($event) })
                "
              />
              <label for="jsClass">Use class</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useJSDoc"
                input-id="jsDoc"
                @update:model-value="
                  emit('update:options', { ...options, useJSDoc: Boolean($event) })
                "
              />
              <label for="jsDoc">Add JSDoc</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useES6"
                input-id="jsES6"
                @update:model-value="
                  emit('update:options', { ...options, useES6: Boolean($event) })
                "
              />
              <label for="jsES6">ES6+ syntax</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.generateFactory"
                input-id="jsFactory"
                @update:model-value="
                  emit('update:options', { ...options, generateFactory: Boolean($event) })
                "
              />
              <label for="jsFactory">Generate factory</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.generateValidator"
                input-id="jsValidator"
                @update:model-value="
                  emit('update:options', { ...options, generateValidator: Boolean($event) })
                "
              />
              <label for="jsValidator">Generate validator</label>
            </div>
          </div>
        </div>

        <!-- Go specific options -->
        <div v-if="language === 'go'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              Go Options
            </span>
          </Divider>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.usePointers"
                input-id="goPointers"
                @update:model-value="
                  emit('update:options', { ...options, usePointers: Boolean($event) })
                "
              />
              <label for="goPointers">Use pointers</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.omitEmpty"
                input-id="goOmitEmpty"
                @update:model-value="
                  emit('update:options', { ...options, omitEmpty: Boolean($event) })
                "
              />
              <label for="goOmitEmpty">omitempty tag</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useJsonTag"
                input-id="goJsonTag"
                @update:model-value="
                  emit('update:options', { ...options, useJsonTag: Boolean($event) })
                "
              />
              <label for="goJsonTag">JSON struct tags</label>
            </div>
          </div>
        </div>

        <!-- Python specific options -->
        <div v-if="language === 'python'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              Python Options
            </span>
          </Divider>
          <div class="option-row">
            <div class="option-item">
              <label for="pythonStyle">Code Style</label>
              <Select
                id="pythonStyle"
                :model-value="options.pythonStyle"
                :options="[...PYTHON_STYLE_OPTIONS]"
                option-label="label"
                option-value="value"
                class="language-select"
                @update:model-value="
                  emit('update:options', {
                    ...options,
                    pythonStyle: $event as typeof options.pythonStyle,
                  })
                "
              />
            </div>
          </div>
          <div v-if="options.pythonStyle === 'dataclass'" class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useFrozen"
                input-id="pyFrozen"
                @update:model-value="
                  emit('update:options', { ...options, useFrozen: Boolean($event) })
                "
              />
              <label for="pyFrozen">Frozen (immutable)</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useSlots"
                input-id="pySlots"
                @update:model-value="
                  emit('update:options', { ...options, useSlots: Boolean($event) })
                "
              />
              <label for="pySlots">Use __slots__</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useKwOnly"
                input-id="pyKwOnly"
                @update:model-value="
                  emit('update:options', { ...options, useKwOnly: Boolean($event) })
                "
              />
              <label for="pyKwOnly">Keyword-only args</label>
            </div>
          </div>
          <div v-if="options.pythonStyle === 'typeddict'" class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useTotal"
                input-id="pyTotal"
                @update:model-value="
                  emit('update:options', { ...options, useTotal: Boolean($event) })
                "
              />
              <label for="pyTotal">total=True</label>
            </div>
          </div>
        </div>

        <!-- Rust specific options -->
        <div v-if="language === 'rust'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              Rust Options
            </span>
          </Divider>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.deriveSerde"
                input-id="rustSerde"
                @update:model-value="
                  emit('update:options', { ...options, deriveSerde: Boolean($event) })
                "
              />
              <label for="rustSerde">Serde derive</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.deriveDebug"
                input-id="rustDebug"
                @update:model-value="
                  emit('update:options', { ...options, deriveDebug: Boolean($event) })
                "
              />
              <label for="rustDebug">Derive Debug</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.deriveClone"
                input-id="rustClone"
                @update:model-value="
                  emit('update:options', { ...options, deriveClone: Boolean($event) })
                "
              />
              <label for="rustClone">Derive Clone</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.deriveDefault"
                input-id="rustDefault"
                @update:model-value="
                  emit('update:options', { ...options, deriveDefault: Boolean($event) })
                "
              />
              <label for="rustDefault">Derive Default</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useBox"
                input-id="rustBox"
                @update:model-value="
                  emit('update:options', { ...options, useBox: Boolean($event) })
                "
              />
              <label for="rustBox">Box nested types</label>
            </div>
          </div>
        </div>

        <!-- Java specific options -->
        <div v-if="language === 'java'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              Java Options
            </span>
          </Divider>
          <div class="option-row">
            <div class="option-item">
              <label for="javaClassStyle">Class Style</label>
              <Select
                id="javaClassStyle"
                :model-value="options.classStyle"
                :options="[...JAVA_CLASS_STYLE_OPTIONS]"
                option-label="label"
                option-value="value"
                class="language-select"
                @update:model-value="
                  emit('update:options', {
                    ...options,
                    classStyle: $event as typeof options.classStyle,
                  })
                "
              />
            </div>
            <div class="option-item">
              <label for="javaSerialization">Serialization</label>
              <Select
                id="javaSerialization"
                :model-value="options.serializationLibrary"
                :options="[...JAVA_SERIALIZATION_OPTIONS]"
                option-label="label"
                option-value="value"
                class="language-select"
                @update:model-value="
                  emit('update:options', {
                    ...options,
                    serializationLibrary: $event as typeof options.serializationLibrary,
                  })
                "
              />
            </div>
          </div>
          <div class="option-row">
            <div class="option-item">
              <label for="javaPackage">Package Name</label>
              <InputText
                id="javaPackage"
                :model-value="options.packageName"
                placeholder="com.example.model"
                @update:model-value="
                  emit('update:options', { ...options, packageName: String($event) })
                "
              />
            </div>
          </div>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useValidation"
                input-id="javaValidation"
                @update:model-value="
                  emit('update:options', { ...options, useValidation: Boolean($event) })
                "
              />
              <label for="javaValidation">Jakarta Validation</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.generateBuilder"
                input-id="javaBuilder"
                @update:model-value="
                  emit('update:options', { ...options, generateBuilder: Boolean($event) })
                "
              />
              <label for="javaBuilder">Generate Builder</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.generateEquals"
                input-id="javaEquals"
                @update:model-value="
                  emit('update:options', { ...options, generateEquals: Boolean($event) })
                "
              />
              <label for="javaEquals">Generate Equals</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useOptional"
                input-id="javaOptional"
                @update:model-value="
                  emit('update:options', { ...options, useOptional: Boolean($event) })
                "
              />
              <label for="javaOptional">Use Optional</label>
            </div>
          </div>
        </div>

        <!-- C# specific options -->
        <div v-if="language === 'csharp'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              C# Options
            </span>
          </Divider>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useRecords"
                input-id="csRecords"
                @update:model-value="
                  emit('update:options', { ...options, useRecords: Boolean($event) })
                "
              />
              <label for="csRecords">
                <Tag
                  :value="options.useRecords ? 'record' : 'class'"
                  :severity="options.useRecords ? 'info' : 'secondary'"
                />
              </label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useNullableReferenceTypes"
                input-id="csNullable"
                @update:model-value="
                  emit('update:options', { ...options, useNullableReferenceTypes: Boolean($event) })
                "
              />
              <label for="csNullable">Nullable reference types</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useSystemTextJson"
                input-id="csSystemTextJson"
                @update:model-value="
                  emit('update:options', { ...options, useSystemTextJson: Boolean($event) })
                "
              />
              <label for="csSystemTextJson">System.Text.Json</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useNewtonsoft"
                input-id="csNewtonsoft"
                @update:model-value="
                  emit('update:options', { ...options, useNewtonsoft: Boolean($event) })
                "
              />
              <label for="csNewtonsoft">Newtonsoft.Json</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.generateDataContract"
                input-id="csDataContract"
                @update:model-value="
                  emit('update:options', { ...options, generateDataContract: Boolean($event) })
                "
              />
              <label for="csDataContract">DataContract</label>
            </div>
          </div>
        </div>

        <!-- Kotlin specific options -->
        <div v-if="language === 'kotlin'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              Kotlin Options
            </span>
          </Divider>
          <div class="option-row">
            <div class="option-item">
              <label for="kotlinSerialization">Serialization</label>
              <Select
                id="kotlinSerialization"
                :model-value="options.kotlinSerializationLibrary"
                :options="[...KOTLIN_SERIALIZATION_OPTIONS]"
                option-label="label"
                option-value="value"
                class="language-select"
                @update:model-value="
                  emit('update:options', {
                    ...options,
                    kotlinSerializationLibrary: $event as typeof options.kotlinSerializationLibrary,
                  })
                "
              />
            </div>
          </div>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useDataClass"
                input-id="ktDataClass"
                @update:model-value="
                  emit('update:options', { ...options, useDataClass: Boolean($event) })
                "
              />
              <label for="ktDataClass">Data class</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useDefaultValues"
                input-id="ktDefaultValues"
                @update:model-value="
                  emit('update:options', { ...options, useDefaultValues: Boolean($event) })
                "
              />
              <label for="ktDefaultValues">Default values</label>
            </div>
          </div>
        </div>

        <!-- Swift specific options -->
        <div v-if="language === 'swift'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              Swift Options
            </span>
          </Divider>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useStruct"
                input-id="swiftStruct"
                @update:model-value="
                  emit('update:options', { ...options, useStruct: Boolean($event) })
                "
              />
              <label for="swiftStruct">
                <Tag
                  :value="options.useStruct ? 'struct' : 'class'"
                  :severity="options.useStruct ? 'info' : 'secondary'"
                />
              </label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useCodingKeys"
                input-id="swiftCodingKeys"
                @update:model-value="
                  emit('update:options', { ...options, useCodingKeys: Boolean($event) })
                "
              />
              <label for="swiftCodingKeys">CodingKeys enum</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useOptionalProperties"
                input-id="swiftOptional"
                @update:model-value="
                  emit('update:options', { ...options, useOptionalProperties: Boolean($event) })
                "
              />
              <label for="swiftOptional">Optional properties</label>
            </div>
          </div>
        </div>

        <!-- PHP specific options -->
        <div v-if="language === 'php'" class="language-options">
          <Divider align="left">
            <span class="divider-text">
              <i class="pi pi-code"></i>
              PHP Options
            </span>
          </Divider>
          <div class="option-row">
            <div class="option-item">
              <label for="phpNamespace">Namespace</label>
              <InputText
                id="phpNamespace"
                :model-value="options.namespace"
                placeholder="App\\Models"
                @update:model-value="
                  emit('update:options', { ...options, namespace: String($event) })
                "
              />
            </div>
          </div>
          <div class="toggle-options-row">
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useStrictTypes"
                input-id="phpStrictTypes"
                @update:model-value="
                  emit('update:options', { ...options, useStrictTypes: Boolean($event) })
                "
              />
              <label for="phpStrictTypes">declare(strict_types=1)</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useReadonlyProperties"
                input-id="phpReadonly"
                @update:model-value="
                  emit('update:options', { ...options, useReadonlyProperties: Boolean($event) })
                "
              />
              <label for="phpReadonly">Readonly properties (8.1+)</label>
            </div>
            <div class="toggle-option">
              <ToggleSwitch
                :model-value="options.useConstructorPromotion"
                input-id="phpPromotion"
                @update:model-value="
                  emit('update:options', { ...options, useConstructorPromotion: Boolean($event) })
                "
              />
              <label for="phpPromotion">Constructor promotion (8.0+)</label>
            </div>
          </div>
        </div>

        <div class="options-actions">
          <Button
            label="Reset Options"
            icon="pi pi-refresh"
            severity="secondary"
            text
            size="small"
            @click="emit('reset-options')"
          />
        </div>
      </div>
    </Panel>

    <Message v-if="error" severity="error" :closable="false" class="codegen-error">
      <i class="pi pi-times-circle"></i>
      {{ error }}
    </Message>

    <div class="editor-grid-2col">
      <div class="editor-panel">
        <div class="panel-label">
          <i class="pi pi-file-edit"></i>
          <span>{{ inputLabelText }}</span>
        </div>
        <CodeEditor
          :model-value="jsonInput"
          :mode="inputModeValue"
          :height="inputHeightValue"
          :options="{ readOnly: true }"
        />
        <Toolbar class="editor-toolbar">
          <template #start>
            <Button
              v-tooltip.top="'Load Sample'"
              icon="pi pi-file"
              severity="info"
              text
              @click="emit('load-sample')"
            />
          </template>
        </Toolbar>
      </div>

      <div class="editor-panel">
        <div class="panel-label">
          <i class="pi pi-code"></i>
          <span>{{ selectedLanguageInfo.label }} Output</span>
          <Tag v-if="generatedCode" :value="selectedLanguageInfo.label" severity="success" />
        </div>
        <CodeEditor
          :model-value="generatedCode"
          :mode="editorMode"
          :height="outputHeightValue"
          :options="{ readOnly: true }"
        />
        <Toolbar class="editor-toolbar">
          <template #start>
            <Button
              icon="pi pi-copy"
              label="Copy"
              severity="secondary"
              :disabled="!generatedCode"
              @click="copyGeneratedCode"
            />
            <Button
              icon="pi pi-download"
              :label="`Download .${selectedLanguageInfo.extension}`"
              severity="info"
              :disabled="!generatedCode"
              @click="downloadGeneratedCode"
            />
          </template>
        </Toolbar>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.options-panel {
  margin-bottom: 1rem;

  :deep(.p-panel-header) {
    padding: 0.75rem 1rem;
  }

  :deep(.p-panel-content) {
    padding: 1rem;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-color);

  i {
    color: var(--primary-color);
  }
}

.codegen-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.option-item {
  flex: 1;
  min-width: 200px;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color-secondary);
  }

  .language-select {
    width: 100%;
  }
}

.toggle-options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 150px;

  label {
    cursor: pointer;
    user-select: none;
    color: var(--text-color);
  }
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.language-options {
  margin-top: 0.5rem;
}

.options-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.codegen-error {
  margin-bottom: 1rem;

  :deep(.p-message-text) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.editor-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-color);

  i {
    color: var(--primary-color);
  }
}

.editor-toolbar {
  :deep(.p-toolbar) {
    padding: 0.5rem;
    background: var(--surface-ground);
    border: 1px solid var(--surface-border);
    border-top: none;
    border-radius: 0 0 var(--border-radius) var(--border-radius);
  }
}
</style>
