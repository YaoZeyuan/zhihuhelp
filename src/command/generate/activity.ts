import Base from "~/src/command/generate/base";
import MAuthor from "~/src/model/author";
import MActivity from "~/src/model/activity";
import ActivityView from "~/src/view/activity"
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import StringUtil from '~/src/library/util/string'
import CommonUtil from '~/src/library/util/common'
import moment from "moment"
import DATE_FORMAT from "~/src/constant/date_format";
import TypeActivity from "~/src/type/namespace/activity";

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
        await CommonUtil.asyncSleep(2 * 1000)

        this.bookname = StringUtil.encodeFilename(`用户${name}(${urlToken})的知乎故事`)
        // 初始化文件夹
        this.initStaticRecource()


        this.log(`获取赞同记录列表`)
        let activityRecordList = await MActivity.asyncGetActivityList(urlToken, actionStartAt, actionEndAt)
        this.log(`赞同记录列表获取完毕, 共${activityRecordList.length}次赞同`)
        // 生成单个文件
        for (let activityRecord of activityRecordList) {
            let title = activityRecord.id
            let content = ActivityView.render(activityRecord)
            content = this.processContent(content)
            fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
            if (_.has(activityRecord, ['target', 'question'])) {
                let record: TypeActivity.AnswerVoteUpActivityRecord = activityRecord
                this.epub.addHtml(record.target.question.title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))
            } else {
                let record: TypeActivity.ArticleVoteUpActivityRecord = activityRecord
                this.epub.addHtml(record.target.title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))
            }

        }
        //  生成全部文件
        let content = ActivityView.renderInSinglePage(this.bookname, activityRecordList)
        this.log(`内容渲染完毕, 开始对内容进行输出前预处理`)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `${this.bookname}.html`), content)
        //  生成目录
        let indexContent = ActivityView.renderIndex(this.bookname, activityRecordList)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `index.html`), indexContent)
        this.epub.addIndexHtml('目录', path.resolve(this.htmlCacheHtmlPath, `index.html`))

        // 处理静态资源
        await this.asyncProcessStaticResource()

        this.log(`用户${name}(${urlToken})的知乎故事制作完毕`)
    }

}

export default GenerateActivity;
