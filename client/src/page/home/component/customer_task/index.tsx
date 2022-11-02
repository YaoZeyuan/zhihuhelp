import electron from 'electron'
import { Button, message, Input, Form, Table, Modal, Tag, Card, Radio } from 'antd'

import { useState, useContext, useEffect } from 'react'
import * as Consts_Task_Config from '~/src/resource/const/task_config'
import * as Types_Task_Config from '~/src/resource/type/task_config'
import * as Consts from './resource/const/index'
import * as Types from './resource/type/index'
import http from '~/src/library/http'

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
      <div className="config-panel">
        <Button
          onClick={async () => {
            let res = await http.asyncGet('http://127.0.0.1:6370/api/zhihu/api/v4/members/zi-yun-fei/answers', {
              params: {
                include:
                  'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,attachment,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp,is_recognized;data[*].vessay_info;data[*].author.badge[?(type=best_answerer)].topics;data[*].author.vip_info;data[*].question.has_publishing_draft,relationship',
                offset: 40,
                limit: 20,
                sort_by: 'created',
              },
            })
            console.log('res => ', res)
            return
          }}
        >
          调试
        </Button>
      </div>
    </div>
  )
}
