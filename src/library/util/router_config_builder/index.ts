import ResponseBuilder from '~/src/library/util/response_builder'
import express from 'express'

export type Type_Router_Config = {
    [url: string]: {
        methodType: typeof RouterConfigBuilder.METHOD_TYPE_GET | typeof RouterConfigBuilder.METHOD_TYPE_POST,
        func: (req: express.Request, res: express.Response) => any,
    }
}

export default class RouterConfigBuilder {

    static readonly METHOD_TYPE_GET = 'get' as const
    static readonly METHOD_TYPE_POST = 'post' as const

    /**
     *
     * @param {String} url          接口url
     * @param {String} methodType   接口类型, METHOD_TYPE_GET / METHOD_TYPE_POST
     * @param {Function} func       实际controller函数
     * @param {Boolean} needProjectPriv 是否需要项目权限
     * @param {Boolean} needLogin   是否需要登录
     * @param {Object}
     */
    static register({
        url = '/', methodType = RouterConfigBuilder.METHOD_TYPE_GET, func
    }: {
        url: string,
        methodType: typeof RouterConfigBuilder.METHOD_TYPE_GET | typeof RouterConfigBuilder.METHOD_TYPE_POST,
        func: (req: express.Request, res: express.Response) => any,
    }) {
        let routerConfig: Type_Router_Config = {}
        routerConfig[url] = {
            methodType,
            func: (req: express.Request, res: express.Response) => {
                // 封装一层, 统一加上catch代码
                return func(req, res).catch((e: any) => {
                    res.status(500)
                    res.json(ResponseBuilder.showError('服务器错误', 10000, e.stack))
                })
            },
        }
        return routerConfig
    }
}
