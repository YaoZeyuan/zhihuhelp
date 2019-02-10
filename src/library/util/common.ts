import logger from "~/src/library/logger"

class Common {
  static promiseList: Array<Promise<any>> = []
  // 并发数限制到10即可
  static maxBuf = 10
  /**
   * 添加promise, 到指定容量后再执行
   */
  static async asyncAppendPromiseWithDebounce(promise: Promise<any>, forceDispatch = false) {
    Common.promiseList.push(promise)
    if (Common.promiseList.length >= Common.maxBuf || forceDispatch) {
      logger.log(`任务队列已满, 开始执行任务, 共${Common.promiseList.length}个任务待执行`)
      await Promise.all(Common.promiseList)
      logger.log(`任务队列内所有任务执行完毕`)
      Common.promiseList = []
    }
    return
  }

  /**
   * 延迟执行函数, 返回一个 Promise
   * @param {number} ms
   */
  static asyncSleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static getUuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(36)
        .substring(1)
    }

    let uuid = `${s4()}-${s4()}-${s4()}-${s4()}`
    return uuid
  }

}

export default Common