import CommonUtil from '~/src/library/util/common.js'

const constUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"

export default class RequestConfig {

  // Request配置为动态配置, 需要单独进行拆分, 避免循环依赖
  static ua = constUa
  static cookie = ''

  static reloadTaskConfig() {
    // 更新配置信息
    let config = CommonUtil.getConfig()
    RequestConfig.ua = constUa
    RequestConfig.cookie = config.requestConfig.cookie
  }

  static setRequestConfig(config: { ua: string; cookie: string }) {
    RequestConfig.ua = constUa
    RequestConfig.cookie = config.cookie
  }
}