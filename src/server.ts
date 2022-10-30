// src/index.ts
import express from 'express'
import bodyParser from 'body-parser'
import baseRouter from '~/src/router'
// 配置 ~/src 通用导入前缀, 方便编写后续文件
require('module-alias').addAlias('~/src', __dirname + '/')

export function startServer({ port }: { port: number }) {
  console.log(`start at ${port}`)
  const app = express()

  // 解析请求的body内容
  app.use(
    bodyParser.json({
      verify: (req, res, buf) => {
        // 方便后续获取原始post内容数据
        // @ts-ignore
        req.rawBody = buf
      },
    }),
  )
  app.use(
    bodyParser.urlencoded({
      extended: false,
      verify: (req, res, buf) => {
        // 方便后续获取原始post内容数据
        // @ts-ignore
        req.rawBody = buf
      },
    }),
  )
  // 注册正常的路由列表
  app.use('/', baseRouter)

  // 实际业务代码
  app.use((request: express.Request, response: express.Response) => {
    response.send(`页面${request.originalUrl}不存在 - 404 Not Found`)
  })

  console.log(`项目启动, 运行在${port}端口`)
  console.log(`点击测试api转发功能`)
  console.log(`http://127.0.0.1:${port}`)

  // 启动并监听端口, 必须是0.0.0.0, 否则无法监听外部请求
  app.listen(port, '0.0.0.0')
}
