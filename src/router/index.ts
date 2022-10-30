import express from 'express'
import RouterConfigBuilder, { Type_Router_Config } from '~/src/library/util/router_config_builder'
import Api from '~/src/router/api'

let commonRouter = express()

let routerConfigMap = {
  ...Api,
}

/**
 * 根据请求方法注册路由
 * @param {*} customerRouter
 * @param {*} routerConfig
 * @param {*} url
 */
function registerRouterByMethod(
  customerRouter: typeof commonRouter,
  routerConfig: Type_Router_Config[string],
  url: string,
) {
  switch (routerConfig.methodType) {
    case RouterConfigBuilder.METHOD_TYPE_GET:
      customerRouter.get(url, (req, res) => {
        return routerConfig.func(req, res)
      })
      break
    case RouterConfigBuilder.METHOD_TYPE_POST:
      customerRouter.post(url, (req, res) => {
        return routerConfig.func(req, res)
      })
      break
    default:
  }
}

// 自动注册
for (let url of Object.keys(routerConfigMap)) {
  let routerConfig = routerConfigMap[url]

  // 普通函数
  registerRouterByMethod(commonRouter, routerConfig, url)
}

export default commonRouter
