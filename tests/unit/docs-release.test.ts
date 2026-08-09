import { describe, expect, it } from 'vitest'
import { parseReleaseInfo, VERSION_ENDPOINT } from '../../doc/.vitepress/theme/release'

describe('documentation download release contract', () => {
  it('uses the published same-origin version endpoint', () => {
    expect(VERSION_ENDPOINT).toBe('/api/zhihuhelp/version')
  })

  it('accepts a release with separate Windows and macOS downloads', () => {
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
  ])('rejects an incomplete or unsafe release response', (payload) => {
    expect(parseReleaseInfo(payload)).toBeUndefined()
  })
})
