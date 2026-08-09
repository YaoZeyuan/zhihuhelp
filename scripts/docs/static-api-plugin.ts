import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

export function resolveStaticApiPath(apiRoot: string, requestUrl: string): string | undefined {
  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname)
  } catch {
    return undefined
  }
  if (!pathname.startsWith('/api/')) return undefined
  const relativePath = pathname.slice('/api/'.length).replace(/\\/g, '/')
  if (relativePath === '' || relativePath.split('/').includes('..')) return undefined
  const resolvedRoot = path.resolve(apiRoot)
  const resolvedPath = path.resolve(resolvedRoot, ...relativePath.split('/'))
  const relative = path.relative(resolvedRoot, resolvedPath)
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) return undefined
  return resolvedPath
}

export function staticApiPlugin(apiRoot: string): Plugin {
  return {
    name: 'zhihuhelp-static-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const filePath = resolveStaticApiPath(apiRoot, request.url ?? '')
        if (!filePath) return next()
        let stats: fs.Stats
        try {
          stats = fs.statSync(filePath)
        } catch {
          return next()
        }
        if (!stats.isFile()) return next()
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        fs.createReadStream(filePath).pipe(response)
      })
    },
  }
}
