import React from 'react'
import TypeAnswer from '~/src/type/zhihu/answer'
import lodash from 'lodash'
import CommonUtil from '~/src/library/util/common'
import CommentCompontent from './comment'

export default ({
  questionRecord,
  answerElementList = [],
}: {
  questionRecord: TypeAnswer.Question
  answerElementList: React.ReactElement<any>[]
}) => {
  if (lodash.isEmpty(questionRecord)) {
    return <div key={CommonUtil.getUuid()} />
  }
  const question = (
    <div key={CommonUtil.getUuid()}>
      <div className="bg-zhihu-blue-light">
        <div className="title-image" />
        <div className="question bg-zhihu-blue-light">
          <div className="question-title">
            <h1 className="bg-zhihu-blue-deep">{questionRecord.title}</h1>
          </div>
          <div className="clear-float" />
        </div>
        <div
          className="question-info bg-zhihu-blue-light"
          data-comment="知乎对外接口中没有问题描述数据, 因此直接略过"
        />
        <div className="clear-float" />
      </div>
      <div className="answer">{answerElementList}</div>
    </div>
  )
  return question
}
