import * as Consts from '../const/index'

import TypeAnswer from '~/src/type/zhihu/answer'
import * as TypePin from '~/src/type/zhihu/pin'
import TypeArticle from '~/src/type/zhihu/article'

type Type_Question = typeof Consts.Const_Type_Question
type Type_Answer = typeof Consts.Const_Type_Answer
type Type_Article = typeof Consts.Const_Type_Article
type Type_Pin = typeof Consts.Const_Type_Pin

type Type_Item_Type = Type_Question | Type_Article | Type_Pin

type Type_Question_Item = {
  type: Type_Question
  baseInfo: TypeAnswer.Question
  recordList: TypeAnswer.Record[]
}

type Type_Article_Item = {
  type: Type_Article
  record: TypeArticle.Record
}

type Type_Pin_Item = {
  type: Type_Pin
  record: TypePin.Record
}

// 实际的item元素-对应每一页的内容
export type Type_Item = Type_Question_Item | Type_Article_Item | Type_Pin_Item

// 实际每一卷的内容
