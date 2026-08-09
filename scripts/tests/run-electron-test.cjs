'use strict'

const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const {
  createArtifacts,
  readRootCookie,
  safeErrorMessage,
  selectSourcesForMode,
  validateFixture,
  validateRunSummary,
} = require('./runtime.cjs')

const rootPath = path.resolve(__dirname, '../..')
const mode = process.argv[2]

if (mode !== 'online' && mode !== 'fixtures') {
  console.error('用法：node scripts/tests/run-electron-test.cjs <online|fixtures>')
  process.exit(2)
}

let artifactPath
let exitCode = 1
try {
  // Preflight only. The Cookie is deliberately not printed, forwarded through argv, or copied to artifacts.
  readRootCookie(rootPath)

  const fixtureRoot = path.join(rootPath, 'fixtures', 'zhihu')
  const manifest = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'sources.json'), 'utf8'))
  const expectedSourceList = selectSourcesForMode(manifest, mode)

  const requiredDistFiles = [
    'dist/api/single/answer.js',
    'dist/api/single/article.js',
    'dist/api/single/author.js',
    'dist/api/single/collection.js',
    'dist/api/single/column.js',
    'dist/api/single/pin.js',
    'dist/api/single/question.js',
    'dist/api/single/topic.js',
    'dist/config/common.js',
    'dist/config/path.js',
    'dist/config/request.js',
    'dist/library/http/index.js',
    'dist/library/knex.js',
    'dist/library/zhihu_encrypt/index.js',
    'dist/model/answer.js',
    'dist/shared/logging/log_contract.js',
  ]
  const missingFileList = requiredDistFiles.filter((relativePath) => !fs.existsSync(path.join(rootPath, relativePath)))
  if (missingFileList.length > 0) {
    throw new Error(`缺少已编译文件：${missingFileList.join(', ')}；请先单独运行 pnpm watch 或 pnpm build`)
  }

  artifactPath = createArtifacts(mode)
  const electronPath = require('electron')
  const runnerPath = path.join(__dirname, 'electron-online-runner.cjs')
  const result = childProcess.spawnSync(electronPath, [runnerPath, `--mode=${mode}`, `--artifacts=${artifactPath}`], {
    cwd: rootPath,
    env: {
      ...process.env,
      ZHIHUHELP_TEST_MODE: mode,
      ZHIHUHELP_TEST_ARTIFACTS: artifactPath,
    },
    stdio: 'inherit',
    timeout: mode === 'fixtures' ? 300000 : 180000,
    killSignal: 'SIGTERM',
  })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`${mode === 'online' ? '在线冒烟' : 'fixture 更新'}失败（退出码 ${result.status}）`)
  }

  const summaryPath = path.join(artifactPath, 'summary.json')
  if (!fs.existsSync(summaryPath)) {
    throw new Error('Electron test completed without a summary.json result')
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  validateRunSummary(summary, expectedSourceList, mode)

  if (mode === 'fixtures') {
    const fixtureDirectory = path.join(fixtureRoot, 'online')
    const fileList = fs.existsSync(fixtureDirectory)
      ? fs
          .readdirSync(fixtureDirectory)
          .filter((fileName) => fileName.endsWith('.json'))
          .sort()
      : []
    const expectedFileList = expectedSourceList.map((source) => `${source.name}.json`).sort()
    if (JSON.stringify(fileList) !== JSON.stringify(expectedFileList)) {
      throw new Error(
        `fixture output source mismatch: expected ${expectedFileList.join(', ')}, received ${fileList.join(', ')}`,
      )
    }
    const sourceByFileName = new Map(expectedSourceList.map((source) => [`${source.name}.json`, source]))
    for (const fileName of fileList) {
      const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, fileName), 'utf8'))
      if (!validateFixture(fixture, sourceByFileName.get(fileName))) {
        throw new Error(`fixture 校验失败：${fileName}`)
      }
    }
    console.info(`fixture schema 与校验值验证通过，共 ${fileList.length} 份。请人工检查以下变更：`)
    const offlineResult = childProcess.spawnSync('corepack', ['pnpm', 'test'], {
      cwd: rootPath,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      timeout: 180000,
      killSignal: 'SIGTERM',
    })
    if (offlineResult.error) {
      throw offlineResult.error
    }
    if (offlineResult.status !== 0) {
      throw new Error(`fixture offline regression failed with exit code ${offlineResult.status}`)
    }
    childProcess.spawnSync('git', ['status', '--short', '--', 'fixtures/zhihu/online'], {
      cwd: rootPath,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      timeout: 10000,
    })
    childProcess.spawnSync('git', ['diff', '--stat', '--', 'fixtures/zhihu/online'], {
      cwd: rootPath,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      timeout: 10000,
    })
  }

  exitCode = 0
} catch (error) {
  console.error(`[${mode}] ${safeErrorMessage(error)}`)
  exitCode = 1
} finally {
  if (artifactPath) {
    if (process.env.KEEP_TEST_ARTIFACTS === '1') {
      console.info(`[test-artifacts] ${artifactPath}`)
    } else {
      fs.rmSync(artifactPath, { recursive: true, force: true })
    }
  }
}

process.exit(exitCode)
