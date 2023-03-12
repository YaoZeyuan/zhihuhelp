import { Button } from 'antd'
import Electron from 'electron'
import { useState, useContext, useEffect } from 'react'

const { ipcRenderer } = Electron

export default () => {
  const [log, setLog] = useState([])

  return (
    <div className="log-panel-4d80654">
      <div>log:{log}</div>
      <div>
        <Button
          type="primary"
          onClick={() => {
            const content = ipcRenderer.sendSync('get-log-content')
            setLog(content)
          }}
        >
          刷新
        </Button>
      </div>
    </div>
  )
}
