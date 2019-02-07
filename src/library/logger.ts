import moment from 'moment'
import DATE_FORMAT from '~/src/constant/date_format'
class Logger {
  static index = 0
  static log(...arg: Array<any>) {
    Logger.index = Logger.index + 1
    const triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)

    console.log(`${Logger.index}-${triggerAt}:`, ...arg)
  }
  static warn(...arg: Array<any>) {
    Logger.index = Logger.index + 1
    const triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
    console.warn(`${Logger.index}-${triggerAt}:`, ...arg)
  }
}

export default Logger
