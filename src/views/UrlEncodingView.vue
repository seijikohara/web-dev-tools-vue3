<template>
  <Card>
    <template #title> URL Encoding </template>
    <template #subtitle> URL Encoding & Decoding </template>
    <template #content>
      <CodeEditor v-model:value="state.content" mode="text" height="500px" />
    </template>
    <template #footer>
      <div class="p-inputgroup">
        <Button label="Encode" @click="onClickEncode" />
        <Button
          label="Decode"
          class="p-button-secondary"
          @click="onClickDecode"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { reactive } from "vue";

import Button from "primevue/button";
import Card from "primevue/card";

import CodeEditor from "@/components/CodeEditor.vue";

const state = reactive({
  content: "",
});
const onClickEncode = () => (state.content = encodeURI(state.content));
const onClickDecode = () => (state.content = decodeURI(state.content));
</script>

<style lang="scss" scoped>
.button {
  margin-right: 0.5rem;
}
</style>
