import Base from '~/src/command/base'

class FetchBase extends Base {
  public static commandName = 'Fetch:Base'
  public static description = '基类:抓取知乎接口'

  max = 20
}

export default FetchBase
