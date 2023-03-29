import { Button, List, Typography, Card, Row, Divider, Space, Col, Checkbox, message } from 'antd'
import Electron from 'electron'
import { useState, useContext, useEffect } from 'react'
import VirtualList from 'rc-virtual-list'
import * as Ahooks from 'ahooks'

import './index.less'

const { ipcRenderer } = Electron

type Type_Log_Item = {
  lineNo: number
  content: string
}

export default () => {
  const [isAutoFresh, setIsAutoFresh] = useState<boolean>(true)
  const [logList, setLogList] = useState<Type_Log_Item[]>([])
  const ContainerHeight = 768
  const fetchLogList = () => {
    const content = ipcRenderer.sendSync('get-log-content')
    const logList: Type_Log_Item[] = []
    let counter = 0
    for (let item of content.split('\n')) {
      counter++
      logList.push({
        lineNo: counter,
        content: item,
      })
    }
    setLogList(logList)
    let containerEle = document.querySelector('.rc-virtual-list-holder')
    if (containerEle?.scrollTop !== undefined) {
      containerEle.scrollTop = containerEle.scrollHeight ?? 1000000000
    }
  }
  const clearLogList = () => {
    ipcRenderer.sendSync('clear-log-content')
    fetchLogList()
  }
  Ahooks.useInterval(() => {
    if (isAutoFresh) {
      // 若自动刷新, 则每2秒刷新一次
      fetchLogList()
    }
  }, 2 * 1000)

  useEffect(() => {
    fetchLogList()
  }, [])

  return (
    <div className="log-panel-4d80654">
      <Card>
        <List>
          <VirtualList data={logList} height={ContainerHeight} itemHeight={20} itemKey="lineNo">
            {(item: Type_Log_Item) => (
              <List.Item key={item.lineNo}>
                <pre>{item.content}</pre>
              </List.Item>
            )}
          </VirtualList>
        </List>
      </Card>
      <div className="action-bar">
        <Row>
          <Col>
            <Checkbox
              checked={isAutoFresh}
              onChange={(e) => {
                setIsAutoFresh(e.target.checked)
              }}
            >
              自动刷新
            </Checkbox>
          </Col>
          <Col offset={6}>
            <Button type="primary" onClick={fetchLogList}>
              刷新日志
            </Button>
            <Divider type="vertical"></Divider>
            <Button danger onClick={clearLogList}>
              清空日志
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  )
}
