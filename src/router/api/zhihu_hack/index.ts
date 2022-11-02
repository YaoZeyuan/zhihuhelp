/**
 * 用于快速调试知乎加密策略
 */
import RouterConfigBuilder from '~/src/library/util/router_config_builder'
import ResponseBuilder from '~/src/library/util/response_builder'
import express from 'express'
import md5 from 'md5'
import zhihuEncrypt from '~/src/library/zhihu_encrypt/lib/zhihu_encrypt'

const Const_Result_Prefix = '2.0'

export default RouterConfigBuilder.register({
  url: '/api/zhihu_hack',
  methodType: RouterConfigBuilder.METHOD_TYPE_GET,
  func: async (request: express.Request, response: express.Response) => {
    let Const_Version = '101_3_3.0'
    let d_c0 = request.query.d_c0
    let url = ''
    let xZst81 = ''

    // 生成完整url
    var info = [
      Const_Version, // 对应于 x-zse-93, 为常量值
      url,
      d_c0,
      xZst81,
    ].join('+')
    var step1 = md5(info)
    var signature = zhihuEncrypt(step1)
    var x_zse_86 = `${Const_Result_Prefix}_${signature}`

    response.json(
      ResponseBuilder.showResult({
        step1,
        signature,
        x_zse_86,
      }),
    )
    return
  },
})
