import electron from 'electron'
import { Button, message, Input, Form, Table, Modal, Tag, Card, Radio, Descriptions, Badge, Divider } from 'antd'

import { useState, useRef, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from './resource/const/index'
import * as Types from './resource/type/index'
import { createStore } from './state/index'
import { useSnapshot } from 'valtio'
import * as Ahooks from 'ahooks'

import './index.less'

const { ipcRenderer } = electron

export const Const_Storage_Key = 'login_msk'
const Const_Table_Column_Width = 100

export default () => {
  let [forceUpdate, setForceUpdate] = useState<number>(0)

  // 仅在初始化时通过value创建一次, 后续直接通过useEffect更新store的值
  let refStore = useRef(createStore())
  const store = refStore.current
  let snap = useSnapshot(store)

  const handleRecordSync = {
    async asyncGetBaseInfo() {
      let summaryInfo = ipcRenderer.sendSync('get-db-summary-info')
      store.baseInfo.count = summaryInfo
    },
  }
  // 初始化时获取数据库数据
  Ahooks.useAsyncEffect(handleRecordSync.asyncGetBaseInfo, [])

  return (
    <div className="db_explorer_dawqxf">
      {/* 需要写一个数据库浏览插件 */}
      {/* 1. 能够查看用户列表, 支持分页 */}
      {/* 2. 确定用户后, 能够显示回答列表, 支持分页 */}
      <Card
        title="已入库数据汇总"
        style={{ width: '100%' }}
        extra={[
          <Button key="refresh" type="link" onClick={handleRecordSync.asyncGetBaseInfo}>
            刷新
          </Button>,
        ]}
      >
        <Descriptions title="基础数据" bordered>
          <Descriptions.Item label="文章">{snap.baseInfo.count.article}</Descriptions.Item>
          <Descriptions.Item label="回答">{snap.baseInfo.count.answer}</Descriptions.Item>
          <Descriptions.Item label="想法">{snap.baseInfo.count.pin}</Descriptions.Item>
        </Descriptions>
        <Divider></Divider>
        <Descriptions title="汇总类别" bordered>
          <Descriptions.Item label="问题">{snap.baseInfo.count.question}</Descriptions.Item>
          <Descriptions.Item label="用户">{snap.baseInfo.count.author}</Descriptions.Item>
          <Descriptions.Item label="专栏">{snap.baseInfo.count.column}</Descriptions.Item>
          <Descriptions.Item label="收藏夹">{snap.baseInfo.count.collection}</Descriptions.Item>
          <Descriptions.Item label="话题">{snap.baseInfo.count.topic}</Descriptions.Item>
          <Descriptions.Item label="其他">{'-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
