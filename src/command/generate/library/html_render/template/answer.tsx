import React from 'react'
import TypeAnswer from '~/src/type/zhihu/answer'
import lodash from 'lodash'
import CommonUtil from '~/src/library/util/common'
import CommentCompontent from './comment'

export default ({ answerRecord }: { answerRecord: TypeAnswer.Record }) => {
  if (lodash.isEmpty(answerRecord)) {
    return <div key={CommonUtil.getUuid()} />
  }
  const answer = (
    <div key={CommonUtil.getUuid()}>
      <div className="answer">
        <div className="author">
          <div className="author-info">
            <div className="author-base">
              <div className="author-logo">
                <img src={answerRecord.author.avatar_url} width="25" height="25" alt="" />
              </div>

              <span className="author-name">
                <a href={`http://www.zhihu.com/people/${answerRecord.author.id}`}>{answerRecord.author.name}</a>
              </span>

              <span className="author-sign">
                {answerRecord.author.headline ? '　' + answerRecord.author.headline : ''}
              </span>
            </div>

            <div className="clear-float" />
          </div>
        </div>

        <div className="content">
          <div dangerouslySetInnerHTML={{ __html: answerRecord.content }} />
        </div>

        <CommentCompontent
          agreeCount={answerRecord.voteup_count}
          commentCount={answerRecord.comment_count}
          createAt={answerRecord.created_time}
          updateAt={answerRecord.updated_time}
        />
      </div>

      <hr />
    </div>
  )
  return answer
}
