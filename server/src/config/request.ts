import CommonUtil from '~/src/library/util/common'

export default class RequestConfig {
  // Request配置为动态配置, 需要单独进行拆分, 避免循环依赖
  static ua = ''
  static cookie = ''

  static reloadTaskConfig() {
    // 更新配置信息
    let config = CommonUtil.getConfig()
    this.ua = config.requestConfig.ua
    this.cookie = config.requestConfig.cookie
  }
}
