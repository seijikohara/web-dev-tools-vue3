import { hashSync, compareSync } from 'bcryptjs'
import type { BcryptWorkerMessage, BcryptWorkerResponse } from '@/types/workers'

self.onmessage = (event: MessageEvent<BcryptWorkerMessage>) => {
  const { data } = event

  try {
    if (data.type === 'hash') {
      const startTime = performance.now()
      const result = hashSync(data.password, data.rounds)
      const computeTime = Math.round(performance.now() - startTime)
      self.postMessage({
        type: 'hash',
        result,
        computeTime,
        id: data.id,
      } as BcryptWorkerResponse)
    } else {
      // data.type === 'verify'
      const result = compareSync(data.password, data.hash)
      self.postMessage({ type: 'verify', result, id: data.id } as BcryptWorkerResponse)
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      id: data.id,
    } as BcryptWorkerResponse)
  }
}
