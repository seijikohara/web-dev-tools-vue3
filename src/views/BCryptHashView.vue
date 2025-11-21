<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { hashSync } from 'bcryptjs'
import { useDebounceFn } from '@vueuse/core'

import Card from 'primevue/card'
import Fieldset from 'primevue/fieldset'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Slider from 'primevue/slider'

const state = reactive({
  password: '',
  rounds: 8,
})

const hashedValue = ref('')
const isComputing = ref(false)

// Debounced hash computation to prevent UI freezing
const computeHash = useDebounceFn(() => {
  if (!state.password) {
    hashedValue.value = ''
    return
  }
  isComputing.value = true
  try {
    hashedValue.value = hashSync(state.password, state.rounds)
  } finally {
    isComputing.value = false
  }
}, 500)

// Watch for changes and trigger debounced computation
watch(() => [state.password, state.rounds], computeHash, { deep: true })
</script>

<template>
  <Card>
    <template #title> BCrypt </template>
    <template #subtitle> BCrypt hash calculator </template>
    <template #content>
      <div class="field">
        <label for="password">Password</label>
        <InputText id="password" v-model="state.password" type="text" class="inputfield w-full" />
      </div>
      <div class="field">
        <label for="rounds">Rounds</label>
        <InputNumber
          id="rounds"
          v-model="state.rounds"
          class="inputfield w-full"
          :min="4"
          :max="20"
        />
        <Slider v-model="state.rounds" :min="4" :max="20" />
      </div>
      <div class="field">
        <Fieldset legend="Hashed password">
          <code v-if="!isComputing">{{ hashedValue || '(enter password to hash)' }}</code>
          <div v-else style="color: #666; font-style: italic">Computing hash...</div>
        </Fieldset>
      </div>
    </template>
  </Card>
</template>
