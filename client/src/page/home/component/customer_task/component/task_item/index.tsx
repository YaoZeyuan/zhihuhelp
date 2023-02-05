import { useSnapshot, subscribe } from 'valtio'
import { store } from './state'
import { Input, Select, Col, Row, Button, Divider } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import * as Consts from '../../resource/const/index'

const { Option } = Select

export default ({
  value,
  onChange,
  action = {
    add: () => {},
    remove: () => {},
  },
}: {
  value?: typeof store
  onChange?: (value: typeof store) => void
  action: {
    add: () => void
    remove: () => void
  }
}) => {
  let snap = useSnapshot(store)
  let taskTypeOptionList = []

  return (
    <div className="task-item-4c685622b7c0">
      <Row>
        <Col span={Consts.CONST_Task_Item_Width.任务类型}>
          <Select
            options={Consts.Const_Task_Type_Option_List}
            defaultValue={snap.type}
            value={snap.type}
            onChange={(value: typeof store.type) => {
              store.type = value
            }}
          ></Select>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.待抓取url}>
          <Input
            value={snap.rawInputText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              store.rawInputText = e.target.value
            }}
          ></Input>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.任务id}>
          <div>{snap.id}</div>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.操作}>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={action.add}></Button>
          <Divider type="vertical" />
          <Button type="primary" danger size="small" icon={<MinusOutlined />} onClick={action.remove}></Button>
        </Col>
      </Row>
    </div>
  )
}
