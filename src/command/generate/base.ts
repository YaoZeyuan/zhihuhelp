import Base from "~/src/command/base";
import http from "~/src/library/http";
import MAnswer from "~/src/model/answer";
import MAuthor from "~/src/model/author";
import AnswerRecord from "model/answer";
import React from 'react'
import ReactDomServer from 'react-dom/server'
import moment from 'moment'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import DATE_FORMAT from '~/src/constant/date_format'
import StringUtil from '~/src/library/util/string'
import AuthorRecord from "model/author";

class FetchBase extends Base {
    imgUriPool: Set<string> = new Set()
    // 图片质量
    PICTURE_QUALITY_HD = 'hd' // 对应 data-actualsrc 属性
    PICTURE_QUALITY_RAW = 'r' // 对应 data-original 属性

    static get signature() {
        return `
        Generate:Base
        `;
    }

    static get description() {
        return "生成电子书";
    }


    processContent(content: string) {
        let that = this
        // 删除noscript标签内的元素
        function removeNoScript(rawHtml: string) {
            rawHtml = _.replace(rawHtml, /<\/br>/g, '')
            rawHtml = _.replace(rawHtml, /<br>/g, '<br/>')
            rawHtml = _.replace(rawHtml, /href="\/\/link.zhihu.com'/g, 'href="https://link.zhihu.com') // 修复跳转链接
            rawHtml = _.replace(rawHtml, /\<noscript\>.*?\<\/noscript\>/g, '')
            return rawHtml
        }

        // 替换图片地址(假定所有图片都在img文件夹下)
        function replaceImgSrc(rawHtml: string, isRaw = false) {
            rawHtml = _.replace(rawHtml, /img src="data:image.+?"/g, 'img')
            // 处理图片
            const imgContentList = rawHtml.match(/<img.+?>/g)
            if (imgContentList === null) {
                // html中没有图片
                return rawHtml
            }
            for (let imgContent of imgContentList) {
                let processedImgContent = ''
                let matchImgRawHeight = imgContent.match(/(?<=data-rawheight=")\d+/)
                let imgRawHeight = parseInt(_.get(matchImgRawHeight, [0], '0'))
                let matchImgRawWidth = imgContent.match(/(?<=data-rawwidth=")\d+/)
                let imgRawWidth = parseInt(_.get(matchImgRawWidth, [0], '0'))
                // 高度大于宽度4倍的图, 一般属于条图, 默认作为原图进行展示
                let needDisplayRawImg = (imgRawWidth !== 0) && (imgRawHeight > (imgRawWidth * 4))
                // 支持通过配置选择是否为原图
                if (needDisplayRawImg || isRaw) {
                    // 原始图片
                    processedImgContent = _.replace(imgContent, /data-original="https:/g, 'src="https:')
                } else {
                    // 高清图
                    processedImgContent = _.replace(imgContent, /data-actualsrc="https:/g, 'src="https:')
                }
                // 支持多看内读图
                processedImgContent = `<div class="duokan-image-single">${processedImgContent}</div>`

                // 将图片地址提取到图片池中
                // 将html内图片地址替换为html内的地址
                let matchImgSrc = processedImgContent.match(/(?<=src=")[^"]+/)
                let rawImgSrc = _.get(matchImgSrc, [0], '')
                if (rawImgSrc.length > 0) {
                    that.imgUriPool.add(rawImgSrc)
                }
                let filename = that.getImgName(rawImgSrc)
                let htmlImgUri = './image/' + filename
                processedImgContent = _.replace(processedImgContent, rawImgSrc, htmlImgUri)

                rawHtml = _.replace(rawHtml, imgContent, processedImgContent)
            }
            return rawHtml
        }
        content = removeNoScript(content)
        content = replaceImgSrc(content)
        return content
    }

    /**
     * 下载图片
     */
    async downloadImg() {
        this.log(`开始下载图片, 共${this.imgUriPool.size}张待下载`)
        let index = 0
        let maxDownload = 100
        let promiseList = []
        for (let src of this.imgUriPool) {
            index++
            let filename = this.getImgName(src)
            let cacheUri = path.resolve(PathConfig.imgCachePath, filename)
            // 检查缓存中是否有该文件
            if (fs.existsSync(cacheUri)) {
                continue
            }
            let request = new Promise(async (resolve) => {
                let imgContent = await http.get(src, {
                    responseType: 'arraybuffer', // important
                })
                fs.writeFileSync(cacheUri, imgContent)
                resolve()
            })
            promiseList.push(request)

            // 分批下载
            if (promiseList.length > maxDownload) {
                this.log(`开始下载第${index - maxDownload}~${index}张图片, 剩余${this.imgUriPool.size - index}张图片待下载`)
                await Promise.all(promiseList)
                this.log(`第${index - maxDownload}~${index}张图片下载完毕, 剩余${this.imgUriPool.size - index}张图片待下载`)
            }
        }
        this.log(`开始下载最后一批图片`)
        await Promise.all(promiseList)
        this.log(`最后一批图片下载完毕`)
    }

    copyImgToCache(imgCachePath: string) {
        let index = 0
        this.log(`将图片从图片池复制到电子书文件夹中`)
        for (let src of this.imgUriPool) {
            index++
            let filename = this.getImgName(src)
            let imgCacheUri = path.resolve(PathConfig.imgCachePath, filename)
            let imgToUri = path.resolve(imgCachePath, filename)
            if (fs.existsSync(imgCacheUri)) {
                fs.copyFileSync(imgCacheUri, imgToUri)
                this.log(`第${index}张图片复制完毕`)
            } else {
                this.log(`第${index}张图片不存在, 自动跳过`)
                this.log(`src => ${src}`)
            }
        }
        this.log(`全部图片复制完毕`)
    }

    /**
     * 根据图片地址生成图片名
     * @param src 
     */
    getImgName(src: string) {
        let filename = _.get(src.split('.com'), [1], '')
        filename = _.trim(filename, '/').replace('/', '_')
        return filename
    }
}

export default FetchBase;
