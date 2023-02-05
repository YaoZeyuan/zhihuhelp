import { useSnapshot } from 'valtio'
import { store } from './state'
import { Input, Select, Col, Row } from 'antd'
import * as Consts from '../../resource/const/index'

const { Option } = Select

export default ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
  let snap = useSnapshot(store)
  let taskTypeOptionList = []

  return (
    <div className="task-item-4c685622b7c0">
      <Row>
        <Col span={Consts.CONST_Task_Item_Width.任务类型}>
          <Select
            options={Consts.Const_Task_Type_Option_List}
            defaultValue={Consts.Const_Default_Task_Type}
            value={value?.task_type ?? Consts.Const_Default_Task_Type}
          ></Select>
        </Col>
        <Col span={Consts.CONST_Task_Item_Width.待抓取url}>
          <Input></Input>
        </Col>
      </Row>
    </div>
  )
}
