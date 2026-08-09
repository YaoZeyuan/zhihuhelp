#!/usr/bin/env node
'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const https = require('node:https')
const path = require('node:path')
const childProcess = require('node:child_process')
const zlib = require('node:zlib')

const rootPath = path.resolve(__dirname, '../..')
const expectedProjectLicense = 'MIT OR GPL-2.0-or-later'
const expectedPackageSpecifier = '^1.1.0'
const expectedPandocWasmPackage = Object.freeze({
  name: 'pandoc-wasm',
  version: '1.1.0',
  license: 'GPL-2.0-or-later',
  npmIntegrity:
    'sha512-IoWBsC/cbSZe71rcRtxXUxG+Auf8aGDHKYOQZA6OdwmUL2xdpQaqrSGhPa+6zfLdSar7cnyAmTWt6KU9n5kBjQ==',
  gitCommit: '8955473ea57f4b9c3f5a6b3c3c9d2564e411deed',
  pandocVersion: '3.10',
  officialWasmReleaseUrl: 'https://github.com/jgm/pandoc/releases/download/3.10/pandoc-3.10.wasm.zip',
  officialWasmReleaseSha256: 'e0865674db6fa2698d29811ca2fcb91ab00a2f8b7d0220eae4ea28405d9cab2b',
  wasmSha256: 'b47c9de52b5b45f103c2dac6fea52591aeafe3dd6cafed13331b67575233a2ff',
  wasmSize: 58580800,
})
const officialSourceList = Object.freeze([
  Object.freeze({
    id: 'pandoc-wasm',
    version: '1.1.0',
    tag: 'v1.1.0',
    gitCommit: expectedPandocWasmPackage.gitCommit,
    archiveName: 'pandoc-wasm-1.1.0-source.tar.gz',
    cacheName: 'pandoc-wasm-8955473ea57f4b9c3f5a6b3c3c9d2564e411deed.tar.gz',
    url: 'https://codeload.github.com/pandoc/pandoc-wasm/tar.gz/8955473ea57f4b9c3f5a6b3c3c9d2564e411deed',
    sha256: '74cd6e69d2a2dbe5856bab359462670dcae159e75da557ad101644eb8e9738e7',
    maximumBytes: 2 * 1024 * 1024,
  }),
  Object.freeze({
    id: 'pandoc',
    version: '3.10',
    tag: '3.10',
    gitCommit: '9376458c26d25d222e5a898ede254ebb2f47ffbe',
    archiveName: 'pandoc-3.10-source.tar.gz',
    cacheName: 'pandoc-9376458c26d25d222e5a898ede254ebb2f47ffbe.tar.gz',
    url: 'https://codeload.github.com/jgm/pandoc/tar.gz/9376458c26d25d222e5a898ede254ebb2f47ffbe',
    sha256: '92b493041c34cdf856ebf3570d7314114a43d103aaf53b526ffa664f1ec975ed',
    maximumBytes: 32 * 1024 * 1024,
  }),
])
const requiredReleaseFileList = Object.freeze([
  'LICENSE',
  'LICENSE-MIT',
  'LICENSE-GPL-2.0-or-later',
  'THIRD_PARTY_NOTICES.md',
  'CORRESPONDING_SOURCE.md',
  'scripts/release/create-corresponding-source.cjs',
  'scripts/release/write-package-version-output.cjs',
  '.github/workflows/build-windows.yml',
  '.github/workflows/build-mac.yml',
  'package.json',
  'pnpm-lock.yaml',
])
const distributionLicenseFileList = Object.freeze([
  'LICENSE',
  'LICENSE-MIT',
  'LICENSE-GPL-2.0-or-later',
  'THIRD_PARTY_NOTICES.md',
  'CORRESPONDING_SOURCE.md',
])
const allowedDownloadHostSet = new Set(['codeload.github.com'])

function usage() {
  return `Usage:
  node scripts/release/create-corresponding-source.cjs [options]
  node scripts/release/create-corresponding-source.cjs --verify-config
  node scripts/release/create-corresponding-source.cjs --verify-installed
  node scripts/release/create-corresponding-source.cjs --stage-license-files <directory>
  node scripts/release/create-corresponding-source.cjs --verify-packaged <release-directory>

Bundle options:
  --output-dir <directory>  Output directory (default: release-source)
  --cache-dir <directory>   Cache for official source archives
  --offline                 Never use the network; require a complete cache

Offline cache filenames:
${officialSourceList.map((source) => `  ${source.cacheName}  sha256:${source.sha256}`).join('\n')}

The source bundle is built only from the clean Git HEAD and checksum-pinned
official source archives. Local node_modules is used only by verification
modes and is never copied into the source bundle.`
}

function parseArguments(argumentList) {
  const options = {
    command: 'bundle',
    offline: false,
    outputDir: path.resolve(rootPath, 'release-source'),
    cacheDir: undefined,
    packagedPath: undefined,
    licenseOutputPath: undefined,
  }
  let commandWasSet = false
  const setCommand = (command) => {
    if (commandWasSet) {
      throw new Error('Only one verification command can be selected')
    }
    commandWasSet = true
    options.command = command
  }
  for (let index = 0; index < argumentList.length; index += 1) {
    const argument = argumentList[index]
    if (argument === '--help' || argument === '-h') {
      options.command = 'help'
      return options
    }
    if (argument === '--verify-config') {
      setCommand('verify-config')
      continue
    }
    if (argument === '--verify-installed') {
      setCommand('verify-installed')
      continue
    }
    if (argument === '--verify-packaged') {
      setCommand('verify-packaged')
      const value = argumentList[++index]
      if (!value) {
        throw new Error('--verify-packaged requires a release directory')
      }
      options.packagedPath = path.resolve(rootPath, value)
      continue
    }
    if (argument === '--stage-license-files') {
      setCommand('stage-license-files')
      const value = argumentList[++index]
      if (!value) {
        throw new Error('--stage-license-files requires an output directory')
      }
      options.licenseOutputPath = path.resolve(rootPath, value)
      continue
    }
    if (argument === '--offline') {
      options.offline = true
      continue
    }
    if (argument === '--output-dir' || argument === '--cache-dir') {
      const value = argumentList[++index]
      if (!value) {
        throw new Error(`${argument} requires a directory`)
      }
      const resolvedValue = path.resolve(rootPath, value)
      if (argument === '--output-dir') {
        options.outputDir = resolvedValue
      } else {
        options.cacheDir = resolvedValue
      }
      continue
    }
    throw new Error(`Unknown argument: ${argument}`)
  }
  options.cacheDir = options.cacheDir || path.resolve(options.outputDir, 'source-cache')
  return options
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot parse JSON ${filePath}: ${safeErrorMessage(error)}`)
  }
}

function safeErrorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual}`)
  }
}

function verifyRepositoryConfiguration() {
  const packageJson = readJson(path.resolve(rootPath, 'package.json'))
  assertEqual(packageJson.license, expectedProjectLicense, 'package.json license')
  assertEqual(
    packageJson.dependencies && packageJson.dependencies[expectedPandocWasmPackage.name],
    expectedPackageSpecifier,
    'package.json pandoc-wasm specifier',
  )
  const packagedFileSet = new Set((packageJson.build && packageJson.build.files) || [])
  if (!packagedFileSet.has('dist/**/*')) {
    throw new Error('package.json build.files must include dist/**/* for the staged license payload')
  }
  for (const relativePath of distributionLicenseFileList) {
    if (!packagedFileSet.has(relativePath)) {
      throw new Error(`package.json build.files must include ${relativePath}`)
    }
  }

  const normalizedLock = fs.readFileSync(path.resolve(rootPath, 'pnpm-lock.yaml'), 'utf8').replace(/\r\n/g, '\n')
  const importerPattern = new RegExp(
    `pandoc-wasm:\\n\\s+specifier: \\^1\\.1\\.0\\n\\s+version: ${escapeRegExp(expectedPandocWasmPackage.version)}(?:\\n|$)`,
  )
  if (!importerPattern.test(normalizedLock)) {
    throw new Error('pnpm-lock.yaml does not pin the root importer to pandoc-wasm 1.1.0')
  }
  if (!normalizedLock.includes(`pandoc-wasm@${expectedPandocWasmPackage.version}:`)) {
    throw new Error('pnpm-lock.yaml is missing pandoc-wasm@1.1.0')
  }
  if (!normalizedLock.includes(`resolution: {integrity: ${expectedPandocWasmPackage.npmIntegrity}}`)) {
    throw new Error('pnpm-lock.yaml pandoc-wasm integrity does not match the official npm publication')
  }

  for (const relativePath of requiredReleaseFileList) {
    const absolutePath = path.resolve(rootPath, relativePath)
    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isFile() === false) {
      throw new Error(`Required release source file is missing: ${relativePath}`)
    }
  }
  const gplText = fs
    .readFileSync(path.resolve(rootPath, 'LICENSE-GPL-2.0-or-later'), 'utf8')
    .replace(/\r\n/g, '\n')
  const gplTextHash = sha256(Buffer.from(gplText, 'utf8'))
  assertEqual(
    gplTextHash,
    'edaef632cbb643e4e7a221717a6c441a4c1a7c918e6e4d56debc3d8739b233f6',
    'GNU GPL v2 license text SHA-256',
  )

  const thirdPartyNotices = fs.readFileSync(path.resolve(rootPath, 'THIRD_PARTY_NOTICES.md'), 'utf8')
  for (const requiredValue of [
    expectedPandocWasmPackage.gitCommit,
    expectedPandocWasmPackage.npmIntegrity,
    expectedPandocWasmPackage.officialWasmReleaseSha256,
    expectedPandocWasmPackage.wasmSha256,
    ...officialSourceList.flatMap((source) => [source.url, source.sha256]),
  ]) {
    if (!thirdPartyNotices.includes(requiredValue)) {
      throw new Error(`THIRD_PARTY_NOTICES.md is missing pinned release value ${requiredValue}`)
    }
  }

  verifyDeterministicArchiveWriter()
  return packageJson
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function runGit(argumentList, options = {}) {
  const result = childProcess.spawnSync('git', argumentList, {
    cwd: rootPath,
    encoding: options.encoding === undefined ? 'utf8' : options.encoding,
    stdio: options.stdio,
    timeout: 120000,
  })
  if (result.error) {
    throw new Error(`git ${argumentList.join(' ')} failed: ${safeErrorMessage(result.error)}`)
  }
  if (result.status !== 0) {
    const details = String(result.stderr || result.stdout || '').trim()
    throw new Error(`git ${argumentList.join(' ')} failed (${result.status})${details ? `: ${details}` : ''}`)
  }
  return typeof result.stdout === 'string' ? result.stdout.trim() : result.stdout
}

function verifyCleanReleaseCommit(packageJson) {
  const repositoryRoot = path.resolve(runGit(['rev-parse', '--show-toplevel']))
  if (repositoryRoot.toLowerCase() !== rootPath.toLowerCase()) {
    throw new Error(`Release script must run in ${rootPath}; Git reported ${repositoryRoot}`)
  }

  const trackedChanges = runGit(['status', '--porcelain', '--untracked-files=no'])
  if (trackedChanges !== '') {
    throw new Error('Tracked files are dirty; commit all release inputs before creating corresponding source')
  }

  const submoduleEntries = runGit(['ls-files', '--stage'])
    .split(/\r?\n/)
    .filter((line) => line.startsWith('160000 '))
  if (submoduleEntries.length > 0) {
    throw new Error('Git submodules are not supported by this source bundler; package their exact source explicitly')
  }

  const commit = runGit(['rev-parse', 'HEAD'])
  if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== commit) {
    throw new Error(`GITHUB_SHA ${process.env.GITHUB_SHA} does not match checked-out HEAD ${commit}`)
  }
  const committedPackageJson = JSON.parse(runGit(['show', `${commit}:package.json`]))
  assertEqual(committedPackageJson.version, packageJson.version, 'committed package version')
  assertEqual(committedPackageJson.license, expectedProjectLicense, 'committed package license')

  for (const relativePath of requiredReleaseFileList) {
    runGit(['cat-file', '-e', `${commit}:${relativePath}`])
  }

  const sourceDateEpoch = Number(runGit(['show', '-s', '--format=%ct', commit]))
  if (!Number.isSafeInteger(sourceDateEpoch) || sourceDateEpoch <= 0) {
    throw new Error(`Invalid Git commit timestamp: ${sourceDateEpoch}`)
  }
  return { commit, sourceDateEpoch }
}

function verifyInstalledPackageAt(packageRoot, label) {
  const packageJsonPath = path.resolve(packageRoot, 'package.json')
  const versionPath = path.resolve(packageRoot, 'pandoc-version.txt')
  const wasmPath = path.resolve(packageRoot, 'src', 'pandoc.wasm')
  for (const filePath of [packageJsonPath, versionPath, wasmPath]) {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isFile() === false) {
      throw new Error(`${label} is incomplete; missing ${filePath}`)
    }
  }

  const packageJson = readJson(packageJsonPath)
  assertEqual(packageJson.name, expectedPandocWasmPackage.name, `${label} package name`)
  assertEqual(packageJson.version, expectedPandocWasmPackage.version, `${label} package version`)
  assertEqual(packageJson.license, expectedPandocWasmPackage.license, `${label} package license`)
  assertEqual(fs.readFileSync(versionPath, 'utf8').trim(), expectedPandocWasmPackage.pandocVersion, `${label} Pandoc version`)
  const wasm = fs.readFileSync(wasmPath)
  assertEqual(wasm.length, expectedPandocWasmPackage.wasmSize, `${label} pandoc.wasm size`)
  assertEqual(sha256(wasm), expectedPandocWasmPackage.wasmSha256, `${label} pandoc.wasm SHA-256`)
  return wasmPath
}

function verifyInstalledPandocWasm() {
  const packageRoot = path.resolve(rootPath, 'node_modules', 'pandoc-wasm')
  const wasmPath = verifyInstalledPackageAt(packageRoot, 'installed pandoc-wasm')
  console.info(`[release-source] verified installed Pandoc WASM: ${wasmPath}`)
}

function stageDistributionLicenseFiles(outputPath) {
  const allowedRoot = path.resolve(rootPath, 'dist')
  const relativePath = path.relative(allowedRoot, outputPath)
  if (
    relativePath === '' ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`Distribution license output must be a child of ${allowedRoot}: ${outputPath}`)
  }
  fs.mkdirSync(outputPath, { recursive: true })
  for (const relativeSourcePath of distributionLicenseFileList) {
    const sourcePath = path.resolve(rootPath, relativeSourcePath)
    const targetPath = path.resolve(outputPath, relativeSourcePath)
    fs.copyFileSync(sourcePath, targetPath)
  }
  console.info(`[release-source] staged distribution licenses in ${outputPath}`)
}

function verifyDistributionLicensePayload(applicationRoot, label) {
  const licenseRoot = path.resolve(applicationRoot, 'dist', 'licenses')
  for (const relativePath of distributionLicenseFileList) {
    const packagedPath = path.resolve(licenseRoot, relativePath)
    const sourcePath = path.resolve(rootPath, relativePath)
    if (!fs.existsSync(packagedPath) || fs.statSync(packagedPath).isFile() === false) {
      throw new Error(`${label} is missing distribution license file ${packagedPath}`)
    }
    assertEqual(sha256(fs.readFileSync(packagedPath)), sha256(fs.readFileSync(sourcePath)), `${label} ${relativePath}`)
  }
}

function verifyPackagedPandocWasm(releasePath) {
  if (!releasePath || !fs.existsSync(releasePath) || fs.statSync(releasePath).isDirectory() === false) {
    throw new Error(`Packaged application directory does not exist: ${releasePath}`)
  }
  const wasmPathList = []
  const pendingDirectoryList = [{ directoryPath: releasePath, depth: 0 }]
  let visitedDirectoryCount = 0
  while (pendingDirectoryList.length > 0) {
    const { directoryPath, depth } = pendingDirectoryList.pop()
    visitedDirectoryCount += 1
    if (visitedDirectoryCount > 200000 || depth > 24) {
      throw new Error(`Packaged application scan exceeded its safety limit under ${releasePath}`)
    }
    for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
      const entryPath = path.resolve(directoryPath, entry.name)
      if (entry.isDirectory()) {
        pendingDirectoryList.push({ directoryPath: entryPath, depth: depth + 1 })
        continue
      }
      if (
        entry.isFile() &&
        entry.name === 'pandoc.wasm' &&
        normalizePath(entryPath).endsWith('/node_modules/pandoc-wasm/src/pandoc.wasm')
      ) {
        wasmPathList.push(entryPath)
      }
    }
  }
  if (wasmPathList.length === 0) {
    throw new Error(`No unpacked pandoc-wasm runtime was found under ${releasePath}`)
  }
  for (const wasmPath of wasmPathList.sort()) {
    const packageRoot = path.resolve(path.dirname(wasmPath), '..')
    verifyInstalledPackageAt(packageRoot, `packaged pandoc-wasm at ${packageRoot}`)
    verifyDistributionLicensePayload(path.resolve(packageRoot, '../..'), `packaged application at ${packageRoot}`)
    console.info(`[release-source] verified packaged Pandoc WASM: ${wasmPath}`)
  }
}

function normalizePath(value) {
  return value.replace(/\\/g, '/')
}

async function readOfficialSource(source, cacheDir, offline) {
  fs.mkdirSync(cacheDir, { recursive: true })
  const cachePath = path.resolve(cacheDir, source.cacheName)
  if (fs.existsSync(cachePath)) {
    const cachedValue = fs.readFileSync(cachePath)
    assertEqual(sha256(cachedValue), source.sha256, `${source.id} cached source SHA-256`)
    console.info(`[release-source] verified cached ${source.id} ${source.version}`)
    return cachedValue
  }
  if (offline) {
    throw new Error(`Offline source cache is missing ${cachePath}`)
  }

  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.info(`[release-source] downloading ${source.id} ${source.version} (attempt ${attempt}/3)`)
      const value = await downloadHttps(source.url, source.maximumBytes, 0)
      assertEqual(sha256(value), source.sha256, `${source.id} downloaded source SHA-256`)
      const temporaryPath = `${cachePath}.partial-${process.pid}`
      fs.writeFileSync(temporaryPath, value)
      fs.renameSync(temporaryPath, cachePath)
      return value
    } catch (error) {
      lastError = error
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500))
      }
    }
  }
  throw new Error(`Unable to obtain official ${source.id} source: ${safeErrorMessage(lastError)}`)
}

function downloadHttps(rawUrl, maximumBytes, redirectCount) {
  const parsedUrl = new URL(rawUrl)
  if (parsedUrl.protocol !== 'https:' || allowedDownloadHostSet.has(parsedUrl.hostname) === false) {
    return Promise.reject(new Error(`Blocked non-official source URL: ${rawUrl}`))
  }
  if (redirectCount > 4) {
    return Promise.reject(new Error(`Too many redirects while downloading ${rawUrl}`))
  }
  return new Promise((resolve, reject) => {
    const request = https.get(
      parsedUrl,
      {
        headers: {
          Accept: 'application/octet-stream',
          'User-Agent': 'zhihuhelp-corresponding-source-builder/1',
        },
      },
      (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
          const location = response.headers.location
          response.resume()
          if (!location) {
            reject(new Error(`Redirect without Location from ${rawUrl}`))
            return
          }
          downloadHttps(new URL(location, parsedUrl).toString(), maximumBytes, redirectCount + 1).then(resolve, reject)
          return
        }
        if (response.statusCode !== 200) {
          response.resume()
          reject(new Error(`HTTP ${response.statusCode || 'unknown'} from ${rawUrl}`))
          return
        }
        const contentLength = Number(response.headers['content-length'])
        if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
          response.destroy()
          reject(new Error(`${rawUrl} exceeds the ${maximumBytes}-byte source limit`))
          return
        }
        const chunkList = []
        let totalBytes = 0
        response.on('data', (chunk) => {
          totalBytes += chunk.length
          if (totalBytes > maximumBytes) {
            response.destroy(new Error(`${rawUrl} exceeds the ${maximumBytes}-byte source limit`))
            return
          }
          chunkList.push(chunk)
        })
        response.on('end', () => resolve(Buffer.concat(chunkList)))
        response.on('error', reject)
      },
    )
    request.setTimeout(60000, () => request.destroy(new Error(`Download timed out: ${rawUrl}`)))
    request.on('error', reject)
  })
}

function createProjectArchive(outputDir, version, commit) {
  const shortCommit = commit.slice(0, 12)
  const archiveName = `zhihuhelp-${version}-${shortCommit}-source.tar`
  const archivePath = path.resolve(outputDir, `.temporary-${archiveName}`)
  const result = childProcess.spawnSync(
    'git',
    ['archive', '--format=tar', `--prefix=zhihuhelp-${version}/`, '--output', archivePath, commit],
    { cwd: rootPath, encoding: 'utf8', timeout: 120000 },
  )
  if (result.error || result.status !== 0) {
    throw new Error(`Unable to archive ZhihuHelp ${commit}: ${safeErrorMessage(result.error || result.stderr)}`)
  }
  const value = fs.readFileSync(archivePath)
  fs.rmSync(archivePath, { force: true })
  return { archiveName, value, sha256: sha256(value) }
}

function buildBundleReadme({ version, commit, projectArchive, sourceDateEpoch }) {
  return `# ZhihuHelp ${version} corresponding source

This deterministic bundle accompanies desktop binaries built from ZhihuHelp
commit \`${commit}\` (SOURCE_DATE_EPOCH \`${sourceDateEpoch}\`).

Contents:

- \`archives/${projectArchive.archiveName}\`: exact tracked ZhihuHelp source;
- \`archives/pandoc-wasm-1.1.0-source.tar.gz\`: official wrapper source;
- \`archives/pandoc-3.10-source.tar.gz\`: official Pandoc source;
- \`SOURCE_MANIFEST.json\` and \`SHA256SUMS\`: versions, revisions, URLs,
  binary identity, and checksums;
- license, notices, and complete build instructions at the bundle root.

Verify \`SHA256SUMS\` before extracting. Local \`node_modules\` and generated
binaries are deliberately not used as source inputs. See
\`CORRESPONDING_SOURCE.md\` for rebuild commands.
`
}

function createSourceManifest({ packageJson, commit, sourceDateEpoch, projectArchive }) {
  return {
    schemaVersion: 1,
    generator: 'scripts/release/create-corresponding-source.cjs',
    sourceDateEpoch,
    project: {
      name: packageJson.name,
      version: packageJson.version,
      license: expectedProjectLicense,
      repository: 'https://github.com/YaoZeyuan/zhihuhelp',
      gitCommit: commit,
      archive: `archives/${projectArchive.archiveName}`,
      sha256: projectArchive.sha256,
    },
    distributedPandocWasm: {
      npmPackage: `${expectedPandocWasmPackage.name}@${expectedPandocWasmPackage.version}`,
      npmIntegrity: expectedPandocWasmPackage.npmIntegrity,
      pandocVersion: expectedPandocWasmPackage.pandocVersion,
      officialWasmReleaseUrl: expectedPandocWasmPackage.officialWasmReleaseUrl,
      officialWasmReleaseSha256: expectedPandocWasmPackage.officialWasmReleaseSha256,
      wasmSize: expectedPandocWasmPackage.wasmSize,
      wasmSha256: expectedPandocWasmPackage.wasmSha256,
    },
    officialSources: officialSourceList.map((source) => ({
      id: source.id,
      version: source.version,
      tag: source.tag,
      gitCommit: source.gitCommit,
      url: source.url,
      archive: `archives/${source.archiveName}`,
      sha256: source.sha256,
    })),
    build: {
      node: '24.x',
      pnpm: '11.5.0',
      commands: [
        'pnpm install --frozen-lockfile',
        'pnpm build-without-sourcemap',
        'node scripts/release/create-corresponding-source.cjs --stage-license-files dist/licenses',
        'pnpm buildgui',
        'pnpm electron-builder',
      ],
      workflows: ['.github/workflows/build-windows.yml', '.github/workflows/build-mac.yml'],
    },
  }
}

async function createCorrespondingSourceBundle(options, packageJson) {
  const { commit, sourceDateEpoch } = verifyCleanReleaseCommit(packageJson)
  fs.mkdirSync(options.outputDir, { recursive: true })

  const officialSourceValueMap = new Map()
  for (const source of officialSourceList) {
    officialSourceValueMap.set(source.id, await readOfficialSource(source, options.cacheDir, options.offline))
  }
  const projectArchive = createProjectArchive(options.outputDir, packageJson.version, commit)
  const manifest = createSourceManifest({ packageJson, commit, sourceDateEpoch, projectArchive })
  const rootName = `zhihuhelp-${packageJson.version}-corresponding-source`

  const entryList = [
    {
      name: `${rootName}/README.md`,
      value: Buffer.from(
        buildBundleReadme({ version: packageJson.version, commit, projectArchive, sourceDateEpoch }),
        'utf8',
      ),
    },
    {
      name: `${rootName}/SOURCE_MANIFEST.json`,
      value: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    },
    {
      name: `${rootName}/archives/${projectArchive.archiveName}`,
      value: projectArchive.value,
    },
  ]
  for (const source of officialSourceList) {
    entryList.push({
      name: `${rootName}/archives/${source.archiveName}`,
      value: officialSourceValueMap.get(source.id),
    })
  }
  for (const relativePath of [
    'LICENSE',
    'LICENSE-MIT',
    'LICENSE-GPL-2.0-or-later',
    'THIRD_PARTY_NOTICES.md',
    'CORRESPONDING_SOURCE.md',
  ]) {
    entryList.push({
      name: `${rootName}/${relativePath}`,
      // Read committed blobs so core.autocrlf cannot make the source bundle
      // differ between the Windows and macOS release runners.
      value: runGit(['show', `${commit}:${relativePath}`], { encoding: null }),
    })
  }

  const checksumLineList = entryList
    .filter((entry) => entry.name.includes('/archives/'))
    .map((entry) => `${sha256(entry.value)}  ${entry.name.slice(rootName.length + 1)}`)
    .sort()
  entryList.push({
    name: `${rootName}/SHA256SUMS`,
    value: Buffer.from(`${checksumLineList.join('\n')}\n`, 'utf8'),
  })

  const tarValue = createTar(entryList, sourceDateEpoch)
  const bundleValue = createStoredGzip(tarValue)
  const bundleName = `${rootName}.tar.gz`
  const bundlePath = path.resolve(options.outputDir, bundleName)
  const bundleHash = sha256(bundleValue)
  fs.writeFileSync(bundlePath, bundleValue)
  fs.writeFileSync(`${bundlePath}.sha256`, `${bundleHash}  ${bundleName}\n`, 'utf8')

  console.info(`[release-source] created ${bundlePath}`)
  console.info(`[release-source] sha256 ${bundleHash}`)
}

function createTar(entryList, modifiedAtSeconds) {
  const blockList = []
  for (const entry of [...entryList].sort((left, right) => {
    if (left.name < right.name) {
      return -1
    }
    return left.name > right.name ? 1 : 0
  })) {
    const value = Buffer.isBuffer(entry.value) ? entry.value : Buffer.from(entry.value)
    const { name, prefix } = splitTarPath(entry.name)
    const header = Buffer.alloc(512)
    writeTarString(header, name, 0, 100)
    writeTarOctal(header, 0o644, 100, 8)
    writeTarOctal(header, 0, 108, 8)
    writeTarOctal(header, 0, 116, 8)
    writeTarOctal(header, value.length, 124, 12)
    writeTarOctal(header, modifiedAtSeconds, 136, 12)
    header.fill(0x20, 148, 156)
    header[156] = '0'.charCodeAt(0)
    writeTarString(header, 'ustar\0', 257, 6)
    writeTarString(header, '00', 263, 2)
    writeTarString(header, prefix, 345, 155)
    const checksum = header.reduce((total, current) => total + current, 0)
    const checksumText = checksum.toString(8).padStart(6, '0')
    header.write(checksumText, 148, 6, 'ascii')
    header[154] = 0
    header[155] = 0x20
    blockList.push(header, value)
    const paddingLength = (512 - (value.length % 512)) % 512
    if (paddingLength > 0) {
      blockList.push(Buffer.alloc(paddingLength))
    }
  }
  blockList.push(Buffer.alloc(1024))
  return Buffer.concat(blockList)
}

function splitTarPath(rawPath) {
  const normalized = normalizePath(rawPath)
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error(`Unsafe tar entry path: ${rawPath}`)
  }
  if (Buffer.byteLength(normalized) <= 100) {
    return { name: normalized, prefix: '' }
  }
  const separatorIndexList = []
  for (let index = 0; index < normalized.length; index += 1) {
    if (normalized[index] === '/') {
      separatorIndexList.push(index)
    }
  }
  for (const separatorIndex of separatorIndexList.reverse()) {
    const prefix = normalized.slice(0, separatorIndex)
    const name = normalized.slice(separatorIndex + 1)
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) {
      return { name, prefix }
    }
  }
  throw new Error(`Tar entry path is too long: ${rawPath}`)
}

function writeTarString(buffer, value, offset, length) {
  const encoded = Buffer.from(value, 'utf8')
  if (encoded.length > length) {
    throw new Error(`Tar header value is too long: ${value}`)
  }
  encoded.copy(buffer, offset)
}

function writeTarOctal(buffer, value, offset, length) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid tar numeric value: ${value}`)
  }
  const encoded = `${value.toString(8).padStart(length - 1, '0')}\0`
  if (encoded.length > length) {
    throw new Error(`Tar numeric value is too large: ${value}`)
  }
  buffer.write(encoded, offset, length, 'ascii')
}

function createStoredGzip(value) {
  const header = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff])
  const blockList = [header]
  let offset = 0
  do {
    const remaining = value.length - offset
    const blockLength = Math.min(remaining, 0xffff)
    const finalBlock = offset + blockLength >= value.length
    const blockHeader = Buffer.alloc(5)
    blockHeader[0] = finalBlock ? 0x01 : 0x00
    blockHeader.writeUInt16LE(blockLength, 1)
    blockHeader.writeUInt16LE(0xffff ^ blockLength, 3)
    blockList.push(blockHeader, value.subarray(offset, offset + blockLength))
    offset += blockLength
  } while (offset < value.length)
  const trailer = Buffer.alloc(8)
  trailer.writeUInt32LE(crc32(value), 0)
  trailer.writeUInt32LE(value.length >>> 0, 4)
  blockList.push(trailer)
  return Buffer.concat(blockList)
}

const crc32Table = createCrc32Table()

function createCrc32Table() {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let current = index
    for (let bit = 0; bit < 8; bit += 1) {
      current = (current & 1) === 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1
    }
    table[index] = current >>> 0
  }
  return table
}

function crc32(value) {
  let result = 0xffffffff
  for (const byte of value) {
    result = crc32Table[(result ^ byte) & 0xff] ^ (result >>> 8)
  }
  return (result ^ 0xffffffff) >>> 0
}

function verifyDeterministicArchiveWriter() {
  const entryList = [
    { name: 'source/a.txt', value: Buffer.from('alpha\n') },
    { name: 'source/nested/b.txt', value: Buffer.from('beta\n') },
  ]
  const first = createStoredGzip(createTar(entryList, 1234567890))
  const second = createStoredGzip(createTar([...entryList].reverse(), 1234567890))
  if (first.equals(second) === false) {
    throw new Error('Corresponding-source archive writer is not deterministic')
  }
  const unpacked = zlib.gunzipSync(first)
  if (unpacked.length < 2048 || unpacked.subarray(-1024).some((byte) => byte !== 0)) {
    throw new Error('Corresponding-source archive writer produced an invalid gzip/tar payload')
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.command === 'help') {
    console.info(usage())
    return
  }
  const packageJson = verifyRepositoryConfiguration()
  if (options.command === 'verify-config') {
    console.info(
      `[release-source] configuration verified for ${packageJson.name}@${packageJson.version}, ` +
        `pandoc-wasm ${expectedPandocWasmPackage.version}, Pandoc ${expectedPandocWasmPackage.pandocVersion}`,
    )
    return
  }
  if (options.command === 'verify-installed') {
    verifyInstalledPandocWasm()
    return
  }
  if (options.command === 'stage-license-files') {
    stageDistributionLicenseFiles(options.licenseOutputPath)
    return
  }
  if (options.command === 'verify-packaged') {
    verifyPackagedPandocWasm(options.packagedPath)
    return
  }
  await createCorrespondingSourceBundle(options, packageJson)
}

main().catch((error) => {
  console.error(`[release-source] ${safeErrorMessage(error)}`)
  process.exitCode = 1
})
