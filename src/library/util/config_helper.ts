import RequestConfig from '~/src/config/request'
import CommonUtil from '~/src/library/util/common'

class ConfigHelper {
    // 重新载入配置文件
  static reloadConfig () {
    let localConfig = CommonUtil.getLocalConfig()
    RequestConfig.cookie = _.get(localConfig, ['requestConfig', 'cookie'], '')
  }
}

export default ConfigHelper
