import { computed, type ComputedRef } from 'vue'
import { UAParser, type IResult } from 'ua-parser-js'

interface BrowserInfo {
  userAgent: string
  parsed: IResult
  browser: IResult['browser'][]
  engine: IResult['engine'][]
  os: IResult['os'][]
  device: IResult['device'][]
}

/**
 * Composable to get browser and device information
 */
export const useBrowserInfo = (): ComputedRef<BrowserInfo> => {
  return computed(() => {
    const userAgent = window.navigator.userAgent
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      userAgent,
      parsed: result,
      browser: [result.browser],
      engine: [result.engine],
      os: [result.os],
      device: [result.device],
    }
  })
}
