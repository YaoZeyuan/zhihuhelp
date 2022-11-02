import { startServer } from './server'
import RequestConfig from '~/src/config/request'

let runner = async () => {
  RequestConfig.reloadTaskConfig()
  console.log('start server')
  startServer({ port: 6370 })
  console.log('start server complete')
}

runner()
