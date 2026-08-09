declare module 'pandoc-wasm' {
  export type PandocConvertOptions = {
    from: string
    to: string
    wrap?: string
    [key: string]: unknown
  }

  export type PandocConvertResult = {
    stdout: string
    stderr: string
    warnings: unknown[]
    files: Record<string, Blob | string>
    mediaFiles: Record<string, Blob>
  }

  export function convert(
    options: PandocConvertOptions,
    stdin: string | null,
    files: Record<string, Blob | string>,
  ): Promise<PandocConvertResult>
}

