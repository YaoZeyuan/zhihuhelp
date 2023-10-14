import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import dayjs from 'dayjs'
import * as DATE_FORMAT from '~/src/constant/date_format'

type TypeVerb = typeof Activity.VERB_ANSWER_VOTE_UP
    | typeof Activity.VERB_MEMBER_FOLLOW_COLLECTION
    | typeof Activity.VERB_QUESTION_FOLLOW
    | typeof Activity.VERB_ANSWER_CREATE
    | typeof Activity.VERB_TOPIC_FOLLOW
    | typeof Activity.VERB_MEMBER_VOTEUP_ARTICLE
    | typeof Activity.VERB_MEMBER_FOLLOW_COLUMN
    | typeof Activity.VERB_MEMBER_FOLLOW_ROUNDTABLE
    | typeof Activity.VERB_MEMBER_CREATE_ARTICLE

const startAt = dayjs('2011-01-25 00:00:00', DATE_FORMAT.Const_Display_By_Second)
    .startOf(DATE_FORMAT.Const_Unit_Month)
    .unix()
@Entity()
export class Activity {
    static readonly ZHIHU_ACTIVITY_START_MONTH_AT = startAt// 知乎活动开始时间
    static readonly ZHIHU_ACTIVITY_END_MONTH_AT = dayjs().endOf(DATE_FORMAT.Const_Unit_Month).unix() // 知乎活动结束时间

    static readonly VERB_ANSWER_VOTE_UP = 'ANSWER_VOTE_UP' as const// 点赞
    static readonly VERB_MEMBER_FOLLOW_COLLECTION = 'MEMBER_FOLLOW_COLLECTION' as const// 关注收藏夹
    static readonly VERB_QUESTION_FOLLOW = 'QUESTION_FOLLOW' as const// 关注问题
    static readonly VERB_ANSWER_CREATE = 'ANSWER_CREATE' as const// 创建回答
    static readonly VERB_TOPIC_FOLLOW = 'TOPIC_FOLLOW' as const// 关注话题
    static readonly VERB_MEMBER_VOTEUP_ARTICLE = 'MEMBER_VOTEUP_ARTICLE' as const// 点赞文章
    static readonly VERB_MEMBER_FOLLOW_COLUMN = 'MEMBER_FOLLOW_COLUMN' as const// 关注专栏
    static readonly VERB_MEMBER_FOLLOW_ROUNDTABLE = 'MEMBER_FOLLOW_ROUNDTABLE' as const// 关注圆桌
    static readonly VERB_MEMBER_CREATE_ARTICLE = 'MEMBER_CREATE_ARTICLE' as const// 发表文章

    // 将行为记录转为文字
    static readonly DISPLAT_VERB = {
        [Activity.VERB_ANSWER_VOTE_UP]: '赞同回答',
        [Activity.VERB_MEMBER_FOLLOW_COLLECTION]: '关注收藏夹',
        [Activity.VERB_QUESTION_FOLLOW]: '关注问题',
        [Activity.VERB_ANSWER_CREATE]: '创建回答',
        [Activity.VERB_TOPIC_FOLLOW]: '关注话题',
        [Activity.VERB_MEMBER_VOTEUP_ARTICLE]: '赞同文章',
        [Activity.VERB_MEMBER_FOLLOW_COLUMN]: '关注专栏',
        [Activity.VERB_MEMBER_FOLLOW_ROUNDTABLE]: '关注圆桌',
        [Activity.VERB_MEMBER_CREATE_ARTICLE]: '发表文章',
    }


    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    url_token!: string

    @Column()
    verb!: TypeVerb
    @Column()
    raw_json!: string
}
