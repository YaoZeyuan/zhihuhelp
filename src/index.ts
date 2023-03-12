// Modules to control application life and create native browser window
import Electron, { Menu } from 'electron'
import RequestConfig from '~/src/config/request'
import PathConfig from '~/src/config/path'
import CommonUtil from '~/src/library/util/common'
import Logger from '~/src/library/logger'
import { Ignitor } from '@adonisjs/core/build/standalone'
import * as FrontTools from '~/src/library/util/front_tools'
import { setBridgeFunc } from '~/src/library/zhihu_encrypt/index'
import * as Type_TaskConfig from '~/src/type/task_config'
import http from '~/src/library/http'
import fs from 'fs'
import path from 'path'
import JSON5 from 'json5'


// 项目初始化时, 自动生成 .adonisrc.json 文件
const adonisRcUri = path.resolve(__dirname, '.adonisrc.json')
const adonisRcTemplateUri = path.resolve(__dirname, 'adonisrc.json')
const adonisRcContent = fs.readFileSync(adonisRcTemplateUri).toString()
const adonisRcConfig = JSON5.parse(adonisRcContent)
fs.writeFileSync(adonisRcUri, JSON.stringify(adonisRcConfig, null, 2))

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
    },
  })
  // 专门启动一个窗口, 用于通过jsRpc计算签名
  jsRpcWindow = new BrowserWindow({
    enableLargerThanScreen: true,
    width: 760,
    height: 500,
    // 负责渲染的子窗口不需要显示出来, 避免被用户误关闭
    show: isDebug ? true : false,
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
      preload: path.join(__dirname, 'public', 'js-rpc', 'preload.js'),
    },
  })

  // and load the index.html of the app.
  // and load the index.html of the app.
  if (isDebug) {
    // 本地调试 & 打开控制台
    // mainWindow.loadFile('./client/index.html')
    mainWindow.loadURL('http://localhost:8080')
    mainWindow.webContents.openDevTools()

    let jsRpcUri = path.resolve(__dirname, 'public', 'js-rpc', 'index.html')
    jsRpcWindow.loadURL(jsRpcUri)
    jsRpcWindow.webContents.openDevTools()
  } else {
    // 线上地址
    // 构建出来后所有文件都位于dist目录中
    let webviewUri = path.resolve(__dirname, 'client', 'index.html')
    mainWindow.loadFile(webviewUri)
    // mainWindow.webContents.openDevTools()

    let jsRpcUri = path.resolve(__dirname, 'public', 'js-rpc', 'index.html')
    jsRpcWindow.loadURL(jsRpcUri)
    // jsRpcWindow.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // @ts-ignore
    mainWindow = null
    // 主窗口关闭时, 子窗口也要跟着关闭, 避免程序退不掉
    jsRpcWindow.close()
    // @ts-ignore
    jsRpcWindow = null
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
  let cookieList = await mainWindow.webContents.session.cookies.get({})
  for (let cookie of cookieList) {
    cookieContent = `${cookie.name}=${cookie.value};${cookieContent}`
  }
  // 将cookie更新到本地配置中
  let config = CommonUtil.getConfig()
  config.requestConfig.cookie = cookieContent
  fs.writeFileSync(PathConfig.configUri, JSON.stringify(config, null, 4))
  Logger.log(`重新载入cookie配置`)
  RequestConfig.reloadTaskConfig()
  return config
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

ipcMain.on('open-output-dir', (event) => {
  // 打开输出文件夹
  console.log("PathConfig.outputPath => ", PathConfig.outputPath)
  shell.showItemInFolder(PathConfig.outputPath)
  event.returnValue = ''
  return
})

// 获取任务配置
ipcMain.on('get-common-config', (event) => {
  let config = CommonUtil.getConfig()
  event.returnValue = config
  return
})

// 启动任务
ipcMain.on('start-customer-task', async (event, { config }: { config: Type_TaskConfig.Type_Task_Config }) => {
  if (isRunning) {
    event.returnValue = '目前尚有任务执行, 请稍后'
    return
  }
  isRunning = true
  Logger.log('开始工作')

  // 将配置写入本地
  await asyncUpdateCookie()
  let oldConfig = CommonUtil.getConfig()
  console.log("oldConfig => ", oldConfig)
  config.requestConfig.cookie = oldConfig.requestConfig.cookie
  console.log("config => ", config)
  config.requestConfig.ua = oldConfig.requestConfig.ua
  CommonUtil.saveConfig(config)

  Logger.log(`开始执行任务`)
  event.returnValue = 'success'

  // 此后操作均为异步操作, 无需等待

  Logger.log(`初始化ace命令集`)
  await ace.handle(['generate:manifest'])
  Logger.log(`初始化运行环境`)
  await ace.handle(['Init:Env'])

  Logger.log(`开始抓取数据`)
  await ace.handle(['Fetch:Customer'])
  Logger.log(`开始生成电子书`)
  await ace.handle(['Generate:Customer'])
  Logger.log(`所有任务执行完毕, 打开电子书文件夹 => `, PathConfig.outputPath)
  // 输出打开文件夹
  shell.showItemInFolder(PathConfig.outputPath)
  isRunning = false

  return
})

ipcMain.on('get-task-default-title', async (event, taskType, taskId: string) => {
  await asyncUpdateCookie()

  let title = await FrontTools.asyncGetTaskDefaultTitle(taskType, taskId)
  event.returnValue = title
  return
})

// 清空所有登录信息
ipcMain.on('clear-all-session-storage', async (event) => {
  await session.defaultSession.clearCache()
  await session.defaultSession.clearStorageData()
  await session.defaultSession.clearHostResolverCache()

  event.returnValue = true
  return
})

/**
 * jsRpc任务管理器
 */
let taskMap = new Map<
  string,
  {
    method: string
    paramList: any[]
    reslove: (value: any) => void
  }
>()
let totalTaskCounter = 0

async function asyncJsRpcTriggerFunc({ method, paramList }: { method: string; paramList: any[] }) {
  totalTaskCounter++
  let id = `task-${totalTaskCounter}-${Math.random()}`
  let task = new Promise((reslove) => {
    jsRpcWindow.webContents.send(method, paramList, id)
    taskMap.set(id, {
      method,
      paramList,
      reslove: (value: any) => {
        reslove(value)
      },
    })
  })
  if (isDebug) {
    Logger.log(
      `派发js-rpc请求, 任务id: ${id}, ${JSON.stringify(
        {
          method,
          paramList,
          id,
        },
        null,
        2,
      )}`,
    )
  }
  let result = await task
  if (isDebug) {
    Logger.log(`id:${id}的js-rpc请求完成`)
  }
  return result
}
// 使用js-rpc获取签名
setBridgeFunc(asyncJsRpcTriggerFunc)

// 触发js-rpc请求
ipcMain.on('js-rpc-trigger', async (event, { method, paramList }) => {
  let result = await asyncJsRpcTriggerFunc({ method, paramList })
  event.returnValue = JSON.stringify(result)
  return
})

// 回收js-rpc调用响应值
ipcMain.on('js-rpc-response', async (event, { id, value }) => {
  // console.log('receive js-rpc-response => ', { id, value })
  if (taskMap.has(id)) {
    taskMap.get(id)?.reslove(value)
    taskMap.delete(id)
  } else {
    Logger.log(`未找到${id}对应的任务`)
  }

  event.returnValue = true
  return
})

ipcMain.on('zhihu-http-get', async (event, { url, params }: { url: string; params: { [key: string]: any } }) => {
  // 调用知乎的get请求
  // console.log('rawUrl => ', url)
  await asyncUpdateCookie()
  let res = await http
    .get(url, {
      params: params,
    })
    .catch((e) => {
      return {}
    })
  event.returnValue = res
  return res
})
ipcMain.on('get-log-content', async (event) => {
  // 获取日志内容
  let content = fs.readFileSync(PathConfig.runtimeLogUri, 'utf-8')
  const logList = content?.split("\n") ?? []
  if (logList.length > 5000) {
    // 自动清理日志, 控制在2000条以下
    content = logList.slice(logList.length - 2000).join("\n")
    fs.writeFileSync(PathConfig.runtimeLogUri, content)
  }
  event.returnValue = content
  return
})
ipcMain.on('clear-log-content', async (event) => {
  // 清理日志内容
  fs.writeFileSync(PathConfig.runtimeLogUri, '')
  event.returnValue = ""
  return
})
ipcMain.on('open-devtools', async (event) => {
  // 打开调试面板
  mainWindow.webContents.openDevTools()
  event.returnValue = true
  return
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
