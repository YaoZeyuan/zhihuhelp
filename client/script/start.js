const childProcess = require('node:child_process')
const path = require('node:path')

const clientBasePath = path.resolve(__dirname, '..')
const vitePackagePath = require.resolve('vite/package.json', { paths: [clientBasePath] })
const viteCliPath = path.resolve(path.dirname(vitePackagePath), 'bin', 'vite.js')
const result = childProcess.spawnSync(process.execPath, [viteCliPath], {
  cwd: clientBasePath,
  stdio: 'inherit',
})

if (result.error) {
  throw result.error
}
process.exit(result.status ?? 1)
