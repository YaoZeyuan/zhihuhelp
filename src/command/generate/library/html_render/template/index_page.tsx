import React from 'react'
import { Type_Index_Record } from '../../../customer'
import CommonUtil from '~/src/library/util/common'

export default (props: { bookname: string; recordList: Type_Index_Record[] }) => {
  let indexPageEleList: React.ReactElement<any>[] = []
  for (let subPackageRecord of props.recordList) {
    let pageEleList: React.ReactElement<any>[] = []

    for (let page of subPackageRecord.pageList) {
      let pageEle = (
        <li key={CommonUtil.getUuid()}>
          <a className="list-group-item" href={`${page.uri}`}>
            {page.title}
          </a>
        </li>
      )
      pageEleList.push(pageEle)
    }
    let indexPage = (
      <div key={CommonUtil.getUuid()} className="panel panel-success center-block">
        <div className="panel-heading">
          {/* 信息页也要可以点进去 */}
          <a href={`${subPackageRecord.uri}`}>{subPackageRecord.title}</a>
        </div>
        <div className="list-group">
          <ol>{pageEleList}</ol>
        </div>
      </div>
    )
    indexPageEleList.push(indexPage)
  }

  return (
    <div className="index-page">
      <div>
        <div className="panel panel-default">
          <div className="panel-heading">电子书由知乎助手生成, 仅供个人阅读学习使用, 严禁用于商业用途</div>
          <div className="panel-body">项目地址: https://www.yaozeyuan.online/zhihuhelp</div>
        </div>
        <p>&nbsp;</p>
        <div className="panel panel-success center-block">
          <div className="panel-heading">{props.bookname}</div>
        </div>
        {indexPageEleList}
      </div>
    </div>
  )
}
