'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow, ipcMain } = require('electron')
const {
  TestResultStatus,
  appendTestLog,
  isOptionalSource,
  readRootCookie,
  safeErrorMessage,
  sanitize,
  selectSourcesForMode,
  summarizePageItem,
  validateEntitySourceResult,
  validatePaginatedSourceResult,
  writeFixture,
} = require('./runtime.cjs')

const rootPath = path.resolve(__dirname, '../..')
let LogEventCode
let LogLevel
let LogStage
let LogStatus
let TestLogStageByEventCode
const mode = process.argv.find((argument) => argument.startsWith('--mode='))?.slice('--mode='.length)
const artifactPath = process.argv.find((argument) => argument.startsWith('--artifacts='))?.slice('--artifacts='.length)
const fixtureRoot = path.join(rootPath, 'fixtures', 'zhihu')
const fixtureStagingRoot = artifactPath ? path.join(artifactPath, 'fixture-staging') : ''

let signerWindow
let taskCounter = 0
let runSettled = false
let forcedFailure = false
const pendingTaskMap = new Map()

function importDistModule(...relativePathSegments) {
  const moduleUrl = pathToFileURL(path.join(rootPath, 'dist', ...relativePathSegments)).href
  return import(moduleUrl)
}

async function initializeRuntimeContract() {
  const contractModule = await importDistModule('shared', 'logging', 'log_contract.js')
  LogEventCode = contractModule.LogEventCode
  LogLevel = contractModule.LogLevel
  LogStage = contractModule.LogStage
  LogStatus = contractModule.LogStatus
  TestLogStageByEventCode = Object.freeze({
    [LogEventCode.WORKFLOW_START]: LogStage.APP,
    [LogEventCode.RPC_SIGN_SUCCESS]: LogStage.RPC,
    [LogEventCode.INIT_SUCCESS]: LogStage.INIT,
    [LogEventCode.FETCH_SUCCESS]: LogStage.FETCH,
    [LogEventCode.PERSIST_SUCCESS]: LogStage.PERSIST,
    [LogEventCode.WORKFLOW_SUCCESS]: LogStage.APP,
    [LogEventCode.WORKFLOW_FAILURE]: LogStage.APP,
  })
}

function log(eventCode, status, message, details) {
  if (!artifactPath) {
    return
  }
  appendTestLog(artifactPath, {
    eventCode,
    stage: TestLogStageByEventCode[eventCode] ?? LogStage.APP,
    status,
    level: status === LogStatus.FAILURE ? LogLevel.ERROR : LogLevel.INFO,
    message,
    details,
  })
}

function failForPrematureWindowClose(message) {
  if (runSettled || forcedFailure) {
    return
  }
  forcedFailure = true
  log(LogEventCode.WORKFLOW_FAILURE, LogStatus.FAILURE, `${mode || 'online'} failed`, { error: message })
  console.error(`[${mode || 'online'}] ${message}`)
  app.exit(1)
}

function createBridge() {
  return ({ method, paramList }) => {
    taskCounter += 1
    const id = `online-${taskCounter}`
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingTaskMap.delete(id)
        reject(new Error('Electron 签名请求超时'))
      }, 30000)
      pendingTaskMap.set(id, {
        resolve: (value) => {
          clearTimeout(timeout)
          resolve(value)
        },
      })
      signerWindow.webContents.send(method, paramList, id)
    })
  }
}

async function waitForSignerReady() {
  const deadline = Date.now() + 45000
  while (Date.now() < deadline) {
    try {
      const ready = await signerWindow.webContents.executeJavaScript(`
        (async () => {
          const webview = document.querySelector('webview#zhihuhelp-rpc')
          if (!webview) return false
          try {
            return await webview.executeJavaScript("typeof zhihuEncryptFunc_4c9c58 === 'function'")
          } catch (_) {
            return false
          }
        })()
      `)
      if (ready === true) {
        return
      }
    } catch {
      // The renderer or webview is still loading.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Electron 签名运行时初始化超时')
}

async function loadApi(sourceType) {
  const apiMap = {
    author: ['author', 'asyncGetAutherInfo'],
    question: ['question', 'asyncGetQuestionInfo'],
    answer: ['answer', 'asyncGetAnswer'],
    article: ['article', 'asyncGetArticle'],
    pin: ['pin', 'asyncGet'],
    topic: ['topic', 'asyncGetTopicInfo'],
    collection: ['collection', 'asyncGetCollectionInfo'],
    column: ['column', 'asyncGetColumnInfo'],
  }
  const definition = apiMap[sourceType]
  if (!definition) {
    throw new Error(`不支持的在线样本类型：${sourceType}`)
  }
  const apiModule = (await importDistModule('api', 'single', `${definition[0]}.js`)).default
  return (id) => apiModule[definition[1]](id)
}

async function loadPageApi(sourceType) {
  const apiMap = {
    author: ['author', 'asyncGetAutherAnswerList'],
    question: ['question', 'asyncGetAnswerList'],
    topic: ['topic', 'asyncGetAnswerList'],
    collection: ['collection', 'asyncGetItemList'],
    column: ['column', 'asyncGetArticleExcerptList'],
  }
  const definition = apiMap[sourceType]
  if (!definition) {
    return undefined
  }
  const apiModule = (await importDistModule('api', 'single', `${definition[0]}.js`)).default
  return (id, offset, limit) => apiModule[definition[1]](id, offset, limit)
}

function pickStableData(sourceType, record) {
  if (!record || typeof record !== 'object') {
    throw new Error(`${sourceType} 响应不是对象`)
  }
  const stableKeyMap = {
    author: ['id', 'url_token', 'name', 'type', 'is_org'],
    question: ['id', 'title', 'type', 'answer_count'],
    answer: ['id', 'type', 'created_time', 'updated_time'],
    article: ['id', 'title', 'type', 'created', 'updated'],
    pin: ['id', 'type', 'created', 'updated'],
    topic: ['id', 'name', 'type'],
    collection: ['id', 'title', 'type', 'item_count'],
    column: ['id', 'title', 'type'],
  }
  const output = {}
  for (const key of stableKeyMap[sourceType] || ['id', 'type']) {
    if (record[key] !== undefined) {
      output[key] = record[key]
    }
  }
  if (record.author && typeof record.author === 'object') {
    output.author = {
      id: record.author.id,
      url_token: record.author.url_token,
      name: record.author.name,
    }
  }
  if (record.question && typeof record.question === 'object') {
    output.question = {
      id: record.question.id,
      title: record.question.title,
    }
  }
  if (output.id === undefined && output.url_token === undefined) {
    throw new Error(`${sourceType} 响应缺少稳定标识，Cookie 可能失效或接口异常`)
  }
  return sanitize(output)
}

async function fetchMinimalPages(source) {
  const pageApi = await loadPageApi(source.sourceType)
  if (!pageApi || !Array.isArray(source.pageOffsets)) {
    return undefined
  }
  const pageList = []
  for (const offset of source.pageOffsets) {
    const recordList = await pageApi(source.id, offset, 1)
    if (!Array.isArray(recordList)) {
      throw new Error(`${source.name} pagination response is not an array`)
    }
    pageList.push({
      sourceName: source.name,
      sourceType: source.sourceType,
      sourceId: String(source.id),
      offset,
      limit: 1,
      itemCount: recordList.length,
      items: recordList.map(summarizePageItem),
    })
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
  validatePaginatedSourceResult(source, pageList)
  return pageList
}

async function checkAuthenticatedSession(httpClient) {
  const profile = await httpClient.get('https://www.zhihu.com/api/v4/me')
  if (!profile || typeof profile !== 'object' || (!profile.id && !profile.url_token)) {
    throw new Error('Cookie 无效或已过期：登录检查未返回用户稳定标识')
  }
}

async function createTemporaryPersistence() {
  const CommonConfig = (await importDistModule('config', 'common.js')).default
  const Knex = (await importDistModule('library', 'knex.js')).default
  const AnswerModel = (await importDistModule('model', 'answer.js')).default
  const databasePath = path.join(artifactPath, 'online.sqlite')
  CommonConfig.setDatabaseUri(databasePath)
  const schemaContent = fs.readFileSync(
    path.join(rootPath, 'src', 'infrastructure', 'sqlite', 'schema', 'init.sql'),
    'utf8',
  )
  for (const sql of schemaContent
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)) {
    await Knex.raw(sql, [])
  }
  return {
    Knex,
    async verifyAnswer(record) {
      await AnswerModel.asyncReplaceAnswer(record)
      const persisted = await AnswerModel.asyncGetAnswer(String(record.id))
      const count = await AnswerModel.asyncGetAnswerCount()
      if (String(persisted.id ?? '') !== String(record.id) || Number(count) < 1) {
        throw new Error('online answer was not persisted to the isolated SQLite database')
      }
      return Number(count)
    },
  }
}

async function execute() {
  if ((mode !== 'online' && mode !== 'fixtures') || !artifactPath) {
    throw new Error('Electron 在线测试参数不完整')
  }
  const cookie = readRootCookie(rootPath)
  log(LogEventCode.WORKFLOW_START, LogStatus.START, `${mode} 开始`, { mode })

  ipcMain.handle('js-rpc-response', async (_event, { id, value }) => {
    const pendingTask = pendingTaskMap.get(id)
    if (pendingTask) {
      pendingTask.resolve(value)
      pendingTaskMap.delete(id)
    }
    return true
  })

  signerWindow = new BrowserWindow({
    width: 760,
    height: 500,
    show: true,
    title: mode === 'online' ? 'ZhihuHelp 在线测试签名运行时' : 'ZhihuHelp Fixture 签名运行时',
    webPreferences: {
      devTools: true,
      webSecurity: false,
      webviewTag: true,
      preload: path.join(rootPath, 'src', 'public', 'js-rpc', 'preload.cjs'),
    },
  })
  signerWindow.once('closed', () => {
    failForPrematureWindowClose('签名窗口在测试完成前被关闭')
  })
  signerWindow.webContents.once('render-process-gone', (_event, details) => {
    failForPrematureWindowClose(`签名窗口渲染进程提前退出：${details.reason}`)
  })
  await signerWindow.loadFile(path.join(rootPath, 'src', 'public', 'js-rpc', 'index.html'))
  await waitForSignerReady()
  log(LogEventCode.RPC_SIGN_SUCCESS, LogStatus.SUCCESS, 'Electron 签名运行时就绪')

  const encryptModule = await importDistModule('library', 'zhihu_encrypt', 'index.js')
  encryptModule.setBridgeFunc(createBridge())
  const RuntimePathConfig = (await importDistModule('config', 'path.js')).default
  RuntimePathConfig.setLogPath(path.join(artifactPath, 'log'))
  RuntimePathConfig.setCachePath(path.join(artifactPath, 'cache'))
  RuntimePathConfig.setOutputPath(path.join(artifactPath, 'output'))
  const RequestConfig = (await importDistModule('config', 'request.js')).default
  RequestConfig.setRequestConfig({ ua: RequestConfig.ua, cookie })
  const httpClient = (await importDistModule('library', 'http', 'index.js')).default
  await checkAuthenticatedSession(httpClient)
  const persistence = await createTemporaryPersistence()
  log(LogEventCode.INIT_SUCCESS, LogStatus.SUCCESS, 'Cookie 登录检查通过')

  const manifest = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'sources.json'), 'utf8'))
  const selectedSourceList = selectSourcesForMode(manifest, mode)

  const summary = []
  for (const source of selectedSourceList) {
    const startedAt = Date.now()
    try {
      const api = await loadApi(source.sourceType)
      const record = await api(source.id)
      validateEntitySourceResult(source, record)
      const entity = pickStableData(source.sourceType, record)
      if (source.sourceType === 'answer') {
        const persistedCount = await persistence.verifyAnswer(record)
        log(
          LogEventCode.PERSIST_SUCCESS,
          LogStatus.SUCCESS,
          'online answer persisted and read back from isolated SQLite',
          {
            entityType: 'answer',
            entityId: String(record.id),
            persistedCount,
          },
        )
      }
      const pageList = await fetchMinimalPages(source)
      const data = pageList === undefined ? entity : { entity, pages: pageList }
      if (mode === 'fixtures') {
        writeFixture(path.join(fixtureStagingRoot, `${source.name}.json`), source, data)
      }
      summary.push({ name: source.name, status: TestResultStatus.SUCCESS, durationMs: Date.now() - startedAt })
      log(LogEventCode.FETCH_SUCCESS, LogStatus.SUCCESS, '在线实体检查通过', {
        sourceType: source.sourceType,
        sourceName: source.name,
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      const allowsExpectedFailure =
        isOptionalSource(source) || (mode === 'fixtures' && source.name.includes('abnormal'))
      if (allowsExpectedFailure) {
        const data = {
          kind: 'abnormal_or_deleted',
          entityType: source.sourceType,
          message: safeErrorMessage(error),
        }
        if (mode === 'fixtures') {
          writeFixture(path.join(fixtureStagingRoot, `${source.name}.json`), source, data)
        }
        summary.push({
          name: source.name,
          status: TestResultStatus.EXPECTED_FAILURE,
          durationMs: Date.now() - startedAt,
        })
      } else {
        throw error
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 350))
  }

  if (mode === 'fixtures') {
    const fixtureOutputRoot = path.join(fixtureRoot, 'online')
    fs.mkdirSync(fixtureOutputRoot, { recursive: true })
    const expectedFileNameList = selectedSourceList.map((source) => `${source.name}.json`).sort()
    const stagedFileNameList = fs
      .readdirSync(fixtureStagingRoot)
      .filter((item) => item.endsWith('.json'))
      .sort()
    if (JSON.stringify(stagedFileNameList) !== JSON.stringify(expectedFileNameList)) {
      throw new Error(
        `fixture staging source mismatch: expected ${expectedFileNameList.join(', ')}, received ${stagedFileNameList.join(', ')}`,
      )
    }
    const expectedFileNameSet = new Set(expectedFileNameList)
    for (const fileName of fs.readdirSync(fixtureOutputRoot).filter((item) => item.endsWith('.json'))) {
      if (!expectedFileNameSet.has(fileName)) {
        fs.unlinkSync(path.join(fixtureOutputRoot, fileName))
      }
    }
    for (const fileName of expectedFileNameList) {
      fs.copyFileSync(path.join(fixtureStagingRoot, fileName), path.join(fixtureOutputRoot, fileName))
    }
  }
  fs.writeFileSync(path.join(artifactPath, 'summary.json'), `${JSON.stringify(sanitize(summary), null, 2)}\n`, 'utf8')
  await persistence.Knex.destroy()
  log(LogEventCode.WORKFLOW_SUCCESS, LogStatus.SUCCESS, `${mode} 完成`, { count: summary.length })
  console.info(`${mode === 'online' ? '在线冒烟' : 'fixture 更新'}完成，共检查 ${summary.length} 个公开样本。`)
}

app.whenReady().then(async () => {
  try {
    await initializeRuntimeContract()
    await execute()
    if (forcedFailure) {
      return
    }
    runSettled = true
    app.exit(0)
  } catch (error) {
    if (forcedFailure) {
      return
    }
    runSettled = true
    if (LogEventCode && LogStatus) {
      log(LogEventCode.WORKFLOW_FAILURE, LogStatus.FAILURE, `${mode || 'online'} 失败`, {
        error: safeErrorMessage(error),
      })
    }
    console.error(`[${mode || 'online'}] ${safeErrorMessage(error)}`)
    app.exit(1)
  }
})

app.on('window-all-closed', () => {
  failForPrematureWindowClose('签名窗口在测试完成前全部关闭')
})
