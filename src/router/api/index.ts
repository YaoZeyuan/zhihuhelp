import Host from '~/src/router/api/host'
import Demo from '~/src/router/api/demo'
import ZhihuHack from '~/src/router/api/zhihu_hack'

export default {
  ...Host,
  ...Demo,
  ...ZhihuHack,
}
