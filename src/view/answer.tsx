import React from 'react'
import ReactDomServer from 'react-dom/server'
import AnswerRecord from '~/src/type/model/answer'
import AuthorRecord from '~/src/type/model/author'
import moment from 'moment'
import DATE_FORMAT from '~/src/constant/date_format'
import logger from '~/src/library/logger'

function renderAnswer (title: string, authorInfo: AuthorRecord, answerRecordList: Array<AnswerRecord>) {
  let questionList = []
  let index = 0
  for (let answerRecord of answerRecordList) {
    index++
    logger.log(`渲染第${index}/${answerRecordList.length}个回答`)
    const answer = (
            <div>
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

                                <span className='author-sign'>{answerRecord.author.headline}</span>
                            </div>

                            <div className='clear-float'></div>
                        </div>
                    </div>

                    <div className='content' >
                        <div dangerouslySetInnerHTML={{ __html: answerRecord.content }} />
                    </div>

                    <div className='comment'>
                        <div className='extra-info'>
                            <p className='comment'>评论数:{answerRecord.comment_count}</p>

                            <p className='agree'>赞同数:{answerRecord.voteup_count}</p>

                            <p className='update-date'>更新时间:{moment.unix(answerRecord.updated_time).format(DATE_FORMAT.DISPLAY_BY_SECOND)}</p>
                        </div>
                    </div>
                </div>

                <hr />
            </div>
        )
    const question = (
            <div key={answerRecord.id}>
                <div className='bg-zhihu-blue-light'>
                    <div className='title-image'>
                    </div>
                    <div className='question bg-zhihu-blue-light'>
                        <div className='question-title'>
                            <h1 className='bg-zhihu-blue-deep'>{answerRecord.question.title}</h1>
                        </div>
                        <div className='clear-float'></div>
                    </div>
                    <div className='question-info bg-zhihu-blue-light' data-comment='知乎对外接口中没有问题描述数据, 因此直接略过'>
                    </div>
                    <div className='clear-float'></div>
                </div>
                <div className='answer'>
                    {answer}
                </div>
            </div>
        )
    questionList.push(question)
  }

  const base = (
        <html>
            <head>
                <meta charSet='utf-8' />
                <title>{title}</title>
                <link rel='stylesheet' type='text/css' href='./css/normalize.css' />
                <link rel='stylesheet' type='text/css' href='./css/markdown.css' />
                <link rel='stylesheet' type='text/css' href='./css/customer.css' />
            </head>
            <body>
                {questionList}
            </body>
        </html>
    )
  return ReactDomServer.renderToString(base)
}

export default renderAnswer
