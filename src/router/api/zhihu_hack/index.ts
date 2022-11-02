/**
 * 用于快速调试知乎加密策略
 */
import RouterConfigBuilder from '~/src/library/util/router_config_builder'
import ResponseBuilder from '~/src/library/util/response_builder'
import express from 'express'
import md5 from 'md5'
import zhihuEncrypt from '~/src/library/zhihu_encrypt/lib/zhihu_encrypt'
import zhihuEncryptV2 from '~/src/library/zhihu_encrypt/lib/zhihu_encrypt_v2'

const Const_Result_Prefix = '2.0'

export default RouterConfigBuilder.register({
  url: '/api/zhihu_hack',
  methodType: RouterConfigBuilder.METHOD_TYPE_GET,
  func: async (request: express.Request, response: express.Response) => {
    let Const_Version = '101_3_3.0'
    let d_c0 = request.query.d_c0
    let url =
      '/api/v4/members/zi-yun-fei/answers?include=data%5B*%5D.is_normal%2Cadmin_closed_comment%2Creward_info%2Cis_collapsed%2Cannotation_action%2Cannotation_detail%2Ccollapse_reason%2Ccollapsed_by%2Csuggest_edit%2Ccomment_count%2Ccan_comment%2Ccontent%2Ceditable_content%2Cattachment%2Cvoteup_count%2Creshipment_settings%2Ccomment_permission%2Cmark_infos%2Ccreated_time%2Cupdated_time%2Creview_info%2Cexcerpt%2Cis_labeled%2Clabel_info%2Crelationship.is_authorized%2Cvoting%2Cis_author%2Cis_thanked%2Cis_nothelp%2Cis_recognized%3Bdata%5B*%5D.vessay_info%3Bdata%5B*%5D.author.badge%5B%3F%28type%3Dbest_answerer%29%5D.topics%3Bdata%5B*%5D.author.vip_info%3Bdata%5B*%5D.question.has_publishing_draft%2Crelationship&offset=120&limit=20&sort_by=created'

    // 生成完整url
    var info = [
      Const_Version, // 对应于 x-zse-93, 为常量值
      url,
      d_c0,
    ].join('+')
    var step1 = md5(info)
    var signature = zhihuEncryptV2(step1)
    var test = zhihuEncryptV2(1)
    var x_zse_86 = `${Const_Result_Prefix}_${signature}`

    response.json(
      ResponseBuilder.showResult({
        inputParam: {
          d_c0,
        },
        output: {
          test,
          step1,
          signature,
          x_zse_86,
        },
      }),
    )
    return
  },
})
