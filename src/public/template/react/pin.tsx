import * as TypePin from '~/src/type/zhihu/pin'
import Base from '~/src/public/template/react/base'

class Pin extends Base {
  static render(record: TypePin.Record) {
    // 都是同一个
    let title = Base.getPinTitle(record)
    let pinElement = this.generateSinglePinElement(record)
    let pageElement = this.generatePageElement(title, [pinElement])
    return this.renderToString(pageElement)
  }

  /**
   * 将所有文章渲染到同一个html中
   *
   * @param title 最后生成html的标题
   * @param pinRecordList 文章列表
   */
  static renderInSinglePage(title: string, pinRecordList: TypePin.Record[]) {
    let pinElementList = []
    for (let pinRecord of pinRecordList) {
      let pinElement = this.generateSinglePinElement(pinRecord)
      pinElementList.push(pinElement)
    }
    let pageElement = this.generatePageElement(title, pinElementList)
    return this.renderToString(pageElement)
  }
}

export default Pin
