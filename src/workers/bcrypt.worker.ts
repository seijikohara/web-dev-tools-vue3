import { hashSync, compareSync } from 'bcryptjs'
import type { BcryptWorkerMessage, BcryptWorkerResponse } from '@/types/workers'

self.addEventListener('message', (event: MessageEvent<BcryptWorkerMessage>) => {
  const { data } = event

  try {
    if (data.type === 'hash') {
      const startTime = performance.now()
      const result = hashSync(data.password, data.rounds)
      const computeTime = Math.round(performance.now() - startTime)
      const response = {
        type: 'hash',
        result,
        computeTime,
        id: data.id,
      } as BcryptWorkerResponse
      // oxlint-disable-next-line unicorn/require-post-message-target-origin -- DedicatedWorkerGlobalScope#postMessage has no targetOrigin parameter (only Window#postMessage does); confirmed via tsc that a self.location.origin second argument fails to type-check here
      self.postMessage(response)
    } else {
      // data.type === 'verify'
      const result = compareSync(data.password, data.hash)
      // oxlint-disable-next-line unicorn/require-post-message-target-origin -- DedicatedWorkerGlobalScope#postMessage has no targetOrigin parameter (only Window#postMessage does)
      self.postMessage({ type: 'verify', result, id: data.id } as BcryptWorkerResponse)
    }
  } catch (error) {
    const response = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      id: data.id,
    } as BcryptWorkerResponse
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- DedicatedWorkerGlobalScope#postMessage has no targetOrigin parameter (only Window#postMessage does)
    self.postMessage(response)
  }
})
