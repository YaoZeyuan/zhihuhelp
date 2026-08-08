const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const clientBasePath = path.resolve(__dirname, '..')
const sourcePath = path.resolve(clientBasePath, 'dist')
const targetPath = path.resolve(clientBasePath, '..', 'dist', 'client')
const corepackCliPath = path.resolve(path.dirname(process.execPath), 'node_modules', 'corepack', 'dist', 'corepack.js')

function assertPathInside(rootPath, target, label) {
  const relativePath = path.relative(path.resolve(rootPath), path.resolve(target))
  if (
    relativePath === ''
    || relativePath === '..'
    || relativePath.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativePath)
  ) {
    throw new Error(`${label}超出允许目录: ${target}`)
  }
}

function copyDirectorySync(source, target) {
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourceEntry = path.resolve(source, entry.name)
    const targetEntry = path.resolve(target, entry.name)
    if (entry.isDirectory()) {
      copyDirectorySync(sourceEntry, targetEntry)
    } else if (entry.isFile()) {
      fs.copyFileSync(sourceEntry, targetEntry)
    }
  }
}

assertPathInside(clientBasePath, sourcePath, '前端构建目录')
assertPathInside(path.resolve(clientBasePath, '..', 'dist'), targetPath, 'Electron 静态资源目录')
if (fs.existsSync(corepackCliPath) === false) {
  throw new Error(`找不到当前 Node.js 自带的 Corepack: ${corepackCliPath}`)
}

console.log(`清空旧构建结果 => ${sourcePath}`)
fs.rmSync(sourcePath, { recursive: true, force: true })

console.log('开始构建前端项目')
const buildResult = childProcess.spawnSync(process.execPath, [corepackCliPath, 'pnpm', 'run', 'build'], {
  cwd: clientBasePath,
  stdio: 'inherit',
})
if (buildResult.error) {
  throw buildResult.error
}
if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

console.log(`复制前端构建结果 ${sourcePath} => ${targetPath}`)
fs.rmSync(targetPath, { recursive: true, force: true })
copyDirectorySync(sourcePath, targetPath)
console.log('前端构建完成')
