import fs from 'node:fs/promises'
import path from 'node:path'
import {
  resolveOutputChildPath,
  sanitizeOutputFilename,
} from '~/src/shared/path/safe_output_path.js'
import { PandocWorkerConverter } from './pandoc_worker_converter.js'
import {
  PANDOC_MARKDOWN_OPTIONS,
  type MarkdownConverter,
  type MarkdownFallbackDetail,
  type MarkdownGenerationOptions,
  type MarkdownGenerationResult,
  type MarkdownHtmlSource,
  type MarkdownImageSourceMap,
  type MarkdownOutputFile,
} from './types.js'

type PreparedSource = {
  sourceRelativeHtmlPath: string
  relativeMarkdownPath: string
  relativeFallbackPath: string
  sourceHtml: string
  preparedHtml: string
}

type ConvertedSource = PreparedSource & {
  content: string
  fallback: boolean
  warnings: unknown[]
  error?: Error
}

const BLOCKED_RELATIVE_SEGMENT_PATTERN = /^(?:\.\.?|)$/
const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i

function normalizeRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
  const segments = normalized.split('/')
  if (
    path.posix.isAbsolute(normalized)
    || segments.some((segment) => BLOCKED_RELATIVE_SEGMENT_PATTERN.test(segment))
  ) {
    throw new Error(`Unsafe relative HTML path: ${relativePath}`)
  }
  return normalized
}

function createPreparedSource(source: MarkdownHtmlSource): PreparedSource {
  const sourceRelativeHtmlPath = normalizeRelativePath(source.relativeHtmlPath)
  if (path.posix.extname(sourceRelativeHtmlPath).toLowerCase() !== '.html') {
    throw new Error(`Markdown source must be an HTML file: ${source.relativeHtmlPath}`)
  }

  const pathSegments = sourceRelativeHtmlPath.split('/')
  const outputDirectory = pathSegments[0] === '单文件版' ? '单文件版' : 'html'
  const rawStem = path.posix.basename(sourceRelativeHtmlPath, path.posix.extname(sourceRelativeHtmlPath))
  const safeStem = sanitizeOutputFilename(rawStem)
  return {
    sourceRelativeHtmlPath,
    relativeMarkdownPath: `${outputDirectory}/${safeStem}.md`,
    relativeFallbackPath: `${outputDirectory}/${safeStem}.pandoc-failed.md`,
    sourceHtml: source.html,
    preparedHtml: source.html,
  }
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
}

function createImageLookup(imageSourceMap: MarkdownImageSourceMap | undefined): Map<string, string> {
  const lookup = new Map<string, string>()
  if (imageSourceMap === undefined) {
    return lookup
  }
  const entries = imageSourceMap instanceof Map
    ? imageSourceMap.entries()
    : Object.entries(imageSourceMap)
  for (const [localPath, remoteUrl] of entries) {
    lookup.set(localPath, remoteUrl)
    lookup.set(localPath.replace(/\\/g, '/'), remoteUrl)
  }
  return lookup
}

function restoreImageSource(rawSource: string, imageLookup: ReadonlyMap<string, string>): string {
  const decodedSource = decodeHtmlAttribute(rawSource)
  return imageLookup.get(rawSource)
    ?? imageLookup.get(decodedSource)
    ?? imageLookup.get(decodedSource.replace(/\\/g, '/'))
    ?? rawSource
}

function restoreRemoteImages(html: string, imageLookup: ReadonlyMap<string, string>): string {
  const withQuotedSources = html.replace(
    /(<img\b[^>]*?\bsrc\s*=\s*)(["'])(.*?)\2/gi,
    (_match, prefix: string, quote: string, source: string) => (
      `${prefix}${quote}${restoreImageSource(source, imageLookup)}${quote}`
    ),
  )
  return withQuotedSources.replace(
    /(<img\b[^>]*?\bsrc\s*=\s*)([^\s"'=<>`]+)/gi,
    (_match, prefix: string, source: string) => `${prefix}${restoreImageSource(source, imageLookup)}`,
  )
}

export function prepareHtmlForMarkdown(
  html: string,
  imageQuality: MarkdownGenerationOptions['imageQuality'],
  imageSourceMap?: MarkdownImageSourceMap,
): string {
  let preparedHtml = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<link\b(?=[^>]*\brel\s*=\s*(?:["']?stylesheet\b))[^>]*>/gi, '')
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside\s*>/gi, '')
    .replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  if (imageQuality === 'none') {
    preparedHtml = preparedHtml
      .replace(/<img\b[^>]*\/?>/gi, '')
      .replace(/<div\b[^>]*\bclass\s*=\s*(["'])[^"']*\bduokan-image-single\b[^"']*\1[^>]*>\s*<\/div\s*>/gi, '')
    return preparedHtml
  }

  return restoreRemoteImages(preparedHtml, createImageLookup(imageSourceMap))
}

function splitLinkSuffix(target: string): { pathname: string; suffix: string } {
  const suffixIndex = target.search(/[?#]/)
  if (suffixIndex < 0) {
    return { pathname: target, suffix: '' }
  }
  return {
    pathname: target.slice(0, suffixIndex),
    suffix: target.slice(suffixIndex),
  }
}

function safelyDecodeUriPath(uriPath: string): string {
  try {
    return decodeURIComponent(uriPath)
  } catch {
    return uriPath
  }
}

function rewriteInternalLink(
  target: string,
  currentSourcePath: string,
  currentOutputPath: string,
  outputPathBySource: ReadonlyMap<string, string>,
): string {
  if (target === '' || EXTERNAL_LINK_PATTERN.test(target)) {
    return target
  }

  const { pathname, suffix } = splitLinkSuffix(target)
  if (path.posix.extname(pathname).toLowerCase() !== '.html') {
    return target
  }

  const decodedPath = safelyDecodeUriPath(pathname).replace(/\\/g, '/')
  const sourceTarget = decodedPath.startsWith('/')
    ? path.posix.normalize(decodedPath.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(currentSourcePath), decodedPath))
  const outputTarget = outputPathBySource.get(sourceTarget)
  if (outputTarget === undefined) {
    return target
  }

  let rewrittenPath = path.posix.relative(path.posix.dirname(currentOutputPath), outputTarget)
  if (rewrittenPath === '') {
    rewrittenPath = path.posix.basename(outputTarget)
  }
  if (pathname.startsWith('./') && rewrittenPath.startsWith('.') === false) {
    rewrittenPath = `./${rewrittenPath}`
  }
  return `${rewrittenPath}${suffix}`
}

function rewriteMarkdownLinks(
  content: string,
  currentSourcePath: string,
  currentOutputPath: string,
  outputPathBySource: ReadonlyMap<string, string>,
): string {
  const withHtmlLinks = content.replace(
    /(\bhref\s*=\s*)(["'])(.*?)\2/gi,
    (_match, prefix: string, quote: string, target: string) => (
      `${prefix}${quote}${rewriteInternalLink(
        target,
        currentSourcePath,
        currentOutputPath,
        outputPathBySource,
      )}${quote}`
    ),
  )

  return withHtmlLinks.replace(/\]\(([^)\n]+)\)/g, (match, rawDestination: string) => {
    const leadingWhitespace = rawDestination.match(/^\s*/)?.[0] ?? ''
    const destinationWithTitle = rawDestination.slice(leadingWhitespace.length)
    if (destinationWithTitle.startsWith('<')) {
      const closingBracket = destinationWithTitle.indexOf('>')
      if (closingBracket < 0) {
        return match
      }
      const target = destinationWithTitle.slice(1, closingBracket)
      const rewrittenTarget = rewriteInternalLink(
        target,
        currentSourcePath,
        currentOutputPath,
        outputPathBySource,
      )
      return `](${leadingWhitespace}<${rewrittenTarget}>${destinationWithTitle.slice(closingBracket + 1)})`
    }

    const targetMatch = destinationWithTitle.match(/^(\S+)/)
    if (targetMatch === null) {
      return match
    }
    const target = targetMatch[1]
    const rewrittenTarget = rewriteInternalLink(
      target,
      currentSourcePath,
      currentOutputPath,
      outputPathBySource,
    )
    return `](${leadingWhitespace}${rewrittenTarget}${destinationWithTitle.slice(target.length)})`
  })
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

async function copyDirectoryFiles(sourceDirectory: string, targetDirectory: string): Promise<void> {
  await fs.mkdir(targetDirectory, { recursive: true })
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = path.resolve(sourceDirectory, entry.name)
    const targetPath = path.resolve(targetDirectory, entry.name)
    if (entry.isDirectory()) {
      await copyDirectoryFiles(sourcePath, targetPath)
      continue
    }
    if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath)
      continue
    }
    throw new Error(`Unsupported Markdown cache entry: ${sourcePath}`)
  }
}

export class MarkdownGenerator {
  private readonly converter: MarkdownConverter

  constructor(converter: MarkdownConverter = new PandocWorkerConverter()) {
    this.converter = converter
  }

  async generate(options: MarkdownGenerationOptions): Promise<MarkdownGenerationResult> {
    const outputPath = resolveOutputChildPath(
      options.outputRootPath,
      options.outputBasename ?? options.bookBasename,
    )
    const cachePath = options.cacheRootPath === undefined
      ? outputPath
      : resolveOutputChildPath(options.cacheRootPath, options.bookBasename)
    const usesSeparateCache = path.resolve(cachePath) !== path.resolve(outputPath)
    const preparedSources = options.sources.map((source) => {
      const preparedSource = createPreparedSource(source)
      preparedSource.preparedHtml = prepareHtmlForMarkdown(
        preparedSource.sourceHtml,
        options.imageQuality,
        options.imageSourceMap,
      )
      return preparedSource
    })

    const sourcePathSet = new Set<string>()
    const regularOutputPathSet = new Set<string>()
    for (const preparedSource of preparedSources) {
      if (sourcePathSet.has(preparedSource.sourceRelativeHtmlPath)) {
        throw new Error(`Duplicate Markdown source path: ${preparedSource.sourceRelativeHtmlPath}`)
      }
      if (regularOutputPathSet.has(preparedSource.relativeMarkdownPath)) {
        throw new Error(`Markdown output path collision: ${preparedSource.relativeMarkdownPath}`)
      }
      sourcePathSet.add(preparedSource.sourceRelativeHtmlPath)
      regularOutputPathSet.add(preparedSource.relativeMarkdownPath)
    }

    const convertedSources: ConvertedSource[] = []
    for (const source of preparedSources) {
      try {
        const converted = await this.converter.convert(source.preparedHtml, PANDOC_MARKDOWN_OPTIONS)
        convertedSources.push({
          ...source,
          content: converted.markdown,
          fallback: false,
          warnings: converted.warnings,
        })
      } catch (error) {
        convertedSources.push({
          ...source,
          content: source.preparedHtml,
          fallback: true,
          warnings: [],
          error: toError(error),
        })
      }
    }

    const outputPathBySource = new Map<string, string>()
    const actualOutputPathSet = new Set<string>()
    for (const source of convertedSources) {
      const actualOutputPath = source.fallback
        ? source.relativeFallbackPath
        : source.relativeMarkdownPath
      if (actualOutputPathSet.has(actualOutputPath)) {
        throw new Error(`Markdown output path collision after fallback: ${actualOutputPath}`)
      }
      actualOutputPathSet.add(actualOutputPath)
      outputPathBySource.set(source.sourceRelativeHtmlPath, actualOutputPath)
    }

    const files: MarkdownOutputFile[] = []
    const details: MarkdownFallbackDetail[] = []
    // Conversion is complete at this point, so a failed Pandoc page can no
    // longer turn directory cleanup into lost output. Limit cleanup to this
    // book's already-sanitized child directory so files from other books and
    // the HTML/EPUB trees are never touched. With a separate cache the old
    // final output remains intact until every cache write succeeds.
    await fs.rm(cachePath, { recursive: true, force: true })
    await fs.mkdir(cachePath, { recursive: true })
    for (const source of convertedSources) {
      const relativeMarkdownPath = outputPathBySource.get(source.sourceRelativeHtmlPath)
      if (relativeMarkdownPath === undefined) {
        throw new Error(`Missing Markdown output mapping: ${source.sourceRelativeHtmlPath}`)
      }
      const rewrittenContent = rewriteMarkdownLinks(
        source.content,
        source.sourceRelativeHtmlPath,
        relativeMarkdownPath,
        outputPathBySource,
      )
      const absoluteCachePath = path.resolve(cachePath, ...relativeMarkdownPath.split('/'))
      const absoluteOutputPath = path.resolve(outputPath, ...relativeMarkdownPath.split('/'))
      await fs.mkdir(path.dirname(absoluteCachePath), { recursive: true })
      await fs.writeFile(absoluteCachePath, rewrittenContent, 'utf8')

      files.push({
        sourceRelativeHtmlPath: source.sourceRelativeHtmlPath,
        relativeMarkdownPath,
        outputPath: absoluteOutputPath,
        fallback: source.fallback,
        warnings: source.warnings,
      })
      if (source.fallback && source.error !== undefined) {
        details.push({
          sourceRelativeHtmlPath: source.sourceRelativeHtmlPath,
          relativeMarkdownPath,
          errorName: source.error.name,
          errorMessage: source.error.message,
        })
      }
    }

    if (usesSeparateCache) {
      await fs.rm(outputPath, { recursive: true, force: true })
      await copyDirectoryFiles(cachePath, outputPath)
    }

    return {
      fileCount: files.length,
      fallbackCount: details.length,
      outputPath,
      files,
      details,
    }
  }

  async dispose(): Promise<void> {
    await this.converter.dispose?.()
  }
}

export async function generateMarkdownBook(
  options: MarkdownGenerationOptions,
  converter?: MarkdownConverter,
): Promise<MarkdownGenerationResult> {
  const generator = new MarkdownGenerator(converter)
  try {
    return await generator.generate(options)
  } finally {
    await generator.dispose()
  }
}
