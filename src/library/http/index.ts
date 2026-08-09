import axios, { AxiosRequestConfig } from 'axios'
import CommonConfig from '~/src/config/common.js'
import RequestConfig from '~/src/config/request.js'
import logger from '~/src/library/logger.js'
import asyncGetZhihuEncrypt from '~/src/library/zhihu_encrypt/index.js'
import querystring from 'querystring'
import lodash from 'lodash'
import URL from 'url'
import { LRUCache } from 'lru-cache'
import md5 from 'md5'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error.js'
import { classifyZhihuResponse } from '~/src/shared/error/zhihu_response_classification.js'
import { LogEventCode, LogLevel, LogStage, LogStatus } from '~/src/shared/logging/log_contract.js'
import { getLogCorrelationContext, runWithLogCorrelation } from '~/src/shared/runtime/log_correlation_context.js'

const Const_Headers_x_zse_93 = '101_3_3.0'

// 创建axios实例
const httpInstance = axios.create({
  timeout: CommonConfig.request_timeout_ms,
  headers: {
    // 加上ua
    'User-Agent': RequestConfig.ua,
    cookie: RequestConfig.cookie,
  },
})

let lruCache = new LRUCache({ max: 10000, ttl: 1000 * 3600 })

export function fixedEncodeURIComponent(str: string) {
  // 不需要对*进行转码
  return encodeURIComponent(str).replace(/[!'()]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16)
  })
}

export async function asyncGenerateZhihuExtendsHeader({
  url,
  params,
  cookie = RequestConfig.cookie,
  ua = RequestConfig.ua,
  traceId,
}: {
  /**
   * 任意url, 带不带query参数均可, 函数中会进行统一处理
   */
  url: string
  /**
   * query参数
   */
  params: {
    [key: string]: string
  }
  /**
   * 原始cookie内容, 会自动从中提取d_c0
   */
  cookie: string
  /**
   * 默认ua
   */
  ua: string
  traceId?: string
}) {
  // 从cookie中提取d_c0
  let cookie_item_list = cookie
    .split(';')
    .map((item: string) => item.trim())
    .filter((item: string) => item.startsWith('d_c0'))
  let raw_d_c0 = cookie_item_list?.[0] || ''
  let cookie_d_c0 = raw_d_c0.split('d_c0=')?.[1] || ''
  if (cookie_d_c0.trim() === '') {
    throw new ApplicationError(AppErrorCode.AUTH_COOKIE_INVALID, '知乎 Cookie 缺少签名所需的 d_c0 字段')
  }

  // 解析出url中的pathname和query参数
  let rawUrlObj = new URL.URL(url)
  let rawUrlPathname = rawUrlObj.pathname
  let rawUrlQuery: { [key: string]: any } = {}
  for (let key of rawUrlObj.searchParams.keys()) {
    rawUrlQuery[key] = rawUrlObj.searchParams.get(key)
  }

  // 合并params中带的query参数
  if (params) {
    rawUrlQuery = {
      ...rawUrlQuery,
      ...params
    }
  }

  // 生成最终的加密url
  let encrypt_url = rawUrlPathname
  // 补充query参数
  if ([...Object.keys(rawUrlQuery)].length > 0) {
    // 将config中的参数合并到url中, 以进行统一的签名运算
    encrypt_url = `${encrypt_url}?${querystring.stringify(rawUrlQuery, undefined, undefined, {
      encodeURIComponent: fixedEncodeURIComponent,
    })}`
  }

  // 执行加密
  let x_zst_96 = await asyncGetZhihuEncrypt({
    cookie_d_c0: cookie_d_c0,
    url: encrypt_url,
    traceId: traceId ?? getLogCorrelationContext().traceId,
  })
  // 返回最终的header
  return {
    'User-Agent': ua,
    cookie: cookie,
    'x-zse-93': Const_Headers_x_zse_93,
    'x-zse-96': x_zst_96,
  }
}

export default class httpClient {
  static rawInstance = httpInstance
  /**
   * 原始request请求
   * @param params
   * @returns
   */
  static async rawRequest(...params: Parameters<typeof httpInstance.request>) {
    return httpInstance.request(...params)
  }
  /**
   * 封装get方法
   * @param url
   * @param config
   */
  static async get(url: string, config: AxiosRequestConfig = {}, context?: { traceId?: string }) {
    // 知乎有自己的query-encode方法, 因此不能使用axios自带的params合并方法
    // 否则会导致加密失败
    if (config?.params && Object.keys(config?.params ?? {}).length > 0) {
      url = `${url}?${querystring.stringify(config.params, undefined, undefined, {
        encodeURIComponent: fixedEncodeURIComponent
      })}`
      delete config.params
    }

    const requestJobId = `http-get-${Date.now()}-${Math.random().toString(16).slice(2)}`
    return runWithLogCorrelation({ traceId: context?.traceId, jobId: requestJobId }, async () => {
      const startedAt = Date.now()
      logger.event({
        eventCode: LogEventCode.FETCH_START,
        stage: LogStage.FETCH,
        status: LogStatus.START,
        level: LogLevel.INFO,
        message: '开始知乎网络请求',
        details: { url, method: 'GET' },
      })
      try {

    // 发送知乎请求时, 需要额外附带校验header, 否则报错
    let extendHeader = await asyncGenerateZhihuExtendsHeader({
      url: url,
      // 此时config.params的值已经被合入url, 所以此处不再需要传入param对象
      params: {},
      cookie: RequestConfig.cookie,
      ua: RequestConfig.ua,
      traceId: context?.traceId,
    })

    config.headers = {
      ...config.headers,
      ...extendHeader,
    }
    const cacheKey = md5(JSON.stringify({
      url,
      // 重新登录账号后, 缓存作废
      cookie: RequestConfig.cookie,
      ua: RequestConfig.ua,
    }))
    if (lruCache.get(cacheKey) !== undefined) {
      console.log(`命中缓存, 直接返回结果, url=>${url}`)
      logger.event({
        eventCode: LogEventCode.FETCH_SUCCESS,
        stage: LogStage.FETCH,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: '知乎网络请求命中缓存',
        durationMs: Date.now() - startedAt,
        details: { url, method: 'GET', cacheHit: true },
      })
      return lruCache.get(cacheKey)
    }

    const response = await httpInstance.get(url, config)
    const record = response.data || {}

    if (lodash.isEmpty(record) === false) {
      // 若响应值不为空, 则缓存响应结果, 保护知乎服务器
      lruCache.set(cacheKey, record)
    }
    logger.event({
      eventCode: LogEventCode.FETCH_SUCCESS,
      stage: LogStage.FETCH,
      status: LogStatus.SUCCESS,
      level: LogLevel.INFO,
      message: '知乎网络请求完成',
      durationMs: Date.now() - startedAt,
      details: { url, method: 'GET', cacheHit: false },
    })
    return record
      } catch (error) {
        const responseStatus = axios.isAxiosError(error) ? error.response?.status : undefined
        const errorCode = classifyZhihuResponse({ status: responseStatus }).errorCode ?? AppErrorCode.REQUEST_FAILED
        const applicationError =
          error instanceof ApplicationError
            ? error
            : new ApplicationError(
                errorCode,
                errorCode === AppErrorCode.ENTITY_NOT_FOUND
                  ? '知乎实体不存在或已不可见'
                  : errorCode === AppErrorCode.ENTITY_DELETED
                    ? '知乎实体已删除'
                    : '知乎请求失败：可能是 Cookie 失效、访问受限、网络异常或接口签名发生变化',
                error,
              )
        logger.event({
          eventCode: LogEventCode.FETCH_FAILURE,
          stage: LogStage.FETCH,
          status: LogStatus.FAILURE,
          level: LogLevel.ERROR,
          errorCode: applicationError.code,
          message: '知乎网络请求失败',
          durationMs: Date.now() - startedAt,
          error: logger.serializeError(applicationError),
          details: { url, method: 'GET' },
        })
        throw applicationError
      }
    })
  }

  /**
   * axios封装的arraybuffer由于使用了stream, 重复次数多了之后会出现stream卡死的情况, 且不可恢复
   * 因此改用request封装图片下载请求
   * @param url
   */
  static async downloadImg(url: string): Promise<Buffer> {
    const requestJobId = `image-get-${Date.now()}-${Math.random().toString(16).slice(2)}`
    return runWithLogCorrelation({ jobId: requestJobId }, async () => {
      const startedAt = Date.now()
      logger.event({
        eventCode: LogEventCode.FETCH_START,
        stage: LogStage.FETCH,
        status: LogStatus.START,
        level: LogLevel.INFO,
        message: '开始下载图片资源',
        details: { url },
      })
      try {
        const res = await httpInstance.get(url, {
        // 下载二进制文件时, 这里必须是arraybuffer, 否则会导致下载的文件损坏&无法识别
          responseType: 'arraybuffer',
          timeout: CommonConfig.request_timeout_ms,
        })
        logger.event({
          eventCode: LogEventCode.FETCH_SUCCESS,
          stage: LogStage.FETCH,
          status: LogStatus.SUCCESS,
          level: LogLevel.INFO,
          message: '图片资源下载完成',
          durationMs: Date.now() - startedAt,
          details: { url, byteLength: Buffer.byteLength(res.data) },
        })
        return res.data
      } catch (error) {
        logger.event({
          eventCode: LogEventCode.FETCH_FAILURE,
          stage: LogStage.FETCH,
          status: LogStatus.FAILURE,
          level: LogLevel.ERROR,
          errorCode: AppErrorCode.IMAGE_DOWNLOAD_FAILED,
          message: '图片下载失败',
          durationMs: Date.now() - startedAt,
          error: logger.serializeError(error),
          details: { url },
        })
        throw new ApplicationError(AppErrorCode.IMAGE_DOWNLOAD_FAILED, '图片下载失败', error)
      }
    })
  }
}
