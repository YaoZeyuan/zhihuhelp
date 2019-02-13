import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constant/date_format'

class Logger {
  private static formatArgument (...arg: Array<any>) {
    const triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
    let stringLogItemList = []
    for (let logItem of [...arg]) {
      if (_.isString(logItem)) {
        stringLogItemList.push(` ${logItem} `)
      } else {
        stringLogItemList.push(JSON.stringify(logItem, null, 4))
      }
    }
    let logContent = `${triggerAt}:` + stringLogItemList.join('')
    return logContent
  }

  private static pushLogContentToGlobal (logContent: string) {
    if (global === undefined) {
      return
    }

    let logList: Array<string> = global.logList
    if (logList === undefined) {
      logList = []
    }
    logList.push(logContent)
    if (logList.length >= 1000) {
      logList = logList.slice(logList.length - 1000, logList.length)
    }
    global.logList = logList
    return
  }

  static log (...arg: Array<any>) {
    let logContent = Logger.formatArgument(...arg)
    // 将日志存入Electron全局变量中
    Logger.pushLogContentToGlobal(logContent)
    console.log(logContent)
  }
  static warn (...arg: Array<any>) {
    let logContent = Logger.formatArgument(...arg)
    Logger.pushLogContentToGlobal(logContent)
    console.warn(logContent)
  }
}

export default Logger
