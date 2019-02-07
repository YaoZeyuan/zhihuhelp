class Common {
  static promiseList: Array<Promise<any>> = []
  // 并发数限制到2, 太高的并发似乎会导致图片下载卡死
  static maxBuf = 20
  /**
   * 添加promise, 到指定容量后再执行
   */
  static async appendPromiseWithDebounce(promise: Promise<any>, forceDispatch = false) {
    Common.promiseList.push(promise)
    if (Common.promiseList.length >= Common.maxBuf || forceDispatch) {
      await Promise.all(Common.promiseList)
      Common.promiseList = []
    }
    return
  }

  /**
   * 延迟执行函数, 返回一个 Promise
   * @param {number} ms
   */
  static sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

}

export default Common