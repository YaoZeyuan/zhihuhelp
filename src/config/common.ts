import path from 'path'
import { CommonUtil } from '~/src/library/util/common'
export class CommonConfig {
  // 使用serverless实现
  static readonly checkUpgradeUri = 'https://api.yaozeyuan.online/zhihuhelp/version'

  static readonly db_version = '1.0.1'
  static readonly db_uri: string = path.resolve(__dirname, `../../zhihu_v${CommonConfig.db_version}.sqlite`)

  /**
   * 每次停止执行任务时长
   */
  static protect_To_Wait_ms = 1000
  /**
   * 每x次任务, 触发一次执行保护
   */
  static protect_Loop_Count = 10

  static readonly request_timeout_ms = 20 * 1000

  // 通过CommonConfig统一管理cookie/ua
  static ua = ''
  static cookie = ''
  static version = '1.0.0'

  static reloadTaskConfig() {
    // 更新版本号
    this.version = CommonUtil.getVersion()

    // 更新配置信息
    let config = CommonUtil.getConfig()
    this.ua = config.requestConfig.ua
    this.cookie = config.requestConfig.cookie
  }
}
