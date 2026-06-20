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
  Modal,
  Alert,
  Card,
  Tag,
} from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { useSnapshot } from 'valtio'

import { useState, useContext, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Consts from './resource/const/index'
import { createStatusStore, Const_Default_FormValue } from './state'
import TaskItem from './component/task_item/index'
import OrderItem from './component/order_item/index'
import { Const_Default_Order_Item } from './component/order_item/state/index'
import Util from './library/util'
import TaskConfigAdapter, { Type_Form_Config } from './library/task_config_adapter'
import { useRef } from 'react'
import * as Context from '~/src/page/home/resource/context'
import * as Consts_Page from '~/src/resource/const/page'
import * as Ahooks from 'ahooks'
import DebugLog from '~/src/library/debug_log'

import './index.less'

const { TextArea } = Input
const DownIcon = DownOutlined as any

export const Const_Storage_Key = 'login_msk'

type Type_Login_Status = 'unknown' | 'checking' | 'success' | 'failure'

const Const_Login_Status_Text: Record<Type_Login_Status, string> = {
  unknown: '尚未检测登录状态',
  checking: '正在检测知乎登录状态',
  success: '已登录知乎，可以启动任务',
  failure: '未登录或登录已失效，请先完成知乎登录',
}

const Const_Login_Status_Alert_Type: Record<Type_Login_Status, 'info' | 'success' | 'warning'> = {
  unknown: 'info',
  checking: 'info',
  success: 'success',
  failure: 'warning',
}

export default () => {
  const { modal: SimpleModal } = App.useApp()
  let { currentTab, setCurrentTab } = useContext(Context.CurrentTab)

  // 仅在初始化时通过value创建一次, 后续直接通过useEffect更新store的值
  let refStatusStore = useRef(createStatusStore())
  const statusStore = refStatusStore.current
  let statusSnap = useSnapshot(statusStore)

  let [autoGenerateTitle, setAutoGenerateTitle] = useState<boolean>(true)
  let [loginStatus, setLoginStatus] = useState<Type_Login_Status>('unknown')
  let [quickTaskInput, setQuickTaskInput] = useState<string>('')
  // 用于生成计数key, 解决批量导入任务后, 组件不更新的问题
  let [batchTaskUpdateCounter, setBatchTaskUpdateCounter] = useState<number>(0)

  const [form] = Form.useForm<Type_Form_Config>()
  const [modalForm] = Form.useForm<{
    batchUrlListStr: string
  }>()

  const taskItemList = Form.useWatch('taskItemList', form)
  const orderItemList = Form.useWatch('orderItemList', form)
  const legalTaskItemList = taskItemList?.filter((item) => item.id !== '') ?? []
  const taskItemErrorList = taskItemList?.map((item, index) => ({
    index,
    rawInputText: item.rawInputText,
    error: Util.getTaskItemError(item),
  })) ?? []
  const invalidTaskItemList = taskItemErrorList.filter((item) => item.error !== '' && item.rawInputText.trim() !== '')

  Ahooks.useAsyncEffect(async () => {
    // 任务列表内容发生变更, 重新生成电子书标题
    if (autoGenerateTitle) {
      let title = ''
      for (const config of legalTaskItemList) {
        const bufTitle = await window.electronAPI['get-task-default-title']({
          taskType: config.type,
          taskId: config.id,
        })
        if (title === '') {
          title = bufTitle
        } else {
          title = title + '_' + bufTitle
        }
      }
      // 限制最大长度
      if (title.length > 100) {
        title = title.slice(0, 100) + `_等${legalTaskItemList.length}项知乎内容合集`
      }
      form.setFieldValue('bookTitle', title)
    }
  }, [JSON.stringify(legalTaskItemList)])

  useEffect(() => {
    if (statusSnap.initComplete === false) {
      // 配置未载入完成前不进行兜底操作
      return
    }
    // 监控排序列表不能为空
    if (orderItemList?.length === 0) {
      form.setFieldValue('orderItemList', [
        {
          ...Const_Default_Order_Item,
        },
      ])
    }

    // 监控任务列表不能为空
    if (taskItemList?.length === 0) {
      form.setFieldValue('taskItemList', [
        {
          id: '',
          rawInputText: '',
          type: Util.detectTaskType({
            rawInputText: '',
          }),
          skipFetch: false,
        },
      ])
      // 同步到批量任务模态框
      handleBatchTaskModal.syncToModalValue([])
    } else {
      // 同步到批量任务模态框
      handleBatchTaskModal.syncToModalValue(taskItemList)
    }
    // 当配置载入成功时, 也重新执行一次检查工作
  }, [taskItemList, orderItemList, statusSnap.initComplete])

  let [isModalShow, setIsModalShow] = useState<boolean>(false)

  Ahooks.useMount(async () => {
    // 初始化时载入一次
    let config = await window.electronAPI['get-common-config']().catch((err) => {
      return { ...Const_Default_FormValue }
    })
    let initValue = TaskConfigAdapter.taskConfigToForm(config)

    form.setFieldValue('bookTitle', initValue.bookTitle)
    form.setFieldValue('taskItemList', initValue.taskItemList)
    form.setFieldValue('orderItemList', initValue.orderItemList)
    form.setFieldValue('imageQuilty', initValue.imageQuilty)
    form.setFieldValue('maxItemInBook', initValue.maxItemInBook)
    form.setFieldValue('comment', initValue.comment)
    form.setFieldValue('generateType', initValue.generateType)
    form.setFieldValue('outputFormats', initValue.outputFormats)

    handleBatchTaskModal.syncToModalValue(initValue.taskItemList)
    setQuickTaskInput(initValue.taskItemList.map((item) => item.rawInputText).filter((item) => item !== '').join('\n'))

    // 载入完成后标记状态
    statusStore.initComplete = true
  })

  const handleFormAction = {
    asyncOnFinish: async (values: any) => {
      statusStore.loading.startTask = true
      // 提交数据, 生成配置文件
      console.log('final config => ', JSON.stringify(values, null, 2))
      const config = TaskConfigAdapter.formToTaskConfig(values)
      if (config.tasks.length === 0) {
        statusStore.loading.startTask = false
        message.error('请先粘贴至少一个可识别的知乎链接')
        return
      }
      if ((values.outputFormats ?? []).length === 0) {
        statusStore.loading.startTask = false
        message.error('请至少选择一种输出格式')
        return
      }
      let isLogin = await handleFormAction.asyncCheckLogin()
      if (isLogin === false) {
        setLoginStatus('failure')
        statusStore.loading.startTask = false
        SimpleModal.warning({
          title: '登录状态异常',
          content: '请先登录知乎账号后再启动任务',
          okText: '去登陆',
          onOk: () => {
            setCurrentTab(Consts_Page.Const_Page_登录)
          },
        })
        return
      }
      setLoginStatus('success')
      statusStore.loading.startTask = false

      // 直接派发任务即可
      window.electronAPI['start-customer-task']({
        config: config,
      })
      setCurrentTab(Consts_Page.Const_Page_运行日志)
    },
    asyncCheckLogin: async () => {
      const request = {
        url: 'https://www.zhihu.com/api/v4/members/s.invalid/answers',
        params: {
          include:
            'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,attachment,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp,is_recognized;data[*].vessay_info;data[*].author.badge[?(type=best_answerer)].topics;data[*].author.vip_info;data[*].question.has_publishing_draft,relationship',
          offset: 0,
          limit: 20,
          sort_by: 'created',
          // 避免请求被缓存住
          random: Math.floor(Math.random() * 100000),
        },
      }
      let res: any
      try {
        res = await DebugLog.invokeElectronApi<any>('zhihu-http-get', [request], {
          message: '任务启动前检查知乎登录态',
        })
      } catch (error) {
        setLoginStatus('failure')
        DebugLog.append({
          level: 'error',
          channel: 'asyncCheckLogin',
          message: '知乎登录态检查异常：IPC 调用失败',
          request,
          error,
        })
        return false
      }
      if (res.data !== undefined) {
        setLoginStatus('success')
        DebugLog.append({
          level: 'success',
          channel: 'asyncCheckLogin',
          message: '知乎登录态检查通过：响应包含 data 字段',
          request,
          response: {
            dataType: Array.isArray(res.data) ? 'array' : typeof res.data,
            dataLength: Array.isArray(res.data) ? res.data.length : undefined,
          },
        })
        return true
      } else {
        setLoginStatus('failure')
        DebugLog.append({
          level: 'warn',
          channel: 'asyncCheckLogin',
          message: '知乎登录态检查未通过：响应缺少 data 字段',
          request,
          response: res,
        })
        return false
      }
    },
  }

  const handleLoginStatus = {
    asyncRefresh: async () => {
      setLoginStatus('checking')
      statusStore.loading.checkLogin = true
      const isLogin = await handleFormAction.asyncCheckLogin()
      statusStore.loading.checkLogin = false
      setLoginStatus(isLogin ? 'success' : 'failure')
      if (isLogin) {
        message.success('当前状态: 已登录')
        return
      }
      message.error('当前状态: 未登录')
    },
  }

  Ahooks.useAsyncEffect(async () => {
    if (statusSnap.initComplete) {
      await handleLoginStatus.asyncRefresh()
    }
  }, [statusSnap.initComplete])

  const handleBatchTaskModal = {
    syncToModalValue: (taskItemList: Type_Form_Config['taskItemList']) => {
      const batchUrlListStr = taskItemList?.map((item) => item.rawInputText)?.join('\n') ?? ''
      modalForm.setFieldValue('batchUrlListStr', batchUrlListStr)
    },
    syncToTaskList: (batchUrlListStr: string) => {
      const taskList = Util.createTaskItemListFromText({
        rawInputText: batchUrlListStr,
      })
      form.setFieldValue('taskItemList', taskList)
    },
    showModal: () => {
      setIsModalShow(true)
    },
    onOk: () => {
      const batchUrlListStr = modalForm.getFieldValue('batchUrlListStr')
      handleBatchTaskModal.syncToTaskList(batchUrlListStr)
      setBatchTaskUpdateCounter(batchTaskUpdateCounter + 1)
      setIsModalShow(false)
    },
    onCancel: () => {
      setIsModalShow(false)
    },
  }

  const handleQuickTaskInput = {
    syncToTaskList: () => {
      const taskList = Util.createTaskItemListFromText({
        rawInputText: quickTaskInput,
      })
      if (taskList.length === 0) {
        message.warning('请先粘贴至少一个知乎链接')
        return
      }
      form.setFieldValue('taskItemList', taskList)
      handleBatchTaskModal.syncToModalValue(taskList)
      setBatchTaskUpdateCounter(batchTaskUpdateCounter + 1)
    },
  }

  return (
    <div className="customer_task">
      <div className="config-panel">
        <Form
          form={form}
          name="control-hooks"
          onFinish={handleFormAction.asyncOnFinish}
          colon={false}
          initialValues={{
            ...Const_Default_FormValue,
          }}
          labelCol={{
            span: 4,
          }}
          labelAlign="left"
        >
          <Card className="quick-start-card" size="small">
            <div className="quick-start-steps">
              <div className="step-item active">1. 登录知乎</div>
              <div className="step-item active">2. 粘贴链接</div>
              <div className="step-item">3. 开始生成</div>
              <div className="step-item">4. 打开结果</div>
            </div>
            <Alert
              className="login-status-alert"
              type={Const_Login_Status_Alert_Type[loginStatus]}
              showIcon
              message={Const_Login_Status_Text[loginStatus]}
              action={
                <Space>
                  <Button
                    size="small"
                    loading={statusSnap.loading.checkLogin || loginStatus === 'checking'}
                    onClick={handleLoginStatus.asyncRefresh}
                  >
                    重新检测
                  </Button>
                  {loginStatus !== 'success' && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        setCurrentTab(Consts_Page.Const_Page_登录)
                      }}
                    >
                      去登录
                    </Button>
                  )}
                </Space>
              }
            />
            <div className="quick-task-input">
              <TextArea
                {...({ autoSize: { minRows: 3, maxRows: 8 }, allowClear: true } as any)}
                value={quickTaskInput}
                placeholder="粘贴知乎链接，每行一个。例如问题、回答、文章、收藏夹、专栏、话题、想法或用户主页。"
                onChange={(event) => {
                  setQuickTaskInput(event.target.value)
                }}
              />
              <Space wrap className="quick-task-actions">
                <Button type="primary" onClick={handleQuickTaskInput.syncToTaskList}>
                  识别链接
                </Button>
                <Button
                  onClick={() => {
                    handleBatchTaskModal.showModal()
                  }}
                >
                  批量编辑
                </Button>
                <span className={invalidTaskItemList.length > 0 ? 'task-summary has-error' : 'task-summary'}>
                  已识别 {legalTaskItemList.length} 条有效任务
                  {invalidTaskItemList.length > 0 ? `，${invalidTaskItemList.length} 条需要检查` : ''}
                </span>
              </Space>
            </div>
          </Card>
          <Form.Item noStyle>
            <Row justify="space-between" align="middle" gutter={1}>
              <Col span={16}>
                <Form.Item
                  name="bookTitle"
                  label="电子书名"
                  style={{
                    margin: '0 auto',
                  }}
                >
                  <Input disabled={autoGenerateTitle} />
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
                <Tag color={invalidTaskItemList.length > 0 ? 'orange' : 'green'}>
                  {invalidTaskItemList.length > 0 ? '存在待检查任务' : '任务识别正常'}
                </Tag>
              </Col>
              <Modal
                title="批量输入"
                open={isModalShow}
                onOk={handleBatchTaskModal.onOk}
                onCancel={handleBatchTaskModal.onCancel}
              >
                <Form form={modalForm}>
                  <Form.Item name="batchUrlListStr" label="任务列表">
                    <Input.TextArea {...({ autoSize: { minRows: 10 }, allowClear: true } as any)}></Input.TextArea>
                  </Form.Item>
                </Form>
              </Modal>
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
          <Form.List name="taskItemList">
            {(fields, operation) => {
              return fields.map((field) => {
                return (
                  <Form.Item {...field} noStyle>
                    <TaskItem
                      // 每次导入批量数据后, 都强制刷新TaskItem组件, 重建Input组件, 以避免旧defaultValue无法更新的问题
                      key={`${batchTaskUpdateCounter}-${field.key}`}
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
          {invalidTaskItemList.length > 0 && (
            <Alert
              className="task-error-alert"
              type="warning"
              showIcon
              message="部分链接暂未识别成功"
              description={
                <div>
                  {invalidTaskItemList.map((item) => (
                    <div key={item.index}>
                      第 {item.index + 1} 条：{item.error}
                    </div>
                  ))}
                </div>
              }
            />
          )}
          <Form.Item noStyle>
            <Row align="middle" gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="imageQuilty"
                  label="图片质量"
                  labelCol={{
                    span: 6,
                  }}
                >
                  <Radio.Group buttonStyle="solid">
                    <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_高清}>高清</Radio.Button>
                    <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_原图}>原图</Radio.Button>
                    <Radio.Button value={Consts_Task_Config.Const_Image_Quilty_无图}>无图</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="outputFormats"
                  label="输出格式"
                  labelCol={{
                    span: 6,
                  }}
                >
                  <Checkbox.Group
                    options={[
                      { label: 'HTML', value: Consts_Task_Config.Const_Output_Format_Html },
                      { label: 'EPUB', value: Consts_Task_Config.Const_Output_Format_Epub },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <details className="advanced-config-panel">
            <summary>高级配置：生成模式、排序、分卷和备注</summary>
          <Form.Item noStyle>
            <Row align="middle" gutter={1}>
              <Col span={Consts.CONST_Order_Item_Width.排序指标}>排序指标</Col>
              <Col span={Consts.CONST_Order_Item_Width.规则}>规则</Col>
              <Col span={Consts.CONST_Order_Item_Width.操作}>操作</Col>
            </Row>
            <Divider style={{ margin: '12px' }} />
          </Form.Item>
          <Form.List name="orderItemList">
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
            name="generateType"
            label="生成模式"
            labelCol={{
              span: 3,
            }}
          >
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={Consts_Task_Config.Const_Generate_Type_独立输出电子书}>独立成书</Radio.Button>
              <Radio.Button value={Consts_Task_Config.Const_Generate_Type_合并输出电子书_按任务拆分章节}>
                按任务合并
              </Radio.Button>
              <Radio.Button value={Consts_Task_Config.Const_Generate_Type_合并输出电子书_内容打乱重排}>
                打乱合并
              </Radio.Button>
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
              <Form.Item name="maxItemInBook" noStyle>
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
            <TextArea {...({ allowClear: true } as any)} />
          </Form.Item>
          </details>
          <Form.Item wrapperCol={{ span: 14, offset: 3 }}>
            <Button type="primary" htmlType="submit" loading={statusSnap.loading.startTask}>
              开始
            </Button>
            <Divider type="vertical"></Divider>
            <Button
              htmlType="button"
              onClick={async () => {
                await window.electronAPI['open-output-dir']()
              }}
            >
              打开电子书输出目录
            </Button>
            <Divider type="vertical"></Divider>
            <Space wrap>
              <Dropdown.Button
                loading={statusSnap.loading.checkLogin}
                menu={{
                  items: [
                    {
                      key: '检查登录状态',
                      label: '检查登录状态',
                      onClick: async () => {
                        statusStore.loading.checkLogin = true
                        let isLogin = await handleFormAction.asyncCheckLogin()
                        statusStore.loading.checkLogin = false
                        if (isLogin) {
                          message.success('当前状态: 已登录')
                          return
                        }
                        message.error('当前状态: 未登录')
                        return
                      },
                    },
                    {
                      key: '注销登录',
                      label: '注销登录',
                      danger: true,
                      onClick: async () => {
                        await window.electronAPI['clear-all-session-storage']()
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
                icon={<DownIcon />}
              >
                账户菜单
              </Dropdown.Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
