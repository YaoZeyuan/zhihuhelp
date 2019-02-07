import Base from "~/src/command/base";
import http from "~/src/library/http";
import moment from 'moment'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import DATE_FORMAT from '~/src/constant/date_format'
import CommonUtil from '~/src/library/util/common'
import logger from '~/src/library/logger'


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
      let processedImgContentList = []
      if (imgContentList === null) {
        // html中没有图片
        return rawHtml
      }
      // 单条rawHtml直接replace替换性能开销太大, 所以应该先拆分, 然后再整体合成一个字符串
      let rawHtmlWithoutImgContentList = rawHtml.split(/<img.+?>/g)
      let index = 0
      for (let imgContent of imgContentList) {
        index++
        // logger.log(`处理第${index}/${imgContentList.length}个img标签`)
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

        processedImgContentList.push(processedImgContent)
      }
      // 拼接 rawHtmlWithoutImgContentList 和 processImgContentList 成 rawHtml
      let strMergeList = []
      for (let index = 0; index < rawHtmlWithoutImgContentList.length; index++) {
        strMergeList.push(rawHtmlWithoutImgContentList[index])
        strMergeList.push(_.get(processedImgContentList, [index], ''))
      }
      let processedHtml = strMergeList.join('')
      return processedHtml
    }
    content = removeNoScript(content)
    let tinyContentList = content.split(`<div data-key='single-page'`).map((value) => { return replaceImgSrc(value) })
    content = tinyContentList.join(`<div data-key='single-page'`)
    return content
  }

  /**
   * 下载图片
   */
  async downloadImg() {
    this.log(`开始下载图片, 共${this.imgUriPool.size}张待下载`)
    let index = 0
    let maxDownload = 100
    for (let src of this.imgUriPool) {
      index++
      let filename = this.getImgName(src)
      let cacheUri = path.resolve(PathConfig.imgCachePath, filename)
      // 检查缓存中是否有该文件
      if (fs.existsSync(cacheUri)) {
        continue
      }


      // 分批下载
      this.log(`[第${index}张图片]将第${index}/${this.imgUriPool.size}张图片添加到任务队列中`)
      await CommonUtil.appendPromiseWithDebounce((async (index, src, cacheUri, that) => {
        logger.log(`[第${index}张图片]准备下载第${index}/${that.imgUriPool.size}张图片, src => ${src}`)
        let imgContent = await http.get(src, {
          responseType: 'arraybuffer', // 必须是这个值, 强制以二进制形式接收页面响应值
        }).catch(e => {
          logger.log(`[第${index}张图片]第${index}/${that.imgUriPool.size}张图片下载失败, 自动跳过`)
          logger.log(`[第${index}张图片]错误原因 =>`, e)
          return 0
        })
        if (imgContent === 0) {
          return
        }
        logger.log(`[第${index}张图片]第${index}/${that.imgUriPool.size}张图片下载完成, src => ${src}`)
        // 调用writeFileSync时间长了之后可能会卡在这上边, 导致程序无响应, 因此改用promise试一下
        logger.log(`[第${index}张图片]准备写入文件:${cacheUri}`)
        await CommonUtil.sleep(10)
        fs.writeFileSync(cacheUri, imgContent)
        logger.log(`[第${index}张图片]第${index}/${that.imgUriPool.size}张图片储存完毕`)
      })(index, src, cacheUri, this))
    }
    this.log(`清空任务队列`)
    await CommonUtil.appendPromiseWithDebounce(this.emptyPromiseFunction(), true)
    this.log(`所有图片下载完毕`)
  }

  async writeFileWithPromise(uri: string, content: string) {
    logger.log(`准备写入文件:${uri}`)
    await CommonUtil.sleep(10)
    logger.log(`开始写入文件:${uri}`)
    await new Promise(function (resolve, reject) {
      fs.writeFile(uri, content, function (err) {
        if (err) {
          reject(err)
        }
        resolve(content)
      })
    })
    logger.log(`文件:${uri}写入完成`)
    return
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
