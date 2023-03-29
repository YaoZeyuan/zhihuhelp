import md5 from 'md5'

// 需要从index.ts中获得js-rpc函数
let bridgeFunc: ({ method, paramList }: { method: string; paramList: any[] }) => any

export function setBridgeFunc(bridge: any) {
  bridgeFunc = bridge
}

// 常量
const Const_Version = '101_3_3.0'
const Const_Result_Prefix = '2.0'

/**
 * 自动生成x-zse-96值
 * @param param
 * @returns
 */
async function asyncGet_X_Zse_96(param: {
  /**
   * 所请求的路径(不含域名)
   */
  url: string | '/api/v4/members/san-qi-er-shi/answers?include=dataonship&offset=20&limit=20&sort_by=created'
  /**
   * header中cookie的d_c0字段, 包括双引号
   */
  cookie_d_c0: string | ''
}) {
  let { url, cookie_d_c0 } = param

  // 生成完整url
  var info = [
    Const_Version, // 对应于 x-zse-93, 为常量值
    url,
    cookie_d_c0,
  ].join('+')
  var step1 = md5(info)
  // console.log('ipcRenderer step1 => ', step1, JSON.stringify({ url, cookie_d_c0, info }))
  let signature = await bridgeFunc({
    method: 'encrypt-string',
    paramList: [
      {
        inputString: step1,
      },
    ],
  })
  // console.log('signature => ', signature)
  //   var signature = result //zhihuEncrypt(step1)
  var x_zse_96 = `${Const_Result_Prefix}_${signature}`
  return x_zse_96
}

export default asyncGet_X_Zse_96
