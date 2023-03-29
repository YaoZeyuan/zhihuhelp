import { Ignitor } from '@adonisjs/core/build/standalone'
import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'

// 项目初始化时, 自动生成 .adonisrc.json 文件
const adonisRcUri = path.resolve(__dirname, '.adonisrc.json')
const adonisRcTemplateUri = path.resolve(__dirname, 'adonisrc.json')
const adonisRcContent = fs.readFileSync(adonisRcTemplateUri).toString()
const adonisRcConfig = JSON5.parse(adonisRcContent)
fs.writeFileSync(adonisRcUri, JSON.stringify(adonisRcConfig, null, 2))

async function asyncRunner() {
    let currentPath = path.resolve(__dirname)
    let ace = new Ignitor(currentPath).ace()
    // 需要先运行 yarn ace generate:manifest 以生成实际命令配置
    await ace.handle(['generate:manifest'])
    // 初始化命令
    await ace.handle(['Init:Env'])

    await ace.handle(process.argv.slice(2))
    // 手工调用示例
    // ace.handle(['Command:Demo'])
}

asyncRunner()