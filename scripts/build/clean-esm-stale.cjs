const fs = require('node:fs')
const path = require('node:path')

const repositoryRoot = path.resolve(__dirname, '../..')
const staleRelativePathList = [
  'dist/src',
  'dist/preload.js',
  'dist/preload.js.map',
  'dist/public/js-rpc/preload.js',
  'dist/public/js-rpc/preload.js.map',
]

for (const relativePath of staleRelativePathList) {
  const targetPath = path.resolve(repositoryRoot, relativePath)
  fs.rmSync(targetPath, { recursive: true, force: true })
}
