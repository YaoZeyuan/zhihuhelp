import Base from "~/src/command/fetch/base";
import TopicApi from "~/src/api/topic";
import MTopic from "~/src/model/topic";
import moment from "moment"
import DATE_FORMAT from "~/src/constant/date_format";
import CommonUtil from "~/src/library/util/common";


class FetchTopic extends Base {
    static get signature() {
        return `
        Fetch:Topic

        {topicId:[必传]话题id}
        `;
    }

    static get description() {
        return "抓取知乎话题精华回答";
    }

    async execute(args: any, options: any): Promise<any> {
        const { topicId } = args;
        this.log(`开始抓取话题${topicId}的精华回答`);
        this.log(`获取话题信息`);
        const topicInfo = await TopicApi.asyncGetTopicInfo(topicId);
        await MTopic.asyncReplaceTopicInfo(topicInfo)
        let baseAnswer = topicInfo.best_answers_count
        this.log(`话题${topicInfo.name}(${topicInfo.id})信息获取完毕, 共有精华回答${baseAnswer}个`);
        const name = topicInfo.name

        this.log(`开始抓取话题精华回答列表`)
        for (let offset = 0; offset < baseAnswer; offset = offset + this.max) {
            await CommonUtil.asyncAppendPromiseWithDebounce(this.asyncGetAnswerList(topicId, offset))
            this.log(`将抓取第${offset}~${offset + this.max}回答任务添加到任务队列中`)
        }
        await CommonUtil.asyncAppendPromiseWithDebounce(this.emptyPromiseFunction(), true)
        this.log(`全部话题精华回答抓取完毕`)
    }

    async asyncGetAnswerList(topicId: number, offset: number) {
        let answerList = await TopicApi.asyncGetAnswerList(topicId, offset, this.max)
        for (let answer of answerList) {
            await MTopic.asyncReplaceTopicAnswer(topicId, answer).catch(e => {
                console.log('catch error')
                console.log(e)
            })
        }
        this.log(`第${offset}~${offset + answerList.length}条精华回答抓取完毕`)
    }
}

export default FetchTopic;
