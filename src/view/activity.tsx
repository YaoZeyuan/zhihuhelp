import React from 'react'
import ReactDomServer from 'react-dom/server'
import TypeActivity from '~/src/type/namespace/activity'
import MActivity from '~/src/model/activity'
import TypeAuthor from '~/src/type/namespace/author'
import moment from 'moment'
import DATE_FORMAT from '~/src/constant/date_format'
import logger from '~/src/library/logger'
import Base from '~/src/view/base'

class Activity extends Base {

    static renderActivity(title: string, authorInfo: TypeAuthor.Record, activityRecordList: Array<TypeActivity.Record>) {
        let activityList = []
        let index = 0
        for (let activityRecord of activityRecordList) {
            index++
            logger.log(`渲染第${index}/${activityRecordList.length}个赞同`)
            switch (activityRecord.verb) {
                case MActivity.VERB_ANSWER_VOTE_UP:
                    let answerActivityContent = Activity.renderAnswerActivity(activityRecord)
                    activityList.push(answerActivityContent)
                    break;
                case MActivity.VERB_MEMBER_VOTEUP_ARTICLE:
                    let articleActivityContent = Activity.renderArticleActivity(activityRecord)
                    activityList.push(articleActivityContent)
                    break;
                default:
            }
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
                    {activityList}
                </body>
            </html>
        )
        return ReactDomServer.renderToString(base)
    }

    static renderAnswerActivity(activityRecord: TypeActivity.AnswerVoteUpActivityRecord) {

        const answer = (
            <div>
                <div className='answer'>
                    <div className='author'>
                        <div className='author-info'>
                            <div className='author-base'>
                                <div className='author-logo'>
                                    <img src={activityRecord.target.author.avatar_url} width='25' height='25'></img>
                                </div>

                                <span className='author-name'>
                                    <a href={`http://www.zhihu.com/people/${activityRecord.target.author.id}`}>{activityRecord.target.author.name}</a>
                                </span>

                                <span className='author-sign'>{activityRecord.target.author.headline}</span>
                            </div>

                            <div className='clear-float'></div>
                        </div>
                    </div>

                    <div className='content' >
                        <div dangerouslySetInnerHTML={{ __html: activityRecord.target.content }} />
                    </div>

                    <div className='comment'>
                        <div className='extra-info'>
                            <p className='comment'>评论数:{activityRecord.target.comment_count}</p>

                            <p className='agree'>赞同数:{activityRecord.target.voteup_count}</p>

                            <p className='update-date'>更新时间:{moment.unix(activityRecord.target.updated_time).format(DATE_FORMAT.DISPLAY_BY_SECOND)}</p>
                        </div>
                    </div>
                </div>

                <hr />
            </div>
        )
        const question = (
            <div key={activityRecord.id}>
                <div className='bg-zhihu-blue-light'>
                    <div className='title-image'>
                    </div>
                    <div className='question bg-zhihu-blue-light'>
                        <div className='question-title'>
                            <h1 className='bg-zhihu-blue-deep'>{activityRecord.target.question.title}</h1>
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
        return question
    }

    static renderArticleActivity(articleActivityRecord: TypeActivity.ArticleVoteUpActivityRecord) {
        const answer = (
            <div>
                <div className='answer'>
                    <div className='author'>
                        <div className='author-info'>
                            <div className='author-base'>
                                <div className='author-logo'>
                                    <img src={articleActivityRecord.target.author.avatar_url} width='25' height='25'></img>
                                </div>

                                <span className='author-name'>
                                    <a href={`http://www.zhihu.com/people/${articleActivityRecord.target.author.id}`}>{articleActivityRecord.target.author.name}</a>
                                </span>

                                <span className='author-sign'>{articleActivityRecord.target.author.headline}</span>
                            </div>

                            <div className='clear-float'></div>
                        </div>
                    </div>

                    <div className='content' >
                        <div dangerouslySetInnerHTML={{ __html: articleActivityRecord.target.content }} />
                    </div>

                    <div className='comment'>
                        <div className='extra-info'>
                            <p className='comment'>评论数:{articleActivityRecord.target.comment_count}</p>

                            <p className='agree'>赞同数:{articleActivityRecord.target.voteup_count}</p>

                            <p className='update-date'>更新时间:{moment.unix(articleActivityRecord.target.updated).format(DATE_FORMAT.DISPLAY_BY_SECOND)}</p>
                        </div>
                    </div>
                </div>

                <hr />
            </div>
        )
        const question = (
            <div data-key='single-page' key={articleActivityRecord.id}>
                <div className='bg-zhihu-blue-light'>
                    <div className='title-image'>
                        {/* 不展示头图, 样式不好看 */}
                        {/* <img src={articleRecord.title_image}></img> */}
                    </div>
                    <div className='question bg-zhihu-blue-light'>
                        <div className='question-title'>
                            <h1 className='bg-zhihu-blue-deep'>{articleActivityRecord.target.title}</h1>
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
        return question
    }

}

export default Activity
