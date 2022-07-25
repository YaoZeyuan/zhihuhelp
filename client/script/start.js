const path = require('path')
const shell = require('shelljs')

let clientBasePath = path.resolve(__dirname, '..')
shell.cd(clientBasePath)
shell.exec('npm run start')
