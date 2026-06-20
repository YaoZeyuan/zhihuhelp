import { Avatar, Button, Card, Empty, Pagination, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
import { useState, useRef, useEffect } from 'react'
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

type PendingDetailPick = {
  pageNo: number
  position: 'first' | 'last'
} | null

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return '-'
  }
  return dayjs.unix(timestamp).format('YYYY-MM-DD')
}

function formatCount(value?: number) {
  return Number.isFinite(value) ? value : 0
}

function isRichRecord(item: Types.DataType) {
  return item.recordKind === 'answer' || item.recordKind === 'article' || item.recordKind === 'pin'
}

function isIndexType(type: Types.Select_Type) {
  return (
    type === Consts.Current_Select_Type_问题 ||
    type === Consts.Current_Select_Type_用户的所有回答 ||
    type === Consts.Current_Select_Type_专栏 ||
    type === Consts.Current_Select_Type_收藏夹 ||
    type === Consts.Current_Select_Type_话题
  )
}

function getAgreeLabel(item: Types.DataType) {
  if (item.recordKind === 'pin') {
    return '喜欢'
  }
  return '赞同'
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/"/g, '&quot;')
}

function getHtmlAttributeValue(htmlTag: string, attrName: string) {
  const match = htmlTag.match(new RegExp(`${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? ''
}

function isUsableImageSrc(src: string) {
  const normalizedSrc = src.trim()
  return normalizedSrc !== '' && /^data:/i.test(normalizedSrc) === false && normalizedSrc !== '#'
}

function normalizeZhihuContentHtml(contentHtml?: string) {
  if (typeof contentHtml !== 'string' || contentHtml.trim() === '') {
    return ''
  }
  return contentHtml.replace(/<img\b[^>]*>/gi, (imgTag) => {
    const src = getHtmlAttributeValue(imgTag, 'src')
    if (isUsableImageSrc(src)) {
      return imgTag
    }
    const actualSrc =
      getHtmlAttributeValue(imgTag, 'data-actualsrc') ||
      getHtmlAttributeValue(imgTag, 'data-original') ||
      getHtmlAttributeValue(imgTag, 'data-default-watermark-src')
    if (actualSrc.trim() === '') {
      return imgTag
    }
    if (src.trim() !== '') {
      return imgTag.replace(/\ssrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, ` src="${escapeHtmlAttribute(actualSrc)}"`)
    }
    return imgTag.replace(/^<img\b/i, `<img src="${escapeHtmlAttribute(actualSrc)}"`)
  })
}

export default () => {
  let [forceUpdate, setForceUpdate] = useState<number>(0)
  let [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false)
  let [isRecordListLoading, setIsRecordListLoading] = useState<boolean>(false)
  let [selectedParent, setSelectedParent] = useState<Types.DataType | null>(null)
  let [selectedDetail, setSelectedDetail] = useState<Types.DataType | null>(null)
  let [pendingDetailPick, setPendingDetailPick] = useState<PendingDetailPick>(null)

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
        parentId: selectedParent?.id,
      }).catch(() => {
        return {
          recordList: [],
          total: 0,
          pageNo: store.currentSelect.info.pageNo,
          pageSize: store.currentSelect.info.pageSize,
          parentId: selectedParent?.id,
        }
      })
      store.currentSelect.info = {
        recordList: info?.recordList ?? [],
        total: info?.total ?? 0,
        pageNo: info?.pageNo ?? store.currentSelect.info.pageNo,
        pageSize: info?.pageSize ?? store.currentSelect.info.pageSize,
        parentId: info?.parentId,
      }
      setIsRecordListLoading(false)
    },
    selectType: (type: Types.Select_Type) => {
      setSelectedParent(null)
      setSelectedDetail(null)
      setPendingDetailPick(null)
      store.currentSelect.type = type
      store.currentSelect.info.pageNo = 0
    },
    selectParent: (item: Types.DataType) => {
      setSelectedParent(item)
      setSelectedDetail(null)
      setPendingDetailPick(null)
      store.currentSelect.info.pageNo = 0
    },
    backToParentList: () => {
      setSelectedParent(null)
      setSelectedDetail(null)
      setPendingDetailPick(null)
      store.currentSelect.info.pageNo = 0
    },
    selectDetail: (item: Types.DataType) => {
      setSelectedDetail(item)
    },
    backToSummaryList: () => {
      setSelectedDetail(null)
      setPendingDetailPick(null)
    },
    refreshAll: async () => {
      setSelectedDetail(null)
      setPendingDetailPick(null)
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
    selectedParent?.id,
    forceUpdate,
  ])

  const recordList = [...snap.currentSelect.info.recordList]
  const selectedDetailKey = selectedDetail?.key
  const selectedDetailIndex = selectedDetailKey ? recordList.findIndex((item) => item.key === selectedDetailKey) : -1
  const canSelectPrevDetail = selectedDetailIndex > 0
  const canSelectNextDetail = selectedDetailIndex >= 0 && selectedDetailIndex < recordList.length - 1
  const hasPrevDetailPage = snap.currentSelect.info.pageNo > 0
  const hasNextDetailPage =
    (snap.currentSelect.info.pageNo + 1) * snap.currentSelect.info.pageSize < snap.currentSelect.info.total
  const canNavigatePrevDetail = canSelectPrevDetail || hasPrevDetailPage
  const canNavigateNextDetail = canSelectNextDetail || hasNextDetailPage

  useEffect(() => {
    if (!pendingDetailPick || isRecordListLoading || snap.currentSelect.info.pageNo !== pendingDetailPick.pageNo) {
      return
    }
    const nextDetail =
      pendingDetailPick.position === 'first'
        ? recordList.find(isRichRecord)
        : [...recordList].reverse().find(isRichRecord)
    if (nextDetail) {
      setSelectedDetail(nextDetail)
    }
    setPendingDetailPick(null)
  }, [pendingDetailPick, isRecordListLoading, snap.currentSelect.info.pageNo, snap.currentSelect.info.recordList])

  const renderAuthor = (item: Types.DataType) => {
    if (!item.author) {
      return null
    }
    return (
      <div className="zhihu-card-author">
        <Avatar size={32} src={item.author.avatarUrl}>
          {item.author.name.slice(0, 1)}
        </Avatar>
        <div className="zhihu-card-author-text">
          {item.author.url ? (
            <a href={item.author.url} target="_blank" rel="noreferrer">
              {item.author.name}
            </a>
          ) : (
            <span>{item.author.name}</span>
          )}
          {item.author.headline && <span>{item.author.headline}</span>}
        </div>
      </div>
    )
  }

  const renderRichRecord = (item: Types.DataType) => {
    return (
      <article className={`zhihu-content-card ${item.recordKind}`} key={item.key}>
        <div className="zhihu-card-title-band">
          <div>
            <Tag color={item.recordKind === 'answer' ? 'blue' : item.recordKind === 'article' ? 'cyan' : 'gold'}>
              {item.type}
            </Tag>
            <h2>{item.title || item.name}</h2>
          </div>
          {item.subtitle && <p>{item.subtitle}</p>}
        </div>
        <div className="zhihu-card-body">
          {renderAuthor(item)}
          {item.coverUrl && <img className="zhihu-card-cover" src={item.coverUrl} alt="" />}
          {item.contentHtml ? (
            <div
              className="zhihu-card-content"
              dangerouslySetInnerHTML={{ __html: normalizeZhihuContentHtml(item.contentHtml) }}
            />
          ) : (
            <div className="zhihu-card-empty-content">{item.description || '暂无正文内容'}</div>
          )}
          {item.originContentHtml && (
            <div className="zhihu-card-origin-pin">
              <div className="origin-title">原想法</div>
              <div dangerouslySetInnerHTML={{ __html: normalizeZhihuContentHtml(item.originContentHtml) }} />
            </div>
          )}
          <div className="zhihu-card-meta">
            <span>
              {getAgreeLabel(item)}:{formatCount(item.voteupCount)}
            </span>
            <span>评论:{formatCount(item.commentCount)}</span>
            <span>创建时间:{formatDate(item.createdAt)}</span>
            <span>最后更新:{formatDate(item.updatedAt)}</span>
            {item.sourceUrl && (
              <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                打开原文
              </a>
            )}
          </div>
        </div>
      </article>
    )
  }

  const renderRichRecordSummary = (item: Types.DataType) => {
    return (
      <article
        className={`zhihu-summary-card ${item.recordKind}`}
        key={item.key}
        onClick={() => handleRecordFunc.selectDetail(item)}
      >
        <div className="zhihu-summary-header">
          <Tag color={item.recordKind === 'answer' ? 'blue' : item.recordKind === 'article' ? 'cyan' : 'gold'}>
            {item.type}
          </Tag>
          <strong>{item.title || item.name}</strong>
          <Button size="small">查看详情</Button>
        </div>
        {renderAuthor(item)}
        {item.description && <div className="zhihu-summary-description">{item.description}</div>}
        <div className="zhihu-card-meta compact">
          <span>
            {getAgreeLabel(item)}:{formatCount(item.voteupCount)}
          </span>
          <span>评论:{formatCount(item.commentCount)}</span>
          <span>创建时间:{formatDate(item.createdAt)}</span>
          <span>最后更新:{formatDate(item.updatedAt)}</span>
        </div>
      </article>
    )
  }

  const renderMetaRecord = (item: Types.DataType) => {
    const canDrilldown = isIndexType(snap.currentSelect.type) && selectedParent === null
    return (
      <article
        className={`zhihu-meta-card ${canDrilldown ? 'clickable' : ''}`}
        key={item.key}
        onClick={() => {
          if (canDrilldown) {
            handleRecordFunc.selectParent(item)
          }
        }}
      >
        <div className="zhihu-meta-card-header">
          <Tag>{item.type}</Tag>
          <strong>{item.name}</strong>
          <span>{item.id}</span>
          {canDrilldown && <Button size="small">查看内容</Button>}
        </div>
        {item.description && <div className="zhihu-meta-card-description">{item.description}</div>}
      </article>
    )
  }

  const renderRecordList = () => {
    if (isRecordListLoading) {
      return (
        <div className="record-loading">
          <Spin />
        </div>
      )
    }
    if (recordList.length === 0) {
      return <Empty description="当前分类暂无缓存记录" />
    }
    if (selectedDetail && isRichRecord(selectedDetail)) {
      return (
        <div className="record-detail-view">
          <div className="record-detail-toolbar">
            <Button onClick={handleRecordFunc.backToSummaryList}>返回摘要列表</Button>
            <div className="record-detail-nav">
              <Button
                disabled={!canNavigatePrevDetail}
                onClick={() => {
                  if (canSelectPrevDetail) {
                    handleRecordFunc.selectDetail(recordList[selectedDetailIndex - 1])
                    return
                  }
                  if (hasPrevDetailPage) {
                    const pageNo = store.currentSelect.info.pageNo - 1
                    setIsRecordListLoading(true)
                    setPendingDetailPick({ pageNo, position: 'last' })
                    store.currentSelect.info.pageNo = pageNo
                  }
                }}
              >
                上一个
              </Button>
              <Button
                type="primary"
                disabled={!canNavigateNextDetail}
                onClick={() => {
                  if (canSelectNextDetail) {
                    handleRecordFunc.selectDetail(recordList[selectedDetailIndex + 1])
                    return
                  }
                  if (hasNextDetailPage) {
                    const pageNo = store.currentSelect.info.pageNo + 1
                    setIsRecordListLoading(true)
                    setPendingDetailPick({ pageNo, position: 'first' })
                    store.currentSelect.info.pageNo = pageNo
                  }
                }}
              >
                下一个
              </Button>
            </div>
          </div>
          {renderRichRecord(selectedDetail)}
        </div>
      )
    }
    return <div className="record-card-list">{recordList.map((item) => (isRichRecord(item) ? renderRichRecordSummary(item) : renderMetaRecord(item)))}</div>
  }

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
        <Card title="核心内容" className="summary-card">
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_回答)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_回答 ? 'active' : ''}
          >
            回答: {snap.baseInfo.count.answer}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_文章)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_文章 ? 'active' : ''}
          >
            文章: {snap.baseInfo.count.article}
          </Card.Grid>
          <Card.Grid
            onClick={() => handleRecordFunc.selectType(Consts.Current_Select_Type_想法)}
            className={snap.currentSelect.type === Consts.Current_Select_Type_想法 ? 'active' : ''}
          >
            想法: {snap.baseInfo.count.pin}
          </Card.Grid>
        </Card>
        <Card title="索引数据" className="summary-card">
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
        title={selectedParent ? `${selectedParent.name} - 缓存内容` : `${Const_Select_Type_Title[snap.currentSelect.type]}缓存内容`}
        extra={
          <div className="record-card-extra">
            {selectedParent && <Button onClick={handleRecordFunc.backToParentList}>返回{Const_Select_Type_Title[snap.currentSelect.type]}列表</Button>}
            <span>共 {snap.currentSelect.info.total} 条</span>
          </div>
        }
      >
        {renderRecordList()}
        {selectedDetail === null && (
          <Pagination
            className="record-pagination"
            current={snap.currentSelect.info.pageNo + 1}
            pageSize={snap.currentSelect.info.pageSize}
            total={snap.currentSelect.info.total}
            showSizeChanger
            showQuickJumper
            pageSizeOptions={[5, 10, 20]}
            showTotal={(total: number) => `共 ${total} 条`}
            onChange={(page: number, pageSize: number) => {
              setSelectedDetail(null)
              setPendingDetailPick(null)
              store.currentSelect.info.pageNo = page - 1
              store.currentSelect.info.pageSize = pageSize
            }}
          />
        )}
      </Card>
    </div>
  )
}
