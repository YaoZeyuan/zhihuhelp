import semver from 'semver'
import CommonConfig from '~/src/config/common.js'
import http from '~/src/library/http/index.js'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error.js'

export type UpgradeCheckResult = {
  currentVersion: string
  latestVersion: string
  hasNewVersion: boolean
  "downloadUrl": string
  "releaseAt": string
  "releaseNote": string
}

export async function checkUpgrade(): Promise<UpgradeCheckResult> {
  const response = await http.rawInstance.get(CommonConfig.checkUpgradeUri, {
    params: { now: new Date().toISOString() },
  }) as {
    data: {
      "downloadUrl": string
      "releaseAt": string
      "releaseNote": string
      "version": string
    }
  }
  const remoteVersion = typeof response.data?.version === 'string' ? semver.valid(response.data.version) : null
  const currentVersion = semver.valid(CommonConfig.version)
  if (remoteVersion === null) {
    throw new ApplicationError(AppErrorCode.VERSION_CHECK_FAILED, '版本检查响应缺少有效的 semver version')
  }
  if (currentVersion === null) {
    throw new ApplicationError(AppErrorCode.VERSION_CHECK_FAILED, '本地应用版本无法按 semver 解析')
  }
  return {
    currentVersion,
    latestVersion: remoteVersion,
    hasNewVersion: semver.gt(remoteVersion, currentVersion),
    "downloadUrl": response.data.downloadUrl,
    "releaseAt": response.data.releaseAt,
    "releaseNote": response.data.releaseNote,
  }
}
