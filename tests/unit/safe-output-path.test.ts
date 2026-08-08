import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isPathInsideRoot,
  resolveOutputChildPath,
  sanitizeOutputFilename,
} from '../../src/shared/path/safe_output_path'

describe('safe output paths', () => {
  it('removes path traversal and Windows-reserved filename characters', () => {
    const safeName = sanitizeOutputFilename('../A/B:C*D?E"F<G>H|I')
    const unicodeSafeName = sanitizeOutputFilename('../A&B/:*? 测试书')
    expect(safeName).not.toMatch(/[<>:"/\\|?*]/)
    expect(unicodeSafeName).not.toMatch(/[<>:"/\\|?*]/)
    expect(safeName).not.toContain('..')
    expect(isPathInsideRoot('D:\\output', resolveOutputChildPath('D:\\output', '../escape'))).toBe(true)
  })

  it('keeps long split-volume names distinct with a stable hash suffix', () => {
    const title = '超长标题'.repeat(40)
    const first = sanitizeOutputFilename(`${title}_1-of-2卷`)
    const second = sanitizeOutputFilename(`${title}_2-of-2卷`)
    expect(first).not.toBe(second)
    expect(first.length).toBeLessThanOrEqual(120)
    expect(second.length).toBeLessThanOrEqual(120)
  })

  it.each([115, 116, 120, 121])('preserves the epub extension at the %s-character boundary', (length) => {
    const basename = sanitizeOutputFilename('a'.repeat(length))
    const outputPath = resolveOutputChildPath('D:\\output', `${basename}.epub`)
    expect(path.extname(outputPath)).toBe('.epub')
    expect(path.basename(outputPath).length).toBeLessThanOrEqual(120)
  })

  it('accepts only the configured output root and its descendants', () => {
    const root = path.resolve('D:\\output')
    expect(isPathInsideRoot(root, path.join(root, 'book', 'index.html'))).toBe(true)
    expect(isPathInsideRoot(root, path.resolve(root, '..', 'secret.txt'))).toBe(false)
  })
})
