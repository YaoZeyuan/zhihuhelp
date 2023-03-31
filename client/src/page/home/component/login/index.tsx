import { Button, message, Input, Form, Table, Modal, Tag, Card, Radio } from 'antd'

import { useState, useContext, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from './resource/const/index'
import * as Types from './resource/type/index'

import moment from 'moment'

import './index.less'

export const Const_Storage_Key = 'login_msk'
const Const_Table_Column_Width = 100

export default () => {
  let [forceUpdate, setForceUpdate] = useState<number>(0)

  let [isModalShow, setIsModalShow] = useState<boolean>(false)
  let [isRecordListLoading, setIsRecordListLoading] = useState<boolean>(false)

  useEffect(() => {
    let asyncRunner = async () => {
      setIsRecordListLoading(true)
      setIsRecordListLoading(false)
    }
    asyncRunner()
  }, [forceUpdate])

  return (
    <div className="login">
      <div className="item">
        <Button
          onClick={() => {
            let webviewEle = document.querySelector('webview#zhihu-login')
            console.log('webviewEle => ', webviewEle)
            // @ts-ignore
            webviewEle.openDevTools()
          }}
          // @todo 待移除
        >
          打开调试面板
        </Button>
      </div>
      <div className="item">
        <webview
          id="zhihu-login"
          src="https://www.zhihu.com/"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
        ></webview>
      </div>
    </div>
  )
}
