import React from 'react'
import ReactDomServer from 'react-dom/server'
import TypeAnswer from '~/src/type/namespace/answer'
import TypeAuthor from '~/src/type/namespace/author'
import TypeActivity from '~/src/type/namespace/activity'
import TypeArticle from '~/src/type/namespace/article'
import TypeColumn from '~/src/type/namespace/column'
import CommonUtil from '~/src/library/util/common'
import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constant/date_format'

class Base {
    static renderIndex(bookname: string, recordList: Array<TypeAnswer.Record | TypeArticle.Record | TypeActivity.Record>) {
        let indexList: Array<React.ReactElement<any>> = []
        for (let record of recordList) {
            let id = 0
            let title = ''
            // 判断数据类别
            if (_.has(record, ['target'])) {
                // activity类
                if (_.has(record, ['target', 'question'])) {
                    let answerActivityRecord: TypeActivity.AnswerVoteUpActivityRecord = record
                    id = answerActivityRecord.id
                    title = answerActivityRecord.target.question.title
                } else {
                    let articleActivityRecord: TypeActivity.ArticleVoteUpActivityRecord = record
                    id = articleActivityRecord.id
                    title = articleActivityRecord.target.title
                }
            } else {
                if (_.has(record, ['question'])) {
                    let answerRecord: TypeAnswer.Record = record
                    id = answerRecord.id
                    title = answerRecord.question.title
                } else {
                    let articleRecord: TypeArticle.Record = record
                  id = articleRecord.id
                    title = articleRecord.title
                }
            }

            let indexItem = (
                <li>
                    <a className="list-group-item" href={`./${id}.html`}>{title}</a>
                </li>
            )
            indexList.push(indexItem)
        }


        const indexTableElement = (
            <div className="panel panel-success center-block">
                <div className="panel-heading">{bookname}</div>
                <div className="list-group">
                    <ol>
                        {indexList}
                    </ol>
                </div>
            </div>
        )

        const pageElement = this.generatePageElement(bookname, [indexTableElement])
        let content = this.renderToString(pageElement)
        return content

    }

    /**
     * 生成单个回答的Element(只有回答, 不包括问题)
     * @param answerRecord 
     */
    static generateSingleAnswerElement(answerRecord: TypeAnswer.Record) {
        if (_.isEmpty(answerRecord)) {
            return (<div key={CommonUtil.getUuid()}></div>)
        }
        const answer = (
            <div key={CommonUtil.getUuid()}>
                <div className='answer'>
                    <div className='author'>
                        <div className='author-info'>
                            <div className='author-base'>
                                <div className='author-logo'>
                                    <img src={answerRecord.author.avatar_url} width='25' height='25'></img>
                                </div>

                                <span className='author-name'>
                                    <a href={`http://www.zhihu.com/people/${answerRecord.author.id}`}>{answerRecord.author.name}</a>
                                </span>

                                <span className='author-sign'>{answerRecord.author.headline ? '　' + answerRecord.author.headline : ''}</span>
                            </div>

                            <div className='clear-float'></div>
                        </div>
                    </div>

                    <div className='content' >
                        <div dangerouslySetInnerHTML={{ __html: answerRecord.content }} />
                    </div>

                    <div className='comment'>
                        <div className='extra-info'>
                            <p className='comment'>赞同:{answerRecord.voteup_count}</p>
                            <p className='update-date'>最后更新:{moment.unix(answerRecord.updated_time).format(DATE_FORMAT.DATABASE_BY_DAY)}</p>
                        </div>
                    </div>
                </div>

                <hr />
            </div>
        )
      return answer
    }

    /**
     * 生成问题对应的Element
     * @param questionRecord
     * @param answerElementList
     */
  static generateQuestionElement(questionRecord: TypeAnswer.Question, answerElementList: Array<React.ReactElement<any>> = []) {
    if (_.isEmpty(questionRecord)) {
            return (<div key={CommonUtil.getUuid()}></div>)
        }
    const question = (
            <div key={CommonUtil.getUuid()}>
                <div className='bg-zhihu-blue-light'>
                    <div className='title-image'>
                    </div>
                    <div className='question bg-zhihu-blue-light'>
                        <div className='question-title'>
                            <h1 className='bg-zhihu-blue-deep'>{questionRecord.title}</h1>
                        </div>
                        <div className='clear-float'></div>
                    </div>
                    <div className='question-info bg-zhihu-blue-light' data-comment='知乎对外接口中没有问题描述数据, 因此直接略过'>
                    </div>
                    <div className='clear-float'></div>
                </div>
                <div className='answer'>
                    {answerElementList}
                </div>
            </div>
        )
    return question
  }

    /**
     * 生成单篇文章的Element
     * @param articleRecord
     */
  static generateSingleArticleElement(articleRecord: TypeArticle.Record) {
    if (_.isEmpty(articleRecord)) {
            return (<div key={CommonUtil.getUuid()}></div>)
        }
    const content = (
            <div key={CommonUtil.getUuid()}>
                <div className='answer'>
                    <div className='author'>
                        <div className='author-info'>
                            <div className='author-base'>
                                <div className='author-logo'>
                                    <img src={articleRecord.author.avatar_url} width='25' height='25'></img>
                                </div>

                                <span className='author-name'>
                                    <a href={`http://www.zhihu.com/people/${articleRecord.author.id}`}>{articleRecord.author.name}</a>
                                </span>
                                <span className='author-sign'>{articleRecord.author.headline ? '　' + articleRecord.author.headline : ''}</span>
                            </div>

                            <div className='clear-float'></div>
                        </div>
                    </div>

                    <div className='content' >
                        <div dangerouslySetInnerHTML={{ __html: articleRecord.content }} />
                    </div>

                    <div className='comment'>
                        <div className='extra-info'>
                            <p className='comment'>赞同:{articleRecord.voteup_count}</p>
                            <p className='update-date'>发布于{moment.unix(articleRecord.updated).format(DATE_FORMAT.DATABASE_BY_DAY)}</p>
                        </div>
                    </div>
                </div>

                <hr />
            </div>
        )
    const article = (
            <div data-key='single-page' key={CommonUtil.getUuid()}>
                <div className='bg-zhihu-blue-light'>
                    <div className='title-image'>
                        {/* 不展示头图, 样式不好看 */}
                        {/* <img src={articleRecord.title_image}></img> */}
                    </div>
                    <div className='question bg-zhihu-blue-light'>
                        <div className='question-title'>
                            <h1 className='bg-zhihu-blue-deep'>{articleRecord.title}</h1>
                        </div>
                        <div className='clear-float'></div>
                    </div>
                    <div className='question-info bg-zhihu-blue-light' data-comment='知乎对外接口中没有问题描述数据, 因此直接略过'>
                    </div>
                    <div className='clear-float'></div>
                </div>
                <div className='answer'>
                    {content}
                </div>
            </div>
        )
    return article
  }

  static generatePageElement(title: string, contentElementList: Array<React.ReactElement<any>>) {
    return (
            <html xmlns='http://www.w3.org/1999/xhtml'>
                <head>
                    <meta charSet='utf-8' />
                    <title>{title}</title>
                    <link rel='stylesheet' type='text/css' href='../css/normalize.css' />
                    <link rel='stylesheet' type='text/css' href='../css/markdown.css' />
                    <link rel='stylesheet' type='text/css' href='../css/customer.css' />
                    <link rel='stylesheet' type='text/css' href='../css/bootstrap.css' />
                </head>
                <body>
                    {contentElementList}
                </body>
            </html>
        )
  }

  static renderToString(contentElement: React.ReactElement<any>) {
    return ReactDomServer.renderToString(contentElement)
  }
}
export default Base
