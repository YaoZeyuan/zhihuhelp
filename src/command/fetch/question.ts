import Base from "~/src/command/fetch/base";
import AuthorApi from "~/src/api/author";
import AnswerApi from "~/src/api/answer";
import MAnswer from "~/src/model/answer";
import MAuthor from "~/src/model/author";

class FetchAuthor extends Base {
  static get signature() {
    return `
        Fetch:Question

        {id:[必传]问题id}
        `;
  }

  static get description() {
    return "抓取知乎问题";
  }

  async execute(args: any, options: any): Promise<any> {
    const { id: questionId } = args;
    this.log(`开始抓取问题${questionId}下的数据`);
    this.log(`获取用户信息`);
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken);
    await MAuthor.asyncReplaceAuthor(authorInfo);
    this.log(`用户信息获取完毕`);
    const name = authorInfo.name;
    const answerCount = authorInfo.answer_count;
    this.log(`用户${name}(${urlToken})共有${answerCount}个回答`);
    this.log(`开始抓取回答列表`);
    for (let offset = 0; offset < answerCount; offset = offset + this.max) {
      let answerList = await AnswerApi.asyncGetAutherAnswerList(
        urlToken,
        offset,
        this.max
      );
      for (let answer of answerList) {
        await MAnswer.asyncReplaceAnswer(answer);
      }
      this.log(`第${offset}~${offset + this.max}条回答抓取完毕`);
    }
    this.log(`全部回答抓取完毕`);
  }
}

export default FetchAuthor;
