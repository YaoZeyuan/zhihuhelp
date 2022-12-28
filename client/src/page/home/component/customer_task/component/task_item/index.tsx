import { useSnapshot } from 'valtio'
import { store } from './state'
import { Input, Select } from 'antd'

const { Option } = Select

export default () => {
  let snap = useSnapshot(store)
  let taskTypeOptionList = []
  return (
    <div className="task-item-4c685622b7c0">
      <div>
        <Select></Select>
        <Input></Input>
      </div>
    </div>
  )
}
