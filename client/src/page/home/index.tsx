import { Switch, Tabs, TabsProps } from 'antd'
import React, { useEffect, useState, useContext } from 'react'

import * as Consts_Page from '~/src/resource/const/page'
import * as Types_Page from '~/src/resource/type/page'
import * as Context from '~/src/page/home/resource/context'

import DbExplorer from './component/db_explorer'
import LogExplorer from './component/log'
import CustomerTask from './component/customer_task'
import Login from './component/login'
import DebugPanel from './component/debug'

import './index.less'

const Const_Developer_Mode_Storage_Key = 'zhihuhelp_developer_mode'

type Type_Debug_Info = {
  isDebug?: boolean
}

function readStoredDeveloperMode() {
  return window.localStorage.getItem(Const_Developer_Mode_Storage_Key) === 'true'
}

let Item = () => {
  let tabItemList: TabsProps[] = []

  let { currentTab, setCurrentTab } = useContext(Context.CurrentTab)
  let [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(readStoredDeveloperMode)

  let tabMap = {
    [Consts_Page.Const_Page_任务管理]: CustomerTask,
    [Consts_Page.Const_Page_运行日志]: LogExplorer,
    [Consts_Page.Const_Page_调试面板]: DebugPanel,
    [Consts_Page.Const_Page_数据浏览]: DbExplorer,
    [Consts_Page.Const_Page_登录]: Login,
  }

  const pageKeyList: Types_Page.Type_Page_Url[] = [
    Consts_Page.Const_Page_任务管理,
    Consts_Page.Const_Page_运行日志,
    Consts_Page.Const_Page_数据浏览,
    Consts_Page.Const_Page_登录,
  ]

  if (isDeveloperMode) {
    pageKeyList.splice(2, 0, Consts_Page.Const_Page_调试面板)
  }

  useEffect(() => {
    let isUnmounted = false
    const getDebugInfo = window.electronAPI?.['get-debug-ipc-channel-list']
    if (!getDebugInfo) {
      return () => {
        isUnmounted = true
      }
    }
    getDebugInfo()
      .then((debugInfo: Type_Debug_Info) => {
        if (!isUnmounted && debugInfo?.isDebug) {
          setIsDeveloperMode(true)
        }
      })
      .catch(() => undefined)
    return () => {
      isUnmounted = true
    }
  }, [])

  useEffect(() => {
    if (!isDeveloperMode && currentTab === Consts_Page.Const_Page_调试面板) {
      setCurrentTab(Consts_Page.Const_Page_任务管理)
    }
  }, [isDeveloperMode, currentTab, setCurrentTab])

  const handleDeveloperModeChange = (checked: boolean) => {
    setIsDeveloperMode(checked)
    window.localStorage.setItem(Const_Developer_Mode_Storage_Key, String(checked))
  }

  for (let key of pageKeyList) {
    tabItemList.push({
      label: Consts_Page.Const_Page_Title[key],
      key: key,
      children: tabMap[key](),
    })
  }

  return (
    <div className="src_page_home_index_tsx">
      <Tabs
        centered
        items={tabItemList}
        activeKey={currentTab}
        tabBarExtraContent={
          <div className="home-tab-extra">
            <span>开发者模式</span>
            <Switch size="small" checked={isDeveloperMode} onChange={handleDeveloperModeChange} />
          </div>
        }
        onChange={(e: Types_Page.Type_Page_Url) => {
          setCurrentTab(e)
        }}
      ></Tabs>
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
