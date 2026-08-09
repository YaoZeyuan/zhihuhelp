const fs = require('node:fs')
const path = require('node:path')

const REPOSITORY_ROOT = path.resolve(__dirname, '..', '..')
const SITE_ROOT = path.join(REPOSITORY_ROOT, 'doc')
const DIST_ROOT = path.join(SITE_ROOT, '.vitepress', 'dist')
const SITE_ORIGIN = 'https://zhihuhelp.yaozeyuan.online'
const EXPECTED_CNAME = 'zhihuhelp.yaozeyuan.online'

const REQUIRED_ROUTES = [
  '/',
  '/guide/',
  '/guide/getting-started',
  '/guide/features',
  '/guide/data-and-output',
  '/guide/faq',
  '/dev/',
  '/dev/environment',
  '/dev/architecture',
  '/dev/workflows',
  '/dev/frontend-electron-backend',
  '/dev/data-and-logging',
  '/dev/testing-and-fixtures',
  '/dev/maintenance',
  '/about/',
]

const REQUIRED_STATIC_ASSETS = [
  'CNAME',
  'og.png',
  'brand/icon.png',
  'brand/知乎助手-宣传图.png',
  'screenshots/task-management.png',
  'screenshots/runtime-log.png',
  'screenshots/data-explorer.png',
  'screenshots/output-preview.png',
]

const FORBIDDEN_STATIC_ASSETS = ['brand/kanshan.png']

const EXPECTED_MERMAID_DIAGRAM_COUNT = 7

const TEXT_FILE_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.svg', '.txt', '.xml'])

const SENSITIVE_PATTERNS = [
  {
    name: 'private key',
    pattern: /-----BEGIN (?:EC |OPENSSH |RSA )?PRIVATE KEY-----/i,
  },
  {
    name: 'GitHub access token',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  {
    name: 'AWS access key',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: 'authorization credential',
    pattern: /\bAuthorization\s*[:=]\s*["']?(?:Basic|Bearer)\s+[A-Za-z0-9+/_=.-]{12,}/i,
  },
  {
    name: 'Zhihu session cookie',
    pattern: /\b(?:z_c0|d_c0|__zse_ck|SESSIONID)\s*=\s*["']?[^\s<>'"`;]{8,}/i,
  },
  {
    name: 'Windows local path',
    pattern: /\b[A-Za-z]:[\\/](?:Users|win_www)[\\/][^\s<>'"]+/i,
  },
  {
    name: 'Unix home path',
    pattern: /(?:^|[\s"'`(])\/(?:home|Users)\/[A-Za-z0-9._-]+\/[^\s<>"'`]+/m,
  },
]

const errors = new Set()

function report(message) {
  errors.add(message)
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath]
  })
}

function relativeToDist(filePath) {
  return path.relative(DIST_ROOT, filePath).split(path.sep).join('/')
}

function readTrimmed(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([\da-f]+);/gi, (_match, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function hasForbiddenRoute(urlPath) {
  const decoded = safeDecode(urlPath).replace(/\\/g, '/')
  const segments = decoded.split('/').filter(Boolean)
  return segments.includes('task') || segments.includes('项目文档')
}

function outputFileForUrlPath(urlPath) {
  const decodedPath = safeDecode(urlPath)
  const normalizedPath = path.posix.normalize(`/${decodedPath}`).replace(/^\/+/, '')
  const resolvedPath = path.resolve(DIST_ROOT, ...normalizedPath.split('/'))
  const relative = path.relative(DIST_ROOT, resolvedPath)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null
  }

  const candidates = []
  if (!normalizedPath || decodedPath.endsWith('/')) {
    candidates.push(path.join(resolvedPath, 'index.html'))
  } else {
    candidates.push(resolvedPath)
    if (!path.posix.extname(normalizedPath)) {
      candidates.push(`${resolvedPath}.html`, path.join(resolvedPath, 'index.html'))
    }
  }

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

function routeForHtmlFile(filePath) {
  const relative = relativeToDist(filePath)
  if (relative === 'index.html') {
    return '/'
  }
  if (relative.endsWith('/index.html')) {
    return `/${relative.slice(0, -'index.html'.length)}`
  }
  return `/${relative}`
}

function collectHtmlIds(filePath) {
  const html = fs.readFileSync(filePath, 'utf8')
  const ids = new Set()
  const attributePattern = /\s(?:id|name)\s*=\s*["']([^"']+)["']/gi
  let match
  while ((match = attributePattern.exec(html)) !== null) {
    ids.add(decodeHtml(match[1]))
  }
  return ids
}

const htmlIdCache = new Map()

function verifyReference(reference, sourceUrl, sourceLabel) {
  const rawReference = decodeHtml(reference.trim())
  if (!rawReference || /^(?:data|javascript|mailto|tel):/i.test(rawReference) || rawReference.startsWith('//')) {
    return
  }

  let resolved
  try {
    resolved = new URL(rawReference, `${SITE_ORIGIN}${sourceUrl}`)
  } catch {
    report(`${sourceLabel}: invalid URL ${JSON.stringify(rawReference)}`)
    return
  }

  if (resolved.origin !== SITE_ORIGIN) {
    return
  }

  if (hasForbiddenRoute(resolved.pathname)) {
    report(`${sourceLabel}: links to excluded route ${resolved.pathname}`)
    return
  }

  const targetFile = outputFileForUrlPath(resolved.pathname)
  if (!targetFile) {
    report(`${sourceLabel}: missing internal target ${resolved.pathname}`)
    return
  }

  if (resolved.hash && path.extname(targetFile).toLowerCase() === '.html') {
    const expectedId = safeDecode(resolved.hash.slice(1))
    if (expectedId) {
      if (!htmlIdCache.has(targetFile)) {
        htmlIdCache.set(targetFile, collectHtmlIds(targetFile))
      }
      if (!htmlIdCache.get(targetFile).has(expectedId)) {
        report(`${sourceLabel}: missing anchor #${expectedId} in ${relativeToDist(targetFile)}`)
      }
    }
  }
}

function verifyHtmlReferences(filePath) {
  const html = fs.readFileSync(filePath, 'utf8')
  const sourceUrl = routeForHtmlFile(filePath)
  const sourceLabel = relativeToDist(filePath)
  const attributePattern = /\s(?:href|poster|src)\s*=\s*["']([^"']+)["']/gi
  const srcsetPattern = /\ssrcset\s*=\s*["']([^"']+)["']/gi
  let match

  while ((match = attributePattern.exec(html)) !== null) {
    verifyReference(match[1], sourceUrl, sourceLabel)
  }

  while ((match = srcsetPattern.exec(html)) !== null) {
    if (/^\s*data:/i.test(match[1])) {
      continue
    }
    for (const candidate of match[1].split(',')) {
      const reference = candidate.trim().split(/\s+/)[0]
      verifyReference(reference, sourceUrl, sourceLabel)
    }
  }
}

function verifyCssReferences(filePath) {
  const css = fs.readFileSync(filePath, 'utf8')
  const sourceUrl = `/${relativeToDist(filePath)}`
  const sourceLabel = relativeToDist(filePath)
  const urlPattern = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi
  let match

  while ((match = urlPattern.exec(css)) !== null) {
    verifyReference(match[2], sourceUrl, sourceLabel)
  }
}

function verifyCname() {
  const sourceCname = path.join(SITE_ROOT, 'public', 'CNAME')
  const builtCname = path.join(DIST_ROOT, 'CNAME')

  for (const [label, filePath] of [
    ['source CNAME', sourceCname],
    ['built CNAME', builtCname],
  ]) {
    if (!fs.existsSync(filePath)) {
      report(`${label} is missing: ${path.relative(REPOSITORY_ROOT, filePath)}`)
      continue
    }
    if (readTrimmed(filePath) !== EXPECTED_CNAME) {
      report(`${label} must contain exactly ${EXPECTED_CNAME}`)
    }
  }
}

function verifyRequiredRoutes() {
  for (const route of REQUIRED_ROUTES) {
    if (!outputFileForUrlPath(route)) {
      report(`required public route was not built: ${route}`)
    }
  }
}

function verifyRequiredStaticAssets() {
  for (const relativePath of REQUIRED_STATIC_ASSETS) {
    const filePath = path.join(DIST_ROOT, ...relativePath.split('/'))
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      report(`required static asset is missing or empty: ${relativePath}`)
    }
  }

  for (const relativePath of FORBIDDEN_STATIC_ASSETS) {
    const filePath = path.join(DIST_ROOT, ...relativePath.split('/'))
    if (fs.existsSync(filePath)) {
      report(`forbidden static asset was published: ${relativePath}`)
    }
  }
}

function verifyExcludedRoutes(files) {
  for (const filePath of files) {
    const relative = relativeToDist(filePath)
    if (hasForbiddenRoute(`/${relative}`)) {
      report(`excluded route was emitted: ${relative}`)
    }

    if (!TEXT_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
      continue
    }

    const text = fs.readFileSync(filePath, 'utf8')
    const serializedRoutePattern = /["'`]\/(?:task|项目文档|%E9%A1%B9%E7%9B%AE%E6%96%87%E6%A1%A3)(?:\/|[?#"'`])/i
    if (serializedRoutePattern.test(text)) {
      report(`excluded route is referenced by built artifact: ${relative}`)
    }
  }
}

function verifySensitiveContent(files) {
  for (const filePath of files) {
    if (!TEXT_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
      continue
    }

    const text = fs.readFileSync(filePath, 'utf8')
    for (const { name, pattern } of SENSITIVE_PATTERNS) {
      if (pattern.test(text)) {
        report(`${relativeToDist(filePath)}: contains possible ${name}`)
      }
    }
  }
}

function verifyGeneratedFeatures(files) {
  const sitemapPath = path.join(DIST_ROOT, 'sitemap.xml')
  if (!fs.existsSync(sitemapPath)) {
    report('sitemap.xml was not generated')
  } else {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8')
    const locationPattern = /<loc>([^<]+)<\/loc>/gi
    let match
    while ((match = locationPattern.exec(sitemap)) !== null) {
      verifyReference(match[1], '/sitemap.xml', 'sitemap.xml')
    }
  }
  if (!files.some((filePath) => /localSearchIndex.*\.js$/i.test(filePath))) {
    report('the VitePress local search index was not generated')
  }

  const mermaidDiagramCount = files
    .filter((filePath) => path.extname(filePath).toLowerCase() === '.html')
    .reduce((count, filePath) => {
      const html = fs.readFileSync(filePath, 'utf8')
      return count + (html.match(/class=["'][^"']*\bmermaid-diagram\b[^"']*["']/gi)?.length ?? 0)
    }, 0)
  if (mermaidDiagramCount !== EXPECTED_MERMAID_DIAGRAM_COUNT) {
    report(`expected ${EXPECTED_MERMAID_DIAGRAM_COUNT} Mermaid diagrams, found ${mermaidDiagramCount}`)
  }
}

function main() {
  if (!fs.existsSync(DIST_ROOT)) {
    console.error('Documentation build is missing. Run `pnpm docs:build` first.')
    process.exitCode = 1
    return
  }

  const files = walkFiles(DIST_ROOT)
  verifyCname()
  verifyRequiredRoutes()
  verifyRequiredStaticAssets()
  verifyGeneratedFeatures(files)
  verifyExcludedRoutes(files)
  verifySensitiveContent(files)

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase()
    if (extension === '.html') {
      verifyHtmlReferences(filePath)
    } else if (extension === '.css') {
      verifyCssReferences(filePath)
    }
  }

  if (errors.size > 0) {
    console.error(`Documentation verification failed with ${errors.size} error(s):`)
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log(
    `Documentation verification passed: ${REQUIRED_ROUTES.length} routes and ${files.length} built files checked.`,
  )
}

main()
