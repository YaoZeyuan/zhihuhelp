import { Alert, Button, Typography, Card, Row, Divider, Space, Col, Checkbox, message, Tag } from 'antd'
import { useRef, useState } from 'react'
import VirtualList from 'rc-virtual-list'
import * as Ahooks from 'ahooks'
import DebugLog from '~/src/library/debug_log'
import { LogEventCode, LogLevel, LogStatus } from '@shared/logging/log_contract'

import './index.less'

type Type_Log_Item = {
  lineNo: number
  content: string
}

type Type_Runtime_Event = {
  runId?: string
  jobId?: string
  eventCode?: string
  triggerAt?: string
  stage?: string
  status?: string
  level?: string
  message?: string
  error?: {
    name?: string
    message?: string
    code?: string
  }
}

type Type_Output_History_Item = {
  id: string
  createdAt?: string
  title?: string
  message?: string
  status?: string
  outputPath: string
}

type Type_Stage_Status = 'waiting' | 'running' | 'success' | 'partial_success' | 'failure' | 'skip'

type Type_Stage_Item = {
  stage: string
  title: string
  status: Type_Stage_Status
  message: string
}

const Const_Stage_Order = ['config', 'init', 'fetch', 'generate', 'output'] as const
type Type_Run_Stage = typeof Const_Stage_Order[number]
const Const_Stage_Title: Record<string, string> = {
  config: '配置',
  init: '初始化',
  fetch: '抓取',
  persist: '入库',
  generate: '生成',
  render: '渲染',
  output: '输出',
}

export function resolveRendererSessionStartedAt(
  rendererPerformance: { timeOrigin?: number } | null | undefined =
    typeof performance === 'undefined' ? undefined : performance,
  now: () => number = Date.now,
) {
  const timeOrigin = rendererPerformance?.timeOrigin
  return typeof timeOrigin === 'number' && Number.isFinite(timeOrigin) && timeOrigin > 0 ? timeOrigin : now()
}

export const RendererSessionStartedAt = resolveRendererSessionStartedAt()

function parseRuntimeJsonl(content: string): Type_Runtime_Event[] {
  return (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      try {
        return JSON.parse(line) as Type_Runtime_Event
      } catch {
        return undefined
      }
    })
    .filter((item): item is Type_Runtime_Event => item !== undefined)
}

function isRunStage(stage?: string): stage is Type_Run_Stage {
  return Const_Stage_Order.includes(stage as Type_Run_Stage)
}

function getRuntimeEventTimeValue(event: Type_Runtime_Event) {
  if (!event.triggerAt) {
    return Number.NaN
  }
  return Date.parse(event.triggerAt)
}

export function buildSessionErrorList(eventList: Type_Runtime_Event[], sessionStartedAt: number) {
  return eventList
    .map((event, index) => ({
      event,
      index,
      triggerAt: getRuntimeEventTimeValue(event),
    }))
    .filter(({ event, triggerAt }) => {
      if (!Number.isFinite(triggerAt) || triggerAt < sessionStartedAt || event.status === LogStatus.PARTIAL_SUCCESS) {
        return false
      }
      return event.level === LogLevel.ERROR || event.status === LogStatus.FAILURE
    })
    .sort((left, right) => right.triggerAt - left.triggerAt || right.index - left.index)
    .map(({ event }) => event)
}

function getLatestRunEventList(eventList: Type_Runtime_Event[]) {
  const latestRunId = [...eventList].reverse().find((event) => typeof event.runId === 'string' && event.runId.trim() !== '')?.runId
  if (latestRunId) {
    return eventList.filter((event) => event.runId === latestRunId)
  }
  const latestConfigIndex = [...eventList].reverse().findIndex((event) => event.stage === 'config')
  if (latestConfigIndex < 0) {
    return eventList
  }
  return eventList.slice(eventList.length - 1 - latestConfigIndex)
}

function toStageStatus(status?: string): Type_Stage_Status {
  if (status === 'start' || status === 'progress') {
    return 'running'
  }
  if (status === 'success') {
    return 'success'
  }
  if (status === 'partial_success') {
    return 'partial_success'
  }
  if (status === 'failure') {
    return 'failure'
  }
  if (status === 'skip') {
    return 'skip'
  }
  return 'waiting'
}

function getStageColor(status: Type_Stage_Status) {
  if (status === 'running') {
    return 'processing'
  }
  if (status === 'success') {
    return 'success'
  }
  if (status === 'partial_success') {
    return 'warning'
  }
  if (status === 'failure') {
    return 'error'
  }
  if (status === 'skip') {
    return 'warning'
  }
  return 'default'
}

function isStageCompleteEvent(event: Type_Runtime_Event) {
  if ((event.status !== 'success' && event.status !== 'partial_success') || !isRunStage(event.stage)) {
    return false
  }
  if (event.stage === 'output' && event.eventCode === LogEventCode.OUTPUT_CREATED) {
    return true
  }
  if (event.stage === 'config' && event.eventCode === LogEventCode.CONFIG_READ_SUCCESS) {
    return true
  }
  return event.eventCode === `${event.stage}.${event.status}`
}

function buildOutputStageItem(stageEventList: Type_Runtime_Event[]): Type_Stage_Item | undefined {
  if (stageEventList.length === 0) {
    return undefined
  }
  const latestEventByJob = new Map<string, Type_Runtime_Event>()
  for (const event of stageEventList) {
    latestEventByJob.set(event.jobId ?? '__output-stage__', event)
  }
  const latestJobEventList = [...latestEventByJob.values()]
  const activeEvent = [...latestJobEventList]
    .reverse()
    .find((event) => event.status === LogStatus.START || event.status === LogStatus.PROGRESS)
  if (activeEvent) {
    return {
      stage: 'output',
      title: Const_Stage_Title.output,
      status: 'running',
      message: activeEvent.message ?? '执行中',
    }
  }
  const terminalPriorityList: Array<[string, Type_Stage_Status, string]> = [
    [LogStatus.FAILURE, 'failure', '执行失败'],
    [LogStatus.PARTIAL_SUCCESS, 'partial_success', '部分完成'],
    [LogStatus.SUCCESS, 'success', '已完成'],
  ]
  for (const [terminalStatus, stageStatus, fallbackMessage] of terminalPriorityList) {
    const terminalEvent = [...latestJobEventList].reverse().find((event) => event.status === terminalStatus)
    if (terminalEvent) {
      return {
        stage: 'output',
        title: Const_Stage_Title.output,
        status: stageStatus,
        message: terminalEvent.message ?? fallbackMessage,
      }
    }
  }
  const latestEvent = stageEventList[stageEventList.length - 1]
  return {
    stage: 'output',
    title: Const_Stage_Title.output,
    status: toStageStatus(latestEvent.status),
    message: latestEvent.message ?? '执行中',
  }
}

export function buildStageList(eventList: Type_Runtime_Event[]): Type_Stage_Item[] {
  const currentRunEventList = getLatestRunEventList(eventList).filter((event) => {
    if (!isRunStage(event.stage)) {
      return false
    }
    // Entity and HTTP jobs can fail recoverably. Their failures are summarized
    // by the canonical stage-* workflow envelope. Output-created jobs are kept
    // because they represent the visible output stage.
    return (
      event.jobId === undefined
      || event.eventCode === LogEventCode.OUTPUT_CREATED
      || event.jobId?.startsWith('generate-book-') === true
      || event.jobId?.startsWith('stage-') === true
      || event.jobId?.startsWith('config-ensure') === true
      || event.jobId?.startsWith('config-read') === true
    )
  })
  const stageEventMap = new Map<Type_Run_Stage, Type_Runtime_Event[]>()
  for (const stage of Const_Stage_Order) {
    stageEventMap.set(stage, [])
  }
  for (const event of currentRunEventList) {
    if (isRunStage(event.stage)) {
      stageEventMap.get(event.stage)?.push(event)
    }
  }
  const firstFailureStageIndex = Const_Stage_Order.findIndex((stage) => {
    return stageEventMap.get(stage)?.some((event) => event.status === LogStatus.FAILURE) === true
  })
  return Const_Stage_Order.map((stage, stageIndex) => {
    const stageEventList = stageEventMap.get(stage) ?? []
    if (stage === 'output') {
      const outputStageItem = buildOutputStageItem(stageEventList)
      if (outputStageItem) {
        return outputStageItem
      }
    }
    const latestStageEvent = stageEventList[stageEventList.length - 1]
    const failedEvent = [...stageEventList].reverse().find((event) => event.status === LogStatus.FAILURE)
    const partialEvent = [...stageEventList].reverse().find((event) => event.status === LogStatus.PARTIAL_SUCCESS)
    const completeEvent = [...stageEventList].reverse().find(isStageCompleteEvent)
    const hasLaterStageEvent = Const_Stage_Order.slice(stageIndex + 1).some((nextStage) => {
      return (stageEventMap.get(nextStage)?.length ?? 0) > 0
    })
    // A later stage can fail before its parent workflow envelope is written.
    // Prefer the stage's own terminal event over the generic downstream wait state.
    if (failedEvent) {
      return {
        stage,
        title: Const_Stage_Title[stage],
        status: 'failure',
        message: failedEvent.message ?? '执行失败',
      }
    }
    if (firstFailureStageIndex >= 0 && stageIndex > firstFailureStageIndex) {
      return {
        stage,
        title: Const_Stage_Title[stage],
        status: 'waiting',
        message: '等待开始',
      }
    }
    if (partialEvent) {
      return {
        stage,
        title: Const_Stage_Title[stage],
        status: 'partial_success',
        message: partialEvent.message ?? '部分完成',
      }
    }
    if (completeEvent || hasLaterStageEvent) {
      return {
        stage,
        title: Const_Stage_Title[stage],
        status: 'success',
        message: completeEvent?.message ?? latestStageEvent?.message ?? '已完成',
      }
    }
    if (stageEventList.length > 0) {
      const latestStatus = toStageStatus(latestStageEvent?.status)
      return {
        stage,
        title: Const_Stage_Title[stage],
        status: latestStatus,
        message: latestStageEvent?.message ?? '执行中',
      }
    }
    return {
      stage,
      title: Const_Stage_Title[stage],
      status: 'waiting',
      message: '等待开始',
    }
  })
}

function formatHistoryTime(createdAt?: string) {
  if (!createdAt) {
    return '-'
  }
  return new Date(createdAt).toLocaleString()
}

function formatStructuredError(error?: Type_Runtime_Event['error']) {
  if (!error) {
    return '无结构化错误详情'
  }
  const identity = [error.name, error.code].filter((item): item is string => Boolean(item)).join(' / ')
  return [identity, error.message].filter((item): item is string => Boolean(item)).join('：') || '无结构化错误详情'
}

function getHistoryTimeValue(item: Type_Output_History_Item) {
  if (!item.createdAt) {
    return 0
  }
  const timestamp = Date.parse(item.createdAt)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function sortOutputHistoryList(outputHistoryList: Type_Output_History_Item[]) {
  return outputHistoryList
    .map((item, index) => ({
      item,
      index,
    }))
    .sort((left, right) => {
      const timeDiff = getHistoryTimeValue(right.item) - getHistoryTimeValue(left.item)
      if (timeDiff !== 0) {
        return timeDiff
      }
      return left.index - right.index
    })
    .map(({ item }) => item)
}

export default () => {
  const [isAutoFresh, setIsAutoFresh] = useState<boolean>(true)
  const [logList, setLogList] = useState<Type_Log_Item[]>([])
  const [stageList, setStageList] = useState<Type_Stage_Item[]>(buildStageList([]))
  const [sessionErrorList, setSessionErrorList] = useState<Type_Runtime_Event[]>([])
  const [latestEvent, setLatestEvent] = useState<Type_Runtime_Event | undefined>()
  const [outputHistoryList, setOutputHistoryList] = useState<Type_Output_History_Item[]>([])
  const sessionErrorRequestSequenceRef = useRef(0)
  const isClearingLogRef = useRef(false)
  const ContainerHeight = 768
  const asyncFetchSessionErrorList = async () => {
    if (isClearingLogRef.current) {
      return
    }
    const requestSequence = ++sessionErrorRequestSequenceRef.current
    try {
      const eventList = await DebugLog.invokeSilentElectronApi<Type_Runtime_Event[]>(
        'get-runtime-session-errors',
        [{ since: RendererSessionStartedAt }],
      )
      if (
        requestSequence !== sessionErrorRequestSequenceRef.current
        || isClearingLogRef.current
        || Array.isArray(eventList) === false
      ) {
        return
      }
      setSessionErrorList(buildSessionErrorList(eventList, RendererSessionStartedAt))
    } catch {
      // 读取失败时保留已经展示的本会话错误，等待下一次刷新恢复。
    }
  }
  const asyncFetchLogList = async () => {
    const sessionErrorPromise = asyncFetchSessionErrorList()
    let content = await DebugLog.invokeSilentElectronApi<string>('get-log-content')
    let runtimeJsonlContent = await DebugLog.invokeSilentElectronApi<string>('get-runtime-jsonl-content').catch(() => '')
    const outputHistory = await DebugLog.invokeSilentElectronApi<any[]>('get-output-history').catch(() => [])
    // console.log('content', content)
    // 暴力避免content为空字符串
    if (typeof content?.split !== 'function') {
      content = ''
    }
    const rawLogList = content?.split('\n') ?? []
    const logList: Type_Log_Item[] = []
    let counter = 0
    for (let item of rawLogList) {
      counter++
      logList.push({
        lineNo: counter,
        content: item,
      })
    }
    setLogList(logList)
    if (typeof runtimeJsonlContent !== 'string') {
      runtimeJsonlContent = ''
    }
    const runtimeEventList = parseRuntimeJsonl(runtimeJsonlContent)
    setStageList(buildStageList(runtimeEventList))
    setLatestEvent(runtimeEventList[runtimeEventList.length - 1])
    setOutputHistoryList(Array.isArray(outputHistory) ? sortOutputHistoryList(outputHistory) : [])
    await sessionErrorPromise
    let containerEle = document.querySelector('.rc-virtual-list-holder')
    if (containerEle?.scrollTop !== undefined) {
      containerEle.scrollTop = containerEle.scrollHeight ?? 1000000000
    }
  }
  const asyncClearLogList = async () => {
    isClearingLogRef.current = true
    sessionErrorRequestSequenceRef.current += 1
    try {
      await DebugLog.invokeElectronApi('clear-log-content')
      await DebugLog.invokeElectronApi('clear-runtime-jsonl-content')
      setSessionErrorList([])
    } catch {
      return
    } finally {
      isClearingLogRef.current = false
    }
    await asyncFetchLogList()
  }
  const asyncExportDiagnosticInfo = async () => {
    const result = await DebugLog.invokeElectronApi<any>('export-diagnostic-info').catch(() => undefined)
    if (result?.diagnosticPath) {
      message.success(`诊断信息已导出：${result.diagnosticPath}`)
      return
    }
    message.error('诊断信息导出失败')
  }
  const asyncOpenLocalPath = async (targetPath?: string) => {
    if (!targetPath) {
      message.warning('该记录没有可打开的路径')
      return
    }
    const opened = await DebugLog.invokeElectronApi<boolean>('open-local-path', [{ targetPath }]).catch(() => false)
    if (opened === false) {
      message.error('输出路径不存在、超出允许目录或无法打开')
    }
  }
  Ahooks.useInterval(async () => {
    if (isAutoFresh) {
      // 若自动刷新, 则每2秒刷新一次
      await asyncFetchLogList()
    }
  }, 2 * 1000)

  Ahooks.useAsyncEffect(async () => {
    await asyncFetchLogList()
  }, [])

  return (
    <div className="log-panel-4d80654">
      <Card className="runtime-status-card" title="运行状态">
        <div className="stage-list">
          {stageList.map((item) => (
            <div className="stage-item" key={item.stage}>
              <Tag color={getStageColor(item.status)}>{item.title}</Tag>
              <span>{item.message}</span>
            </div>
          ))}
        </div>
        {latestEvent && (
          <div className="latest-event">
            最近事件：{latestEvent.message}
          </div>
        )}
        <section className="session-error-section" aria-label="本会话错误">
          <Typography.Title level={5}>本会话错误（{sessionErrorList.length}）</Typography.Title>
          {sessionErrorList.length === 0 && <div className="empty-session-errors">本会话暂无错误。</div>}
          {sessionErrorList.length > 0 && (
            <div className="session-error-list">
              {sessionErrorList.map((event, index) => (
                <Alert
                  className="session-error-item"
                  key={`${event.triggerAt ?? 'unknown'}-${event.eventCode ?? event.stage ?? 'error'}-${index}`}
                  type="error"
                  showIcon
                  title={event.message ?? '未提供错误消息'}
                  description={(
                    <div className="session-error-description">
                      <div className="session-error-meta">
                        <span>{formatHistoryTime(event.triggerAt)}</span>
                        <Tag color="error">{event.stage ?? '未知阶段'}</Tag>
                        <code>{event.eventCode ?? '未提供 eventCode'}</code>
                      </div>
                      <div className="session-error-detail">
                        结构化错误：{formatStructuredError(event.error)}
                      </div>
                    </div>
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </Card>
      <Card
        className="output-history-card"
        title="输出历史"
        extra={<Button onClick={asyncExportDiagnosticInfo}>导出诊断信息</Button>}
      >
        {outputHistoryList.length === 0 && <div className="empty-history">暂无输出历史，完成一次生成任务后会显示在这里。</div>}
        {outputHistoryList.map((item) => (
          <div className="output-history-item" key={item.id}>
            <div className="output-history-main">
              <strong>{item.title}</strong>
              {item.status === LogStatus.PARTIAL_SUCCESS && <Tag color="warning">部分完成</Tag>}
              <span>{formatHistoryTime(item.createdAt)}</span>
              <span>{item.message}</span>
            </div>
            <Button size="small" onClick={() => asyncOpenLocalPath(item.outputPath)}>
              打开文件夹
            </Button>
          </div>
        ))}
      </Card>
      <Card title="原始日志">
        <div className="raw-log-list">
          <VirtualList data={logList} height={ContainerHeight} itemHeight={20} itemKey="lineNo">
            {(item: Type_Log_Item) => (
              <div className="raw-log-item" key={item.lineNo}>
                <pre>{item.content}</pre>
              </div>
            )}
          </VirtualList>
        </div>
      </Card>
      <div className="action-bar">
        <Row>
          <Col>
            <Checkbox
              checked={isAutoFresh}
              onChange={(e) => {
                setIsAutoFresh(e.target.checked)
              }}
            >
              自动刷新
            </Checkbox>
          </Col>
          <Col offset={6}>
            <Button onClick={asyncFetchLogList}>刷新日志</Button>
            <Divider orientation="vertical"></Divider>
            <Button
              type="primary"
              htmlType="button"
              onClick={async () => {
                await DebugLog.invokeElectronApi('open-output-dir')
              }}
            >
              打开电子书输出目录
            </Button>
            <Divider orientation="vertical"></Divider>
            <Button onClick={asyncExportDiagnosticInfo}>导出诊断信息</Button>
            <Divider orientation="vertical"></Divider>
            <Button danger onClick={asyncClearLogList}>
              清空日志
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  )
}
