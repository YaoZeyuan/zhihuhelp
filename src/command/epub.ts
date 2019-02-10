import { Command } from '@adonisjs/ace'
import _ from 'lodash'
import Base from '~/src/command/base'
import Epub from '~/src/library/epub'
import PathConfig from '~/src/config/path'

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
    let epub = new Epub(PathConfig.epubCachePath, '测试')

  }

}

export default EpubTest
