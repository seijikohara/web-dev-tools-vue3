<script setup lang="ts">
import { reactive } from 'vue'
import format from 'xml-formatter'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Tooltip from 'primevue/tooltip'

import CodeEditor from '@/components/CodeEditor.vue'
import { FORMAT_OPTIONS, DEFAULT_FORMAT_OPTION } from '@/constants/formatOptions'

const vTooltip = Tooltip

const state = reactive({
  content: '<xml></xml>',
  formatOptionValue: DEFAULT_FORMAT_OPTION,
  collapseContent: false,
  whiteSpaceAtEndOfSelfclosingTag: false,
  excludeComments: false,
})
const onClickFormat = () => {
  state.content = format(state.content, {
    indentation: state.formatOptionValue,
    collapseContent: state.collapseContent,
    whiteSpaceAtEndOfSelfclosingTag: state.whiteSpaceAtEndOfSelfclosingTag,
    filter: node => !state.excludeComments || node.type !== 'Comment',
  })
}
</script>

<template>
  <Card>
    <template #title> XML Formatter </template>
    <template #subtitle> Formatting XML </template>
    <template #content>
      <CodeEditor v-model="state.content" mode="xml" height="500px" />
    </template>
    <template #footer>
      <h3>Options</h3>
      <div class="field-checkbox">
        <Checkbox
          id="collapseContent"
          v-model="state.collapseContent"
          v-tooltip.right="
            'True to keep content in the same line as the element. Only works if element contains at least one text node'
          "
          :binary="true"
        />
        <label for="collapseContent">Collapse</label>
      </div>
      <div class="field-checkbox">
        <Checkbox
          id="whiteSpaceAtEndOfSelfclosingTag"
          v-model="state.whiteSpaceAtEndOfSelfclosingTag"
          v-tooltip.right="'To either end ad self closing tag with <tag/> or <tag />'"
          :binary="true"
        />
        <label for="whiteSpaceAtEndOfSelfclosingTag">Self closing tag space</label>
      </div>
      <div class="field-checkbox">
        <Checkbox
          id="excludeComments"
          v-model="state.excludeComments"
          v-tooltip.right="'Remove comment tags'"
          :binary="true"
        />
        <label for="excludeComments">Exclude comments</label>
      </div>
      <div class="p-inputgroup">
        <Button label="Format" @click="onClickFormat" />
        <Dropdown
          v-model="state.formatOptionValue"
          :options="FORMAT_OPTIONS"
          optionLabel="text"
          optionValue="value"
        />
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.buttons {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
