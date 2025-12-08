/**
 * PrimeVue Component Re-exports
 *
 * This module provides centralized re-exports of commonly used PrimeVue components
 * to simplify imports throughout the application.
 *
 * Usage:
 * ```typescript
 * import { Button, Card, Select } from '@/components/primevue'
 * ```
 *
 * Instead of:
 * ```typescript
 * import Button from 'primevue/button'
 * import Card from 'primevue/card'
 * import Select from 'primevue/select'
 * ```
 */

// Form Components
export { default as Button } from 'primevue/button'
export { default as Checkbox } from 'primevue/checkbox'
export { default as ColorPicker } from 'primevue/colorpicker'
export { default as FileUpload } from 'primevue/fileupload'
export { default as InputGroup } from 'primevue/inputgroup'
export { default as InputGroupAddon } from 'primevue/inputgroupaddon'
export { default as InputNumber } from 'primevue/inputnumber'
export { default as InputText } from 'primevue/inputtext'
export { default as Select } from 'primevue/select'
export { default as SelectButton } from 'primevue/selectbutton'
export { default as Textarea } from 'primevue/textarea'
export { default as ToggleSwitch } from 'primevue/toggleswitch'

// Layout Components
export { default as Card } from 'primevue/card'
export { default as Divider } from 'primevue/divider'
export { default as Panel } from 'primevue/panel'
export { default as Toolbar } from 'primevue/toolbar'

// Data Display Components
export { default as Column } from 'primevue/column'
export { default as DataTable } from 'primevue/datatable'
export { default as Tag } from 'primevue/tag'

// Tab Components
export { default as Tab } from 'primevue/tab'
export { default as TabList } from 'primevue/tablist'
export { default as TabPanel } from 'primevue/tabpanel'
export { default as TabPanels } from 'primevue/tabpanels'
export { default as Tabs } from 'primevue/tabs'

// Overlay Components
export { default as Dialog } from 'primevue/dialog'

// Messages & Feedback
export { default as Message } from 'primevue/message'
export { default as ProgressBar } from 'primevue/progressbar'
export { default as ProgressSpinner } from 'primevue/progressspinner'

// Re-export commonly used types
export type { FileUploadSelectEvent } from 'primevue/fileupload'
