import axios, { AxiosRequestConfig } from 'axios'

// 创建axios实例
const http = axios.create({
  timeout: 1000,
})

class Http {
  /**
   * 封装get方法
   * @param url
   * @param config
   */
  static async asyncGet(url: string, config: AxiosRequestConfig = {}) {
    const response = await http.get(url, config).catch(() => {
      return {} as any
    })
    const record = response?.data ?? {}
    return record
  }
}

export default Http
