import * as Platform_Consts from '~/src/resource/const/platform'

// 环境下对应的host地址
export const Const_Host = 'https://www.zhihu.com'
// 需要转发到a1.ke.com的前端请求特征前缀
export const Const_Prefix = '/api/zhihu/' as const
// 需要转发到a1.ke.com的前端请求特征正则匹配表达式
export const Const_Match_Reg = /^\/api\/zhihu\/.+/
export const Const_Platform = Platform_Consts.Const_Platform_知乎
// 请求超时时间
export const Request_Timeout_s = 10
