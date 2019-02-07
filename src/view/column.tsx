import React from 'react'
import ReactDomServer from 'react-dom/server'
import ArticleRecord from "~/src/type/model/article";
import ColumnRecord from "~/src/type/model/column";
import moment from 'moment'
import DATE_FORMAT from '~/src/constant/date_format'
import logger from '~/src/library/logger'

function renderColumn(title: string, columnInfo: ColumnRecord, articleRecordList: Array<ArticleRecord>) {
    let articleList = []
    let index = 0
    for (let articleRecord of articleRecordList) {
        index++
        logger.log(`渲染第${index}/${articleRecordList.length}篇文章`)
        const answer = (
            <div>
                <div className="answer">
                    <div className="author">
                        <div className="author-info">
                            <div className="author-base">
                                <div className="author-logo">
                                    <img src={articleRecord.author.avatar_url} width="25" height="25"></img>
                                </div>

                                <span className="author-name">
                                    <a href={`http://www.zhihu.com/people/${articleRecord.author.id}`}>{articleRecord.author.name}</a>
                                </span>

                                <span className="author-sign">{articleRecord.author.headline}</span>
                            </div>

                            <div className="clear-float"></div>
                        </div>
                    </div>

                    <div className="content" >
                        <div dangerouslySetInnerHTML={{ __html: articleRecord.content }} />
                    </div>

                    <div className="comment">
                        <div className="extra-info">
                            <p className="comment">评论数:{articleRecord.comment_count}</p>

                            <p className="agree">赞同数:{articleRecord.voteup_count}</p>

                            <p className="update-date">更新时间:{moment.unix(articleRecord.updated).format(DATE_FORMAT.DISPLAY_BY_SECOND)}</p>
                        </div>
                    </div>
                </div>

                <hr />
            </div>
        )
        const question = (
            <div data-key='single-page' key={articleRecord.id}>
                <div className="bg-zhihu-blue-light">
                    <div className="title-image">
                        <img src={articleRecord.title_image}></img>
                    </div>
                    <div className="question bg-zhihu-blue-light">
                        <div className="question-title">
                            <h1 className="bg-zhihu-blue-deep">{articleRecord.title}</h1>
                        </div>
                        <div className="clear-float"></div>
                    </div>
                    <div className="question-info bg-zhihu-blue-light" data-comment="知乎对外接口中没有问题描述数据, 因此直接略过">
                    </div>
                    <div className="clear-float"></div>
                </div>
                <div className="answer">
                    {answer}
                </div>
            </div>
        )
        articleList.push(question)
    }

    const base = (
        <html>
            <head>
                <meta charSet="utf-8" />
                <title>{title}</title>
                <link rel="stylesheet" type="text/css" href="./css/normalize.css" />
                <link rel="stylesheet" type="text/css" href="./css/markdown.css" />
                <link rel="stylesheet" type="text/css" href="./css/customer.css" />
            </head>
            <body>
                {articleList}
            </body>
        </html>
    )
    return ReactDomServer.renderToString(base)
}

export default renderColumn