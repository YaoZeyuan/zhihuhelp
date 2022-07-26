import electron from 'electron'
import { Button, message, Input, Form, Table, Modal, Tag, Card, Radio } from 'antd'

import { useState, useContext, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from './resource/const/index'
import * as Types from './resource/type/index'

import moment from 'moment'

import './index.less'

const { ipcRenderer } = electron

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
    <div className="customer_task">
      <div className="config-panel"></div>
    </div>
  )
}
