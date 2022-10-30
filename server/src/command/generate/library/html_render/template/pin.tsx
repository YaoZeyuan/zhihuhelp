import React from 'react'
import * as TypePin from '~/src/type/zhihu/pin'
import lodash from 'lodash'
import CommonUtil from '~/src/library/util/common'
import CommentCompontent from './comment'
import moment from 'moment'
import * as DATE_FORMAT from '~/src/constant/date_format'

export default ({ rawPinRecord }: { rawPinRecord: TypePin.Record }) => {
  if (lodash.isEmpty(rawPinRecord)) {
    return <div key={CommonUtil.getUuid()} />
  }
  // 想法

  let title = ''
  // 想法
  // 根据是否存在repin字段, 可以分为转发/非转发两种类型
  if (lodash.isEmpty(rawPinRecord.repin)) {
    let pinRecord = rawPinRecord as any as TypePin.DefaultRecord
    title = `${moment.unix(pinRecord.created).format(DATE_FORMAT.Const_Display_By_Day)}:${pinRecord.excerpt_title}`
  } else {
    let repinRecord = rawPinRecord as any as TypePin.RepinRecord
    title = `${moment.unix(repinRecord.created).format(DATE_FORMAT.Const_Display_By_Day)}:${
      repinRecord.excerpt_title
    }:${repinRecord.repin.excerpt_title}`
  }

  let contentHtmlElement = <div />
  if (lodash.isEmpty(rawPinRecord.repin)) {
    let defaultPinRecord = rawPinRecord as any as TypePin.DefaultRecord
    contentHtmlElement = (
      <div className="pin">
        <div className="commment">
          <div dangerouslySetInnerHTML={{ __html: defaultPinRecord.content_html }} />
        </div>
        <div className="origin-pin" />
      </div>
    )
  } else {
    let repinRecord = rawPinRecord as any as TypePin.RepinRecord
    contentHtmlElement = (
      <div className="pin repin">
        <div className="commment">
          <div dangerouslySetInnerHTML={{ __html: repinRecord.content_html }} />
        </div>
        <div className="origin-pin">
          <div dangerouslySetInnerHTML={{ __html: repinRecord.repin.content_html }} />
        </div>
      </div>
    )
  }

  const content = (
    <div key={CommonUtil.getUuid()}>
      <div className="answer">
        <div className="author">
          <div className="author-info">
            <div className="author-base">
              <div className="author-logo">
                <img src={rawPinRecord.author.avatar_url} width="25" height="25" alt="" />
              </div>

              <span className="author-name">
                <a href={`http://www.zhihu.com/people/${rawPinRecord.author.id}`}>{rawPinRecord.author.name}</a>
              </span>
              <span className="author-sign">
                {rawPinRecord.author.headline ? '　' + rawPinRecord.author.headline : ''}
              </span>
            </div>

            <div className="clear-float" />
          </div>
        </div>

        <div className="content">
          <div>{contentHtmlElement}</div>
        </div>

        <CommentCompontent
          agreeCount={rawPinRecord.like_count}
          commentCount={rawPinRecord.comment_count}
          createAt={rawPinRecord.created}
          updateAt={rawPinRecord.updated}
        />
      </div>

      <hr />
    </div>
  )
  const pin = (
    <div data-key="single-page" key={CommonUtil.getUuid()}>
      <div className="bg-zhihu-blue-light">
        <div className="title-image">
          {/* 不展示头图, 样式不好看 */}
          {/* <img src={articleRecord.title_image}></img> */}
        </div>
        <div className="question bg-zhihu-blue-light">
          <div className="question-title">
            <h1 className="bg-zhihu-blue-deep">{title}</h1>
          </div>
          <div className="clear-float" />
        </div>
        <div
          className="question-info bg-zhihu-blue-light"
          data-comment="知乎对外接口中没有问题描述数据, 因此直接略过"
        />
        <div className="clear-float" />
      </div>
      <div className="answer">{content}</div>
    </div>
  )
  return pin
}
