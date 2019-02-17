import Base from "~/src/command/generate/base";
import MTopic from "~/src/model/topic";
import AnswerView from "~/src/view/answer"
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import Epub from '~/src/library/epub'
import StringUtil from '~/src/library/util/string'

class GenerateTopic extends Base {
    max = 20

    static get signature() {
        return `
        Generate:Topic

        {topicId:[必填]话题id}
        `;
    }

    static get description() {
        return "生成知乎话题精华回答的电子书";
    }

    async execute(args: any, options: any): Promise<any> {
        const { topicId } = args;
        this.log(`开始抓取话题${topicId}的信息`);
        const topicInfo = await MTopic.asyncGetTopicInfo(topicId);
        this.log(`话题信息获取完毕`);
        const title = topicInfo.name
        const answerCount = topicInfo.best_answers_count


        this.log(`话题${title}(${topicId})内共有${answerCount}条精华回答`)
        this.bookname = StringUtil.encodeFilename(`话题${title}(${topicId})下精华回答集锦`)
        // 初始化文件夹
        this.initStaticRecource()

        this.log(`获取话题答案列表`)
        let answerRecordList = await MTopic.asyncGetAnswerList(topicId)
        this.log(`话题答案列表获取完毕, 共${answerRecordList.length}条答案`)
        // 生成单个文件
        for (let answerRecord of answerRecordList) {
            let title = answerRecord.id
            let content = AnswerView.render([answerRecord])
            content = this.processContent(content)
            fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
            this.epub.addHtml(answerRecord.question.title, path.resolve(this.htmlCacheHtmlPath, `${title}.html`))
        }
        //  生成全部文件
        let content = AnswerView.renderInSinglePage(this.bookname, [answerRecordList])
        this.log(`内容渲染完毕, 开始对内容进行输出前预处理`)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `${this.bookname}.html`), content)
        //  生成目录
        let indexContent = AnswerView.renderIndex(this.bookname, answerRecordList)
        fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `index.html`), indexContent)
        this.epub.addIndexHtml('目录', path.resolve(this.htmlCacheHtmlPath, `index.html`))

        // 处理静态资源
        await this.asyncProcessStaticResource()

        this.log(`话题${title}(${topicId})下精华回答集锦生成完毕`)
    }

}

export default GenerateTopic;
