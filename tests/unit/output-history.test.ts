import { describe, expect, it } from 'vitest'
import { createStructuredLogRecord, LogEventCode, LogLevel, LogStatus } from '../../src/shared/logging/log_contract'
import { buildOutputHistory, parseJsonlRecords } from '../../src/shared/logging/output_history'

describe('output history', () => {
  it('ignores damaged lines and keeps successful output events in reverse order', () => {
    const records = parseJsonlRecords(
      [
        JSON.stringify({
          triggerAt: '2026-08-01T00:00:00.000Z',
          eventCode: LogEventCode.OUTPUT_CREATED,
          status: LogStatus.SUCCESS,
          message: 'first',
          details: { outputPath: 'D:/output/first' },
        }),
        '{ damaged',
        JSON.stringify({
          triggerAt: '2026-08-02T00:00:00.000Z',
          eventCode: LogEventCode.OUTPUT_CREATED,
          status: LogStatus.FAILURE,
          details: { outputPath: 'D:/output/failed' },
        }),
        JSON.stringify({
          triggerAt: '2026-08-03T00:00:00.000Z',
          eventCode: LogEventCode.OUTPUT_CREATED,
          status: LogStatus.SUCCESS,
          message: 'last',
          details: { htmlOutputPath: 'D:/output/last' },
        }),
      ].join('\n'),
    )

    expect(buildOutputHistory(records).map((item) => item.message)).toEqual(['last', 'first'])
  })

  it('deduplicates identical output records and applies the requested limit', () => {
    const event = {
      triggerAt: '2026-08-03T00:00:00.000Z',
      eventCode: LogEventCode.OUTPUT_CREATED,
      status: LogStatus.SUCCESS,
      message: 'same',
      details: { outputPath: 'D:/output/same', title: 'same' },
    }
    expect(buildOutputHistory([event, event, { ...event, triggerAt: '2026-08-04T00:00:00.000Z' }])).toHaveLength(1)
  })

  it('ignores successful workflow records that only contain a context output directory', () => {
    expect(
      buildOutputHistory([
        {
          triggerAt: '2026-08-03T00:00:00.000Z',
          eventCode: LogEventCode.WORKFLOW_SUCCESS,
          status: LogStatus.SUCCESS,
          message: 'workflow complete',
          details: { outputPath: 'D:/output' },
        },
      ]),
    ).toEqual([])
  })

  it('preserves deep Windows output paths so GUI open actions remain usable', () => {
    const path = 'D:\\win_www\\zhihuhelp\\output\\epub\\book.epub'
    const [item] = buildOutputHistory([
      createStructuredLogRecord({
        eventCode: LogEventCode.OUTPUT_CREATED,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: 'created',
        details: { epubOutputPath: path, bookname: 'book' },
      }, '2026-08-03T00:00:00.000Z'),
    ])
    expect(item.epubOutputPath).toBe(path)
  })

  it('keeps partial output artifacts and exposes their warning status', () => {
    const [item] = buildOutputHistory([
      createStructuredLogRecord({
        eventCode: LogEventCode.OUTPUT_CREATED,
        status: LogStatus.PARTIAL_SUCCESS,
        level: LogLevel.WARN,
        message: 'created with missing images',
        details: { htmlOutputPath: 'D:\\output\\partial-book' },
      }, '2026-08-03T00:00:00.000Z'),
    ])
    expect(item).toMatchObject({
      status: LogStatus.PARTIAL_SUCCESS,
      htmlOutputPath: 'D:\\output\\partial-book',
    })
  })
})
