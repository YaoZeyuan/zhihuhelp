import { Tabs } from 'antd'
import React, { useState, useContext } from 'react'

import * as Consts_Page from '~/src/resource/const/page'
import * as Types_Page from '~/src/resource/type/page'
import * as Context from '~/src/page/home/resource/context'

import DbExplorer from './component/db_explorer'
import CustomerTask from './component/customer_task'
import Login from './component/login'

import './index.less'

let Item = () => {
  let tabEleList: JSX.Element[] = []

  let { currentTab, setCurrentTab } = useContext(Context.CurrentTab)

  let tabMap = {
    [Consts_Page.Const_Page_任务管理]: CustomerTask,
    [Consts_Page.Const_Page_数据浏览]: DbExplorer,
    [Consts_Page.Const_Page_登录]: Login,
  }

  for (let key of [Consts_Page.Const_Page_任务管理, Consts_Page.Const_Page_数据浏览, Consts_Page.Const_Page_登录]) {
    tabEleList.push(
      <Tabs.TabPane tab={Consts_Page.Const_Page_Title[key]} key={key}>
        {tabMap[key]()}
      </Tabs.TabPane>,
    )
  }

  return (
    <div className="src_page_home_index_tsx">
      <Tabs
        activeKey={currentTab}
        onChange={(e) => {
          setCurrentTab(e as Types_Page.Type_Page_Url)
        }}
      >
        {tabEleList}
      </Tabs>
    </div>
  )
}

export default () => {
  let [currentTab, setCurrentTab] = useState<Types_Page.Type_Page_Url>(Consts_Page.Const_Page_任务管理)

  return (
    <div>
      <Context.CurrentTab.Provider
        value={{
          currentTab,
          setCurrentTab,
        }}
      >
        <Item />
      </Context.CurrentTab.Provider>
    </div>
  )
}
