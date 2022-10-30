export default class ResponseBuilder {
    static showResult(data = {}, errmsg = '', errno = 0) {
        return {
            data,
            errmsg,
            errno,
        }
    }

    /**
     * 展示列表
     * 字段来自antd的分页文档 https://ant.design/components/pagination-cn/
     * @param recordList 列表记录
     * @param total 记录总数
     * @param currentPageNum 当前页码
     * @param pageSize 分页大小
     */
    static showList(recordList: any[], total: number, currentPageNum: number, pageSize: number) {
        let data = {
            recordList: recordList,
            total,
            currentPageNum,
            pageSize,
        }
        return ResponseBuilder.showResult(data, '', 0)
    }

    static showError(errmsg = '', errno = 10001, data = {}) {
        return ResponseBuilder.showResult(data, errmsg, errno)
    }
}
