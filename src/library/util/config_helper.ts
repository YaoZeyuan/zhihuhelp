import RequestConfig from '~/src/config/request'
import InitConfig from '~/src/config/init_config'
import _ from 'lodash'

class ConfigHelper {
  // 重新载入配置文件
  static reloadConfig() {
    let config = InitConfig.getConfig()
    RequestConfig.cookie = _.get(config, ['config', 'cookie'], '')
  }
}

export default ConfigHelper
