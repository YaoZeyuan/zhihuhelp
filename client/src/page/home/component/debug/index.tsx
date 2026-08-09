import { Button, Checkbox, Divider, Input, List, Radio, Select, Space, Tag, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import VirtualList from 'rc-virtual-list'
import * as Ahooks from 'ahooks'
import DebugLog, { Type_Debug_Log_Item, Type_Debug_Log_Level } from '~/src/library/debug_log'

import './index.less'

type Type_Log_Line_Item = {
  lineNo: number
  content: string
}

type Type_Log_Source = 'frontend' | 'runtime' | 'jsonl'

type Type_Debug_Channel = Exclude<keyof Window['electronAPI'], 'loadPreferences' | 'append-frontend-log-batch'>

const Const_Container_Height = 460

const Const_Check_Login_Request = {
  url: 'https://www.zhihu.com/api/v4/members/s.invalid/answers',
  params: {
    include:
      'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,attachment,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp,is_recognized;data[*].vessay_info;data[*].author.badge[?(type=best_answerer)].topics;data[*].author.vip_info;data[*].question.has_publishing_draft,relationship',
    offset: 0,
    limit: 20,
    sort_by: 'created',
    random: 0,
  },
}

const Const_Channel_Option_List: Array<{ label: string; value: Type_Debug_Channel }> = [
  { label: '查看主进程 IPC 能力 get-debug-ipc-channel-list', value: 'get-debug-ipc-channel-list' },
  { label: '检查登录 zhihu-http-get', value: 'zhihu-http-get' },
  { label: '读取任务配置 get-common-config', value: 'get-common-config' },
  { label: '启动任务 start-customer-task', value: 'start-customer-task' },
  { label: '获取默认标题 get-task-default-title', value: 'get-task-default-title' },
  { label: '读取数据库摘要 get-db-summary-info', value: 'get-db-summary-info' },
  { label: '读取数据库列表 get-db-record-list', value: 'get-db-record-list' },
  { label: '读取输出历史 get-output-history', value: 'get-output-history' },
  { label: '导出诊断信息 export-diagnostic-info', value: 'export-diagnostic-info' },
  { label: '打开本地路径 open-local-path', value: 'open-local-path' },
  { label: '读取运行日志 get-log-content', value: 'get-log-content' },
  { label: '读取结构化日志 get-runtime-jsonl-content', value: 'get-runtime-jsonl-content' },
  { label: '清空运行日志 clear-log-content', value: 'clear-log-content' },
  { label: '清空结构化日志 clear-runtime-jsonl-content', value: 'clear-runtime-jsonl-content' },
  { label: '打开输出目录 open-output-dir', value: 'open-output-dir' },
  { label: '打开主窗口 DevTools', value: 'open-devtools' },
  { label: '打开 JS-RPC DevTools', value: 'open-js-rpc-window-devtools' },
  { label: '清空登录缓存 clear-all-session-storage', value: 'clear-all-session-storage' },
]

const Const_Default_Custom_Arg_Map: Record<Type_Debug_Channel, unknown[]> = {
  'get-debug-ipc-channel-list': [],
  'zhihu-http-get': [
    {
      ...Const_Check_Login_Request,
      params: {
        ...Const_Check_Login_Request.params,
        random: Math.floor(Math.random() * 100000),
      },
    },
  ],
  'get-common-config': [],
  'start-customer-task': [
    {
      config: {
        request: {
          ua: '',
          cookie: '',
        },
        tasks: [],
        generate: {
          title: '调试任务',
          mode: 'merge_by_task',
          imageQuality: 'low',
          maxItemsPerBook: 100,
          orderBy: [],
          outputFormats: ['html', 'markdown', 'epub'],
          comment: '',
        },
      },
    },
  ],
  'get-db-summary-info': [],
  'get-db-record-list': [
    {
      type: 'author-answer',
      pageNo: 0,
      pageSize: 5,
    },
  ],
  'export-db-record-json': [],
  'import-db-record-json': [],
  'get-output-history': [],
  'export-diagnostic-info': [],
  'open-local-path': [{ targetPath: '' }],
  'get-task-default-title': [{ taskType: 'answer', taskId: '' }],
  'get-log-content': [],
  'clear-log-content': [],
  'get-runtime-jsonl-content': [],
  'clear-runtime-jsonl-content': [],
  'open-output-dir': [],
  'clear-all-session-storage': [],
  'open-devtools': [],
  'open-js-rpc-window-devtools': [],
}

const Const_Risk_Channel_Message_Map: Partial<Record<Type_Debug_Channel, string>> = {
  'start-customer-task': '会真实启动任务流程，请确认参数里的 config 是你希望执行的配置。',
  'clear-all-session-storage': '会清空当前 Electron 会话缓存和登录态。',
  'clear-log-content': '会清空 runtime.log。',
  'clear-runtime-jsonl-content': '会清空 runtime.jsonl。',
  'export-diagnostic-info': '会在输出目录写入诊断 JSON 文件，内容包含配置摘要、日志片段和数据库摘要。',
}

function stringifyJson(value: unknown) {
  if (value === undefined) {
    return ''
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function buildLineList(content: unknown): Type_Log_Line_Item[] {
  const normalizedContent = typeof content === 'string' ? content : content == null ? '' : stringifyJson(content)
  return normalizedContent.split('\n').map((item, index) => ({
    lineNo: index + 1,
    content: item,
  }))
}

function getLevelColor(level: Type_Debug_Log_Level) {
  if (level === 'success') {
    return 'green'
  }
  if (level === 'warn') {
    return 'orange'
  }
  if (level === 'error') {
    return 'red'
  }
  return 'blue'
}

function getLoginCheckStatus(response: unknown) {
  if (response && typeof response === 'object' && 'data' in response) {
    return true
  }
  return false
}

function isNoHandlerError(error: unknown) {
  if (error instanceof Error) {
    return error.message.includes('No handler registered')
  }
  return String(error).includes('No handler registered')
}

export default () => {
  const [frontendLogList, setFrontendLogList] = useState<Type_Debug_Log_Item[]>(DebugLog.readList())
  const [runtimeLogContent, setRuntimeLogContent] = useState('')
  const [runtimeJsonlContent, setRuntimeJsonlContent] = useState('')
  const [activeLogSource, setActiveLogSource] = useState<Type_Log_Source>('frontend')
  const [isAutoRefreshBackendLog, setIsAutoRefreshBackendLog] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Type_Debug_Channel>('zhihu-http-get')
  const [customArgText, setCustomArgText] = useState(stringifyJson(Const_Default_Custom_Arg_Map['zhihu-http-get']))
  const runtimeJsonlApiAvailableRef = useRef(true)

  const runtimeLogList = useMemo(() => buildLineList(runtimeLogContent), [runtimeLogContent])
  const runtimeJsonlList = useMemo(() => buildLineList(runtimeJsonlContent), [runtimeJsonlContent])
  const riskMessage = Const_Risk_Channel_Message_Map[selectedChannel]

  const asyncRefreshBackendLog = async () => {
    const runtimeLog = await DebugLog.invokeSilentElectronApi<string>('get-log-content').catch((error) => {
      DebugLog.append({
        level: 'warn',
        channel: 'get-log-content',
        message: '读取 runtime.log 失败',
        error,
      })
      return ''
    })
    let runtimeJsonl = runtimeJsonlContent
    if (runtimeJsonlApiAvailableRef.current) {
      runtimeJsonl = await DebugLog.invokeSilentElectronApi<string>('get-runtime-jsonl-content').catch((error) => {
        if (isNoHandlerError(error)) {
          runtimeJsonlApiAvailableRef.current = false
          const tip =
            '当前 Electron 主进程未注册 get-runtime-jsonl-content。请完全退出 Electron 后重新执行 pnpm build、pnpm buildgui、pnpm start。'
          DebugLog.append({
            level: 'warn',
            channel: 'get-runtime-jsonl-content',
            message: tip,
            error,
          })
          return tip
        }
        DebugLog.append({
          level: 'warn',
          channel: 'get-runtime-jsonl-content',
          message: '读取 runtime.jsonl 失败',
          error,
        })
        return ''
      })
    }
    setRuntimeLogContent(typeof runtimeLog === 'string' ? runtimeLog : '')
    setRuntimeJsonlContent(typeof runtimeJsonl === 'string' ? runtimeJsonl : '')
  }

  const asyncRunDebugCall = async (channel: Type_Debug_Channel, args: unknown[], tip: string) => {
    setIsCalling(true)
    try {
      const response = await DebugLog.invokeElectronApi(channel, args, {
        message: tip,
      })
      if (channel === 'zhihu-http-get') {
        if (getLoginCheckStatus(response)) {
          message.success('登录检查完成：响应包含 data 字段')
        } else {
          message.warning('登录检查完成：响应未包含 data 字段，请查看前端记录和后端日志')
        }
      } else {
        message.success('IPC 调用完成')
      }
      await asyncRefreshBackendLog()
    } catch {
      message.error('IPC 调用失败，请查看前端记录和后端日志')
      await asyncRefreshBackendLog()
    } finally {
      setIsCalling(false)
    }
  }

  const asyncRunCustomCall = async () => {
    let args: unknown[] = []
    try {
      const parsedArgList = JSON.parse(customArgText || '[]')
      if (!Array.isArray(parsedArgList)) {
        message.warning('参数必须是 JSON 数组，例如 [] 或 [{ "url": "..." }]')
        return
      }
      args = parsedArgList
    } catch {
      message.error('参数 JSON 解析失败')
      return
    }
    await asyncRunDebugCall(selectedChannel, args, `手动调用 IPC：${selectedChannel}`)
  }

  const asyncClearAllLog = async () => {
    DebugLog.clear()
    await DebugLog.invokeSilentElectronApi('clear-log-content').catch((error) => {
      DebugLog.append({
        level: 'warn',
        channel: 'clear-log-content',
        message: '清空 runtime.log 失败',
        error,
      })
    })
    if (runtimeJsonlApiAvailableRef.current) {
      await DebugLog.invokeSilentElectronApi('clear-runtime-jsonl-content').catch((error) => {
        if (isNoHandlerError(error)) {
          runtimeJsonlApiAvailableRef.current = false
          return
        }
        DebugLog.append({
          level: 'warn',
          channel: 'clear-runtime-jsonl-content',
          message: '清空 runtime.jsonl 失败',
          error,
        })
      })
    }
    setFrontendLogList([])
    await asyncRefreshBackendLog()
    message.success('调试记录和后端日志已清空')
  }

  useEffect(() => {
    return DebugLog.subscribe(() => {
      setFrontendLogList(DebugLog.readList())
    })
  }, [])

  Ahooks.useAsyncEffect(async () => {
    await asyncRefreshBackendLog()
  }, [])

  Ahooks.useInterval(async () => {
    if (isAutoRefreshBackendLog) {
      await asyncRefreshBackendLog()
    }
  }, 2 * 1000)

  const renderFrontendLogList = () => {
    const reversedLogList = [...frontendLogList].reverse()
    return (
      <List>
        <VirtualList data={reversedLogList} height={Const_Container_Height} itemHeight={88} itemKey="id">
          {(item: Type_Debug_Log_Item) => (
            <List.Item key={item.id}>
              <div className="debug-log-item">
                <div className="debug-log-title">
                  <Tag color={getLevelColor(item.level)}>{item.level}</Tag>
                  <strong>{item.channel}</strong>
                  <span>{item.triggerAt}</span>
                  {item.durationMs !== undefined && <span>{item.durationMs}ms</span>}
                </div>
                <div className="debug-log-message">{item.message}</div>
                <div className="debug-log-detail">
                  {item.request !== undefined && (
                    <details>
                      <summary>请求参数</summary>
                      <pre>{stringifyJson(item.request)}</pre>
                    </details>
                  )}
                  {item.response !== undefined && (
                    <details>
                      <summary>返回结果</summary>
                      <pre>{stringifyJson(item.response)}</pre>
                    </details>
                  )}
                  {item.error !== undefined && (
                    <details open>
                      <summary>异常信息</summary>
                      <pre>{stringifyJson(item.error)}</pre>
                    </details>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        </VirtualList>
      </List>
    )
  }

  const renderTextLogList = (logList: Type_Log_Line_Item[]) => {
    return (
      <List>
        <VirtualList data={logList} height={Const_Container_Height} itemHeight={22} itemKey="lineNo">
          {(item: Type_Log_Line_Item) => (
            <List.Item key={item.lineNo}>
              <pre className="debug-backend-log-line">
                <span>{item.lineNo}</span>
                {item.content}
              </pre>
            </List.Item>
          )}
        </VirtualList>
      </List>
    )
  }

  return (
    <div className="debug-panel-6fce4b2">
      <section className="debug-section">
        <div className="debug-section-title">IPC 调用</div>
        <Space wrap>
          <Button
            type="primary"
            loading={isCalling}
            onClick={async () => {
              await asyncRunDebugCall(
                'zhihu-http-get',
                [
                  {
                    ...Const_Check_Login_Request,
                    params: {
                      ...Const_Check_Login_Request.params,
                      random: Math.floor(Math.random() * 100000),
                    },
                  },
                ],
                '手动检查知乎登录态',
              )
            }}
          >
            检查登录
          </Button>
          <Button
            loading={isCalling}
            onClick={async () => {
              await asyncRunDebugCall('get-common-config', [], '读取任务配置')
            }}
          >
            读取配置
          </Button>
          <Button
            loading={isCalling}
            onClick={async () => {
              await asyncRunDebugCall('get-db-summary-info', [], '读取数据库摘要')
            }}
          >
            数据库摘要
          </Button>
          <Button
            loading={isCalling}
            onClick={async () => {
              await asyncRunDebugCall('open-devtools', [], '打开主窗口 DevTools')
            }}
          >
            主窗口 DevTools
          </Button>
          <Button
            loading={isCalling}
            onClick={async () => {
              await asyncRunDebugCall('open-js-rpc-window-devtools', [], '打开 JS-RPC DevTools')
            }}
          >
            JS-RPC DevTools
          </Button>
          <Button
            loading={isCalling}
            onClick={async () => {
              await asyncRunDebugCall('clear-all-session-storage', [], '清空登录缓存')
            }}
          >
            清空登录缓存
          </Button>
        </Space>
        <Divider />
        <div className="debug-custom-call">
          <Select
            value={selectedChannel}
            options={Const_Channel_Option_List}
            onChange={(channel: Type_Debug_Channel) => {
              setSelectedChannel(channel)
              setCustomArgText(stringifyJson(Const_Default_Custom_Arg_Map[channel]))
            }}
          />
          <Input.TextArea
            {...({
              autoSize: { minRows: 4, maxRows: 8 },
              allowClear: true,
            } as any)}
            value={customArgText}
            onChange={(event) => {
              setCustomArgText(event.target.value)
            }}
          />
          <Button type="primary" loading={isCalling} onClick={asyncRunCustomCall}>
            调用
          </Button>
        </div>
        {riskMessage && <div className="debug-risk-tip">{riskMessage}</div>}
      </section>

      <section className="debug-section">
        <div className="debug-section-header">
          <div className="debug-section-title">调试日志</div>
          <Space wrap>
            <Radio.Group
              value={activeLogSource}
              onChange={(event) => {
                setActiveLogSource(event.target.value)
              }}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: `前端 IPC 记录(${frontendLogList.length})`, value: 'frontend' },
                { label: `runtime.log(${runtimeLogList.length})`, value: 'runtime' },
                { label: `runtime.jsonl(${runtimeJsonlList.length})`, value: 'jsonl' },
              ]}
            />
            <Checkbox
              checked={isAutoRefreshBackendLog}
              onChange={(event) => {
                setIsAutoRefreshBackendLog(event.target.checked)
              }}
            >
              自动刷新后端日志
            </Checkbox>
            <Button onClick={asyncRefreshBackendLog}>刷新后端日志</Button>
            <Button danger onClick={asyncClearAllLog}>
              清空调试记录
            </Button>
          </Space>
        </div>
        <div className="debug-log-panel">
          {activeLogSource === 'frontend' && renderFrontendLogList()}
          {activeLogSource === 'runtime' && renderTextLogList(runtimeLogList)}
          {activeLogSource === 'jsonl' && renderTextLogList(runtimeJsonlList)}
        </div>
      </section>
    </div>
  )
}
