import TypeAnswer from '~/src/type/namespace/answer'
import AnswerApi from '~/src/api/answer'
import CommonUtil from '~/src/library/util/common'
import MTotalAnswer from '~/src/model/total_answer'
import Logger from '~/src/library/logger'
import _ from 'lodash'

class BaseBatchFetch {
  max = 20

  /**
   * 获取单个回答,并存入数据库中
   * @param id
   */
  async fetchAndSaveToDb(id: string) {
    this.log(`需要子类覆盖该方法`)
  }

  /**
   * 获取回答列表,并存入数据库中
   * @param idList
   */
  async fetchListAndSaveToDb(idList: Array<string>) {
    let index = 0
    for (let id of idList) {
      index = index + 1
      this.log(`将第${index}/${idList.length}个任务(${id})置入待抓取队列中`)
      await CommonUtil.asyncAppendPromiseWithDebounce(this.fetchAndSaveToDb(id))
    }
    this.log(`派发所有待抓取任务`)
    await CommonUtil.asyncDispatchAllPromiseInQueen()
    this.log(`所有抓取任务执行完毕`)
  }

  /**
   * 简易logger
   * @returns  null
   */
  async log(...argumentList: string[] | any): Promise<any> {
    let message = ''
    for (const rawMessage of argumentList) {
      if (_.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    Logger.log(`[${this.constructor.name}] ` + message)
  }
}

export default BaseBatchFetch
