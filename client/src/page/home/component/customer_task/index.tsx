import electron from 'electron'
import {
  Button,
  message,
  Input,
  Form,
  Divider,
  Radio,
  Select,
  Space,
  Row,
  Col,
  InputNumber,
  Dropdown,
  App,
  Checkbox,
} from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { useSnapshot } from 'valtio'

import { useState, useContext, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Consts from './resource/const/index'
import { createStore } from './state'
import TaskItem from './component/task_item/index'
import OrderItem from './component/order_item/index'
import Util, { Type_Form_Config } from './library/index'
import { useRef } from 'react'
import * as Context from '~/src/page/home/resource/context'
import * as Consts_Page from '~/src/resource/const/page'
import * as Ahooks from 'ahooks'

import './index.less'

const { ipcRenderer } = electron
const { Option } = Select
const { TextArea } = Input

export const Const_Storage_Key = 'login_msk'
const Const_Table_Column_Width = 100

export default () => {
  const { modal: SimpleModal } = App.useApp()
  let { currentTab, setCurrentTab } = useContext(Context.CurrentTab)

  // 仅在初始化时通过value创建一次, 后续直接通过useEffect更新store的值
  let refStore = useRef(createStore())
  const store = refStore.current
  let snap = useSnapshot(store)

  let [autoGenerateTitle, setAutoGenerateTitle] = useState<boolean>(true)

  const [form] = Form.useForm<Type_Form_Config>()

  const taskItemList = Form.useWatch('task-item-list', form)
  const legalTaskItemList = taskItemList?.filter((item) => item.id !== '')

  Ahooks.useAsyncEffect(async () => {
    // 任务列表内容发生变更, 重新生成电子书标题
    // console.log('legalTaskItemList has changed => ', legalTaskItemList)
    if (autoGenerateTitle) {
      let title = ''
      for (const config of legalTaskItemList) {
        const bufTitle = ipcRenderer.sendSync('get-task-default-title', {
          taskType: config.type,
          taskId: config.id,
        })
        if (title === '') {
          title = bufTitle
        } else {
          title = title + '_' + bufTitle
        }
      }
      form.setFieldValue('book-title', title)
    }
  }, [JSON.stringify(legalTaskItemList)])

  let [forceUpdate, setForceUpdate] = useState<number>(0)
  let [initStoreValue, setInitStoreValue] = useState<ReturnType<typeof Util.generateStatus>>({} as any)

  let [isModalShow, setIsModalShow] = useState<boolean>(false)

  Ahooks.useMount(() => {
    // 初始化时载入一次
    let config = ipcRenderer.sendSync('get-common-config')
    // console.log('init config =>', config)
    let initStoreValue = Util.generateStatus(config)
    setInitStoreValue(initStoreValue)
  })

  useEffect(() => {
    if (initStoreValue?.generateConfig?.bookTitle !== undefined) {
      for (let key of Object.keys(initStoreValue)) {
        // @ts-ignore
        store[key] = initStoreValue[key]
      }
      form.setFieldValue('book-title', initStoreValue.generateConfig.bookTitle)
      form.setFieldValue('task-item-list', initStoreValue.fetchTaskList)
      form.setFieldValue('order-item-list', initStoreValue.generateConfig.orderByList)
      form.setFieldValue('image-quilty', initStoreValue.generateConfig.imageQuilty)
      form.setFieldValue('max-item-in-book', initStoreValue.generateConfig.maxItemInBook)
      form.setFieldValue('comment', initStoreValue.generateConfig.comment)
    }
  }, [initStoreValue])

  const asyncOnFinish = async (values: any) => {
    // 提交数据, 生成配置文件
    console.log('final config => ', JSON.stringify(values, null, 2))
    const config = Util.generateTaskConfig(values)
    // let isLogin = await asyncCheckLogin()
    // if (isLogin === false) {
    //   SimpleModal.warning({
    //     title: '登录状态异常',
    //     content: '请先登录知乎账号后再启动任务',
    //     okText: '去登陆',
    //     onOk: () => {
    //       setCurrentTab(Consts_Page.Const_Page_登录)
    //     },
    //   })
    //   return
    // }

    ipcRenderer.sendSync('start-customer-task', {
      config: config,
    })
  }

  const asyncCheckLogin = async () => {
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
    if (res.data !== undefined) {
      return true
    } else {
      return false
    }
  }

  return (
    <div className="customer_task">
      <div className="config-panel">
        <Form
          form={form}
          name="control-hooks"
          onFinish={asyncOnFinish}
          colon={false}
          initialValues={{
            'book-title': snap.generateConfig.bookTitle,
            'task-item-list': [...snap.fetchTaskList],
            'order-item-list': [...snap.generateConfig.orderByList],
            'image-quilty': snap.generateConfig.imageQuilty,
            'max-item-in-book': snap.generateConfig.maxItemInBook,
            comment: snap.generateConfig.comment,
          }}
          labelCol={{
            span: 4,
          }}
          labelAlign="left"
        >
          <Form.Item noStyle>
            <Row justify="space-between" align="middle" gutter={1}>
              <Col span={16}>
                <Form.Item
                  name="book-title"
                  label="电子书名"
                  style={{
                    margin: '0 auto',
                  }}
                >
                  <Input
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      store.generateConfig.bookTitle = e.target.value
                    }}
                    disabled={autoGenerateTitle}
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Checkbox
                  checked={autoGenerateTitle}
                  onChange={(e) => {
                    setAutoGenerateTitle(e.target.checked)
                  }}
                >
                  自动生成书名
                </Checkbox>
              </Col>
              <Col span={4}>
                <Button>批量添加任务</Button>
              </Col>
            </Row>
            <Divider style={{ margin: '12px' }} />
          </Form.Item>
          <Form.Item noStyle>
            <Row align="middle" gutter={1}>
              <Col span={Consts.CONST_Task_Item_Width.任务类型}>任务类型</Col>
              <Col span={Consts.CONST_Task_Item_Width.待抓取url}>待抓取url(取消勾选则跳过抓取)</Col>
              <Col span={Consts.CONST_Task_Item_Width.任务id} offset={1}>
                任务id
              </Col>
              <Col span={Consts.CONST_Task_Item_Width.操作}>操作</Col>
            </Row>
            <Divider style={{ margin: '12px' }} />
          </Form.Item>
          <Form.List name="task-item-list">
            {(fields, operation) => {
              return fields.map((field) => {
                return (
                  <Form.Item {...field} noStyle>
                    <TaskItem
                      fieldIndex={field.name}
                      action={{
                        remove: (index: number) => {
                          operation.remove(index)
                        },
                        add: operation.add,
                      }}
                    ></TaskItem>
                  </Form.Item>
                )
              })
            }}
          </Form.List>
          <Form.Item noStyle>
            <Row align="middle" gutter={1}>
              <Col span={Consts.CONST_Order_Item_Width.排序指标}>排序指标</Col>
              <Col span={Consts.CONST_Order_Item_Width.规则}>规则</Col>
              <Col span={Consts.CONST_Order_Item_Width.操作}>操作</Col>
            </Row>
            <Divider style={{ margin: '12px' }} />
          </Form.Item>
          <Form.List name="order-item-list">
            {(fields, operation) => {
              return fields.map((field) => {
                return (
                  <Form.Item {...field} noStyle>
                    <OrderItem
                      fieldKey={field.key}
                      action={{
                        remove: operation.remove,
                        add: operation.add,
                      }}
                    ></OrderItem>
                  </Form.Item>
                )
              })
            }}
          </Form.List>
          <Form.Item
            name="image-quilty"
            label="图片质量"
            labelCol={{
              span: 3,
            }}
          >
            <Radio.Group
              onChange={(e) => {
                console.log('imageQuilty => ', e.target.value)
                store.generateConfig.imageQuilty = e.target.value
              }}
              buttonStyle="solid"
            >
              <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_原图}>原图</Radio.Button>
              <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_高清}>高清</Radio.Button>
              <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_无图}>无图</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="自动分卷"
            labelCol={{
              span: 3,
            }}
          >
            <Space>
              单本电子书中最多
              <Form.Item name="max-item-in-book" noStyle>
                <InputNumber step={1000}></InputNumber>
              </Form.Item>
              条答案/想法/文章
            </Space>
          </Form.Item>
          <Form.Item
            name="comment"
            label="备注"
            labelCol={{
              span: 3,
            }}
            wrapperCol={{ span: 18 }}
          >
            <TextArea allowClear />
          </Form.Item>
          <Form.Item wrapperCol={{ span: 14, offset: 3 }}>
            <Button type="primary" htmlType="submit">
              开始
            </Button>
            <Divider type="vertical"></Divider>
            <Button
              htmlType="button"
              onClick={() => {
                ipcRenderer.sendSync('open-output-dir')
              }}
            >
              打开输出目录
            </Button>
            <Divider type="vertical"></Divider>
            <Space wrap>
              <Dropdown.Button
                menu={{
                  items: [
                    {
                      label: '检查登录状态',
                      onClick: async () => {
                        let isLogin = await asyncCheckLogin()
                        if (isLogin) {
                          message.success('当前状态: 已登录')
                          return
                        }
                        message.error('当前状态: 未登录')
                        return
                      },
                    },
                    {
                      label: '打开开发者工具',
                      onClick: () => {
                        ipcRenderer.sendSync('open-devtools')
                      },
                    },
                    {
                      label: '注销登录',
                      danger: true,
                      onClick: () => {
                        ipcRenderer.sendSync('clear-all-session-storage')
                        SimpleModal.warning({
                          title: '注销成功',
                          content: '请重新登录知乎账号',
                          okText: '去登陆',
                          onOk: () => {
                            setCurrentTab(Consts_Page.Const_Page_登录)
                          },
                        })
                      },
                    },
                  ],
                  onClick: () => {},
                }}
                icon={<DownOutlined />}
              >
                调试菜单
              </Dropdown.Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
      <div className="debug-panel">{/* 调试栏 */}</div>
    </div>
  )
}
