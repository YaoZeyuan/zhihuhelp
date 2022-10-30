import React from 'react'
import moment from 'moment'
import * as DATE_FORMAT from '~/src/constant/date_format'

export default (props: { agreeCount: number; commentCount: number; createAt: number; updateAt: number }) => {
  return (
    <div className="comment">
      <div className="info-flex-line">
        <span className="float-left">赞同:{props.agreeCount}</span>
        <span className="float-right">
          创建时间:{moment.unix(props.createAt).format(DATE_FORMAT.Const_Display_By_Day)}
        </span>
      </div>
      <div className="clear-float" />
      <div className="info-flex-line">
        <span className="float-left">评论:{props.commentCount}</span>
        <span className="float-right">
          最后更新:{moment.unix(props.updateAt).format(DATE_FORMAT.Const_Display_By_Day)}
        </span>
      </div>
    </div>
  )
}
