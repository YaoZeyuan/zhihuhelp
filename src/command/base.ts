import { BaseCommand, args, flags } from '@adonisjs/ace'
import { CommandSettings } from '@adonisjs/ace/build/src/Contracts'
import lodash from 'lodash'
import logger from '~/src/library/logger'

class Base extends BaseCommand {
  public static commandName = 'Command:Base'
  public static description = '命令基类, 无实际功能'

  static settings: CommandSettings = {
    "stayAlive": true,
  }

  /**
   * 在最外层进行一次封装, 方便获得报错信息
   * @param args
   * @param options
   * @returns {Promise<void>}
   */
  async run() {
    this.log('command start')
    await this.execute().catch((e) => {
      this.log('catch error')
      this.log(e.stack)
    })
    this.log('command finish')
  }

  /**
   *
   * @param args
   * @param options
   */
  async execute(): Promise<any> { }

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
    logger.log(`[${this.constructor.name}] ` + message)
  }

  /**
   * 简易logger
   * @returns  null
   */
  async warn() {
    let message = ''
    for (const rawMessage of arguments) {
      if (lodash.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    logger.warn(`[${this.constructor.name}] ` + message)
  }
}

export default Base
