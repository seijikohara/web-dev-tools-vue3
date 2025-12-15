---
paths: src/stores/**/*.ts
---

# State Management Guidelines (Pinia)

## Store Structure

Use the Setup Store syntax (Composition API style):

```typescript
import { defineStore } from 'pinia'
import { computed, readonly } from 'vue'
import { useToggle, useLocalStorage } from '@vueuse/core'

export const useUIStore = defineStore('ui', () => {
  // ============================================================
  // State
  // ============================================================

  // Toggle state (non-persisted)
  const [isMenuOpen, toggleMenu] = useToggle(false)

  // Persisted state (localStorage)
  const isSidebarCollapsed = useLocalStorage('sidebar-collapsed', false)

  // ============================================================
  // Derived State
  // ============================================================

  const sidebarWidth = computed(() =>
    isSidebarCollapsed.value ? COLLAPSED_WIDTH : FULL_WIDTH
  )

  // ============================================================
  // Actions
  // ============================================================

  const openMenu = () => { isMenuOpen.value = true }
  const closeMenu = () => { isMenuOpen.value = false }

  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  // ============================================================
  // Public API
  // ============================================================

  return {
    // State (readonly for external consumers)
    isMenuOpen: readonly(isMenuOpen),
    isSidebarCollapsed: readonly(isSidebarCollapsed),
    sidebarWidth,

    // Actions
    toggleMenu,
    openMenu,
    closeMenu,
    toggleSidebar,
  }
})
```

## @vueuse/core Integration

### useToggle

```typescript
const [isOpen, toggle] = useToggle(false)
// toggle() switches value
// toggle(true) sets to true
```

### useLocalStorage

```typescript
const theme = useLocalStorage('app-theme', 'light')
// Auto-syncs with localStorage
```

### useClipboard

```typescript
const { copy, copied, isSupported } = useClipboard()
await copy('text')
```

## Best Practices

### Store Naming

- Store ID: lowercase `'ui'`, `'settings'`
- Export: `useXxxStore`

See @rules/typescript.md for file naming conventions.

### State Protection

```typescript
return {
  count: readonly(count),  // Prevent external mutation
  increment,               // Actions for mutation
}
```

### Persistence Strategy

```typescript
// Persist UI preferences
const preference = useLocalStorage('key', defaultValue)

// Session-only state
const [isOpen] = useToggle(false)
```

## Usage in Components

```typescript
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'

const uiStore = useUIStore()

// Destructure reactive state with storeToRefs
const { isSidebarCollapsed } = storeToRefs(uiStore)

// Actions can be destructured directly
const { toggleSidebar } = uiStore
```

## Anti-Patterns

```typescript
// ❌ Don't mutate directly
store.count++

// ✅ Use actions
store.increment()

// ❌ Don't expose raw refs
return { count }

// ✅ Wrap with readonly
return { count: readonly(count) }
```
