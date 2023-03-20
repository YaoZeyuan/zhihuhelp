import { useSnapshot, subscribe } from 'valtio'
import { createStore, Const_Default_Task_Item } from './state'
import { Input, Select, Col, Row, Button, Divider, Space, Checkbox } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import * as Consts from '../../resource/const/index'
import { useEffect, useRef } from 'react'

import './index.less'

export default ({
  value = {
    ...Const_Default_Task_Item,
  },
  fieldIndex,
  onChange = () => {},
  action,
}: {
  value?: ReturnType<typeof createStore>
  onChange?: (value: ReturnType<typeof createStore>) => void
  fieldIndex: number
  action: {
    add: (taskItem: typeof Const_Default_Task_Item) => void
    remove: (key: number) => void
  }
}) => {
  // 仅在初始化时通过value创建一次, 后续直接通过useEffect更新store的值
  let refStore = useRef(createStore(value))
  const store = refStore.current
  let snap = useSnapshot(store)

  useEffect(() => {
    if (value?.rawInputText !== snap.rawInputText || value.type !== snap.type) {
      console.log('value发生变更, 更新内部状态')
      store.rawInputText = value!.rawInputText
      store.type = value!.type
    }
  }, [value])

  useEffect(() => {
    console.log('snap发生变更, 通知外部', snap)
    // 当id和type发生变更时, 通知外部组件
    onChange({
      type: snap.type,
      id: snap.id,
      rawInputText: snap.rawInputText,
      skipFetch: snap.skipFetch,
    })
  }, [snap])

  return (
    <div className="task-item-4c685622b7c0">
      <Row justify="start" align="middle" gutter={1}>
        <Col span={Consts.CONST_Task_Item_Width.任务类型}>
          <Select
            dropdownMatchSelectWidth={false}
            options={Consts.Const_Task_Type_Option_List}
            defaultValue={snap.type}
            value={snap.type}
            onChange={(value: typeof store.type) => {
              store.type = value
            }}
          ></Select>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.待抓取url}>
          <div className="url-container">
            <Checkbox
              checked={snap.skipFetch === false}
              onClick={(e) => {
                // @ts-ignore
                store.skipFetch = !e.target!.checked
              }}
            ></Checkbox>
            <Input
              // 通过defaultValue, 避免每次value变更后, input的输入光标都被重置
              defaultValue={snap.rawInputText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                store.rawInputText = e.target.value
              }}
              // onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
              //   // console.log('on input trigger', e.target.value)
              //   store.rawInputText = e.target.value
              // }}
              placeholder={'示例url:' + Consts.Placeholder_By_Task_Type[snap.type]}
            ></Input>
          </div>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.任务id} offset={1}>
          <div>{snap.id === '' ? '未解析到任务id' : snap.id}</div>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.操作}>
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                action.add({
                  ...Const_Default_Task_Item,
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
                // console.log('remove task item index => ', fieldIndex)
                action.remove(fieldIndex)
              }}
            ></Button>
          </Space>
        </Col>
      </Row>
      <Divider style={{ margin: '12px' }} />
    </div>
  )
}
