class Logger {
  static log (...arg: Array<any>) {
    console.log(...arg)
  }
  static warn (...arg: Array<any>) {
    console.warn(...arg)
  }
}

export default Logger
