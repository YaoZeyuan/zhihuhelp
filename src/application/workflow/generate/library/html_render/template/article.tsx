import React from 'react'
import TypeArticle from '~/src/type/zhihu/article'
import lodash from 'lodash'
import CommonUtil from '~/src/library/util/common'
import CommentCompontent from './comment'

export default ({ articleRecord }: { articleRecord: TypeArticle.Record }) => {
  if (lodash.isEmpty(articleRecord)) {
    return <div key={CommonUtil.getUuid()} />
  }
  const content = (
    <div key={CommonUtil.getUuid()}>
      <div className="answer">
        <div className="author">
          <div className="author-info">
            <div className="author-base">
              <div className="author-logo">
                <img src={articleRecord.author.avatar_url} width="25" height="25" alt="" />
              </div>

              <span className="author-name">
                <a href={`http://www.zhihu.com/people/${articleRecord.author.id}`}>{articleRecord.author.name}</a>
              </span>
              <span className="author-sign">
                {articleRecord.author.headline ? '　' + articleRecord.author.headline : ''}
              </span>
            </div>

            <div className="clear-float" />
          </div>
        </div>

        <div className="content">
          <div dangerouslySetInnerHTML={{ __html: articleRecord.content }} />
        </div>

        <CommentCompontent
          agreeCount={articleRecord.voteup_count}
          commentCount={articleRecord.comment_count}
          createAt={articleRecord.created}
          updateAt={articleRecord.updated}
        />
      </div>

      <hr />
    </div>
  )
  const article = (
    <div data-key="single-page" key={CommonUtil.getUuid()}>
      <div className="bg-zhihu-blue-light">
        <div className="title-image">
          {/* 不展示头图, 样式不好看 */}
          {/* <img src={articleRecord.title_image}></img> */}
        </div>
        <div className="question bg-zhihu-blue-light">
          <div className="question-title">
            <h1 className="bg-zhihu-blue-deep">{articleRecord.title}</h1>
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
  return article
}
