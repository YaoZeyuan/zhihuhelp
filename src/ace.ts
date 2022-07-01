import { Ignitor } from '@adonisjs/core/build/standalone'
import path from 'path'
// 需要运行 yarn ace generate:manifest 以生成实际命令配置
let currentPath = path.resolve(__dirname)
let ace = new Ignitor(currentPath).ace()
ace.handle(process.argv.slice(2))
