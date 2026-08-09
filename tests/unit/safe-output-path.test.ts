import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isPathInsideRoot,
  resolveBookOutputPath,
  resolveOutputChildPath,
  sanitizeBookOutputDirectoryName,
  sanitizeOutputFilename,
} from '../../src/shared/path/safe_output_path'

describe('安全输出路径', () => {
  it('移除路径穿越片段和 Windows 保留的文件名字符', () => {
    const safeName = sanitizeOutputFilename('../A/B:C*D?E"F<G>H|I')
    const unicodeSafeName = sanitizeOutputFilename('../A&B/:*? 测试书')
    expect(safeName).not.toMatch(/[<>:"/\\|?*]/)
    expect(unicodeSafeName).not.toMatch(/[<>:"/\\|?*]/)
    expect(safeName).not.toContain('..')
    expect(isPathInsideRoot('D:\\output', resolveOutputChildPath('D:\\output', '../escape'))).toBe(true)
  })

  it('使用稳定 hash 后缀区分过长的分卷名称', () => {
    const title = '超长标题'.repeat(40)
    const first = sanitizeOutputFilename(`${title}_1-of-2卷`)
    const second = sanitizeOutputFilename(`${title}_2-of-2卷`)
    expect(first).not.toBe(second)
    expect(first.length).toBeLessThanOrEqual(120)
    expect(second.length).toBeLessThanOrEqual(120)
  })

  it.each([115, 116, 120, 121])('在 %s 字符边界保留 epub 扩展名', (length) => {
    const basename = sanitizeOutputFilename('a'.repeat(length))
    const outputPath = resolveOutputChildPath('D:\\output', `${basename}.epub`)
    expect(path.extname(outputPath)).toBe('.epub')
    expect(path.basename(outputPath).length).toBeLessThanOrEqual(120)
  })

  it('仅接受配置的输出根目录及其后代路径', () => {
    const root = path.resolve('D:\\output')
    expect(isPathInsideRoot(root, path.join(root, 'book', 'index.html'))).toBe(true)
    expect(isPathInsideRoot(root, path.resolve(root, '..', 'secret.txt'))).toBe(false)
  })

  it.each(['html', 'Markdown', 'EPUB', 'json', 'diagnostics'])(
    '为输出根保留名称 %s 生成稳定的书籍目录替代名',
    (bookname) => {
      const first = sanitizeBookOutputDirectoryName(bookname)
      const second = sanitizeBookOutputDirectoryName(bookname)
      expect(first).toBe(second)
      expect(first.toLowerCase()).not.toBe(bookname.toLowerCase())
      expect(first).not.toMatch(/[<>:"/\\|?*]/)
      expect(resolveBookOutputPath('D:\\output', bookname)).toBe(path.resolve('D:\\output', first))
    },
  )
})
