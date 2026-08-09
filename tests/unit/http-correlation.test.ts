import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HttpClient from '../../src/library/http'
import { setBridgeFunc } from '../../src/library/zhihu_encrypt'
import RequestConfig from '../../src/config/request'
import PathConfig from '../../src/config/path'
import Logger from '../../src/library/logger'
import { createTestSandbox, TestSandbox } from '../helpers/sandbox'

describe('HTTP log correlation', () => {
  let sandbox: TestSandbox
  let originalLogPath: string
  let originalCookie: string

  beforeEach(() => {
    sandbox = createTestSandbox('http-correlation')
    originalLogPath = PathConfig.logPath
    originalCookie = RequestConfig.cookie
    PathConfig.setLogPath(sandbox.logPath)
    RequestConfig.setRequestConfig({ ua: 'fixture', cookie: 'd_c0=fake-cookie' })
    Logger.setDebugMode(true)
    setBridgeFunc(async () => 'fixture-signature')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    PathConfig.setLogPath(originalLogPath)
    RequestConfig.setRequestConfig({ ua: 'fixture', cookie: originalCookie })
    Logger.setDebugMode(true)
    vi.restoreAllMocks()
    sandbox.cleanup()
  })

  it('keeps an explicit IPC traceId on HTTP start and terminal records', async () => {
    vi.spyOn(HttpClient.rawInstance, 'get').mockResolvedValue({ data: { id: 'fixture-entity' } } as never)
    await HttpClient.get(`https://www.zhihu.com/api/v4/test/${Date.now()}`, {}, { traceId: 'renderer-trace-1' })

    const recordList = fs
      .readdirSync(sandbox.logPath)
      .filter((fileName) => /^runtime\..+\.jsonl$/.test(fileName))
      .flatMap((fileName) => fs.readFileSync(path.join(sandbox.logPath, fileName), 'utf8').trim().split('\n'))
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((record) => record.eventCode === 'fetch.start' || record.eventCode === 'fetch.success')

    expect(recordList).toHaveLength(2)
    expect(recordList.every((record) => record.traceId === 'renderer-trace-1')).toBe(true)
    expect(new Set(recordList.map((record) => record.jobId)).size).toBe(1)
  })
})
