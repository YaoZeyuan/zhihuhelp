import PinApi from '~/src/api/single/pin'
import MPin from '~/src/model/pin'
import Base from '~/src/api/batch/base'

class BatchFetchPin extends Base {
  async fetch(id: string) {
    this.log(`开始抓取想法:${id}`)
    const pinRecord = await PinApi.asyncGet(id)
    await MPin.asyncReplacePin(pinRecord)
    this.log(`想法:${id}抓取完毕`)
  }
}

export default BatchFetchPin
