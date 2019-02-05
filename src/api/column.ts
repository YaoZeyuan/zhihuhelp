import _ from "lodash";
import Base from "~/src/api/base";
import ColumnRecord from '~/src/type/model/column'

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
}
export default Column;