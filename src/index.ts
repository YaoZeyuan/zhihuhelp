// Modules to control application life and create native browser window
import Electron, { Menu } from 'electron'
import RequestConfig from '~/src/config/request'
import PathConfig from '~/src/config/path'
import CommonUtil from '~/src/library/util/common'
import Logger from '~/src/library/logger'
import { Ignitor } from '@adonisjs/core/build/standalone'
import * as FrontTools from '~/src/library/util/front_tools'
import { startServer } from '~/src/server'
import portfinder from 'portfinder'

import fs from 'fs'
import path from 'path'

const Const_User_Agent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
const Const_Default_Server_Port = 6370
let serverPort = Const_Default_Server_Port

const Const_Current_Path = path.resolve(__dirname)
let ace = new Ignitor(Const_Current_Path).ace()
let argv = process.argv
let isDebug = argv.includes('--zhihuhelp-debug')
let { app, BrowserWindow, ipcMain, session, shell } = Electron
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow
// 用于执行远程通信
let jsRpcWindow: Electron.BrowserWindow

let isRunning = false

async function asyncCreateWindow() {
  if (process.platform === 'darwin') {
    const template = [
      {
        label: 'Application',
        submenu: [
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function () {
              app.quit()
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        ],
      },
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  } else {
    Menu.setApplicationMenu(null)
  }

  const { screen } = Electron
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width,
    height,
    // 自动隐藏菜单栏
    autoHideMenuBar: true,
    // 窗口的默认标题
    title: '稳部落',
    // 在屏幕中间展示窗口
    center: true,
    // 展示原生窗口栏
    frame: true,
    // 禁用web安全功能 --> 个人软件, 要啥自行车
    webPreferences: {
      // 开启 DevTools.
      devTools: true,
      // 禁用同源策略, 允许加载任何来源的js
      webSecurity: false,
      // 允许 https 页面运行 http url 里的资源
      allowRunningInsecureContent: true,
      // 启用node支持
      nodeIntegration: true,
      // Electron12后, 启用node支持时还需要关闭上下文隔离
      contextIsolation: false,
      // 启用webview标签
      webviewTag: true,
      // // 启用preload.js, 以进行rpc通信
      // preload: path.join(__dirname, 'preload.js'),
    },
  })
  jsRpcWindow = new BrowserWindow({
    width,
    height,
    // 自动隐藏菜单栏
    autoHideMenuBar: true,
    // 窗口的默认标题
    title: '稳部落',
    // 在屏幕中间展示窗口
    center: true,
    // 展示原生窗口栏
    frame: true,
    // 禁用web安全功能 --> 个人软件, 要啥自行车
    webPreferences: {
      // 开启 DevTools.
      devTools: true,
      // 禁用同源策略, 允许加载任何来源的js
      webSecurity: false,
      // js-rpc需要
      contextIsolation: true,
      // 启用webview标签
      webviewTag: true,
      // 启用preload.js, 以进行rpc通信
      preload: path.join(__dirname, 'js-rpc', 'preload.js'),
    },
  })

  // 自动查找一个可用端口
  let finalPort = await portfinder
    .getPortPromise({
      host: '0.0.0.0',
      port: Const_Default_Server_Port,
    })
    .catch((e) => {
      Logger.log('没有可用的端口号,自动退出')
      process.exit(1)
    })
  serverPort = finalPort

  // and load the index.html of the app.
  // and load the index.html of the app.
  if (isDebug) {
    // 本地调试 & 打开控制台
    // mainWindow.loadFile('./client/index.html')
    mainWindow.loadURL('http://localhost:8080')
    mainWindow.webContents.openDevTools()

    let jsRpcUri = path.resolve(__dirname, 'js-rpc', 'index.html')
    jsRpcWindow.loadURL(jsRpcUri)
    jsRpcWindow.webContents.openDevTools()

    // @todo 本地临时测试使用
    // 仅线上需要启动server, dev环境执行npm命令单独启动服务
    // startServer({ port: serverPort })
  } else {
    // 线上地址
    // 构建出来后所有文件都位于dist目录中
    let webviewUri = path.resolve(__dirname, 'client', 'index.html')
    mainWindow.loadFile(webviewUri)
    // mainWindow.webContents.openDevTools()

    let jsRpcUri = path.resolve(__dirname, 'js-rpc', 'index.html')
    jsRpcWindow.loadURL(jsRpcUri)
    // jsRpcWindow.webContents.openDevTools()

    startServer({ port: serverPort })
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // @ts-ignore
    mainWindow = null
  })

  // 设置ua
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
    callback({ cancel: false, requestHeaders: details.requestHeaders })
  })
}

async function asyncUpdateCookie() {
  let cookieContent = ''
  let cookieList = await session.defaultSession.cookies.get({})
  for (let cookie of cookieList) {
    cookieContent = `${cookie.name}=${cookie.value};${cookieContent}`
  }
  // 将cookie更新到本地配置中
  let config = CommonUtil.getConfig()
  config.request.cookie = cookieContent
  fs.writeFileSync(PathConfig.configUri, JSON.stringify(config, null, 4))
  Logger.log(`重新载入cookie配置`)
  RequestConfig.reloadTaskConfig()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', asyncCreateWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    asyncCreateWindow()
  }
})

ipcMain.on('openOutputDir', (event) => {
  // 打开输出文件夹
  shell.showItemInFolder(PathConfig.outputPath)
})

ipcMain.on('getPathConfig', (event) => {
  // 获取pathConfig

  let obj: any = {}
  for (let key in PathConfig) {
    // @ts-ignore
    obj[key] = PathConfig[key]
  }
  let jsonStr = JSON.stringify(obj, null, 2)

  event.returnValue = jsonStr
  return
})

ipcMain.on('startCustomerTask', async (event) => {
  if (isRunning) {
    event.returnValue = '目前尚有任务执行, 请稍后'
    return
  }
  isRunning = true
  Logger.log('开始工作')

  await asyncUpdateCookie()

  Logger.log(`开始执行任务`)
  event.returnValue = 'success'
  Logger.log(`开始抓取数据`)
  await ace.handle(['Fetch:Customer'])
  Logger.log(`开始生成电子书`)
  await ace.handle(['Generate:Customer'])
  Logger.log(`所有任务执行完毕, 打开电子书文件夹 => `, PathConfig.outputPath)
  // 输出打开文件夹
  shell.showItemInFolder(PathConfig.outputPath)
  isRunning = false
})

ipcMain.on('get-task-default-title', async (event, taskType, taskId: string) => {
  await asyncUpdateCookie()

  let title = await FrontTools.asyncGetTaskDefaultTitle(taskType, taskId)
  event.returnValue = title
  return
})

// 清空所有登录信息
ipcMain.on('devtools-clear-all-session-storage', async (event) => {
  await session.defaultSession.clearCache()
  await session.defaultSession.clearStorageData()
  await session.defaultSession.clearHostResolverCache()

  event.returnValue = true
  return
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
