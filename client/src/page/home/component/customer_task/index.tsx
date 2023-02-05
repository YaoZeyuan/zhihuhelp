import electron from 'electron'
import { Button, message, Input, Form, Table, Modal, Tag, Card, Radio, Select, Row, Col } from 'antd'
import { proxy, useSnapshot } from 'valtio'

import { useState, useContext, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from './resource/const/index'
import * as Types from './resource/type/index'
import { store } from './state'
import http from '~/src/library/http'
import TaskItem from './component/task_item/index'
import OrderItem from './component/order_item/index'

import './index.less'

const { ipcRenderer } = electron
const { Option } = Select

export const Const_Storage_Key = 'login_msk'
const Const_Table_Column_Width = 100

export default () => {
  let snap = useSnapshot(store)

  const [form] = Form.useForm()

  let [forceUpdate, setForceUpdate] = useState<number>(0)

  let [isModalShow, setIsModalShow] = useState<boolean>(false)
  let [isRecordListLoading, setIsRecordListLoading] = useState<boolean>(false)

  useEffect(() => {
    let asyncRunner = async () => {
      setIsRecordListLoading(true)
      setIsRecordListLoading(false)
    }
    asyncRunner()
  }, [forceUpdate])

  const onFinish = (values: any) => {
    console.log(values)
  }

  const onReset = () => {
    form.resetFields()
  }

  return (
    <div className="customer_task">
      <div className="debug-panel">
        <Button
          onClick={async () => {
            let res = ipcRenderer.sendSync('zhihu-http-get', {
              url: 'https://www.zhihu.com/api/v4/members/s.invalid/answers',
              params: {
                include:
                  'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,attachment,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp,is_recognized;data[*].vessay_info;data[*].author.badge[?(type=best_answerer)].topics;data[*].author.vip_info;data[*].question.has_publishing_draft,relationship',
                offset: 0,
                limit: 20,
                sort_by: 'created',
              },
            })
            console.log('res => ', res)
            return
          }}
        >
          调试
        </Button>
        <Button
          onClick={async () => {
            let res = ipcRenderer.sendSync('js-rpc-trigger', {
              method: 'encrypt-string',
              paramList: [
                {
                  inputString: '123',
                },
              ],
            })

            console.log('res => ', res)
            return
          }}
        >
          调试-触发请求
        </Button>
        <Button
          onClick={async () => {
            let res = ipcRenderer.sendSync('devtools-clear-all-session-storage', {})

            console.log('res => ', res)
            return
          }}
        >
          调试-清除session
        </Button>
      </div>
      <div className="action-panel">{/* 操作栏 */}</div>
      <div className="config-panel">
        {/* 任务配置 */}
        <Button>添加任务</Button>
        <Form form={form} name="control-hooks" onFinish={onFinish}>
          <Form.Item name="note" label="Note" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item noStyle>
            <Row>
              <Col span={Consts.CONST_Task_Item_Width.任务类型}>任务类型</Col>
              <Col span={Consts.CONST_Task_Item_Width.待抓取url}>待抓取url</Col>
              <Col span={Consts.CONST_Task_Item_Width.任务id}>任务id</Col>
              <Col span={Consts.CONST_Task_Item_Width.跳过抓取}>跳过抓取</Col>
              <Col span={Consts.CONST_Task_Item_Width.操作}>操作</Col>
            </Row>
          </Form.Item>
          <Form.Item noStyle>
            <TaskItem></TaskItem>
          </Form.Item>
          <Form.Item noStyle>
            <Row>
              <Col span={Consts.CONST_Order_Item_Width.排序指标}>排序指标</Col>
              <Col span={Consts.CONST_Order_Item_Width.规则}>规则</Col>
              <Col span={Consts.CONST_Order_Item_Width.操作}>操作</Col>
            </Row>
          </Form.Item>
          <Form.Item noStyle>
            <OrderItem />
          </Form.Item>
          <Form.Item noStyle>
            <Form.Item name="img" label="图片质量" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
            <Button htmlType="button" onClick={onReset}>
              Reset
            </Button>
            <Button type="link" htmlType="button">
              Fill form
            </Button>
          </Form.Item>
        </Form>
      </div>
      <div className="debug-panel">{/* 调试栏 */}</div>
    </div>
  )
}
