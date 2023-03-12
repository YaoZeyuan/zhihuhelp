import { Ignitor } from '@adonisjs/core/build/standalone'
import path from 'path'
import fs from 'fs'

// 项目初始化时, 自动生成 .adonisrc.json 文件
const adonisrcRcUri = path.resolve(__dirname, '.adonisrc.json')
const adonisrcTemplateUri = path.resolve(__dirname, 'adonisrc.json')
fs.writeFileSync(adonisrcRcUri, fs.readFileSync(adonisrcTemplateUri))

// 需要运行 yarn ace generate:manifest 以生成实际命令配置
let currentPath = path.resolve(__dirname)
let ace = new Ignitor(currentPath).ace()
ace.handle(process.argv.slice(2))
// 手工调用示例
// ace.handle(['Command:Demo'])
