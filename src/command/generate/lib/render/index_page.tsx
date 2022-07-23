import React from 'react'
import { Type_Index_Record } from '../../customer'
import CommonUtil from '~/src/library/util/common'

export default (props: { bookname: string; recordList: Type_Index_Record[] }) => {
  let indexList: React.ReactElement<any>[] = []
  for (let record of props.recordList) {
    let indexItem = (
      <li key={CommonUtil.getUuid()}>
        <a className="list-group-item" href={`${record.uri}`}>
          {record.title}
        </a>
      </li>
    )
    indexList.push(indexItem)
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
          <div className="list-group">
            <ol>{indexList}</ol>
          </div>
        </div>
      </div>
    </div>
  )
}
