import { LogEventCode, LogStatus } from '~/src/shared/logging/log_contract.js'

export type OutputHistoryItem = {
  id: string
  createdAt?: string
  runId?: string
  stage?: string
  status?: string
  message?: string
  title: string
  outputPath: string
  htmlOutputPath?: string
  markdownOutputPath?: string
  epubOutputPath?: string
  outputFormats?: unknown
}

export function parseJsonlRecords(content: string): Record<string, unknown>[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      try {
        const value = JSON.parse(line)
        return value && typeof value === 'object' && Array.isArray(value) === false
          ? (value as Record<string, unknown>)
          : undefined
      } catch {
        return undefined
      }
    })
    .filter((item): item is Record<string, unknown> => item !== undefined)
}

export function buildOutputHistory(
  eventList: Record<string, unknown>[],
  limit = 50,
): OutputHistoryItem[] {
  const historyList = eventList
    .map((event, orderIndex) => {
      const details =
        event.details && typeof event.details === 'object' && Array.isArray(event.details) === false
          ? (event.details as Record<string, unknown>)
          : {}
      const outputPath = typeof details.outputPath === 'string' ? details.outputPath : undefined
      const htmlOutputPath = typeof details.htmlOutputPath === 'string' ? details.htmlOutputPath : undefined
      const markdownOutputPath = typeof details.markdownOutputPath === 'string' ? details.markdownOutputPath : undefined
      const epubOutputPath = typeof details.epubOutputPath === 'string' ? details.epubOutputPath : undefined
      if (
        (event.status !== LogStatus.SUCCESS && event.status !== LogStatus.PARTIAL_SUCCESS)
        || event.eventCode !== LogEventCode.OUTPUT_CREATED
      ) {
        return undefined
      }
      if (outputPath === undefined || outputPath.trim() === '') {
        return undefined
      }
      const message = typeof event.message === 'string' ? event.message : undefined
      const createdAt = typeof event.triggerAt === 'string' ? event.triggerAt : undefined
      const title =
        (typeof details.bookname === 'string' && details.bookname) ||
        (typeof details.title === 'string' && details.title) ||
        message ||
        '输出记录'
      return {
        orderIndex,
        id: `${createdAt ?? orderIndex}-${title}`,
        createdAt,
        runId: typeof event.runId === 'string' ? event.runId : undefined,
        stage: typeof event.stage === 'string' ? event.stage : undefined,
        status: typeof event.status === 'string' ? event.status : undefined,
        message,
        title,
        outputPath,
        htmlOutputPath,
        markdownOutputPath,
        epubOutputPath,
        outputFormats: details.outputFormats,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== undefined)
    .reverse()

  const dedupeMap = new Map<string, (typeof historyList)[number]>()
  for (const item of historyList) {
    const key = item.outputPath.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase()
    if (dedupeMap.has(key) === false) {
      dedupeMap.set(key, item)
    }
  }

  return [...dedupeMap.values()]
    .sort((left, right) => right.orderIndex - left.orderIndex)
    .slice(0, limit)
    .map(({ orderIndex, ...item }) => item)
}
