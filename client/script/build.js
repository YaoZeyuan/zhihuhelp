process.env.NODE_ENV = 'production'

let shell = require('shelljs')
let path = require('path')

let clientBasePath = path.resolve(__dirname, '..')
// 静态资源整体打包输出到 dist/client/dist 下
let generatePath = path.resolve(clientBasePath, 'dist')
let targetPath = path.resolve(clientBasePath, '..', 'dist', 'client')
shell.cd(clientBasePath)

// 清理旧资源
let distPath = path.resolve(clientBasePath, 'dist')
console.log(`清空旧构建结果 => ${distPath}`)
if (typeof distPath !== 'string' || distPath.length < 3) {
  console.warn('distPath/mapPath长度过短，自动退出')
  shell.exit(10004)
}
shell.rm('-rf', distPath)
console.log('旧构建结果清理完毕')

// 构建新项目
console.log('开始构建新项目')
shell.exec('npm run build')
console.log('静态资源构建完毕')

// 复制静态资源到electron项目中
console.log(`删除旧静态资源目录 => ${targetPath}`)
shell.rm('-rf', targetPath)
console.log(`创建新资源目录 => ${targetPath}`)
shell.mkdir('-p', targetPath)
console.log(`复制文件 ${generatePath} => ${targetPath}`)
// 不复制dist本身这一层目录, 使最终结果更容易理解
shell.cp('-rf', generatePath + '/*', targetPath)
// shell.mv(generatePath, targetPath)
console.log(`构建完成`)
