import { useSnapshot } from 'valtio'
import { Const_Default_Order_Item, createStore } from './state'
import { Input, Select, Col, Row } from 'antd'
import * as Consts from '../../resource/const/index'
import { useRef, useEffect } from 'react'

const { Option } = Select

export default ({
  value = {
    ...Const_Default_Order_Item,
  },
  onChange = () => {},
}: {
  value?: any
  onChange?: (value: any) => void
}) => {
  let refStore = useRef(createStore(value))
  const store = refStore.current
  let snap = useSnapshot(store)
  useEffect(() => {
    if (value !== undefined) {
      console.log('value发生变更, 更新内部状态')
      store.orderBy = value!.orderBy
      store.orderWith = value!.orderWith
      store.type = value!.type
    }
  }, [value])

  return (
    <div className="task-item-4c685622b7c0">
      <Row>
        <Col span={Consts.CONST_Task_Item_Width.任务类型}>
          <Select
            dropdownMatchSelectWidth={false}
            options={Consts.Const_Task_Type_Option_List}
            defaultValue={Consts.Const_Default_Task_Type}
            value={snap?.type}
          ></Select>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.待抓取url}>
          <Input></Input>
        </Col>
      </Row>
    </div>
  )
}
