import Base from "~/src/command/fetch/base";
import AuthorApi from "~/src/api/author";
import ActivityApi from "~/src/api/activity";
import MAuthor from "~/src/model/author";
import MActivity from "~/src/model/activity";
import moment from "moment"

class FetchAuthor extends Base {
    max = 20

    static get signature() {
        return `
        Fetch:Author

        {account:[必传]用户账户名}
        `;
    }

    static get description() {
        return "抓取知乎用户行为记录";
    }

    async execute(args: any, options: any): Promise<any> {
        const { account: urlToken } = args;
        this.log(`开始抓取用户${urlToken}的行为历史`);
        this.log(`获取用户信息`);
        const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken);
        await MAuthor.asyncReplaceAuthor(authorInfo)
        this.log(`用户信息获取完毕`);
        const name = authorInfo.name
        this.log(`开始抓取用户行为列表`)
        let startAt = moment().unix()
        this.log(`全部回答抓取完毕`)
    }

}

export default FetchAuthor;
