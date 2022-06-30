import { BaseCommand, args, flags } from '@adonisjs/ace'
import _ from 'lodash'
import logger from '~/src/library/logger'

class Base extends BaseCommand {
  public static commandName = 'Parse:Base'
  public static description = '解析kafka日志, Base'

  @flags.boolean({ description: '[必传]flag,只有true/false两个值' })
  onlyFlag: boolean = false

  @args.string({ description: '[必传]日志文件名' })
  logName: string = ''

  @flags.boolean({ description: '[可选]是否处于测试环境' })
  isTest: boolean = false

  /**
   * 在最外层进行一次封装, 方便获得报错信息
   * @param args
   * @param options
   * @returns {Promise<void>}
   */
  async handle(args: any, options: any) {
    this.log('command start')
    await this.execute(args, options).catch((e) => {
      this.log('catch error')
      this.log(e.stack)
    })
    this.log('command finish')
  }

  /**
   * 空promise函数, 方便清空promise队列
   */
  async emptyPromiseFunction() {
    return
  }

  /**
   *
   * @param args
   * @param options
   */
  async execute(args: any, options: any): Promise<any> {}

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
    logger.log(`[${this.constructor.name}] ` + message)
  }

  /**
   * 简易logger
   * @returns  null
   */
  async warn() {
    let message = ''
    for (const rawMessage of arguments) {
      if (_.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    logger.warn(`[${this.constructor.name}] ` + message)
  }
}

export default Base
