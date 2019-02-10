import { Command } from '@adonisjs/ace'
import _ from 'lodash'
import Base from '~/src/command/base'

class EpubTest extends Base {
  static get signature() {
    return `
     epub
     `
  }

  static get description() {
    return '测试epub的生成功能'
  }

  /**
   * 在最外层进行一次封装, 方便获得报错信息
   * @param args
   * @param options
   * @returns {Promise<void>}
   */
  async execute(args: any, options: any) {
    this.log('hello world')
  }

}

export default EpubTest
