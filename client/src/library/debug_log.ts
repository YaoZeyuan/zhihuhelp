export type Type_Debug_Log_Level = 'info' | 'success' | 'warn' | 'error'

export type Type_Debug_Log_Item = {
  id: string
  triggerAt: string
  level: Type_Debug_Log_Level
  channel: string
  message: string
  durationMs?: number
  request?: unknown
  response?: unknown
  error?: unknown
}

type Type_Append_Debug_Log_Param = Omit<Type_Debug_Log_Item, 'id' | 'triggerAt'>

const Const_Storage_Key = 'zhihuhelp.frontend.debugLog'
const Const_Change_Event_Name = 'zhihuhelp-frontend-debug-log-change'
const Const_Max_Log_Count = 200
const Const_Passive_Channel_Set = new Set(['get-log-content', 'get-runtime-jsonl-content'])

function createLogId() {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toJsonSafeValue(value: unknown) {
  if (value === undefined) {
    return undefined
  }
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return toJsonSafeValue(error)
}

export default class DebugLog {
  static readonly changeEventName = Const_Change_Event_Name
  private static rawElectronApiMap: Record<string, (...args: unknown[]) => Promise<unknown>> = {}
  private static isRecorderInstalled = false
  private static disableRecorderCounter = 0

  static readList(): Type_Debug_Log_Item[] {
    try {
      const rawContent = localStorage.getItem(Const_Storage_Key)
      if (!rawContent) {
        return []
      }
      const record = JSON.parse(rawContent)
      if (Array.isArray(record)) {
        return record
      }
      return []
    } catch {
      return []
    }
  }

  static append(param: Type_Append_Debug_Log_Param) {
    const logItem: Type_Debug_Log_Item = {
      id: createLogId(),
      triggerAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      ...param,
      request: toJsonSafeValue(param.request),
      response: toJsonSafeValue(param.response),
      error: normalizeError(param.error),
    }
    const logList = [...DebugLog.readList(), logItem].slice(-Const_Max_Log_Count)
    localStorage.setItem(Const_Storage_Key, JSON.stringify(logList))
    window.dispatchEvent(new CustomEvent(Const_Change_Event_Name))
  }

  static clear() {
    localStorage.removeItem(Const_Storage_Key)
    window.dispatchEvent(new CustomEvent(Const_Change_Event_Name))
  }

  static subscribe(listener: () => void) {
    window.addEventListener(Const_Change_Event_Name, listener)
    return () => {
      window.removeEventListener(Const_Change_Event_Name, listener)
    }
  }

  static installElectronApiRecorder() {
    if (DebugLog.isRecorderInstalled) {
      return
    }
    const api = window.electronAPI as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>
    if (!api || typeof api !== 'object') {
      return
    }
    for (const channel of Object.keys(api)) {
      const rawMethod = api[channel]
      if (typeof rawMethod !== 'function') {
        continue
      }
      DebugLog.rawElectronApiMap[channel] = rawMethod.bind(api)
      try {
        api[channel] = async (...args: unknown[]) => {
          if (DebugLog.disableRecorderCounter > 0 || Const_Passive_Channel_Set.has(channel)) {
            return DebugLog.rawElectronApiMap[channel](...args)
          }
          return DebugLog.callElectronApiWithLog(channel, DebugLog.rawElectronApiMap[channel], args, {
            message: `前端调用 IPC：${channel}`,
          })
        }
      } catch (error) {
        DebugLog.append({
          level: 'warn',
          channel,
          message: `IPC 自动记录器安装失败：${channel}`,
          error,
        })
      }
    }
    DebugLog.isRecorderInstalled = true
  }

  static async invokeSilentElectronApi<T = unknown>(
    channel: keyof Window['electronAPI'],
    args: unknown[] = [],
  ): Promise<T> {
    const rawMethod = DebugLog.getRawElectronApiMethod<T>(String(channel))
    DebugLog.disableRecorderCounter++
    try {
      return await rawMethod(...args)
    } finally {
      DebugLog.disableRecorderCounter--
    }
  }

  static async invokeElectronApi<T = unknown>(
    channel: keyof Window['electronAPI'],
    args: unknown[] = [],
    option: {
      message?: string
    } = {},
  ): Promise<T> {
    const channelName = String(channel)
    const rawMethod = DebugLog.getRawElectronApiMethod<T>(channelName)
    return DebugLog.callElectronApiWithLog(channelName, rawMethod, args, option)
  }

  private static getRawElectronApiMethod<T>(channel: string) {
    const api = window.electronAPI as unknown as Record<string, (...args: unknown[]) => Promise<T>>
    const rawMethod = (DebugLog.rawElectronApiMap[channel] as (...args: unknown[]) => Promise<T>) ?? api[channel]
    if (typeof rawMethod !== 'function') {
      throw new Error(`未找到 IPC 方法：${channel}`)
    }
    return rawMethod
  }

  private static async callElectronApiWithLog<T>(
    channel: string,
    method: (...args: unknown[]) => Promise<T>,
    args: unknown[] = [],
    option: {
      message?: string
    } = {},
  ): Promise<T> {
    const startAt = Date.now()
    const requestPayload = args.length === 1 ? args[0] : args
    DebugLog.append({
      level: 'info',
      channel,
      message: option.message ?? `开始调用 IPC：${channel}`,
      request: requestPayload,
    })
    try {
      const response = await method(...args)
      DebugLog.append({
        level: 'success',
        channel,
        message: `IPC 调用成功：${channel}`,
        durationMs: Date.now() - startAt,
        request: requestPayload,
        response,
      })
      return response
    } catch (error) {
      DebugLog.append({
        level: 'error',
        channel,
        message: `IPC 调用失败：${channel}`,
        durationMs: Date.now() - startAt,
        request: requestPayload,
        error,
      })
      throw error
    }
  }
}
