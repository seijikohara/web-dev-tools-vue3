<script setup lang="ts">
import { computed, ref } from 'vue'
import type CryptoJS from 'crypto-js'
import * as CryptoJSLib from 'crypto-js'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import CodeEditor from '@/components/CodeEditor.vue'

const HASH_FUNCTIONS = {
  md5: CryptoJSLib.MD5,
  sha1: CryptoJSLib.SHA1,
  sha224: CryptoJSLib.SHA224,
  sha256: CryptoJSLib.SHA256,
  sha384: CryptoJSLib.SHA384,
  sha512: CryptoJSLib.SHA512,
} as const satisfies Record<
  string,
  (message: string | CryptoJS.lib.WordArray) => CryptoJS.lib.WordArray
>

type HashMethod = keyof typeof HASH_FUNCTIONS

const computeHash = (method: HashMethod, value: string): string =>
  HASH_FUNCTIONS[method](value).toString()

const text = ref('')

const hashedValues = computed(() =>
  (Object.keys(HASH_FUNCTIONS) as HashMethod[]).map(method => ({
    method,
    value: computeHash(method, text.value),
  })),
)
</script>

<template>
  <Card>
    <template #title> Hash </template>
    <template #subtitle> Hash calculator </template>
    <template #content>
      <div class="fluid">
        <div class="field">
          <CodeEditor v-model="text" mode="plain_text" height="200px" />
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

<style lang="scss" scoped>
.method-column {
  width: 150px;
}
</style>
