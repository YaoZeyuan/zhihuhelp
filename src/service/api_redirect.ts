// src/service/api_redirect.ts
import * as Zhihu_ApiHost from '~/src/config/api-host/zhihu'
// 用于解析cookie, 方便根据服务端要求配置请求的header头
import http from '~/src/library/http'
import querystring from 'query-string'
import UtilCommon from '~/src/library/util/common'
import express from 'express'
import md5 from 'md5'
import Logger from '../library/logger'

let apiHostList = [Zhihu_ApiHost]

const Const_Ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'

// 定义前缀类型列表, 方便后续编写匹配函数
type Type_Prefix = typeof apiHostList[number]['Const_Prefix']

// 根据前端请求的页面前缀, 判断实际需要转发的host值
function getApiHostConfig(prefix: Type_Prefix) {
  for (let config of apiHostList) {
    if (prefix === config.Const_Prefix) {
      return config
    }
  }
  console.log(`没有找到与${prefix}相匹配的配置项, 返回默认值`)
  return Zhihu_ApiHost
}

/**
 * 获取对应配置
 * @param prefix
 * @returns
 */
function getRequestHeaderConfig(prefix: Type_Prefix) {
  let headers: { [key in string]: string } = {}
  switch (prefix) {
    case Zhihu_ApiHost.Const_Prefix:
      break
  }

  return headers
}

// 包裹一层, 以根据prefix返回对应接口转发函数
let getAsyncRedirectResponse = (prefix: Type_Prefix) => {
  return async (request: express.Request, response: express.Response) => {
    let apiHostConfig = getApiHostConfig(prefix)
    let requestHeaderConfig = getRequestHeaderConfig(prefix)

    let request_timeout_ms = apiHostConfig.Request_Timeout_s * 1000

    let headers: any = {
      'User-Agent': Const_Ua,
      ...requestHeaderConfig,
    }

    // 根据api类别添加额外处理逻辑
    if (prefix === Zhihu_ApiHost.Const_Prefix) {
    }

    // 对以下key对应的header, 转成value后发送.
    // 方便debug
    const Const_Extend_Proxy_Header_Map: { [key: string]: string } = {
      // 通用
      'x-common-content-type': 'content-type',
      'x-common-user-agent': 'user-agent',
    }

    let existHeader: { [key: string]: string } = {}
    for (let headerKey of Object.keys(headers)) {
      existHeader[headerKey.toLowerCase()] = headerKey
    }
    for (let key of Object.keys(request.headers)) {
      let extendHeaderName = Const_Extend_Proxy_Header_Map[key]
      if (extendHeaderName !== undefined) {
        // 先删除旧值
        if (existHeader[extendHeaderName] !== undefined) {
          // 如果存在相同值, 那么先删除旧值
          let existHeaderName = existHeader[extendHeaderName]
          delete headers[existHeaderName]
        }
        // 然后使用自定义值替代原值
        headers[extendHeaderName] = request.headers[key]
      }
    }

    // 根据传入prefix配置, 解析客户端请求url, 拼接生成实际需要请求的api服务地址
    let rawRequestUrl = request.url
    let requestUrl = rawRequestUrl.split(prefix)[1]
    let api_host = getApiHostConfig(prefix)
    let targetUrl = `${api_host.Const_Host}/${requestUrl}`

    // if (targetUrl.includes("v6r.ipip.net")) {
    //     // 仅用于测试
    //     targetUrl = `https://v6r.ipip.net/?format=callback`
    //     delete headers['cookie']
    // }

    // 实际发送请求
    let remoteServerResponse

    // 打印将转发的请求参数, 方便debug
    console.log('real request => ')
    console.log('targetUrl => ', targetUrl)
    console.log('headers => ', JSON.stringify(headers, null, 2))

    let curlHeaderList: string[] = []
    for (let headerName of Object.keys(headers)) {
      curlHeaderList.push(`-H '${headerName}: ${headers[headerName]}'    \\`)
    }

    let postContent = request?.body

    if (request.headers['content-type']?.includes('application/json') === false) {
      // 说明data数据是urlencode格式
      // 利用在server.ts中添加的rawBody属性
      // @ts-ignore
      postContent = request?.rawBody?.toString()
      // postContent = querystring.stringify(postContent)
    } else {
      postContent = request?.body ?? {}
    }

    let extendAgentConfig = {}
    let extendProxyInfo = ''

    let data_raw_str = `--data-raw '${JSON.stringify(request?.body ?? {})}'`

    Logger.log(`curl =>
${extendProxyInfo}
-----

curl '${targetUrl}' \\
${curlHeaderList.join('\n')}
${request.method === 'POST' && request?.body ? data_raw_str : ''}\\
--compressed        
        `)

    remoteServerResponse = await http
      .rawRequest({
        url: targetUrl,
        method: request.method,
        data: request.method === 'POST' && request?.body ? postContent : undefined,
        timeout: request_timeout_ms,
        headers,
        responseType: 'arraybuffer',
        ...extendAgentConfig,
      })
      .catch((e) => {
        Logger.log('error  => ', e?.response?.data?.toString())
        return e?.response ?? ({} as any)
      })

    if (remoteServerResponse?.status === 200) {
      // 设置响应头
      response.set('Content-Type', remoteServerResponse?.headers?.['content-type'])
      // 返回数据
      response.send(remoteServerResponse?.data || '')
    } else {
      response.set('Content-Type', 'application/json')
      // @ts-ignore
      response.status(remoteServerResponse?.status ?? 200)
      response.send({
        success: false,
        errorData: remoteServerResponse?.data?.toString() ?? '',
      })
    }
    return
  }
}

// 总路由, 接管以api为前缀的网络请求
let totalRouter = express()

// 批量注册路由配置
for (let config of apiHostList) {
  // 获取config服务对应的接口处理函数
  // router.all(config.Const_Match_Reg, getAsyncRedirectResponse(config.Const_Prefix))
  // 在总路由中进行注册
  totalRouter.all(config.Const_Match_Reg, getAsyncRedirectResponse(config.Const_Prefix))
}

// 添加路由拦截操作
// 实际注册中间件服务
export default totalRouter
