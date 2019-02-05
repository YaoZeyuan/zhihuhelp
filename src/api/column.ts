import _ from "lodash";
import Base from "~/src/api/base";
import ColumnRecord from '~/src/type/model/column'
import ArticleExcerptRecord from '~/src/type/model/article_excerpt'

class Column extends Base {
    /**
     * 获取专栏信息
     * @param columnId
     */
    static async asyncGetColumnInfo(columnId: string): Promise<ColumnRecord> {
        const baseUrl = `https://zhuanlan.zhihu.com/api2/columns/${columnId}`;
        const config = {
        };
        const record = await Base.http.get(baseUrl, {
            params: config
        });
        const columnInfo = _.get(record, ["data"], {});
        return columnInfo;
    }

    /**
     * 获取专栏信息
     * @param columnId
     */
    static async asyncGetAtricleExcerptList(columnId: string, offset = 0, limit = 10): Promise<Array<ArticleExcerptRecord>> {
        const baseUrl = `https://zhuanlan.zhihu.com/api2/columns/${columnId}/articles`;
        const config = {
            offset,
            limit
        };
        const record = await Base.http.get(baseUrl, {
            params: config
        });
        const atricleExcerptList = _.get(record, ["data"], {});
        return atricleExcerptList;
    }
}
export default Column;