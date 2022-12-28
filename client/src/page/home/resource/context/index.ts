import { createContext } from 'react'

import * as Consts_Page from '~/src/resource/const/page'
import * as Types_Page from '~/src/resource/type/page'

export let ctx: {
  currentTab: Types_Page.Type_Page_Url
  setCurrentTab: (tab: Types_Page.Type_Page_Url) => void
} = {
  currentTab: Consts_Page.Const_Page_任务管理,
  setCurrentTab: (tab: Types_Page.Type_Page_Url) => {
    ctx.currentTab = tab
  },
}

export const CurrentTab = createContext(ctx)
