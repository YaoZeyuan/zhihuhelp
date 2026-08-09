import path from 'node:path'
import { createHash } from 'node:crypto'

const WINDOWS_RESERVED_NAME_PATTERN = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i

export function sanitizeOutputFilename(input: string, fallback = 'zhihuhelp-output'): string {
  const normalized = String(input ?? '')
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/[. ]+$/g, '')
    .replace(/^\s+|\s+$/g, '')

  const nonEmptyName = normalized === '' ? fallback : normalized
  const extension = path.extname(nonEmptyName)
  const preservedExtension = /^\.[a-z0-9]{1,10}$/i.test(extension) ? extension : ''
  const hash = createHash('sha256').update(nonEmptyName).digest('hex').slice(0, 12)
  const prefixLength = 120 - preservedExtension.length - hash.length - 1
  const safeName = nonEmptyName.length <= 120
    ? nonEmptyName
    : `${nonEmptyName.slice(0, prefixLength)}-${hash}${preservedExtension}`
  return WINDOWS_RESERVED_NAME_PATTERN.test(safeName) ? `_${safeName}` : safeName
}

export function isPathInsideRoot(rootPath: string, targetPath: string): boolean {
  const resolvedRoot = path.resolve(rootPath)
  const resolvedTarget = path.resolve(targetPath)
  const relativePath = path.relative(resolvedRoot, resolvedTarget)
  return (
    relativePath === ''
    || (relativePath !== '..'
      && relativePath.startsWith(`..${path.sep}`) === false
      && path.isAbsolute(relativePath) === false)
  )
}

export function resolveOutputChildPath(rootPath: string, rawFilename: string): string {
  const safeFilename = sanitizeOutputFilename(rawFilename)
  const targetPath = path.resolve(rootPath, safeFilename)
  if (isPathInsideRoot(rootPath, targetPath) === false || targetPath === path.resolve(rootPath)) {
    throw new Error(`输出文件名无法安全解析: ${rawFilename}`)
  }
  return targetPath
}
