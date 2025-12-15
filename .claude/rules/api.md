---
paths: src/api/**/*.ts
---

# API Client Guidelines

## Directory Structure

```
src/api/
├── client.ts          # Axios instance, error handling
├── index.ts           # Re-exports
└── endpoints/         # Endpoint definitions by domain
```

## Client Configuration

```typescript
import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
} as const satisfies Parameters<typeof axios.create>[0]

// Error handling
const handleApiError = (error: AxiosError): never => {
  const message = (error.response?.data as { message?: string })?.message ?? error.message
  throw new ApiError(message, error.response?.status, error.code)
}

// Client factory
export const createApiClient = (): AxiosInstance => {
  const client = axios.create(API_CONFIG)
  client.interceptors.response.use(
    response => response,
    (error: AxiosError) => handleApiError(error),
  )
  return client
}

export const apiClient = createApiClient()
```

## Endpoint Definition Pattern

```typescript
import { apiClient } from '../client'

// Type definitions
export interface DataModel {
  id: string
  name: string
}

// Endpoint functions
export const getData = async (): Promise<DataModel> =>
  apiClient.get<DataModel>('endpoint').then(({ data }) => data)

export const getDataById = async (id: string): Promise<DataModel> =>
  apiClient.get<DataModel>(`endpoint/${id}`).then(({ data }) => data)

export const createData = async (payload: CreatePayload): Promise<DataModel> =>
  apiClient.post<DataModel>('endpoint', payload).then(({ data }) => data)
```

## Best Practices

### Type Safety

- Define interfaces for all request/response shapes
- Use generics: `apiClient.get<ResponseType>()`
- Extract `.data` in endpoint function

### Error Handling

- Centralized via interceptors
- Handle in composables, not endpoints
- Use `Promise.allSettled` for parallel requests

### Function Signatures

```typescript
// GET - no params
export const getData = async (): Promise<Data> =>
  apiClient.get<Data>('path').then(({ data }) => data)

// GET - with path param
export const getById = async (id: string): Promise<Data> =>
  apiClient.get<Data>(`path/${id}`).then(({ data }) => data)

// GET - with query params
export const search = async (query: string): Promise<Data[]> =>
  apiClient.get<Data[]>('path', { params: { q: query } }).then(({ data }) => data)

// POST
export const create = async (payload: Payload): Promise<Data> =>
  apiClient.post<Data>('path', payload).then(({ data }) => data)

// DELETE
export const remove = async (id: string): Promise<void> =>
  apiClient.delete(`path/${id}`).then(() => undefined)
```

## Usage in Composables

```typescript
import { ref, readonly } from 'vue'
import { getData } from '@/api/endpoints'
import type { DataModel } from '@/api/endpoints'

export const useData = () => {
  const data = ref<DataModel | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetch = async () => {
    isLoading.value = true
    error.value = null
    try {
      data.value = await getData()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  return {
    data: readonly(data),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetch,
  }
}
```
