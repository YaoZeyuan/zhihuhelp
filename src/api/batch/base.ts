import Logger from '~/src/library/logger'
import CommonUtil from '~/src/library/util/common'
import lodash from 'lodash'

class BaseBatchFetch {
  /**
   * 单次获取的数据条数
   */
  fetchLimit = 20

  /**
   * 获取单个回答,并存入数据库中
   * @param id
   */
  async fetch(id: string) {
    this.log(`需要子类覆盖该方法`)
  }

  /**
   * 获取回答列表,并存入数据库中
   * @param idList
   */
  async fetchListAndSaveToDb(idList: string[]) {
    const label = this.constructor.name
    let index = 0
    for (let id of idList) {
      index = index + 1
      let taskIndex = index
      this.log(`添加第${taskIndex}/${idList.length}个抓取任务(${id})`)
      let asyncTaskFunc = async () => {
        await this.fetch(id)
          .then(() => {
            this.log(`第${taskIndex}/${idList.length}个任务(${id})执行完毕`)
          })
          .catch((e) => {
            this.log(`第${taskIndex}/${idList.length}个任务(${id})执行失败, 错误原因=>`, e)
          })
      }
      // 通过统一的任务中心执行
      CommonUtil.addAsyncTaskFunc({
        asyncTaskFunc,
        needProtect: true,
      })
    }
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: false
    })
    // switch (label) {
    //   case "BatchFetchAuthorAnswer":
    //     console.log("here")
    //     break;
    // }
    this.log(`所有抓取任务执行完毕`)
  }

  /**
   * 简易logger
   * @returns  null
   */
  async log(...argumentList: string[] | any): Promise<any> {
    let message = ''
    for (const rawMessage of argumentList) {
      if (lodash.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    Logger.log(`[${this.constructor.name}] ` + message)
  }
}

export default BaseBatchFetch
