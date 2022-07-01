import path from 'path'
export class CommonConfig {
  // 感谢github-page, 免费cdn
  static readonly checkUpgradeUri = 'https://api.bookflaneur.cn/zhihuhelp/version'

  static readonly db_version = '1.0.1'
  static readonly db_uri: string = path.resolve(__dirname, `../../zhihu_v${CommonConfig.db_version}.sqlite`)

  /**
   * 保护知乎服务器的时间
   */
  static wait2ProtectZhihuServer_s = 1
  /**
   * 每x次抓取触发一次保护
   */
  static perLoop2TriggerProtect = 10
  static timeoutMs = 20 * 1000
}
