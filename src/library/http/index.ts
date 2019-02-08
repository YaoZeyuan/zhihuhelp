import axios, { AxiosRequestConfig } from 'axios'
import RequestConfig from '~/src/config/request'
import logger from '~/src/library/logger'
import request from 'request-promise'
import _ from 'lodash'

// 创建axios实例
const http = axios.create({
    timeout: RequestConfig.timeoutMs,
    headers: {
        // 加上ua
        'User-Agent': RequestConfig.ua,
        cookie: RequestConfig.cookie,
    }
})

class Http {
    /**
     * 封装get方法
     * @param url
     * @param config
     */
    static async get(url: string, config: AxiosRequestConfig = {}) {
        const response = await http.get(url, config).catch(() => {
            return {}
        })
        const record = _.get(response, ['data'], {})
        return record
    }

    /**
     * axios封装的arraybuffer由于使用了stream, 重复次数多了之后会出现stream卡死的情况, 且不可恢复
     * 因此改用request封装图片下载请求
     * @param url 
     */
    static async downloadImg(url: string): Promise<request.RequestPromise> {
        return await request({
            url,
            method: 'get',
            // 数据以二进制形式返回
            encoding: null,
            timeout: RequestConfig.timeoutMs,
        })
    }
}

export default Http
