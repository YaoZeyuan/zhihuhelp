import Base from "~/src/command/generate/base";
import MAnswer from "~/src/model/answer";
import MAuthor from "~/src/model/author";
import AnswerView from "~/src/view/answer"
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import StringUtil from '~/src/library/util/string'

class GenerateAuthor extends Base {
    max = 20

    static get signature() {
        return `
        Generate:Author

        {account:[必传]用户账户名}
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
        this.bookname = StringUtil.encodeFilename(`用户${name}(${urlToken})的知乎回答集锦`)
        // 初始化文件夹
        this.initPath()

        this.log(`获取回答列表`)
        let answerRecordList = await MAnswer.asyncGetAnswerList(urlToken)
        this.log(`回答列表获取完毕, 共${answerRecordList.length}条答案`)
        // 生成单个文件
        for (let answerRecord of answerRecordList) {
            let title = answerRecord.id
            let content = AnswerView.render([answerRecord])
            content = this.processContent(content)
            fs.writeFileSync(path.resolve(this.htmlCacheHtmlPath, `${title}.html`), content)
        }
        //  生成全部文件
        let content = AnswerView.renderInSinglePage(this.bookname, [answerRecordList])
        this.log(`内容渲染完毕, 开始对内容进行输出前预处理`)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `${this.bookname}.html`), content)
        //  生成目录
        let indexContent = AnswerView.renderIndex(this.bookname, answerRecordList)
        content = this.processContent(content)
        fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `index.html`), indexContent)

        // 处理静态资源
        await this.asyncProcessStaticResource()

        this.log(`作者${name}(${urlToken})的知乎回答集锦制作完毕`)
    }

}

export default GenerateAuthor;
