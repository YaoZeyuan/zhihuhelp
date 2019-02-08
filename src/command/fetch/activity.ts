import Base from "~/src/command/fetch/base";
import AuthorApi from "~/src/api/author";
import ActivityApi from "~/src/api/activity";
import MAuthor from "~/src/model/author";
import MActivity from "~/src/model/activity";
import moment from "moment"
import DATE_FORMAT from "~/src/constant/date_format";
import CommonUtil from "~/src/library/util/common";


class FetchAuthor extends Base {
    max = 20

    static get signature() {
        return `
        Fetch:Activity

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
        let startAt = MActivity.ZHIHU_ACTIVITY_START_MONTH_AT
        let endAt = MActivity.ZHIHU_ACTIVITY_END_MONTH_AT
        this.log(`抓取时间范围为:${moment.unix(startAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)} ~ ${moment.unix(endAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)}, 按月抓取`)
        for (let fetchAt = startAt; fetchAt <= endAt;) {
            let fetchStartAt = fetchAt
            let fetchEndAt = moment.unix(fetchAt).endOf(DATE_FORMAT.UNIT.MONTH).unix()
            fetchAt = fetchEndAt + 1
            await this.fetchActivityInRange(urlToken, startAt, fetchEndAt)
            // await CommonUtil.appendPromiseWithDebounce(
            // )
        }
    }

    /**
     * 抓取指定时间范围内的用户活动记录
     * @param urlToken
     * @param startAt 
     * @param endAt 
     */
    async fetchActivityInRange(urlToken: string, startAt: number, endAt: number) {
        let rangeString = `${moment.unix(startAt).format(DATE_FORMAT.DISPLAY_BY_DAY)} ~ ${moment.unix(endAt).format(DATE_FORMAT.DISPLAY_BY_DAY)}`
        this.log(`抓取时间范围为:${rangeString}内的记录`)
        let activityCounter = 0
        for (let fetchAt = endAt; fetchAt >= startAt;) {
            this.log(`[${rangeString}]抓取${moment.unix(fetchAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)}的记录`)
            let activityList = await ActivityApi.asyncGetAutherActivityList(urlToken, fetchAt)
            for (let activityRecord of activityList) {
                activityCounter = activityCounter + 1
                // 更新时间
                fetchAt = activityRecord.id
                await MActivity.asyncReplaceActivity(activityRecord)
            }
        }
        this.log(`[${rangeString}]${rangeString}期间的记录抓取完毕, 共${activityCounter}条`)
    }

}

export default FetchAuthor;
