import PinApi from '~/src/api/single/pin.js'
import MPin from '~/src/model/pin.js'
import Base from '~/src/api/batch/base.js'

class BatchFetchPin extends Base {
  async fetch(id: string) {
    this.log(`开始抓取想法:${id}`)
    const pinRecord = await PinApi.asyncGet(id)
    this.assertEntityRecord(pinRecord, 'pin', id)
    await this.persist('pin', id, () => MPin.asyncReplacePin(pinRecord))
    this.log(`想法:${id}抓取完毕`)
  }
}

export default BatchFetchPin
