---
paths: src/**/*.vue
---

# Vue Component Guidelines

## Script Setup Structure

Use `<script setup lang="ts">` with this order:

```vue
<script setup lang="ts">
// 1. External imports (Vue, PrimeVue, libraries)
import { ref, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'

// 2. Internal imports (components, composables)
import MyComponent from '@/components/MyComponent.vue'
import { useFeature } from '@/composables/useFeature'

// 3. Type imports (separate with `type` keyword)
import type { Ref, ComputedRef } from 'vue'
import type { FeatureOptions } from '@/composables/useFeature'

// 4. Props/Emits/Model definitions
const props = defineProps<{ ... }>()
const emit = defineEmits<{ ... }>()
const modelValue = defineModel<string>()

// 5. Composables
const toast = useToast()
const { data, isLoading, execute } = useFeature()

// 6. Local refs and computed
const inputText = ref('')
const hasInput = computed(() => inputText.value.length > 0)

// 7. Functions/handlers
const handleSubmit = () => { ... }

// 8. Watchers
watch(inputText, (newValue) => { ... })

// 9. Lifecycle hooks
onMounted(() => { ... })
</script>
```

## Block Order

Always maintain this order:
1. `<script setup lang="ts">`
2. `<template>`
3. `<style lang="scss" scoped>`

## Component Patterns

### Props Definition

```typescript
interface Props {
  mode?: 'primary' | 'secondary'
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'primary',
  placeholder: 'Enter text...',
  disabled: false,
})
```

### Event Emissions

```typescript
const emit = defineEmits<{
  change: [value: string]
  submit: []
  error: [message: string]
}>()
```

### Two-way Binding

```typescript
const modelValue = defineModel<string>({ default: '' })
const selected = defineModel<string>('selected')  // Named model
```

### Expose for Parent Access

```typescript
defineExpose({
  focus: () => inputRef.value?.focus(),
  reset: () => { inputText.value = '' },
})
```

## PrimeVue Components

### Button Patterns

```vue
<!-- Primary action -->
<Button label="Execute" @click="execute" />

<!-- Secondary action -->
<Button label="Reset" severity="secondary" @click="reset" />

<!-- Icon button with tooltip -->
<Button
  v-tooltip.top="'Tooltip text'"
  icon="pi pi-copy"
  text
  rounded
  @click="handleAction"
/>
```

### Toast Usage

```typescript
import { useToast } from 'primevue/usetoast'

const toast = useToast()

toast.add({
  severity: 'success',  // 'success' | 'info' | 'warn' | 'error'
  summary: 'Title',
  detail: 'Message content',
  life: 3000,
})
```

### Tab Navigation

```vue
<Tabs value="0">
  <TabList>
    <Tab value="0">First Tab</Tab>
    <Tab value="1">Second Tab</Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="0">Content 1</TabPanel>
    <TabPanel value="1">Content 2</TabPanel>
  </TabPanels>
</Tabs>
```

## Template Guidelines

- Use PrimeVue components for UI consistency
- Prefer `v-if` over `v-show` for conditional rendering
- Use `v-for` with `:key` always
- Keep template logic minimal; move to computed/methods
- Use `v-tooltip.top` directive for tooltips

## Styling

```vue
<style lang="scss" scoped>
// Use CSS custom properties for theming
.container {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  padding: var(--content-padding);
}

// PrimeVue overrides with :deep()
:deep(.p-button) {
  // Override styles
}
</style>
```
