import { type } from 'os'
import * as Consts from '../const'

export type Select_Type = typeof Consts.Current_Select_Type_专栏
    | typeof Consts.Current_Select_Type_收藏夹
    | typeof Consts.Current_Select_Type_用户的所有回答
    | typeof Consts.Current_Select_Type_话题
    | typeof Consts.Current_Select_Type_问题
    | typeof Consts.Current_Select_Type_回答
    | typeof Consts.Current_Select_Type_文章
    | typeof Consts.Current_Select_Type_想法

export type Status = {
    /**
     * 页面状态信息
     */
    forceUpdate: number,
    currentSelect: {
        type: Select_Type,
        id: string,
        info: FetchListRes,
    },
    /**
      * 目前数据库中已有的类别数据
      */
    baseInfo: {
        /**
         * 总数
         */
        count: {
            /**
           * 回答总数
           */
            answer: number,
            /**
             * 文章总数
             */
            article: number,
            /**
             * 想法总数
             */
            pin: number,
            /**
             * 收藏夹数量
             */
            collection: number,
            /**
            * 问题总数
            */
            question: number,
            /**
             * 作者总数
             */
            author: number,
            /**
             * 话题总数
             */
            topic: number,
            /**
             * 专栏总数
             */
            column: number,
        }
    },
    /**
     * 记录列表
     */
    recordList: DataType[]
}

export type FetchListRes = {
    recordList: DataType[],
    total: number,
    pageNo: number,
    pageSize: number,
    parentId?: string,
}

export type DataRecordKind = 'answer' | 'article' | 'pin' | 'meta'

export type DataType = {
    key: string;
    id: string;
    name: string;
    type: string;
    description: string;
    recordKind: DataRecordKind;
    title?: string;
    subtitle?: string;
    contentHtml?: string;
    originContentHtml?: string;
    sourceUrl?: string;
    coverUrl?: string;
    author?: {
        id: string;
        name: string;
        headline: string;
        avatarUrl: string;
        url: string;
    };
    voteupCount?: number;
    commentCount?: number;
    createdAt?: number;
    updatedAt?: number;
}
