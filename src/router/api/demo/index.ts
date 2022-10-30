import RouterConfigBuilder from '~/src/library/util/router_config_builder'
import ResponseBuilder from '~/src/library/util/response_builder'
import express from 'express'

export default RouterConfigBuilder.register({
  url: '/api/demo',
  methodType: RouterConfigBuilder.METHOD_TYPE_GET,
  func: async (request: express.Request, response: express.Response) => {
    let originalUrl = request.originalUrl
    console.log(`originalUrl: ${originalUrl}`)

    response.json(
      ResponseBuilder.showResult({
        hello: 'world',
      }),
    )
    return
  },
})
