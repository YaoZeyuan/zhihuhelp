import type * as TypeAuthor from '~/src/type/zhihu/author.js'

export type PersistedAuthorIdentity = {
  id?: unknown
  url_token?: unknown
}

export interface ResolvedAuthorIdentity {
  author: TypeAuthor.Record
  requestedIdentifier: string
  authorId: string
  urlToken: string
  aliases: string[]
}

export function normalizeAuthorIdentifier(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return ''
  }
  return String(value).trim()
}

export function normalizeAuthorAliases(values: readonly unknown[]): string[] {
  const aliases: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const alias = normalizeAuthorIdentifier(value)
    if (alias === '' || seen.has(alias)) {
      continue
    }
    seen.add(alias)
    aliases.push(alias)
  }
  return aliases
}

export function getStableAuthorId(author: Pick<TypeAuthor.Record, 'id'>): string {
  return normalizeAuthorIdentifier(author.id)
}

export function getCanonicalAuthorUrlToken(author: Pick<TypeAuthor.Record, 'id' | 'url_token'>): string {
  return normalizeAuthorIdentifier(author.url_token) || getStableAuthorId(author)
}

export function createAuthorProfileUrl(author: Pick<TypeAuthor.Record, 'id' | 'url_token'>): string {
  const displayIdentifier = getCanonicalAuthorUrlToken(author)
  return displayIdentifier === '' ? '' : `https://www.zhihu.com/people/${encodeURIComponent(displayIdentifier)}`
}

export function collectAuthorAliases(
  author: Pick<TypeAuthor.Record, 'id' | 'url_token'>,
  requestedIdentifier?: unknown,
  persistedIdentity: PersistedAuthorIdentity = {},
): string[] {
  return normalizeAuthorAliases([
    author.url_token,
    requestedIdentifier,
    author.id,
    persistedIdentity.url_token,
    persistedIdentity.id,
  ])
}

export function createResolvedAuthorIdentity(
  author: TypeAuthor.Record,
  requestedIdentifier: unknown,
  persistedIdentity: PersistedAuthorIdentity = {},
): ResolvedAuthorIdentity {
  const requested = normalizeAuthorIdentifier(requestedIdentifier)
  const authorId = getStableAuthorId(author) || normalizeAuthorIdentifier(persistedIdentity.id)
  const urlToken =
    normalizeAuthorIdentifier(author.url_token) || normalizeAuthorIdentifier(persistedIdentity.url_token) || authorId
  const canonicalAuthor = {
    ...author,
    id: authorId,
    url_token: urlToken,
  } as TypeAuthor.Record

  return {
    author: canonicalAuthor,
    requestedIdentifier: requested,
    authorId,
    urlToken,
    aliases: collectAuthorAliases(author, requested, persistedIdentity),
  }
}
