import _ from "lodash";
import Base from "~/src/api/base";
import ArticleRecord from '~/src/type/model/article'

class Article extends Base {
    /**
     * 获取单篇文章详情
     * @param articleId
     */
    static async asyncGetArticle(articleId: number): Promise<ArticleRecord> {
        const baseUrl = `https://zhuanlan.zhihu.com/api2/articles/${articleId}`;
        const config = {
        };
        const record = await Base.http.get(baseUrl, {
            params: config
        });
        const articleRecord = _.get(record, ["data"], {});
        return articleRecord;
    }
}
export default Article;