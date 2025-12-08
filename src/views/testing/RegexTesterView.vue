<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import CodeEditor from '@/components/editors/CodeEditor.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Toolbar from 'primevue/toolbar'
import Panel from 'primevue/panel'

import { useRegexTester, COMMON_PATTERNS } from '@/composables/useRegexTester'
import { useClipboardToast } from '@/composables/useClipboardToast'

const { copy, showInfo } = useClipboardToast()

// Use composable
const {
  // State
  pattern,
  testString,
  replacement,

  // Flags
  flagGlobal,
  flagCaseInsensitive,
  flagMultiline,
  flagDotAll,
  flagUnicode,
  flags,

  // Visualizer
  showAst,
  svgDiagram,
  astJson,
  visualizerError,

  // Computed
  regexError,
  matches,
  highlightedText,
  replacedText,
  fullPattern,

  // Actions
  usePattern,
  loadSampleData,
  clearAll,
} = useRegexTester()

// UI actions with toast notifications
const copyPattern = () => {
  void copy(fullPattern.value, { detail: 'Pattern copied to clipboard' })
}

const copyReplaced = () => {
  void copy(replacedText.value, { detail: 'Replaced text copied to clipboard' })
}

const handleUsePattern = (p: string) => {
  usePattern(p)
  showInfo('Pattern Applied', 'Pattern has been loaded')
}
</script>

<template>
  <Card>
    <template #title>
      <div class="card-title">
        <i class="pi pi-code"></i>
        <span>Regex Tester</span>
      </div>
    </template>
    <template #subtitle> Test and debug regular expressions with real-time matching </template>
    <template #content>
      <div class="regex-container">
        <!-- Pattern Input Section -->
        <Panel toggleable class="pattern-panel">
          <template #header>
            <div class="panel-header">
              <i class="pi pi-sliders-h"></i>
              <span>Pattern & Flags</span>
              <Tag
                v-if="pattern"
                :value="regexError ? 'Invalid' : 'Valid'"
                :severity="regexError ? 'danger' : 'success'"
              />
            </div>
          </template>
          <template #icons>
            <Button
              v-tooltip.top="'Load Sample'"
              icon="pi pi-file-import"
              severity="secondary"
              text
              rounded
              @click="loadSampleData"
            />
            <Button
              v-tooltip.top="'Clear All'"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="!pattern && !testString"
              @click="clearAll"
            />
          </template>

          <div class="pattern-section">
            <div class="field">
              <label for="pattern">
                <i class="pi pi-code"></i>
                Regular Expression
              </label>
              <InputGroup>
                <InputGroupAddon class="pattern-delimiter">/</InputGroupAddon>
                <InputText
                  id="pattern"
                  v-model="pattern"
                  class="pattern-field"
                  placeholder="Enter regex pattern"
                />
                <InputGroupAddon class="pattern-delimiter">/{{ flags }}</InputGroupAddon>
                <InputGroupAddon>
                  <Button
                    v-tooltip.top="'Copy Pattern'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    :disabled="!pattern"
                    @click="copyPattern"
                  />
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Divider align="left">
              <span class="divider-text">
                <i class="pi pi-flag"></i>
                Flags
              </span>
            </Divider>

            <div class="flags-row">
              <div class="flag-option">
                <ToggleSwitch v-model="flagGlobal" input-id="flagG" />
                <label for="flagG">
                  <Tag value="g" :severity="flagGlobal ? 'success' : 'secondary'" />
                  <span>Global</span>
                </label>
              </div>
              <div class="flag-option">
                <ToggleSwitch v-model="flagCaseInsensitive" input-id="flagI" />
                <label for="flagI">
                  <Tag value="i" :severity="flagCaseInsensitive ? 'success' : 'secondary'" />
                  <span>Case Insensitive</span>
                </label>
              </div>
              <div class="flag-option">
                <ToggleSwitch v-model="flagMultiline" input-id="flagM" />
                <label for="flagM">
                  <Tag value="m" :severity="flagMultiline ? 'success' : 'secondary'" />
                  <span>Multiline</span>
                </label>
              </div>
              <div class="flag-option">
                <ToggleSwitch v-model="flagDotAll" input-id="flagS" />
                <label for="flagS">
                  <Tag value="s" :severity="flagDotAll ? 'success' : 'secondary'" />
                  <span>Dot All</span>
                </label>
              </div>
              <div class="flag-option">
                <ToggleSwitch v-model="flagUnicode" input-id="flagU" />
                <label for="flagU">
                  <Tag value="u" :severity="flagUnicode ? 'success' : 'secondary'" />
                  <span>Unicode</span>
                </label>
              </div>
            </div>

            <Message v-if="regexError" severity="error" :closable="false">
              <div class="error-content">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ regexError }}</span>
              </div>
            </Message>
          </div>
        </Panel>

        <!-- Tabs -->
        <Tabs value="0">
          <TabList>
            <Tab value="0">Test</Tab>
            <Tab value="1">Replace</Tab>
            <Tab value="2">Visualize</Tab>
            <Tab value="3">Common Patterns</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="0">
              <div class="test-section">
                <div class="field">
                  <label for="testString">
                    <i class="pi pi-file-edit"></i>
                    Test String
                  </label>
                  <CodeEditor v-model="testString" mode="plain_text" height="200px" />
                </div>

                <div v-if="testString" class="results">
                  <Toolbar class="result-toolbar">
                    <template #start>
                      <div class="match-stats">
                        <Tag
                          :value="`${matches.length} match${matches.length !== 1 ? 'es' : ''}`"
                          :severity="matches.length > 0 ? 'success' : 'secondary'"
                          icon="pi pi-search"
                        />
                      </div>
                    </template>
                  </Toolbar>

                  <Divider align="left">
                    <span class="divider-text">
                      <i class="pi pi-eye"></i>
                      Highlighted Matches
                    </span>
                  </Divider>

                  <div class="highlighted-text" v-html="highlightedText"></div>

                  <div v-if="matches.length > 0">
                    <Divider align="left">
                      <span class="divider-text">
                        <i class="pi pi-list"></i>
                        Match Details
                      </span>
                    </Divider>

                    <DataTable
                      :value="matches"
                      striped-rows
                      size="small"
                      :paginator="matches.length > 10"
                      :rows="10"
                      class="match-table"
                    >
                      <Column field="index" header="#" :header-style="{ width: '60px' }">
                        <template #body="slotProps">
                          <Tag :value="slotProps.data.index + 1" severity="secondary" />
                        </template>
                      </Column>
                      <Column field="match" header="Match">
                        <template #body="slotProps">
                          <code class="match-value">{{ slotProps.data.match }}</code>
                        </template>
                      </Column>
                      <Column header="Position" :header-style="{ width: '120px' }">
                        <template #body="slotProps">
                          <Tag
                            :value="`${slotProps.data.start}-${slotProps.data.end}`"
                            severity="info"
                          />
                        </template>
                      </Column>
                      <Column header="Groups">
                        <template #body="slotProps">
                          <div v-if="slotProps.data.groups.length > 0" class="groups-list">
                            <Tag
                              v-for="(g, i) in slotProps.data.groups"
                              :key="i"
                              :value="`$${i + 1}: ${g}`"
                              severity="warn"
                            />
                          </div>
                          <span v-else class="no-groups">No groups</span>
                        </template>
                      </Column>
                    </DataTable>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <i class="pi pi-file-edit"></i>
                  <span>Enter a test string to see matches</span>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="1">
              <div class="replace-section">
                <div class="field">
                  <label for="testStringReplace">
                    <i class="pi pi-file-edit"></i>
                    Test String
                  </label>
                  <CodeEditor v-model="testString" mode="plain_text" height="150px" />
                </div>

                <div class="field">
                  <label for="replacement">
                    <i class="pi pi-pencil"></i>
                    Replacement
                  </label>
                  <InputGroup>
                    <InputGroupAddon>
                      <i class="pi pi-arrow-right"></i>
                    </InputGroupAddon>
                    <InputText
                      id="replacement"
                      v-model="replacement"
                      class="w-full"
                      placeholder="Replacement string (use $1, $2 for groups)"
                    />
                  </InputGroup>
                  <small class="hint-text">
                    <i class="pi pi-info-circle"></i>
                    Use $1, $2, etc. to reference captured groups
                  </small>
                </div>

                <div v-if="testString && pattern" class="result-section">
                  <Divider align="left">
                    <span class="divider-text">
                      <i class="pi pi-check-circle"></i>
                      Result
                    </span>
                  </Divider>

                  <CodeEditor
                    :model-value="replacedText"
                    mode="plain_text"
                    height="150px"
                    :options="{ readOnly: true }"
                  />
                  <Toolbar class="result-actions">
                    <template #end>
                      <Button
                        icon="pi pi-copy"
                        label="Copy Result"
                        severity="secondary"
                        :disabled="!replacedText"
                        @click="copyReplaced"
                      />
                    </template>
                  </Toolbar>
                </div>

                <div v-else class="empty-state">
                  <i class="pi pi-info-circle"></i>
                  <span>Enter pattern and test string to see replacement result</span>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="2">
              <div class="visualize-section">
                <div v-if="!pattern" class="empty-state">
                  <i class="pi pi-sitemap"></i>
                  <span>Enter a pattern to see visualization</span>
                </div>

                <div v-else-if="visualizerError" class="error-state">
                  <Message severity="error" :closable="false">
                    <div class="error-content">
                      <i class="pi pi-exclamation-triangle"></i>
                      <span>{{ visualizerError }}</span>
                    </div>
                  </Message>
                </div>

                <div v-else class="visualization-content">
                  <Toolbar class="viz-toolbar">
                    <template #start>
                      <span class="viz-title">
                        <i class="pi pi-sitemap"></i>
                        Railroad Diagram
                      </span>
                    </template>
                    <template #end>
                      <div class="viz-actions">
                        <ToggleSwitch v-model="showAst" input-id="showAst" />
                        <label for="showAst">Show AST</label>
                      </div>
                    </template>
                  </Toolbar>

                  <div class="diagram-container">
                    <div v-if="svgDiagram" class="svg-wrapper" v-html="svgDiagram"></div>
                  </div>

                  <div v-if="showAst && astJson" class="ast-section">
                    <Divider align="left">
                      <span class="divider-text">
                        <i class="pi pi-code"></i>
                        Abstract Syntax Tree (AST)
                      </span>
                    </Divider>
                    <CodeEditor
                      :model-value="astJson"
                      mode="json"
                      height="300px"
                      :options="{ readOnly: true }"
                    />
                  </div>

                  <Divider align="left">
                    <span class="divider-text">
                      <i class="pi pi-palette"></i>
                      Legend
                    </span>
                  </Divider>
                  <div class="legend">
                    <div class="legend-item">
                      <span class="legend-box legend-char"></span>
                      <span>Character</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-box legend-meta"></span>
                      <span>Meta Character</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-box legend-charclass"></span>
                      <span>Character Class</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-box legend-group"></span>
                      <span>Group</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-box legend-quantifier"></span>
                      <span>Quantifier</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-box legend-assertion"></span>
                      <span>Assertion</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="3">
              <div class="common-patterns">
                <div class="patterns-intro">
                  <Message severity="info" :closable="false">
                    <div class="intro-content">
                      <i class="pi pi-lightbulb"></i>
                      <span>Click on a pattern to load it into the editor</span>
                    </div>
                  </Message>
                </div>

                <div class="patterns-grid">
                  <div
                    v-for="p in COMMON_PATTERNS"
                    :key="p.name"
                    class="pattern-card"
                    @click="handleUsePattern(p.pattern)"
                  >
                    <div class="pattern-header">
                      <i :class="p.icon"></i>
                      <span class="pattern-name">{{ p.name }}</span>
                    </div>
                    <code class="pattern-value">{{ p.pattern }}</code>
                    <div class="pattern-action">
                      <Tag value="Click to use" severity="secondary" icon="pi pi-arrow-right" />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.regex-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pattern-panel {
  margin-bottom: 1rem;
}

.pattern-section {
  padding: 0.5rem 0;
}

.field {
  margin-bottom: 1rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;

    i {
      color: var(--primary-color);
    }
  }
}

.pattern-delimiter {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
  background: transparent;
}

.pattern-field {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color-secondary);

  i {
    color: var(--primary-color);
  }
}

.flags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.flag-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-bottom: 0;

    span {
      font-size: 0.9rem;
    }
  }
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.test-section,
.replace-section {
  padding: 0.5rem 0;
}

.result-toolbar {
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: 1rem;
}

.match-stats {
  display: flex;
  gap: 0.5rem;
}

.highlighted-text {
  padding: 1rem;
  background-color: var(--surface-ground);
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);

  :deep(.highlight) {
    background-color: #fef08a;
    color: #000;
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
    font-weight: 600;
  }
}

.match-table {
  margin-top: 1rem;
}

.match-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.no-groups {
  color: var(--text-color-secondary);
  font-style: italic;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;

  i {
    color: var(--primary-color);
  }
}

.result-section {
  margin-top: 1rem;
}

.result-actions {
  background: transparent;
  border: none;
  padding: 0.5rem 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: var(--surface-ground);
  border-radius: 8px;
  color: var(--text-color-secondary);

  i {
    font-size: 2rem;
    color: var(--primary-color);
  }
}

.common-patterns {
  padding: 0.5rem 0;
}

.patterns-intro {
  margin-bottom: 1rem;
}

.intro-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.pattern-card {
  padding: 1rem;
  background-color: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--surface-hover);
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.pattern-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  i {
    color: var(--primary-color);
  }

  .pattern-name {
    font-weight: 600;
    font-size: 1rem;
  }
}

.pattern-value {
  display: block;
  font-size: 0.8rem;
  word-break: break-all;
  color: var(--text-color-secondary);
  background: var(--surface-card);
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.pattern-action {
  display: flex;
  justify-content: flex-end;
}

// Visualize tab styles
.visualize-section {
  padding: 0.5rem 0;
}

.error-state {
  padding: 1rem 0;
}

.visualization-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.viz-toolbar {
  background: transparent;
  border: none;
  padding: 0;
}

.viz-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;

  i {
    color: var(--primary-color);
  }
}

.viz-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    cursor: pointer;
  }
}

.diagram-container {
  background: #fafafa;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow-x: auto;
  min-height: 150px;
}

.svg-wrapper {
  display: flex;
  justify-content: center;
  padding: 1rem;

  :deep(svg) {
    max-width: 100%;
    height: auto;
  }
}

.ast-section {
  margin-top: 1rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.legend-box {
  display: inline-block;
  width: 24px;
  height: 16px;
  border-radius: 4px;
  border-width: 2px;
  border-style: solid;
}

.legend-char {
  background: #e8f5e9;
  border-color: #4caf50;
}

.legend-meta {
  background: #fff9c4;
  border-color: #ffc107;
}

.legend-charclass {
  background: #e3f2fd;
  border-color: #2196f3;
}

.legend-group {
  background: #fff3e0;
  border-color: #ff9800;
}

.legend-quantifier {
  background: #fce4ec;
  border-color: #e91e63;
}

.legend-assertion {
  background: #f3e5f5;
  border-color: #9c27b0;
}
</style>
