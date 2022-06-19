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
  async fetch(id: string) {
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
      let taskIndex = index
      this.log(`启动第${taskIndex}/${idList.length}个抓取任务(${id})`)
      // 一个一个任务进行, 请求接口不搞并行. 切实保护知乎服务器
      await this.fetch(id)
        .then(() => {
          this.log(`第${taskIndex}/${idList.length}个任务(${id})执行完毕`)
        })
        .catch((e) => {
          this.log(`第${taskIndex}/${idList.length}个任务(${id})执行失败, 错误原因=>`, e)
        })
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
