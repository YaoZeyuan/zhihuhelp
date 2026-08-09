export const VERSION_ENDPOINT = '/api/zhihuhelp/version'

export type PlatformRelease = {
  version: string
  url: string
}

export type ReleaseInfo = {
  downloadUrl: string
  releaseAt: string
  version: string
  windows: PlatformRelease
  mac: PlatformRelease
}

function parsePlatform(value: unknown): PlatformRelease | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  const platform = value as Record<string, unknown>
  if (typeof platform.version !== 'string' || platform.version.trim() === '') return undefined
  if (typeof platform.url !== 'string' || /^https?:\/\//i.test(platform.url) === false) return undefined
  return { version: platform.version, url: platform.url }
}

export function parseReleaseInfo(value: unknown): ReleaseInfo | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  const payload = value as Record<string, unknown>
  const releaseAt = payload.releaseAt as string
  const downloadUrl = payload.downloadUrl as string
  const detail = payload.detail
  if (typeof payload.version !== 'string' || payload.version.trim() === '' || detail === null || typeof detail !== 'object' || Array.isArray(detail)) return undefined
  const platforms = detail as Record<string, unknown>
  const windows = parsePlatform(platforms.windows)
  const mac = parsePlatform(platforms.mac)
  if (!windows || !mac) return undefined
  return { releaseAt, downloadUrl, version: payload.version, windows, mac }
}
