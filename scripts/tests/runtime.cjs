'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const JSON5 = require('json5')

const SENSITIVE_KEY = /cookie|authorization|token|password|secret|headers|d_c0|x-zse/i
const CONTENT_KEY = /^(content|body|response|raw_json|html|text)$/i
const TestLogSource = Object.freeze({ BACKEND: 'backend' })
const TestResultStatus = Object.freeze({
  SUCCESS: 'success',
  EXPECTED_FAILURE: 'expected_failure',
})

function readRootCookie(rootPath) {
  const configPath = path.join(rootPath, 'config.json')
  if (!fs.existsSync(configPath)) {
    throw new Error('config.json 不存在；在线测试只读取根目录 config.json.request.cookie')
  }
  let config
  try {
    config = JSON5.parse(fs.readFileSync(configPath, 'utf8'))
  } catch {
    throw new Error('config.json 格式错误，无法读取 request.cookie')
  }
  const cookie = config && config.request && config.request.cookie
  if (typeof cookie !== 'string' || cookie.trim() === '') {
    throw new Error('config.json.request.cookie 不存在或为空')
  }
  if (!/(?:^|;\s*)d_c0=/.test(cookie)) {
    throw new Error('config.json.request.cookie 格式错误：缺少 d_c0 字段')
  }
  return cookie
}

function sanitize(value, key, depth = 0, seen = new WeakSet()) {
  if (key && (SENSITIVE_KEY.test(key) || CONTENT_KEY.test(key))) {
    return '[REDACTED]'
  }
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    let result = value.replace(/d_c0=[^;\s]+/gi, 'd_c0=[REDACTED]').replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    if (/^https?:\/\//i.test(result)) {
      try {
        const url = new URL(result)
        result = `${url.origin}${url.pathname}${url.search ? '?[REDACTED]' : ''}`
      } catch {
        // Keep malformed URLs on the truncation path.
      }
    }
    return result.length > 512 ? `${result.slice(0, 512)}...[truncated:${result.length}]` : result
  }
  if (typeof value !== 'object') {
    return `[${typeof value}]`
  }
  if (depth >= 8) {
    return '[MaxDepth]'
  }
  if (seen.has(value)) {
    return '[Circular]'
  }
  seen.add(value)
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitize(item, undefined, depth + 1, seen))
  }
  const output = {}
  for (const currentKey of Object.keys(value).slice(0, 80)) {
    output[currentKey] = sanitize(value[currentKey], currentKey, depth + 1, seen)
  }
  return output
}

function createArtifacts(mode) {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), `zhihuhelp-${mode}-`))
  fs.mkdirSync(path.join(rootPath, 'log'), { recursive: true })
  return rootPath
}

function localDate() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function appendTestLog(artifactPath, entry) {
  const record = sanitize({
    schemaVersion: 1,
    triggerAt: new Date().toISOString(),
    source: TestLogSource.BACKEND,
    ...entry,
  })
  const logPath = path.join(artifactPath, 'log', `runtime.${localDate()}.jsonl`)
  fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, 'utf8')
}

function checksum(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}

function writeFixture(filePath, source, data) {
  const safeData = sanitize(data)
  const envelope = {
    schemaVersion: 1,
    sourceType: source.sourceType,
    sourceUrl: source.url,
    capturedAt: new Date().toISOString(),
    checksum: checksum(safeData),
    data: safeData,
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8')
  return envelope
}

function validateFixture(value, source) {
  try {
    if (
      !isRecord(value) ||
      value.schemaVersion !== 1 ||
      typeof value.sourceType !== 'string' ||
      typeof value.capturedAt !== 'string' ||
      Number.isNaN(Date.parse(value.capturedAt)) ||
      value.checksum !== checksum(value.data)
    ) {
      return false
    }
    if (source === undefined) {
      return true
    }
    if (
      !isRecord(source) ||
      value.sourceType !== source.sourceType ||
      typeof source.url !== 'string' ||
      value.sourceUrl !== source.url
    ) {
      return false
    }

    const isExpectedFailureData =
      isRecord(value.data) && value.data.kind === 'abnormal_or_deleted' && value.data.entityType === source.sourceType
    if (isExpectedFailureData) {
      return isOptionalSource(source) || (typeof source.name === 'string' && source.name.includes('abnormal'))
    }
    if (!isRecord(value.data)) {
      return false
    }

    const entity = Array.isArray(source.pageOffsets)
      ? value.data.entity
      : isRecord(value.data.entity)
        ? value.data.entity
        : value.data
    if (!isRecord(entity)) {
      return false
    }
    validateEntitySourceResult(source, entity, { allowRedactedAuthorToken: true })
    if (Array.isArray(source.pageOffsets)) {
      validatePaginatedSourceResult(source, value.data.pages)
    } else if (value.data.pages !== undefined) {
      return false
    }
    return true
  } catch {
    return false
  }
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error)
  return sanitize(message)
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasStableIdentifier(value) {
  return (
    (typeof value === 'string' && value.trim() !== '') ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'bigint'
  )
}

function hasStableType(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function isOptionalSource(source) {
  return Boolean(source && source.optional === true)
}

function validateEntitySourceResult(source, entity, options = {}) {
  if (
    !isRecord(source) ||
    typeof source.name !== 'string' ||
    source.name.trim() === '' ||
    typeof source.sourceType !== 'string' ||
    source.sourceType.trim() === '' ||
    !hasStableIdentifier(source.id)
  ) {
    throw new Error('entity source is missing a stable name, sourceType, or id')
  }
  if (!isRecord(entity)) {
    throw new Error(`${source.name} entity response is not an object`)
  }

  const expectedIdentifier = String(source.id)
  if (source.sourceType === 'author') {
    const urlToken = entity.url_token
    const authorId = entity.id
    if (
      (hasStableIdentifier(urlToken) && String(urlToken) === expectedIdentifier) ||
      (hasStableIdentifier(authorId) && String(authorId) === expectedIdentifier)
    ) {
      return true
    }
    if (options.allowRedactedAuthorToken === true && urlToken === '[REDACTED]' && hasStableIdentifier(authorId)) {
      return true
    }
    throw new Error(`${source.name} author response identifier does not match manifest source id`)
  }

  const actualIdentifier = entity.id ?? entity.url_token
  if (!hasStableIdentifier(actualIdentifier)) {
    throw new Error(`${source.name} entity response has no stable identifier`)
  }
  if (String(actualIdentifier) !== expectedIdentifier) {
    throw new Error(`${source.name} entity response identifier does not match manifest source id`)
  }
  return true
}

function summarizePageItem(item) {
  if (!isRecord(item)) {
    throw new Error('pagination item must be an object')
  }

  const candidateQueue = [item]
  const seenCandidateSet = new Set()
  let typeCandidate
  while (candidateQueue.length > 0) {
    const candidate = candidateQueue.shift()
    if (!isRecord(candidate) || seenCandidateSet.has(candidate)) {
      continue
    }
    seenCandidateSet.add(candidate)

    if (hasStableIdentifier(candidate.id)) {
      const summary = { id: candidate.id }
      if (hasStableType(candidate.type)) {
        summary.type = candidate.type
      }
      if (typeof candidate.title === 'string' && candidate.title.trim() !== '') {
        summary.title = candidate.title
      }
      return sanitize(summary)
    }
    if (!typeCandidate && hasStableType(candidate.type)) {
      typeCandidate = candidate
    }

    for (const key of ['target', 'content', 'answer', 'article', 'pin']) {
      if (isRecord(candidate[key])) {
        candidateQueue.push(candidate[key])
      }
    }
  }

  if (typeCandidate) {
    const summary = { type: typeCandidate.type }
    if (typeof typeCandidate.title === 'string' && typeCandidate.title.trim() !== '') {
      summary.title = typeCandidate.title
    }
    return sanitize(summary)
  }

  throw new Error('pagination item has no stable id or type')
}

function validatePaginatedSourceResult(source, pageList) {
  if (
    !isRecord(source) ||
    typeof source.name !== 'string' ||
    source.name.trim() === '' ||
    typeof source.sourceType !== 'string' ||
    source.sourceType.trim() === '' ||
    !hasStableIdentifier(source.id)
  ) {
    throw new Error('pagination source is missing a stable name, sourceType, or id')
  }
  if (!Array.isArray(source.pageOffsets) || source.pageOffsets.length === 0) {
    throw new Error(`${source.name} pagination source must declare at least one page offset`)
  }
  if (
    source.pageOffsets.some((offset) => !Number.isInteger(offset) || offset < 0) ||
    new Set(source.pageOffsets).size !== source.pageOffsets.length
  ) {
    throw new Error(`${source.name} pagination source has invalid or duplicate page offsets`)
  }
  if (!Array.isArray(pageList) || pageList.length !== source.pageOffsets.length) {
    throw new Error(`${source.name} pagination result does not match manifest page offsets`)
  }

  const expectedSourceId = String(source.id)
  const collectionItemIdSet = new Set()
  for (let index = 0; index < pageList.length; index += 1) {
    const page = pageList[index]
    if (
      !isRecord(page) ||
      page.sourceName !== source.name ||
      page.sourceType !== source.sourceType ||
      String(page.sourceId ?? '') !== expectedSourceId
    ) {
      throw new Error(`${source.name} pagination page source mismatch at index ${index}`)
    }
    if (page.offset !== source.pageOffsets[index]) {
      throw new Error(`${source.name} pagination offset mismatch at index ${index}`)
    }
    if (!Number.isInteger(page.limit) || page.limit <= 0 || !Array.isArray(page.items)) {
      throw new Error(`${source.name} pagination page shape is invalid at offset ${page.offset}`)
    }
    if (!Number.isInteger(page.itemCount) || page.itemCount < 0 || page.itemCount !== page.items.length) {
      throw new Error(`${source.name} pagination item count mismatch at offset ${page.offset}`)
    }

    for (const item of page.items) {
      const hasId = isRecord(item) && hasStableIdentifier(item.id)
      const hasType = isRecord(item) && hasStableType(item.type)
      if (!hasId && !hasType) {
        throw new Error(`${source.name} pagination summary has no stable id or type at offset ${page.offset}`)
      }
      if (source.sourceType === 'collection' && source.pageOffsets.length > 1) {
        if (!hasId) {
          throw new Error(`${source.name} collection pagination summary needs an id for de-duplication`)
        }
        const itemId = String(item.id)
        if (collectionItemIdSet.has(itemId)) {
          throw new Error(`${source.name} collection pagination contains duplicate item id ${itemId}`)
        }
        collectionItemIdSet.add(itemId)
      }
    }
  }

  if (!isOptionalSource(source) && pageList[0].items.length === 0) {
    throw new Error(`${source.name} required pagination source returned an empty first page`)
  }
  return true
}

function selectSourcesForMode(manifest, mode) {
  if (!manifest || !Array.isArray(manifest.sources)) {
    throw new Error('fixture source manifest is missing a sources array')
  }
  if (mode !== 'online' && mode !== 'fixtures') {
    throw new Error(`unsupported test mode: ${mode}`)
  }

  const onlineSourceList = manifest.sources.filter((source) => source && source.online === true)
  if (mode === 'fixtures') {
    return onlineSourceList
  }

  const selectedSourceByType = new Map()
  for (const source of onlineSourceList) {
    if (typeof source.name !== 'string' || source.name.includes('abnormal')) {
      continue
    }
    const selectedSource = selectedSourceByType.get(source.sourceType)
    if (!selectedSource || (isOptionalSource(selectedSource) && !isOptionalSource(source))) {
      selectedSourceByType.set(source.sourceType, source)
    }
  }
  return Array.from(selectedSourceByType.values())
}

function validateRunSummary(summary, expectedSourceList, mode) {
  if (!Array.isArray(summary)) {
    throw new Error('Electron test summary must be an array')
  }
  if (!Array.isArray(expectedSourceList)) {
    throw new Error('expected source list must be an array')
  }
  if (mode !== 'online' && mode !== 'fixtures') {
    throw new Error(`unsupported test mode: ${mode}`)
  }

  const expectedNameList = expectedSourceList.map((source) => source.name).sort()
  const actualNameList = summary.map((item) => item && item.name).sort()
  if (
    expectedNameList.some((name) => typeof name !== 'string') ||
    actualNameList.some((name) => typeof name !== 'string') ||
    new Set(actualNameList).size !== actualNameList.length ||
    JSON.stringify(actualNameList) !== JSON.stringify(expectedNameList)
  ) {
    throw new Error(
      `Electron test summary source mismatch: expected ${expectedNameList.join(', ')}, received ${actualNameList.join(', ')}`,
    )
  }

  const expectedSourceMap = new Map(expectedSourceList.map((source) => [source.name, source]))
  for (const item of summary) {
    if (!item || !Number.isFinite(item.durationMs) || item.durationMs < 0) {
      throw new Error(`Electron test summary has an invalid duration for ${item && item.name}`)
    }
    const source = expectedSourceMap.get(item.name)
    const allowsExpectedFailure = isOptionalSource(source) || (mode === 'fixtures' && source.name.includes('abnormal'))
    const allowedStatusSet = allowsExpectedFailure
      ? new Set([TestResultStatus.SUCCESS, TestResultStatus.EXPECTED_FAILURE])
      : new Set([TestResultStatus.SUCCESS])
    if (!allowedStatusSet.has(item.status)) {
      throw new Error(`Electron test summary has an invalid status for ${item.name}: ${item.status}`)
    }
  }
  return true
}

module.exports = {
  TestResultStatus,
  appendTestLog,
  checksum,
  createArtifacts,
  isOptionalSource,
  readRootCookie,
  safeErrorMessage,
  sanitize,
  selectSourcesForMode,
  summarizePageItem,
  validateEntitySourceResult,
  validatePaginatedSourceResult,
  validateRunSummary,
  validateFixture,
  writeFixture,
}
