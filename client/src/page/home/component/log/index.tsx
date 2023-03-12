import { Button, List, Typography, Card, Row, Divider, Space, Col } from 'antd'
import Electron from 'electron'
import { useState, useContext, useEffect } from 'react'
import VirtualList from 'rc-virtual-list'

import './index.less'

const { ipcRenderer } = Electron

type Type_Log_Item = {
  lineNo: number
  content: string
}

export default () => {
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
  }

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
          <Col offset={12}>
            <Button type="primary" onClick={fetchLogList}>
              刷新
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  )
}
