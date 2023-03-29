import { useSnapshot } from 'valtio'
import { Const_Default_Order_Item, createStore } from './state'
import { Input, Select, Col, Row, Radio, Button, Divider, Space } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import * as Consts from '../../resource/const/index'
import { useRef, useEffect } from 'react'

const { Option } = Select

export default ({
  value = {
    ...Const_Default_Order_Item,
  },
  fieldKey,
  onChange = () => {},
  action,
}: {
  value?: ReturnType<typeof createStore>
  onChange?: (value: ReturnType<typeof createStore>) => void
  fieldKey: number
  action: {
    add: (taskItem: typeof Const_Default_Order_Item) => void
    remove: (key: number) => void
  }
}) => {
  let refStore = useRef(createStore(value))
  const store = refStore.current
  let snap = useSnapshot(store)
  useEffect(() => {
    if (value !== undefined) {
      console.log('value发生变更, 更新内部状态')
      store.orderBy = value!.orderBy
      store.orderWith = value!.orderWith
    }
  }, [value])

  useEffect(() => {
    console.log('snap发生变更, 通知外部', snap)
    onChange({
      orderBy: snap.orderBy,
      orderWith: snap.orderWith,
    })
  }, [snap.orderBy, snap.orderWith])

  return (
    <div className="order-item-4c685622b7c0">
      <Row justify="start" align="middle" gutter={1}>
        <Col span={Consts.CONST_Order_Item_Width.排序指标}>
          <Select
            dropdownMatchSelectWidth={false}
            options={Consts.Const_Order_With_Option_List}
            defaultValue={Consts.Const_Default_Order_With}
            value={snap?.orderWith}
            onChange={(value: typeof store.orderWith) => {
              console.log('orderWith发生变更', value)
              store.orderWith = value
            }}
          ></Select>
        </Col>
        <Col span={Consts.CONST_Order_Item_Width.规则}>
          <Radio.Group
            value={snap.orderBy}
            onChange={(e) => {
              store.orderBy = e.target.value
            }}
            buttonStyle="solid"
          >
            <Radio.Button value={Consts.CONST_Order_Asc}>
              {Consts.Translate_Order_By_Type[snap.orderWith][Consts.CONST_Order_Asc]}
            </Radio.Button>
            <Radio.Button value={Consts.CONST_Order_Desc}>
              {Consts.Translate_Order_By_Type[snap.orderWith][Consts.CONST_Order_Desc]}
            </Radio.Button>
          </Radio.Group>
        </Col>
        <Col span={Consts.CONST_Order_Item_Width.操作}>
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                action.add({
                  ...Const_Default_Order_Item,
                })
              }}
            ></Button>
            <Divider type="vertical" />
            <Button
              type="primary"
              danger
              size="small"
              icon={<MinusOutlined />}
              onClick={() => {
                action.remove(fieldKey)
              }}
            ></Button>
          </Space>
        </Col>
      </Row>
      <Divider style={{ margin: '12px' }} />
    </div>
  )
}
