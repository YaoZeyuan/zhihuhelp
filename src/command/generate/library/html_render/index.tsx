import React from 'react'
import ReactDomServer from 'react-dom/server'
import TypeAnswer from '~/src/type/zhihu/answer'
import TypeArticle from '~/src/type/zhihu/article'
import { Type_Index_Record } from '../../customer'
import * as TypePin from '~/src/type/zhihu/pin'
import CommonUtil from '~/src/library/util/common'
import TsxInfoPage from './template/info_page'
import TsxBasePage from './template/base_page'
import TsxArticle from './template/article'
import TsxPin from './template/pin'
import TsxQuestion from './template/question'
import TsxIndexPage from './template/index_page'

type Type_Render_Result = {
  /**
   * 用于生成单页面的ele元素
   */
  singleEle: React.ReactElement
  /**
   * 用于生成html页面的ele元素(带html根目录)
   */
  htmlEle: React.ReactElement
}

export default class HtmlRender {
  static renderToString(contentElement: React.ReactElement<any>) {
    return ReactDomServer.renderToString(contentElement)
  }

  static renderInfoPage({ title, desc = '' }: { title: string; desc?: string }): Type_Render_Result {
    let ele = <TsxInfoPage title={title} desc={desc}></TsxInfoPage>
    return {
      singleEle: ele,
      htmlEle: <TsxBasePage title={title}>{ele}</TsxBasePage>,
    }
  }

  static renderArticle({ title, recordList }: { title: string; recordList: TypeArticle.Record[] }): Type_Render_Result {
    let eleList = []
    for (let record of recordList) {
      let ele = <TsxArticle key={CommonUtil.getUuid()} articleRecord={record}></TsxArticle>
      eleList.push(ele)
    }

    return {
      singleEle: (
        <div data-type="single-page-ele-4-article" key={CommonUtil.getUuid()}>
          {eleList}
        </div>
      ),
      htmlEle: <TsxBasePage title={title}>{eleList}</TsxBasePage>,
    }
  }
  static renderQuestion({ title, recordList }: { title: string; recordList: TypeAnswer.Record[] }): Type_Render_Result {
    let eleList = []
    let ele = <TsxQuestion key={CommonUtil.getUuid()} answerRecordList={recordList}></TsxQuestion>
    eleList.push(ele)

    return {
      singleEle: (
        <div data-type="single-page-ele-4-question" key={CommonUtil.getUuid()}>
          {eleList}
        </div>
      ),
      htmlEle: <TsxBasePage title={title}>{eleList}</TsxBasePage>,
    }
  }
  static renderPin({ title, recordList }: { title: string; recordList: TypePin.Record[] }): Type_Render_Result {
    let eleList = []
    for (let record of recordList) {
      let ele = <TsxPin key={CommonUtil.getUuid()} rawPinRecord={record}></TsxPin>
      eleList.push(ele)
    }

    return {
      singleEle: (
        <div data-type="single-page-ele-4-pin" key={CommonUtil.getUuid()}>
          {eleList}
        </div>
      ),
      htmlEle: <TsxBasePage title={title}>{eleList}</TsxBasePage>,
    }
  }

  static renderIndex({ title, recordList }: { title: string; recordList: Type_Index_Record[] }): Type_Render_Result {
    let ele = <TsxIndexPage bookname={title} recordList={recordList}></TsxIndexPage>
    return {
      singleEle: (
        <div data-type="single-page-ele-4-index-page" key={CommonUtil.getUuid()}>
          {ele}
        </div>
      ),
      htmlEle: <TsxBasePage title={title}>{ele}</TsxBasePage>,
    }
  }

  static generateSinglePageHtml({ title, eleList }: { title: string; eleList: React.ReactElement[] }) {
    return this.renderToString(<TsxBasePage title={title}>{eleList}</TsxBasePage>)
  }
}
