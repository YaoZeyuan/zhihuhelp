export const PANDOC_MARKDOWN_OPTIONS = Object.freeze({
  from: 'html',
  to: 'gfm-raw_html',
  wrap: 'none',
})

export type PandocMarkdownOptions = typeof PANDOC_MARKDOWN_OPTIONS

export type MarkdownHtmlSource = {
  relativeHtmlPath: string
  html: string
}

export type MarkdownImageSourceMap =
  | ReadonlyMap<string, string>
  | Readonly<Record<string, string>>

export type MarkdownConversionResult = {
  markdown: string
  warnings: unknown[]
}

export interface MarkdownConverter {
  convert(html: string, options?: PandocMarkdownOptions): Promise<MarkdownConversionResult>
  dispose?(): Promise<void> | void
}

export type MarkdownGenerationOptions = {
  sources: readonly MarkdownHtmlSource[]
  outputRootPath: string
  outputBasename?: string
  cacheRootPath?: string
  bookBasename: string
  imageQuality: 'hd' | 'raw' | 'none'
  imageSourceMap?: MarkdownImageSourceMap
}

export type MarkdownOutputFile = {
  sourceRelativeHtmlPath: string
  relativeMarkdownPath: string
  outputPath: string
  fallback: boolean
  warnings: unknown[]
}

export type MarkdownFallbackDetail = {
  sourceRelativeHtmlPath: string
  relativeMarkdownPath: string
  errorName: string
  errorMessage: string
}

export type MarkdownGenerationResult = {
  fileCount: number
  fallbackCount: number
  outputPath: string
  files: MarkdownOutputFile[]
  details: MarkdownFallbackDetail[]
}
