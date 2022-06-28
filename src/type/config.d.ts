export type Local = {
  request: {
    ua:
      | 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
      | string
    cookie: '' | string
  }
}
export type Version = {
  downloadUrl: 'http://www.baidu.com' | string
  releaseAt: '2019年2月11日12点08分' | string
  releaseNote: '' | string
  version: 1 | number
}
