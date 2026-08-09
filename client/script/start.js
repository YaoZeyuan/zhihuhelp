const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const clientBasePath = path.resolve(__dirname, '..')
const corepackCliPath = path.resolve(path.dirname(process.execPath), 'node_modules', 'corepack', 'dist', 'corepack.js')
if (fs.existsSync(corepackCliPath) === false) {
  throw new Error(`找不到当前 Node.js 自带的 Corepack: ${corepackCliPath}`)
}
const result = childProcess.spawnSync(process.execPath, [corepackCliPath, 'pnpm', 'run', 'dev'], {
  cwd: clientBasePath,
  stdio: 'inherit',
})

if (result.error) {
  throw result.error
}
process.exit(result.status ?? 1)
