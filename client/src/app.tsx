import { Layout, ConfigProvider, App } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'
import './app.less'
import Home from './page/home'

export default () => {
  return (
    <ConfigProvider locale={zhCN}>
      <App>
        <Layout>
          <Layout.Content>
            <Home></Home>
          </Layout.Content>
        </Layout>
      </App>
    </ConfigProvider>
  )
}
