import { Alert, Button, List, Typography, Card, Row, Divider, Space, Col, Checkbox, message, Tag } from 'antd'
import { useState, useContext, useEffect } from 'react'
import VirtualList from 'rc-virtual-list'
import * as Ahooks from 'ahooks'

import './index.less'

type Type_Log_Item = {
  lineNo: number
  content: string
}

type Type_Runtime_Event = {
  triggerAt?: string
  stage?: string
  status?: string
  level?: string
  message?: string
  error?: {
    message?: string
  }
}

type Type_Stage_Status = 'waiting' | 'running' | 'success' | 'failure' | 'skip'

type Type_Stage_Item = {
  stage: string
  title: string
  status: Type_Stage_Status
  message: string
}

const Const_Stage_Order = ['config', 'init', 'fetch', 'generate', 'output']
const Const_Stage_Title: Record<string, string> = {
  config: '配置',
  init: '初始化',
  fetch: '抓取',
  persist: '入库',
  generate: '生成',
  render: '渲染',
  output: '输出',
}

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

function toStageStatus(status?: string): Type_Stage_Status {
  if (status === 'start' || status === 'progress') {
    return 'running'
  }
  if (status === 'success') {
    return 'success'
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
  if (status === 'failure') {
    return 'error'
  }
  if (status === 'skip') {
    return 'warning'
  }
  return 'default'
}

function buildStageList(eventList: Type_Runtime_Event[]): Type_Stage_Item[] {
  const stageMap = new Map<string, Type_Stage_Item>()
  for (const stage of Const_Stage_Order) {
    stageMap.set(stage, {
      stage,
      title: Const_Stage_Title[stage],
      status: 'waiting',
      message: '等待开始',
    })
  }
  for (const event of eventList) {
    if (!event.stage || !stageMap.has(event.stage)) {
      continue
    }
    stageMap.set(event.stage, {
      stage: event.stage,
      title: Const_Stage_Title[event.stage] ?? event.stage,
      status: toStageStatus(event.status),
      message: event.message ?? '',
    })
  }
  return [...stageMap.values()]
}

export default () => {
  const [isAutoFresh, setIsAutoFresh] = useState<boolean>(true)
  const [logList, setLogList] = useState<Type_Log_Item[]>([])
  const [stageList, setStageList] = useState<Type_Stage_Item[]>(buildStageList([]))
  const [latestError, setLatestError] = useState<Type_Runtime_Event | undefined>()
  const [latestEvent, setLatestEvent] = useState<Type_Runtime_Event | undefined>()
  const ContainerHeight = 768
  const asyncFetchLogList = async () => {
    let content = await window.electronAPI['get-log-content']()
    let runtimeJsonlContent = await window.electronAPI['get-runtime-jsonl-content']().catch(() => '')
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
    setLatestError([...runtimeEventList].reverse().find((item) => item.level === 'error' || item.status === 'failure'))
    let containerEle = document.querySelector('.rc-virtual-list-holder')
    if (containerEle?.scrollTop !== undefined) {
      containerEle.scrollTop = containerEle.scrollHeight ?? 1000000000
    }
  }
  const asyncClearLogList = async () => {
    await window.electronAPI['clear-log-content']()
    await window.electronAPI['clear-runtime-jsonl-content']?.()
    await asyncFetchLogList()
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
        {latestError && (
          <Alert
            className="latest-error"
            type="error"
            showIcon
            message="最近错误"
            description={latestError.error?.message ?? latestError.message}
          />
        )}
      </Card>
      <Card title="原始日志">
        <List>
          <VirtualList data={logList} height={ContainerHeight} itemHeight={20} itemKey="lineNo">
            {(item: Type_Log_Item) => (
              <List.Item key={item.lineNo}>
                <pre>{item.content}</pre>
              </List.Item>
            )}
          </VirtualList>
        </List>
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
            <Divider type="vertical"></Divider>
            <Button
              type="primary"
              htmlType="button"
              onClick={async () => {
                await window.electronAPI['open-output-dir']()
              }}
            >
              打开电子书输出目录
            </Button>
            <Divider type="vertical"></Divider>
            <Button danger onClick={asyncClearLogList}>
              清空日志
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  )
}
