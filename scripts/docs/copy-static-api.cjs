const fs = require('node:fs')
const path = require('node:path')

const REPOSITORY_ROOT = path.resolve(__dirname, '..', '..')
const API_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'api')
const DIST_ROOT = path.join(REPOSITORY_ROOT, 'doc', '.vitepress', 'dist')
const API_DIST_ROOT = path.join(DIST_ROOT, 'api')

function assertDirectory(directory, label) {
  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
    throw new Error(`${label} is missing or is not a directory: ${directory}`)
  }
}

function assertInside(parentDirectory, targetPath) {
  const relativePath = path.relative(parentDirectory, targetPath)
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to access a path outside its expected directory: ${targetPath}`)
  }
}

function assertNoSymbolicLinks(targetPath) {
  const stats = fs.lstatSync(targetPath)
  if (stats.isSymbolicLink()) {
    throw new Error(`Refusing to replace a symbolic link in the API output: ${targetPath}`)
  }
  if (!stats.isDirectory()) {
    return
  }

  for (const entry of fs.readdirSync(targetPath)) {
    assertNoSymbolicLinks(path.join(targetPath, entry))
  }
}

function scanSourceDirectory(directory, relativeDirectory = '') {
  const directories = []
  const files = []

  for (const entry of fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))) {
    const sourcePath = path.join(directory, entry.name)
    const relativePath = path.join(relativeDirectory, entry.name)

    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed in the public API directory: ${relativePath}`)
    }
    if (entry.isDirectory()) {
      directories.push(relativePath)
      const nested = scanSourceDirectory(sourcePath, relativePath)
      directories.push(...nested.directories)
      files.push(...nested.files)
      continue
    }
    if (entry.isFile()) {
      files.push(relativePath)
      continue
    }

    throw new Error(`Unsupported entry in the public API directory: ${relativePath}`)
  }

  return { directories, files }
}

function main() {
  assertDirectory(API_SOURCE_ROOT, 'Public API source directory')
  assertDirectory(DIST_ROOT, 'Documentation build output')
  assertInside(DIST_ROOT, API_DIST_ROOT)

  const { directories, files } = scanSourceDirectory(API_SOURCE_ROOT)
  if (files.length === 0) {
    throw new Error(`Public API source directory contains no files: ${API_SOURCE_ROOT}`)
  }

  if (fs.existsSync(API_DIST_ROOT)) {
    assertNoSymbolicLinks(API_DIST_ROOT)
  }

  fs.rmSync(API_DIST_ROOT, { recursive: true, force: true })
  fs.mkdirSync(API_DIST_ROOT, { recursive: true })

  for (const relativeDirectory of directories) {
    const targetDirectory = path.resolve(API_DIST_ROOT, relativeDirectory)
    assertInside(API_DIST_ROOT, targetDirectory)
    fs.mkdirSync(targetDirectory, { recursive: true })
  }

  let totalBytes = 0
  for (const relativePath of files) {
    const sourcePath = path.resolve(API_SOURCE_ROOT, relativePath)
    const targetPath = path.resolve(API_DIST_ROOT, relativePath)
    assertInside(API_SOURCE_ROOT, sourcePath)
    assertInside(API_DIST_ROOT, targetPath)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
    totalBytes += fs.statSync(sourcePath).size
  }

  console.log(`Copied ${files.length} public API file(s) (${totalBytes} bytes) to ${API_DIST_ROOT}.`)
}

main()
