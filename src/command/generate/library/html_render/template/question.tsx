import React from 'react'
import TypeAnswer from '~/src/type/zhihu/answer'
import lodash from 'lodash'
import CommonUtil from '~/src/library/util/common'
import Answer from './answer'

export default ({ answerRecordList = [] }: { answerRecordList: TypeAnswer.Record[] }) => {
  if (lodash.isEmpty(answerRecordList)) {
    return <div key={CommonUtil.getUuid()} />
  }
  let questionRecord = answerRecordList[0].question
  let answerEleList = []
  for (let record of answerRecordList) {
    let ele = <Answer key={CommonUtil.getUuid()} answerRecord={record}></Answer>
    answerEleList.push(ele)
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
      <div className="answer">{answerEleList}</div>
    </div>
  )
  return question
}
