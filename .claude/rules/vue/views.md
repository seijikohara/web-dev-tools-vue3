---
paths: src/views/**/*.vue
---

# View Component Guidelines

## Purpose

Views are page-level components that:
- Correspond to routes
- Compose UI from smaller components
- Connect composables to the UI
- Handle page-specific interactions

## File Organization

```
src/views/
├── category-a/
│   ├── FeatureAView.vue
│   └── feature-a/
│       ├── TabOneContent.vue
│       └── TabTwoContent.vue
├── category-b/
│   ├── FeatureBView.vue
│   └── ...
└── ...
```

## View Structure

```vue
<script setup lang="ts">
// PrimeVue components
import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

// Custom components
import MyEditor from '@/components/editors/MyEditor.vue'

// Composable for this view
import { useFeature } from '@/composables/useFeature'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy } = useClipboardToast()
const { input, output, execute, clear } = useFeature()

const handleCopy = () => {
  void copy(output.value, { detail: 'Copied to clipboard' })
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-code"></i>
        <span>Feature Name</span>
      </div>
    </template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Primary</Tab>
          <Tab value="1">Secondary</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">...</TabPanel>
          <TabPanel value="1">...</TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>
```

## Common Patterns

### Card Title with Icon

```vue
<template #title>
  <div class="card-title">
    <i class="pi pi-xxx"></i>
    <span>Feature Name</span>
  </div>
</template>
```

### Input/Output Layout

```vue
<div class="grid">
  <div class="col-12 lg:col-6">
    <h3>Input</h3>
    <CodeEditor v-model="input" mode="text" />
  </div>
  <div class="col-12 lg:col-6">
    <h3>Output</h3>
    <CodeEditor v-model="output" mode="text" :options="{ readOnly: true }" />
  </div>
</div>
```

### Action Toolbar

```vue
<Toolbar class="mb-3">
  <template #start>
    <Button label="Execute" @click="execute" />
    <Button label="Sample" severity="secondary" @click="loadSample" />
  </template>
  <template #end>
    <Button label="Copy" icon="pi pi-copy" @click="handleCopy" />
    <Button label="Clear" severity="danger" @click="clear" />
  </template>
</Toolbar>
```

## Tab-Based Layout

For views with multiple related functions:

1. **Main View** (`XxxView.vue`): Contains Card wrapper and Tabs
2. **Tab Components** (`xxx/TabContent.vue`): Individual tab content
