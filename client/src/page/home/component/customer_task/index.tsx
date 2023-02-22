import electron from 'electron'
import { Button, message, Input, Form, Table, Modal, Tag, Card, Radio, Select, Row, Col, InputNumber } from 'antd'
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
    // 重置任务列表
    store.fetchTaskList = [...Consts_Task_Config.Const_Default_Config.fetchTaskList]
    store.generateConfig = {
      ...Consts_Task_Config.Const_Default_Config.generateConfig,
    }
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
        <Button>批量添加任务</Button>
        <Form form={form} name="control-hooks" onFinish={onFinish} colon={false}>
          <Form.Item name="note" label="电子书名" rules={[{ required: true }]}>
            <Input
              value={snap.generateConfig.bookTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                store.generateConfig.bookTitle = e.target.value
              }}
            />
          </Form.Item>
          <Form.Item label="抓取任务"></Form.Item>
          <Form.Item noStyle>
            <Row>
              <Col span={Consts.CONST_Task_Item_Width.任务类型}>任务类型</Col>
              <Col span={Consts.CONST_Task_Item_Width.待抓取url}>待抓取url</Col>
              <Col span={Consts.CONST_Task_Item_Width.任务id}>任务id</Col>
              <Col span={Consts.CONST_Task_Item_Width.操作}>操作</Col>
            </Row>
          </Form.Item>
          <Form.List name="task-item-list" initialValue={[undefined]}>
            {(fields, operation) => {
              return fields.map((field) => {
                return (
                  <Form.Item {...field} noStyle>
                    <TaskItem
                      fieldKey={field.key}
                      action={{
                        remove: operation.remove,
                        add: operation.add,
                      }}
                    ></TaskItem>
                  </Form.Item>
                )
              })
            }}
          </Form.List>
          <Form.Item label="排序规则"></Form.Item>
          <Form.Item noStyle>
            <Row>
              <Col span={Consts.CONST_Order_Item_Width.排序指标}>排序指标</Col>
              <Col span={Consts.CONST_Order_Item_Width.规则}>规则</Col>
              <Col span={Consts.CONST_Order_Item_Width.操作}>操作</Col>
            </Row>
          </Form.Item>
          <Form.Item name="order-item-list" noStyle>
            <OrderItem />
          </Form.Item>
          <Form.Item label="图片质量">
            <Radio.Group
              value={snap.generateConfig.imageQuilty}
              onChange={(e) => {
                store.generateConfig.imageQuilty = e.target.value
              }}
              buttonStyle="solid"
            >
              <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_原图}>原图</Radio.Button>
              <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_高清}>高清</Radio.Button>
              <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_无图}>无图</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="自动分卷">
            每
            <InputNumber
              value={snap.generateConfig.maxQuestionOrArticleInBook}
              onChange={(e: number) => {
                console.log(e)
                store.generateConfig.maxQuestionOrArticleInBook = e
              }}
            ></InputNumber>
            个问题/想法/文章为一本电子书
          </Form.Item>
          <Form.Item label="备注">
            <Input
              value={snap.generateConfig.comment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                store.generateConfig.comment = e.target.value
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              开始
            </Button>
            <Button htmlType="button" onClick={onReset}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </div>
      <div className="debug-panel">{/* 调试栏 */}</div>
    </div>
  )
}
