import { Layout, ConfigProvider, App } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'
import './app.less'
// vite需要主动导入dist下的moment语言包才能显示中文(dist下是esm格式, 而默认是umd格式, vite不支持)
// https://blog.csdn.net/baobao_123456789/article/details/115480855
import 'moment/dist/locale/zh-cn'
// 正式版为webpack引入
import 'moment/locale/zh-cn'
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
