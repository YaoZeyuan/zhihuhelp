import fs from 'fs'
import PathConfig from '~/src/config/path'
import TypeConfig from '~/src/type/namespace/config'

export default class InitConfig {
  static getConfig() {
    if (fs.existsSync(PathConfig.configUri) === false) {
      // 没有就初始化一份
      fs.writeFileSync(
        PathConfig.configUri,
        JSON.stringify(
          {
            request: {
              ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
              cookie: '',
            },
          },
          null,
          4,
        ),
      )
    }
    let configJson = fs.readFileSync(PathConfig.configUri)
    let config: TypeConfig.Local
    try {
      config = JSON.parse(configJson.toString())
    } catch (e) {
      config = {
        request: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
          cookie: '',
        },
      }
    }
    return config
  }
}
