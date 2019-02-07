import moment from 'moment'
import DATE_FORMAT from '~/src/constant/date_format'
class Logger {
  static log(...arg: Array<any>) {
    const triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)

    console.log(`${triggerAt}:`, ...arg)
  }
  static warn(...arg: Array<any>) {
    const triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
    console.warn(`${triggerAt}:`, ...arg)
  }
}

export default Logger
