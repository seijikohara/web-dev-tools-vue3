<script setup lang="ts">
import { reactive } from 'vue'

import Button from 'primevue/button'
import Card from 'primevue/card'
import DataView from 'primevue/dataview'
// DataViewLayoutOptions has been removed in PrimeVue 4.x
import InputText from 'primevue/inputtext'

import type { HtmlEntity } from '@/types/types'
import ApiService from '@/services/ApiService'

type PageEvent = {
  page: number
  first?: number
  rows: number
  pageCount?: number
}
const state = reactive({
  layout: 'list' as 'list' | 'grid' | undefined,
  searchWord: '',
  page: 0,
  size: 50,
  totalRecords: 0,
  entities: [] as HtmlEntity[],
})

const onPage = async (event: PageEvent) => {
  state.page = event.page
  state.size = event.rows
  const pagedEntities = await ApiService.getHtmlEntities(state.searchWord, state.page, state.size)
  state.entities = pagedEntities.content
  state.totalRecords = pagedEntities.totalElements
}

const onClickSearch = async () => {
  await onPage({ page: 0, rows: state.size })
}

await onClickSearch()
</script>

<template>
  <Card>
    <template #title> HTML Entities </template>
    <template #subtitle> List of HTML entities </template>
    <template #content>
      <DataView
        dataKey="name"
        :value="state.entities"
        :layout="state.layout"
        paginatorPosition="both"
        :paginator="true"
        :rows="state.size"
        :lazy="true"
        :totalRecords="state.totalRecords"
        :alwaysShowPaginator="false"
        :rowsPerPageOptions="[25, 50, 100, 200, 1000]"
        @page="onPage($event)"
      >
        <template #header>
          <div class="grid nogutter">
            <div class="col-6" style="text-align: left">
              <div class="p-inputgroup">
                <InputText
                  placeholder="Search..."
                  v-model="state.searchWord"
                  @keyup.enter="onClickSearch"
                />
                <Button icon="pi pi-search" @click="onClickSearch" />
              </div>
            </div>
            <div class="col-6" style="text-align: right">
              <DataViewLayoutOptions v-model="state.layout" />
            </div>
          </div>
        </template>
        <template #list="slotProps">
          <div class="grid grid-nogutter">
            <template v-for="(item, index) in slotProps.items" :key="index">
              <div class="col-12 md:col-1">
                <div class="char" v-html="item.entityReference" />
              </div>
              <div class="col-12 md:col-11">
                <table class="list-table">
                  <tr>
                    <th>Code</th>
                    <td>{{ item.entityReference }}</td>
                  </tr>
                  <tr>
                    <th>Name</th>
                    <td>{{ item.name }}</td>
                  </tr>
                  <tr>
                    <th>Description</th>
                    <td>{{ item.description }}</td>
                  </tr>
                  <tr>
                    <th>Standard</th>
                    <td>{{ item.standard }}</td>
                  </tr>
                  <tr>
                    <th>DTD</th>
                    <td>{{ item.dtd }}</td>
                  </tr>
                </table>
              </div>
            </template>
          </div>
        </template>
        <template #grid="slotProps">
          <div class="grid-container">
            <div class="char" v-html="slotProps.items.entityReference" />
            <div class="code">
              {{ slotProps.items.entityReference }}
            </div>
          </div>
        </template>
        <template #empty>
          <div class="empty-record-message">No records found.</div>
        </template>
      </DataView>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.char {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 5rem;
  width: 5rem;
  font-size: 2.5rem;
  background-color: #eeeeee;
  margin: 0.5rem;
  transition: all 0.25s ease;
  &:hover {
    font-size: 3.5rem;
    box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.125);
    transition: all 0.25s ease;
  }
}
.list-table {
  font-size: 0.75rem;
  th {
    text-align: right;
  }
}
.grid-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  .code {
    font-size: 0.75rem;
  }
}
.empty-record-message {
  margin: 2rem;
  text-align: center;
}
</style>
