import axios, { AxiosRequestConfig } from 'axios'
import CommonConfig from '~/src/config/common'
import RequestConfig from '~/src/config/request'
import logger from '~/src/library/logger'
import getZhihuEncrypt from '~/src/library/zhihu_encrypt/index'
import querystring from 'querystring'
import _ from 'lodash'
import URL from 'url'

const Const_Headers_x_zse_93 = '101_3_2.0'

// 创建axios实例
const httpInstance = axios.create({
  timeout: CommonConfig.request_timeout_ms,
  headers: {
    // 加上ua
    'User-Agent': RequestConfig.ua,
    cookie: RequestConfig.cookie,
  },
})

function fixedEncodeURIComponent(str: string) {
  // 不需要对*进行转码
  return encodeURIComponent(str).replace(/[!'()]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16)
  })
}

export default class httpClient {
  /**
   * 原始request请求
   * @param params
   * @returns
   */
  static async rawRequest(...params: Parameters<typeof httpInstance.request>) {
    return httpInstance.request(...params)
  }
  /**
   * 封装get方法
   * @param rawUrl
   * @param config
   */
  static async get(rawUrl: string, config: AxiosRequestConfig = {}) {
    // 发送知乎请求时, 需要额外附带校验header, 否则报错

    let cookie_item_list = RequestConfig.cookie
      .split(';')
      .map((item: string) => item.trim())
      .filter((item: string) => item.startsWith('d_c0'))
    let raw_d_c0 = cookie_item_list?.[0] || ''
    let cookie_d_c0 = raw_d_c0.split('d_c0=')?.[1] || ''

    let url = rawUrl
    if (config.params) {
      // 将config中的参数合并到url中, 以进行统一的签名运算
      url = `${url}?${querystring.stringify(config.params, undefined, undefined, {
        encodeURIComponent: fixedEncodeURIComponent,
      })}`
      delete config.params
    }

    let url_obj = new URL.URL(url)

    let encrypt_url = `${url_obj.pathname}${url_obj.search}`
    let x_zst_96 = getZhihuEncrypt({
      cookie_d_c0: cookie_d_c0,
      url: encrypt_url,
    })
    config.headers = {
      ...config.headers,
      // 加上ua
      'User-Agent': RequestConfig.ua,
      cookie: RequestConfig.cookie,
      'x-zse-93': Const_Headers_x_zse_93,
      'x-zse-96': x_zst_96,
    }

    const response = await httpInstance.get(url, config).catch((e) => {
      logger.log(
        `网络请求失败, 两种可能: 1.知乎更换了接口签名算法, 知乎私信@姚泽源 更新代码 2. 您的账号可能因抓取频繁被知乎认为有风险, 在浏览器中访问知乎首页,输入验证码即可恢复`,
      )
      logger.log(`错误内容=> message:${e.message}, stack=>${e.stack}`)
      return { data: [] }
    })
    const record = response.data || {}
    return record
  }

  /**
   * axios封装的arraybuffer由于使用了stream, 重复次数多了之后会出现stream卡死的情况, 且不可恢复
   * 因此改用request封装图片下载请求
   * @param url
   */
  static async downloadImg(url: string): Promise<Buffer> {
    let res = await httpInstance.get(url, {
      responseType: 'blob',
      timeout: CommonConfig.request_timeout_ms,
    })
    return res.data
  }
}
