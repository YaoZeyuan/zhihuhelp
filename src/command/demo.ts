import Base from '~/src/command/base'
import { args, flags } from '@adonisjs/ace'

class CommandDemo extends Base {
  public static commandName = 'Command:Demo'
  public static description = 'demo命令'

  @flags.boolean({ description: '[必传]flag,只有true/false两个值' })
  onlyFlag: boolean = false

  @args.string({ description: '[必传]日志文件名', required: false })
  logName: string = ''

  @flags.boolean({ description: '[可选]是否处于测试环境' })
  isTest: boolean = false

  async execute() {
    this.log('获取回答列表')
  }
}

export default CommandDemo
