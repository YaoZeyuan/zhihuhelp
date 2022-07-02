import path from 'path'
export class CommonConfig {
  // 感谢github-page, 免费cdn
  static readonly checkUpgradeUri = 'https://api.bookflaneur.cn/zhihuhelp/version'

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
}
