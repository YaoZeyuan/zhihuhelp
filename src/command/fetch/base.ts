import Base from "~/src/command/base";

class FetchBase extends Base {
    static get signature() {
        return `
        Fetch:Base
        `;
    }

    static get description() {
        return "抓取知乎接口";
    }

    /**
     * 空promise函数, 方便清空promise队列
     */
    async emptyPromiseFunction() {
        return
    }
}

export default FetchBase;
