import Base from "~/src/command/generate/base";
import MAuthor from "~/src/model/author";
import MActivity from "~/src/model/activity";
import MArticle from "~/src/model/article";
import MColumn from "~/src/model/column";
import renderArticle from "~/src/view/article"
import renderAnswer from "~/src/view/answer"
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import StringUtil from '~/src/library/util/string'
import moment from "moment"
import DATE_FORMAT from "~/src/constant/date_format";

class GenerateActivity extends Base {
    max = 20

    static get signature() {
        return `
        Generate:Activity

        {account:[必传]用户账户名}
        `;
    }

    static get description() {
        return "按用户点赞回答&文章生成电子书";
    }

    async execute(args: any, options: any): Promise<any> {
        const { account: urlToken } = args;
        this.log(`开始获取用户${urlToken}的数据`);
        this.log(`获取用户信息`);
        const authorInfo = await MAuthor.asyncGetAuthor(urlToken);
        const actionSummary = await MActivity.asyncGetActionSummary(urlToken)
        const actionDuring = await MActivity.asyncGetActionDuring(urlToken)
        let actionStartAt = _.get(actionDuring, ['activity_start_at'], MActivity.ZHIHU_ACTIVITY_START_MONTH_AT)
        let actionEndAt = _.get(actionDuring, ['activity_end_at'], MActivity.ZHIHU_ACTIVITY_END_MONTH_AT)
        const name = authorInfo.name
        this.log(`用户${name}(${urlToken})信息获取完毕`);
        this.log(`从${moment.unix(actionStartAt).format(DATE_FORMAT.DATABASE_BY_DAY)}~${moment.unix(actionEndAt).format(DATE_FORMAT.DATABASE_BY_DAY)}`)
        this.log(`用户${name}(${urlToken})共`);
        for (let key of Object.keys(MActivity.DISPLAT_VERB)) {
            let count = _.get(actionSummary, [key], 0)
            if (_.has(actionSummary, [key])) {
                let displayKey = _.get(MActivity.DISPLAT_VERB, [key], '')
                this.log(`${displayKey} => ${count}次`)
            }
        }
        return


        // this.log(`用户${name}(${urlToken})共有${answerCount}个回答`)
        // const bookname = StringUtil.encodeFilename(`用户${name}(${urlToken})的知乎回答集锦`)
        // // 初始化文件夹
        // this.log(`创建电子书:${bookname}对应文件夹`)
        // let htmlCachePath = path.resolve(PathConfig.htmlCachePath, bookname)
        // let htmlCacheHtmlPath = path.resolve(htmlCachePath, '') // 单文件就没必要放在html文件夹内了, 直接放最外层即可
        // let htmlCacheCssPath = path.resolve(htmlCachePath, 'css')
        // let htmlCacheImgPath = path.resolve(htmlCachePath, 'image')
        // shelljs.mkdir('-p', htmlCachePath)
        // shelljs.mkdir('-p', htmlCacheHtmlPath)
        // shelljs.mkdir('-p', htmlCacheCssPath)
        // shelljs.mkdir('-p', htmlCacheImgPath)
        // this.log(`电子书:${bookname}对应文件夹创建完毕`)

        // this.log(`获取回答列表`)
        // let answerRecordList = await MAnswer.asyncGetAnswerList(urlToken)
        // this.log(`回答列表获取完毕, 共${answerRecordList.length}条答案`)
        // // 直接渲染为单个文件
        // let content = renderAnswer(bookname, authorInfo, answerRecordList)
        // this.log(`回答渲染完毕, 开始对内容进行输出前预处理`)
        // content = this.processContent(content)
        // fs.writeFileSync(path.resolve(htmlCacheHtmlPath, `${bookname}.html`), content)
        // this.log(`回答列表预处理完毕, 准备下载图片`)
        // // 下载图片
        // await this.downloadImg()
        // this.log(`图片下载完毕`)
        // this.copyImgToCache(htmlCacheImgPath)

        // this.log(`复制静态资源`)
        // // css
        // for (let filename of ['bootstrap.css', 'customer.css', 'markdown.css', 'normalize.css',]) {
        //     let copyFromUri = path.resolve(PathConfig.resourcePath, 'css', filename)
        //     let copyToUri = path.resolve(htmlCacheCssPath, filename)
        //     fs.copyFileSync(copyFromUri, copyToUri)
        // }
        // // 图片资源
        // for (let filename of ['cover.jpg', 'kanshan.png']) {
        //     let copyFromUri = path.resolve(PathConfig.resourcePath, 'image', filename)
        //     let copyToUri = path.resolve(htmlCacheImgPath, filename)
        //     fs.copyFileSync(copyFromUri, copyToUri)
        // }

        // this.log(`作者${name}(${urlToken})的知乎回答集锦制作完毕`)
    }

}

export default GenerateActivity;
