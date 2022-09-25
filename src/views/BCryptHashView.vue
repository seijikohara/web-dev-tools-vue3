<template>
  <Card>
    <template #title> BCyprt </template>
    <template #subtitle> BCrypt hash calculator </template>
    <template #content>
      <div class="field">
        <label for="password">Password</label>
        <InputText
          id="password"
          type="text"
          class="inputfield w-full"
          v-model="state.password"
        />
      </div>
      <div class="field">
        <label for="rounds">Rounds</label>
        <InputNumber
          id="rounds"
          class="inputfield w-full"
          v-model="state.rounds"
          :min="4"
          :max="20"
        />
        <Slider v-model="state.rounds" :min="4" :max="20" />
      </div>
      <div class="field">
        <Fieldset legend="Hashed password">
          <code>{{ hashedValue }}</code>
        </Fieldset>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import * as bcrypt from "bcryptjs";

import Card from "primevue/card";
import Fieldset from "primevue/fieldset";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Slider from "primevue/slider";

const state = reactive({
  password: "",
  rounds: 8,
});
const hashedValue = computed(() =>
  bcrypt.hashSync(state.password, state.rounds)
);
</script>
