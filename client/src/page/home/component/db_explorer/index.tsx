import { Button, Card, Table, Tag } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { useState, useRef } from 'react'
import * as Consts from './resource/const/index'
import * as Types from './resource/type/index'
import { createStore } from './state/index'
import { useSnapshot } from 'valtio'
import * as Ahooks from 'ahooks'

import './index.less'

export const Const_Storage_Key = 'login_msk'

const Const_Select_Type_Title: Record<Types.Select_Type, string> = {
  [Consts.Current_Select_Type_回答]: '回答',
  [Consts.Current_Select_Type_文章]: '文章',
  [Consts.Current_Select_Type_想法]: '想法',
  [Consts.Current_Select_Type_问题]: '问题',
  [Consts.Current_Select_Type_用户的所有回答]: '用户',
  [Consts.Current_Select_Type_专栏]: '专栏',
  [Consts.Current_Select_Type_收藏夹]: '收藏夹',
  [Consts.Current_Select_Type_话题]: '话题',
}

export default () => {
  let [forceUpdate, setForceUpdate] = useState<number>(0)
  let [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false)
  let [isRecordListLoading, setIsRecordListLoading] = useState<boolean>(false)

  // 仅在初始化时通过value创建一次, 后续直接通过useEffect更新store的值
  let refStore = useRef(createStore())
  const store = refStore.current
  let snap = useSnapshot(store)

  const handleRecordFunc = {
    getBaseInfo: async () => {
      setIsSummaryLoading(true)
      let summaryInfo = await window.electronAPI['get-db-summary-info']()
      store.baseInfo.count = summaryInfo
      setIsSummaryLoading(false)
    },
    getRecordList: async () => {
      setIsRecordListLoading(true)
      const info = await window.electronAPI['get-db-record-list']({
        type: store.currentSelect.type,
        pageNo: store.currentSelect.info.pageNo,
        pageSize: store.currentSelect.info.pageSize,
      }).catch(() => {
        return {
          recordList: [],
          total: 0,
          pageNo: store.currentSelect.info.pageNo,
          pageSize: store.currentSelect.info.pageSize,
        }
      })
      store.currentSelect.info = {
        recordList: info?.recordList ?? [],
        total: info?.total ?? 0,
        pageNo: info?.pageNo ?? store.currentSelect.info.pageNo,
        pageSize: info?.pageSize ?? store.currentSelect.info.pageSize,
      }
      setIsRecordListLoading(false)
    },
    selectType: (type: Types.Select_Type) => {
      store.currentSelect.type = type
      store.currentSelect.info.pageNo = 0
    },
    refreshAll: async () => {
      await handleRecordFunc.getBaseInfo()
      await handleRecordFunc.getRecordList()
    },
  }
  // 初始化时获取数据库数据
  Ahooks.useAsyncEffect(handleRecordFunc.getBaseInfo, [])
  Ahooks.useAsyncEffect(handleRecordFunc.getRecordList, [
    snap.currentSelect.type,
    snap.currentSelect.info.pageNo,
    snap.currentSelect.info.pageSize,
    forceUpdate,
  ])

  const columns: ColumnsType<Types.DataType> = [
    {
      title: '类别',
      dataIndex: 'type',
      width: 100,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 220,
      ellipsis: true,
    },
    {
      title: '说明',
      dataIndex: 'description',
      ellipsis: true,
    },
  ]

  return (
    <div className="db_explorer_dawqxf">
      <Card
        loading={isSummaryLoading}
        title="已入库数据汇总"
        style={{ width: '100%' }}
        extra={[
          <Button
            key="refresh"
            type="link"
            onClick={async () => {
              setForceUpdate(forceUpdate + 1)
              await handleRecordFunc.refreshAll()
            }}
          >
            刷新
          </Button>,
        ]}
      >
        <Card title="基础数据" className="summary-card">
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_文章)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_文章 ? 'active' : ''}
          >
            文章: {snap.baseInfo.count.article}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_回答)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_回答 ? 'active' : ''}
          >
            回答: {snap.baseInfo.count.answer}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_想法)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_想法 ? 'active' : ''}
          >
            想法: {snap.baseInfo.count.pin}
          </Card.Grid>
        </Card>
        <Card title="汇总类别" className="summary-card">
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_问题)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_问题 ? 'active' : ''}
          >
            提问: {snap.baseInfo.count.question}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_用户的所有回答)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_用户的所有回答 ? 'active' : ''}
          >
            用户: {snap.baseInfo.count.author}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_专栏)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_专栏 ? 'active' : ''}
          >
            专栏: {snap.baseInfo.count.column}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_收藏夹)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_收藏夹 ? 'active' : ''}
          >
            收藏夹: {snap.baseInfo.count.collection}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_话题)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_话题 ? 'active' : ''}
          >
            话题: {snap.baseInfo.count.topic}
          </Card.Grid>
        </Card>
      </Card>
      <Card
        className="record-list-card"
        title={`${Const_Select_Type_Title[snap.currentSelect.type]}列表`}
        extra={<span>共 {snap.currentSelect.info.total} 条</span>}
      >
        <Table
          rowKey="key"
          loading={isRecordListLoading}
          columns={columns}
          dataSource={[...snap.currentSelect.info.recordList]}
          pagination={{
            current: snap.currentSelect.info.pageNo + 1,
            pageSize: snap.currentSelect.info.pageSize,
            total: snap.currentSelect.info.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条`,
            onChange: (page: number, pageSize: number) => {
              store.currentSelect.info.pageNo = page - 1
              store.currentSelect.info.pageSize = pageSize
            },
          }}
        />
      </Card>
    </div>
  )
}
