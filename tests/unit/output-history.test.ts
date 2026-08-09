import { describe, expect, it } from 'vitest'
import { createStructuredLogRecord, LogEventCode, LogLevel, LogStatus } from '../../src/shared/logging/log_contract'
import { buildOutputHistory, parseJsonlRecords } from '../../src/shared/logging/output_history'

describe('输出历史', () => {
  it('忽略损坏行，并按倒序保留成功的输出事件', () => {
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

  it('去重相同输出记录并应用指定数量限制', () => {
    const event = {
      triggerAt: '2026-08-03T00:00:00.000Z',
      eventCode: LogEventCode.OUTPUT_CREATED,
      status: LogStatus.SUCCESS,
      message: 'same',
      details: { outputPath: 'D:/output/same', title: 'same' },
    }
    expect(buildOutputHistory([event, event, { ...event, triggerAt: '2026-08-04T00:00:00.000Z' }])).toHaveLength(1)
  })

  it('忽略仅包含上下文输出目录的成功 workflow 记录', () => {
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

  it('保留深层 Windows 输出路径以供 GUI 打开操作使用', () => {
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

  it('保留部分成功的输出产物并暴露其警告状态', () => {
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

  it('保留 Markdown 书籍目录供 GUI 打开和去重', () => {
    const markdownOutputPath = 'D:\\output\\markdown\\book'
    const [item] = buildOutputHistory([
      createStructuredLogRecord({
        eventCode: LogEventCode.OUTPUT_CREATED,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: 'three artifacts created',
        details: {
          bookname: 'book',
          markdownOutputPath,
          outputFormats: ['html', 'markdown', 'epub'],
        },
      }, '2026-08-03T00:00:00.000Z'),
    ])
    expect(item).toMatchObject({
      markdownOutputPath,
      outputFormats: ['html', 'markdown', 'epub'],
    })
  })
})
