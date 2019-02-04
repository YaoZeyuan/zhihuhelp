import Base from "~/src/command/generate/base";
import http from "~/src/library/http";
import MAnswer from "~/src/model/answer";
import MAuthor from "~/src/model/author";
import AnswerRecord from "model/answer";
import React from 'react'
import ReactDomServer from 'react-dom/server'
import moment from 'moment'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import DATE_FORMAT from '~/src/constant/date_format'
import StringUtil from '~/src/library/util/string'
import AuthorRecord from "model/author";

class FetchAuthor extends Base {
    max = 20

    static get signature() {
        return `
        Generate:Author

        {account:[必选]用户账户名}
        `;
    }

    static get description() {
        return "生成知乎用户的电子书";
    }

    async execute(args: any, options: any): Promise<any> {
        const { account: urlToken } = args;
        this.log(`开始抓取用户${urlToken}的数据`);
        this.log(`获取用户信息`);
        const authorInfo = await MAuthor.asyncGetAuthor(urlToken);
        this.log(`用户信息获取完毕`);
        const name = authorInfo.name
        const answerCount = authorInfo.answer_count


        this.log(`用户${name}(${urlToken})共有${answerCount}个回答`)
        const bookname = StringUtil.encodeFilename(`用户${name}(${urlToken})的知乎回答集锦`)
        // 初始化文件夹
        this.log(`创建电子书:${bookname}对应文件夹`)
        let htmlCachePath = path.resolve(PathConfig.htmlCachePath, bookname)
        let htmlCacheHtmlPath = path.resolve(htmlCachePath, '') // 单文件就没必要放在html文件夹内了, 直接放最外层即可
        let htmlCacheCssPath = path.resolve(htmlCachePath, 'css')
        let htmlCacheImgPath = path.resolve(htmlCachePath, 'image')
        shelljs.mkdir('-p', htmlCachePath)
        shelljs.mkdir('-p', htmlCacheHtmlPath)
        shelljs.mkdir('-p', htmlCacheCssPath)
        shelljs.mkdir('-p', htmlCacheImgPath)
        this.log(`电子书:${bookname}对应文件夹创建完毕`)

        this.log(`获取回答列表`)
        let answerRecordList = await MAnswer.asyncGetAnswerList(urlToken)
        this.log(`回答列表获取完毕, 共${answerRecordList.length}条答案`)
        // 直接渲染为单个文件
        let content = this.render(bookname, authorInfo, answerRecordList)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(htmlCacheHtmlPath, `${bookname}.html`), content)
        this.log(`回答列表处理完毕`)
        // 下载图片
        await this.downloadImg()
        this.log(`图片下载完毕`)
        this.copyImgToCache(htmlCacheImgPath)

        this.log(`复制静态资源`)
        // css
        for (let filename of ['bootstrap.css', 'customer.css', 'markdown.css', 'normalize.css',]) {
            let copyFromUri = path.resolve(PathConfig.resourcePath, 'css', filename)
            let copyToUri = path.resolve(htmlCacheCssPath, filename)
            fs.copyFileSync(copyFromUri, copyToUri)
        }
        // 图片资源
        for (let filename of ['cover.jpg', 'kanshan.png']) {
            let copyFromUri = path.resolve(PathConfig.resourcePath, 'image', filename)
            let copyToUri = path.resolve(htmlCacheImgPath, filename)
            fs.copyFileSync(copyFromUri, copyToUri)
        }

        this.log(`全部回答获取完毕`)
    }

    render(title: string, authorInfo: AuthorRecord, answerRecordList: Array<AnswerRecord>): string {

        let questionList = []
        for (let answerRecord of answerRecordList) {

            const answer = (
                <div>
                    <div className="answer">
                        <div className="author">
                            <div className="author-info">
                                <div className="author-base">
                                    <div className="author-logo">
                                        <img src={answerRecord.author.avatar_url} width="25" height="25"></img>
                                    </div>

                                    <span className="author-name">
                                        <a href={`http://www.zhihu.com/people/${answerRecord.author.id}`}>{answerRecord.author.name}</a>
                                    </span>

                                    <span className="author-sign">{answerRecord.author.headline}</span>
                                </div>

                                <div className="clear-float"></div>
                            </div>
                        </div>

                        <div className="content" >
                            <div dangerouslySetInnerHTML={{ __html: answerRecord.content }} />
                        </div>

                        <div className="comment">
                            <div className="extra-info">
                                <p className="comment">评论数:{answerRecord.comment_count}</p>

                                <p className="agree">赞同数:{answerRecord.voteup_count}</p>

                                <p className="update-date">更新时间:{moment.unix(answerRecord.updated_time).format(DATE_FORMAT.DISPLAY_BY_SECOND)}</p>
                            </div>
                        </div>
                    </div>

                    <hr />
                </div>
            )
            const question = (
                <div key={answerRecord.id}>
                    <div className="bg-zhihu-blue-light">
                        <div className="title-image">
                        </div>
                        <div className="question bg-zhihu-blue-light">
                            <div className="question-title">
                                <h1 className="bg-zhihu-blue-deep">{answerRecord.question.title}</h1>
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
            questionList.push(question)
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
                    {questionList}
                </body>
            </html>
        )

        return ReactDomServer.renderToString(base)
    }

}

export default FetchAuthor;
