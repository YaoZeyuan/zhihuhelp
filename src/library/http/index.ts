import axios, { AxiosRequestConfig } from 'axios'
import RequestConfig from '~/src/config/request'
import logger from '~/src/library/logger'
import getZhihuEncrypt from '~/src/library/zhihu_encrypt/index'
import request from 'request-promise'
import _ from 'lodash'
import URL from 'url'

const Const_Headers_x_zse_93 = '101_3_2.0'


// 创建axios实例
const http = axios.create({
  timeout: RequestConfig.timeoutMs,
  headers: {
    // 加上ua
    'User-Agent': RequestConfig.ua,
    cookie: RequestConfig.cookie,
  },
})

class Http {
  /**
   * 封装get方法
   * @param url
   * @param config
   */
  static async get(url: string, config: AxiosRequestConfig = {}) {
    // 发送知乎请求时, 需要额外附带校验header, 否则报错

    let cookie_item_list = RequestConfig.cookie.split(';').map(item => item.trim()).filter(item => item.startsWith('d_c0'))
    let raw_d_c0 = cookie_item_list?.[0] || ''
    let cookie_d_c0 = raw_d_c0.split("d_c0=")?.[1] || ''

    let url_obj = new URL.URL(url)
    let encrypt_url = `${url_obj.pathname}?${url_obj.search}`;
    let x_zst_81 = getZhihuEncrypt({
      cookie_d_c0: cookie_d_c0,
      "url": encrypt_url,
    })
    config.headers = {
      ...config.headers,
      'x-zse-93': Const_Headers_x_zse_93,
      'x-zst-81': x_zst_81,
    }

    const response = await http.get(url, config).catch(e => {
      logger.log(`网络请求失败, 您的账号可能因抓取频繁被知乎认为有风险, 在浏览器中访问知乎首页,输入验证码即可恢复`)
      logger.log(`错误内容=> message:${e.message}, stack=>${e.stack}`)
      return {}
    })
    const record = _.get(response, ['data'], {})
    return record
  }

  /**
   * axios封装的arraybuffer由于使用了stream, 重复次数多了之后会出现stream卡死的情况, 且不可恢复
   * 因此改用request封装图片下载请求
   * @param url
   */
  static async downloadImg(url: string): Promise<request.RequestPromise> {
    return await request({
      url,
      method: 'get',
      // 数据以二进制形式返回
      encoding: null,
      timeout: RequestConfig.timeoutMs,
    })
  }
}

export default Http
