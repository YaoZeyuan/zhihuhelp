import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkUpgrade } from '../../src/application/update/check_upgrade'
import CommonConfig from '../../src/config/common'
import http from '../../src/library/http'

describe('手动检查更新', () => {
  afterEach(() => vi.restoreAllMocks())

  it('请求配置地址并比较语义化版本', async () => {
    const getSpy = vi.spyOn(http.rawInstance, 'get').mockResolvedValue({ data: { version: '99.0.0' } } as never)

    await expect(checkUpgrade()).resolves.toEqual({
      currentVersion: CommonConfig.version,
      latestVersion: '99.0.0',
      hasNewVersion: true,
    })
    expect(getSpy).toHaveBeenCalledWith(CommonConfig.checkUpgradeUri, {
      params: { now: expect.any(String) },
    })
  })

  it('拒绝无效版本响应', async () => {
    vi.spyOn(http.rawInstance, 'get').mockResolvedValue({ data: { version: 'latest' } } as never)
    await expect(checkUpgrade()).rejects.toThrow('版本检查响应缺少有效的 semver version')
  })
})
