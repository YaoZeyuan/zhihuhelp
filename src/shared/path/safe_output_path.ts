import path from 'node:path'
import { createHash } from 'node:crypto'

const WINDOWS_RESERVED_NAME_PATTERN = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i
const OUTPUT_ROOT_RESERVED_ENTRY_NAME_SET = new Set(['html', 'markdown', 'epub', 'json', 'diagnostics'])

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

/**
 * Resolve the directory assigned to one generated book.
 *
 * Some output-root entries are owned by non-book features or by an older
 * layout. A book whose title matches one of those entries must never reuse or
 * clear it, so reserved names receive a deterministic, hash-suffixed alias.
 */
export function sanitizeBookOutputDirectoryName(input: string): string {
  const safeEpubFilename = sanitizeOutputFilename(`${sanitizeOutputFilename(input)}.epub`)
  const safeName = safeEpubFilename.slice(0, -'.epub'.length)
  if (OUTPUT_ROOT_RESERVED_ENTRY_NAME_SET.has(safeName.toLowerCase()) === false) {
    return safeName
  }
  const hash = createHash('sha256').update(safeName).digest('hex').slice(0, 12)
  return sanitizeOutputFilename(`zhihuhelp-book-${safeName}-${hash}`)
}

export function resolveBookOutputPath(rootPath: string, bookname: string): string {
  return resolveOutputChildPath(rootPath, sanitizeBookOutputDirectoryName(bookname))
}
