import { describe, expect, it } from 'vitest'
import { parseReleaseInfo, VERSION_ENDPOINT } from '../../doc/.vitepress/theme/release'

describe('文档下载版本契约', () => {
  it('使用已发布的同源版本端点', () => {
    expect(VERSION_ENDPOINT).toBe('/api/zhihuhelp/version')
  })

  it('接受 Windows 和 macOS 分别提供下载地址的版本', () => {
    expect(parseReleaseInfo({
      version: '2.5.1',
      detail: {
        windows: { version: '2.5.1', url: 'https://download.example/windows' },
        mac: { version: '2.5.1', url: 'https://download.example/mac' },
      },
    })).toEqual({
      version: '2.5.1',
      windows: { version: '2.5.1', url: 'https://download.example/windows' },
      mac: { version: '2.5.1', url: 'https://download.example/mac' },
    })
  })

  it.each([
    {},
    { version: '2.5.1', detail: {} },
    { version: '2.5.1', detail: { windows: { version: '2.5.1', url: '/local' }, mac: { version: '2.5.1', url: 'https://download.example/mac' } } },
  ])('拒绝不完整或不安全的版本响应（用例 %#）', (payload) => {
    expect(parseReleaseInfo(payload)).toBeUndefined()
  })
})
