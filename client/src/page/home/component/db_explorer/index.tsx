import { Button, message, Input, Form, Table, Modal, Tag, Card, Radio, Descriptions, Badge, Divider } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { useState, useRef, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from './resource/const/index'
import * as Types from './resource/type/index'
import { createStore } from './state/index'
import { useSnapshot } from 'valtio'
import * as Ahooks from 'ahooks'

import './index.less'

export const Const_Storage_Key = 'login_msk'
const Const_Table_Column_Width = 100

export default () => {
  let [forceUpdate, setForceUpdate] = useState<number>(0)
  let [isLoading, setIsLoading] = useState<boolean>(false)

  // 仅在初始化时通过value创建一次, 后续直接通过useEffect更新store的值
  let refStore = useRef(createStore())
  const store = refStore.current
  let snap = useSnapshot(store)

  const handleRecordFunc = {
    getBaseInfo: async () => {
      setIsLoading(true)
      let summaryInfo = await window.electronAPI['get-db-summary-info']()
      store.baseInfo.count = summaryInfo
      setIsLoading(false)
    },
  }
  // 初始化时获取数据库数据
  Ahooks.useAsyncEffect(handleRecordFunc.getBaseInfo, [])

  return (
    <div className="db_explorer_dawqxf">
      {/* 需要写一个数据库浏览插件 */}
      {/* 1. 能够查看用户列表, 支持分页 */}
      {/* 2. 确定用户后, 能够显示回答列表, 支持分页 */}
      <Card
        loading={isLoading}
        title="已入库数据汇总"
        style={{ width: '100%' }}
        extra={[
          <Button key="refresh" type="link" onClick={handleRecordFunc.getBaseInfo}>
            刷新
          </Button>,
        ]}
      >
        <Card title="基础数据" className="summary-card">
          <Card.Grid>文章:{snap.baseInfo.count.article}</Card.Grid>
          <Card.Grid>回答:{snap.baseInfo.count.answer}</Card.Grid>
          <Card.Grid>想法:{snap.baseInfo.count.pin}</Card.Grid>
        </Card>
        <Card title="汇总类别" className="summary-card">
          <Card.Grid
            onClick={() => {
              store.currentSelect.type = Consts.Current_Select_Type_问题
            }}
            className={snap.currentSelect.type === Consts.Current_Select_Type_问题 ? 'active' : ''}
          >
            提问: {snap.baseInfo.count.question}
          </Card.Grid>
          <Card.Grid
            onClick={() => {
              store.currentSelect.type = Consts.Current_Select_Type_用户的所有回答
            }}
            className={snap.currentSelect.type === Consts.Current_Select_Type_用户的所有回答 ? 'active' : ''}
          >
            用户: {snap.baseInfo.count.author}
          </Card.Grid>
          <Card.Grid
            onClick={() => {
              store.currentSelect.type = Consts.Current_Select_Type_专栏
            }}
            className={snap.currentSelect.type === Consts.Current_Select_Type_专栏 ? 'active' : ''}
          >
            专栏: {snap.baseInfo.count.column}
          </Card.Grid>
          <Card.Grid
            onClick={() => {
              store.currentSelect.type = Consts.Current_Select_Type_收藏夹
            }}
            className={snap.currentSelect.type === Consts.Current_Select_Type_收藏夹 ? 'active' : ''}
          >
            收藏夹: {snap.baseInfo.count.collection}
          </Card.Grid>
          <Card.Grid
            onClick={() => {
              store.currentSelect.type = Consts.Current_Select_Type_话题
            }}
            className={snap.currentSelect.type === Consts.Current_Select_Type_话题 ? 'active' : ''}
          >
            话题: {snap.baseInfo.count.topic}
          </Card.Grid>
        </Card>
      </Card>
    </div>
  )
}
