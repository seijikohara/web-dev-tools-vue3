/**
 * Bcrypt worker message types
 */
export type BcryptWorkerMessage =
  | { type: 'hash'; password: string; rounds: number; id: number }
  | { type: 'verify'; password: string; hash: string; id: number }

export type BcryptWorkerResponse =
  | { type: 'hash'; result: string; computeTime: number; id: number }
  | { type: 'verify'; result: boolean; id: number }
  | { type: 'error'; error: string; id: number }

/**
 * Generic worker message wrapper
 */
export interface WorkerMessage<T extends string, P = unknown> {
  type: T
  payload: P
  id: number
}

/**
 * Generic worker response wrapper
 */
export interface WorkerResponse<T extends string, R = unknown> {
  type: T
  result?: R
  error?: string
  id: number
}
