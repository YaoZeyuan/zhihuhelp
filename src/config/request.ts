import _ from 'lodash'
import CommonUtil from '~/src/library/util/common'

// 优先使用远程发放的配置
let localConfig = CommonUtil.getLocalConfig()

class Request {
  static readonly timeoutMs = 20 * 1000
  static readonly ua = _.get(localConfig, ['requestConfig', 'ua'], 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36')
  // 专门注册的小号
  static readonly cookie = _.get(localConfig, ['requestConfig', 'cookie'], '_xsrf=fuQ8idq5qhHyWvZ6V808zhwcxPk491vr; _zap=bc5d49d2-7d3b-4468-b0be-8decd1647d0a; d_c0="AKCgjexM7w6PTioLa2Jwzi-W2ujNUITXzuk=|1549357352"; r_cap_id="NjY0YWViOTc0MTQ3NGIxYzk5MGEyZDZmNTg1ZDA0OTc=|1549357373|4c729512e397d59919f862604274225ae9fe58b2"; cap_id="YTM3MDRkZGIyNDViNDZhMmIzNGZkZDM5MDZhMDJiZGQ=|1549357373|9d5fe4d43a4dfbd0f55ddfe8a25d8e075e65b402"; l_cap_id="N2UzZDU4ZmMzMGI1NDA0MzhiYzViZjQ4YTg0ZjgzMjM=|1549357373|050ae445cb4c6486bd859771f20381e2e4988283"; q_c1=e665406d86c2414e82989adfe245ca14|1549357435000|1549357435000; tst=r; __utmv=51854390.100-1|2=registration_date=20120515=1^3=entry_date=20120515=1; __utma=51854390.662762305.1549719973.1549719973.1549797514.2; __utmc=51854390; __utmz=51854390.1549797514.2.2.utmcsr=zhihu.com|utmccn=(referral)|utmcmd=referral|utmcct=/; tgw_l7_route=4860b599c6644634a0abcd4d10d37251; capsion_ticket="2|1:0|10:1549939306|14:capsion_ticket|44:NWIzNTQ3YWZjYjI5NDQ4ZTljMmNjNTlhN2U4MDMyZTU=|8b6cdf95754df7eb2cb78b500902a5ecbdc87b8426ade2829eb0aeab461dd381"; z_c0="2|1:0|10:1549939335|4:z_c0|92:Mi4xbVowc0RnQUFBQUFBb0tDTjdFenZEaVlBQUFCZ0FsVk5oNEJQWFFDM245UUVfT3BlalZSMktaQ3lMcjE1TDgxbmdn|b9617e01515bae2756d75a51db99b6e9504977d354fb147c6cbe300e02506325"; unlock_ticket="APBhrALv7A4mAAAAYAJVTY85YlzPs_i4DgfFZxRxyBvKAgsIo3yqKw=="')
}
export default Request
