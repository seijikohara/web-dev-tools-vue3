<script setup lang="ts">
import { computed, reactive } from 'vue'
import CryptoJS from 'crypto-js'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/CodeEditor.vue'

const state = reactive({
  text: '',
})
const hashedValues = computed(() => {
  const value = state.text
  return [
    { method: 'md5', value: CryptoJS.MD5(value).toString() },
    { method: 'sha1', value: CryptoJS.SHA1(value).toString() },
    { method: 'sha224', value: CryptoJS.SHA224(value).toString() },
    { method: 'sha256', value: CryptoJS.SHA256(value).toString() },
    { method: 'sha384', value: CryptoJS.SHA384(value).toString() },
    { method: 'sha512', value: CryptoJS.SHA512(value).toString() },
  ]
})
</script>

<style lang="scss" scoped>
.method-column {
  width: 150px;
}
</style>

<template>
  <Card>
    <template #title> Hash </template>
    <template #subtitle> Hash calculator </template>
    <template #content>
      <div class="fluid">
        <div class="field">
          <CodeEditor v-model:value="state.text" mode="text" height="200px" />
        </div>
        <div class="field">
          <DataTable :value="hashedValues" class="datatable-sm">
            <template #header> Hash values </template>
            <Column
              field="method"
              header="Method"
              :headerStyle="{ width: '150px' }"
              :sortable="true"
            />
            <Column header="Value">
              <template #body="slotProps">
                <code>{{ slotProps.data.value }}</code>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </template>
  </Card>
</template>
