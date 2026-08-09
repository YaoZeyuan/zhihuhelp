export type ZhihuLoginProfile = {
  id?: unknown
  url_token?: unknown
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function isAuthenticatedZhihuProfile(value: unknown): value is ZhihuLoginProfile {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const profile = value as ZhihuLoginProfile
  return hasNonEmptyString(profile.id) || hasNonEmptyString(profile.url_token)
}
