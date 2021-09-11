'use strict'

process.env.NODE_ENV = 'production'

let shell = require('shelljs')
let path = require('path')

let clientBasePath = path.resolve(__dirname, '..')
shell.cd(clientBasePath)

console.log('清空缓存资源')
let distPath = path.resolve(clientBasePath, 'dist')
console.log(`dist_path => ${distPath}`)
if (typeof distPath !== 'string' || distPath.length < 3) {
  console.warn('distPath/mapPath长度过短，自动退出')
  shell.exit(10004)
}
shell.rm('-rf', distPath)
console.log('缓存资源清理完毕')
console.log('构建项目')

shell.exec('npm run build')
