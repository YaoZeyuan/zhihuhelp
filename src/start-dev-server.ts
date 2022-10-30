import { startServer } from './server'

let runner = async () => {
  console.log('start server')
  startServer({ port: 6370 })
  console.log('start server complete')
}

runner()
