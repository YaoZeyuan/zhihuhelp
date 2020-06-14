import Base from '~/src/command/base'
import http from '~/src/library/http'
import md5 from 'md5'
import url from 'url'
import moment from 'moment'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import DATE_FORMAT from '~/src/constant/date_format'
import CommonUtil from '~/src/library/util/common'
import logger from '~/src/library/logger'
import StringUtil from '~/src/library/util/string'
import Epub from '~/src/library/epub'
import TypeTaskConfig from '~/src/type/namespace/task_config'
import sharp from 'sharp'

type TypeSrc2Download = string
class ImgItem {
  /**
   * 文件名
   */
  filename: string
  /**
   * 真实文件名
   */
  realFilename: string
  /**
   * 是否为LatexImg文件(LatexImg文件为svg格式, 需要单独处理)
   */
  isLatexImg: boolean = false
  /**
   * 文件下载cache位置
   */
  downloadCacheUri: string
  /**
   * 文件实际存储cache位置(svg文件需要转换为jpg后使用)
   */
  fileCacheUri: string
  /**
   * 下载地址
   */
  rawImgSrc: string
  /**
   * html中展示的地址
   */
  htmlImguri: string

  constructor(src: string, isLatexImg = false) {
    this.isLatexImg = isLatexImg
    this.filename = ImgItem.getImgName(src, isLatexImg)
    if (this.isLatexImg) {
      this.realFilename = this.filename.split('.svg')[0] + '.png'
    } else {
      this.realFilename = this.filename
    }

    this.rawImgSrc = src
    this.downloadCacheUri = path.resolve(PathConfig.imgCachePath, this.filename)

    if (this.isLatexImg) {
      this.htmlImguri = '../image/' + this.realFilename
      this.fileCacheUri = path.resolve(PathConfig.imgCachePath, this.realFilename)
    } else {
      this.htmlImguri = '../image/' + this.filename
      this.fileCacheUri = path.resolve(PathConfig.imgCachePath, this.filename)
    }
  }

  static getImgName(src: string, isLatexImg = false) {
    // 直接将路径信息md5
    let filename = ''
    try {
      let srcMd5 = md5(src)
      let urlObj = new url.URL(src)
      let pathname = urlObj.pathname
      if (path.extname(pathname) === '') {
        // 避免没有后缀名
        if (isLatexImg) {
          // Latex图片本身就没有后缀名
          pathname = `${pathname}.svg`
        } else {
          pathname = `${pathname}.jpg`
        }
      }
      if (pathname.length > 50) {
        // 文件名不能过长, 否则用户无法直接删除该文件
        pathname = pathname.substr(pathname.length - 50, 50)
      }
      filename = StringUtil.encodeFilename(`${srcMd5}_${pathname}`)
    } catch (e) {
      // 非url, 不需要进行处理, 返回空即可
      logger.warn(`[警告]传入值src:${src}不是合法url, 将返回空filename`)
    }
    return filename
  }
}

class FetchBase extends Base {
  epub: Epub | null = null
  imageQuilty: TypeTaskConfig.imageQuilty = 'hd'

  imgUriPool: Map<TypeSrc2Download, ImgItem> = new Map()

  bookname = ''

  get epubCachePath() {
    return path.resolve(PathConfig.epubCachePath, this.bookname)
  }

  get epubOutputPath() {
    return path.resolve(PathConfig.epubOutputPath)
  }

  get epubOutputPathUri() {
    return path.resolve(this.epubOutputPath, this.bookname + '.epub')
  }

  get htmlCachePath() {
    return path.resolve(PathConfig.htmlCachePath, this.bookname)
  }
  get htmlCacheHtmlPath() {
    return path.resolve(this.htmlCachePath, 'html')
  }
  get htmlCacheSingleHtmlPath() {
    return path.resolve(this.htmlCachePath, '单文件版')
  }
  get htmlCacheCssPath() {
    return path.resolve(this.htmlCachePath, 'css')
  }
  get htmlCacheImgPath() {
    return path.resolve(this.htmlCachePath, 'image')
  }

  get htmlOutputPath() {
    return path.resolve(PathConfig.htmlOutputPath)
  }

  get htmlOutputPathUri() {
    return path.resolve(this.htmlOutputPath, this.bookname)
  }

  static get signature() {
    return `
        Generate:Base
        `
  }

  static get description() {
    return '生成电子书'
  }

  // 初始化静态资源(电子书 & html目录)
  initStaticRecource() {
    this.log(`删除旧目录`)
    this.log(`删除旧epub缓存资源目录:${this.epubCachePath}`)
    shelljs.rm('-rf', this.epubCachePath)
    this.log(`旧epub缓存目录删除完毕`)
    this.log(`删除旧epub输出资源目录:${this.epubOutputPathUri}`)
    shelljs.rm('-rf', this.epubOutputPathUri)
    this.log(`旧epub输出目录删除完毕`)
    this.log(`删除旧html资源目录:${this.htmlCachePath}`)
    shelljs.rm('-rf', this.htmlCachePath)
    this.log(`旧html资源目录删除完毕`)
    this.log(`删除旧html输出目录:${this.htmlOutputPathUri}`)
    shelljs.rm('-rf', this.htmlOutputPathUri)
    this.log(`旧html输出目录删除完毕`)

    this.log(`创建电子书:${this.bookname}对应文件夹`)
    shelljs.mkdir('-p', this.epubCachePath)
    shelljs.mkdir('-p', this.epubOutputPath)

    shelljs.mkdir('-p', this.htmlCachePath)
    shelljs.mkdir('-p', this.htmlCacheSingleHtmlPath)
    shelljs.mkdir('-p', this.htmlCacheHtmlPath)
    shelljs.mkdir('-p', this.htmlCacheCssPath)
    shelljs.mkdir('-p', this.htmlCacheImgPath)
    shelljs.mkdir('-p', this.htmlOutputPath)
    this.log(`电子书:${this.bookname}对应文件夹创建完毕`)

    this.epub = new Epub(this.bookname, this.epubCachePath)
  }
  processContent(content: string) {
    let that = this
    // 删除noscript标签内的元素
    function removeNoScript(rawHtml: string) {
      rawHtml = _.replace(rawHtml, /<\/br>/g, '')
      rawHtml = _.replace(rawHtml, /<br +?>/g, '<br />')
      rawHtml = _.replace(rawHtml, /<br>/g, '<br />')
      rawHtml = _.replace(rawHtml, /href="\/\/link.zhihu.com'/g, 'href="https://link.zhihu.com') // 修复跳转链接
      rawHtml = _.replace(rawHtml, /\<noscript\>.*?\<\/noscript\>/g, '')
      return rawHtml
    }

    // 替换图片地址(假定所有图片都在img文件夹下)
    function replaceImgSrc(rawHtml: string, isRaw = false) {
      rawHtml = _.replace(rawHtml, / src="data:image.+?"/g, '  ')
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
        // this.log(`处理第${index}/${imgContentList.length}个img标签`)
        let processedImgContent = imgContent
        let matchImgRawHeight = imgContent.match(/(?<=data-rawheight=")\d+/)
        let imgRawHeight = parseInt(_.get(matchImgRawHeight, [0], '0'))
        let matchImgRawWidth = imgContent.match(/(?<=data-rawwidth=")\d+/)
        let imgRawWidth = parseInt(_.get(matchImgRawWidth, [0], '0'))
        // 有可能只有data-actualsrc属性, 没有data-original属性

        let hasRawImg = imgContent.indexOf(`data-original="`) !== -1
        let hasHdImg = imgContent.indexOf(`data-actualsrc="`) !== -1
        let isLatexImg = imgContent.indexOf(`eeimg`) !== -1
        let imgSrc = ''
        if (hasHdImg) {
          let matchImgSrc = imgContent.match(/(?<=data-actualsrc=")[^"]+/)
          imgSrc = _.get(matchImgSrc, [0], '')
        }
        if (imgSrc === '' && hasRawImg) {
          let matchImgSrc = imgContent.match(/(?<=data-original=")[^"]+/)
          imgSrc = _.get(matchImgSrc, [0], '')
        }
        if (hasRawImg === false && hasHdImg === false) {
          // 只有src属性
          let matchImgSrc = imgContent.match(/(?<=src=")[^"]+/)
          imgSrc = _.get(matchImgSrc, [0], '')
        }
        let backupImgSrc = imgSrc
        // 去掉最后的_r/_b后缀
        let imgSrc_raw = _.replace(imgSrc, /_\w*/g, '_r')
        let imgSrc_hd = _.replace(imgSrc, /_\w*/g, '_b')
        // 彻底去除imgContent中的src属性
        imgContent = _.replace(imgContent, / src=".+?"/g, '  ')
        if (isLatexImg) {
          // 如果是LatexImg, 不需要被处理
          imgSrc = backupImgSrc
        }

        if (that.imageQuilty === 'raw') {
          // 原始图片
          processedImgContent = _.replace(imgContent, /<img /g, `<img src="${imgSrc_raw}"`)
        } else if (that.imageQuilty === 'none') {
          // 无图
          processedImgContent = ''
        } else {
          // if (that.imageQuilty === 'hd' || that.imageQuilty === 'default') {
          // 高度大于宽度4倍的图, 一般属于条图, 默认作为原图进行展示
          let needDisplayRawImg = imgRawWidth !== 0 && imgRawHeight > imgRawWidth * 4
          // 是否需要展示为原图(判断逻辑: 有原图属性 && (需要展示为原图 或 通过配置强制指定为原图)
          let isDisplayAsRawImg = hasRawImg && (needDisplayRawImg || isRaw)
          if (isDisplayAsRawImg) {
            processedImgContent = _.replace(imgContent, /<img /g, `<img src="${imgSrc_raw}"`)
          } else {
            // 高清图
            processedImgContent = _.replace(imgContent, /<img /g, `<img src="${imgSrc_hd}"`)
            // if (imgContent.includes('data-actualsrc')) {
            //   // 先替换掉原先的src地址
            //   processedImgContent = _.replace(imgContent, / src="https:.+?"/g, '')
            //   // 再改成标清图地址
            //   processedImgContent = _.replace(processedImgContent, /data-actualsrc="https:/g, 'src="https:')
            // }
          }
        }

        if (isLatexImg === false) {
          // 支持多看内读图
          processedImgContent = `<div class="duokan-image-single">${processedImgContent}</div>`
        }

        if (that.imageQuilty === 'none' && isLatexImg === false) {
          // 没有图片, 也就不需要处理了, 直接跳过即可
          processedImgContentList.push(processedImgContent)
          continue
        }

        // 将图片地址提取到图片池中
        // 将html内图片地址替换为html内的地址
        let matchImgSrc = processedImgContent.match(/(?<= src=")[^"]+/)
        let rawImgSrc = _.get(matchImgSrc, [0], '')
        let imgItem = new ImgItem(rawImgSrc, isLatexImg)
        if (rawImgSrc.length > 0) {
          that.imgUriPool.set(rawImgSrc, imgItem)
        }
        processedImgContent = _.replace(processedImgContent, imgItem.rawImgSrc, imgItem.htmlImguri)

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
    let tinyContentList = content.split(`<div data-key='single-page'`).map(value => {
      return replaceImgSrc(value)
    })
    content = tinyContentList.join(`<div data-key='single-page'`)
    return content
  }

  /**
   * 下载图片
   */
  async downloadImg() {
    let index = 0
    for (let imgItem of this.imgUriPool.values()) {
      index++
      // 检查缓存中是否有该文件
      if (fs.existsSync(imgItem.downloadCacheUri)) {
        this.log(`[第${index}张图片]-0-将第${index}/${this.imgUriPool.size}张图片已存在,自动跳过`)
        continue
      }

      if (fs.existsSync(imgItem.downloadCacheUri) === false) {
        // 分批下载
        this.log(`[第${index}张图片]-0-将第${index}/${this.imgUriPool.size}张图片添加到任务队列中`)
        await CommonUtil.asyncAppendPromiseWithDebounce(
          this.asyncDownloadImg(index, imgItem.rawImgSrc, imgItem.downloadCacheUri),
          false,
          false,
        )
      }
    }
    this.log(`清空任务队列`)
    await CommonUtil.asyncAppendPromiseWithDebounce(this.emptyPromiseFunction(), true)
    this.log(`所有图片下载完毕`)
    this.log(`开始转换Latex图片`)
    index = 0
    for (let imgItem of this.imgUriPool.values()) {
      index++

      // 下载完成后, 将图片转为png格式
      if (imgItem.isLatexImg) {
        if (fs.existsSync(imgItem.fileCacheUri)) {
          this.log(`[第${index}张图片]-0-将第${index}/${this.imgUriPool.size}张Latex图片已转换,自动跳过`)
          continue
        }

        this.log(`[第${index}张图片]-0-第${index}/${this.imgUriPool.size}张图片为Latex-svg图片, 将之转换为png格式`)
        await sharp(imgItem.downloadCacheUri)
          .png()
          .toFile(imgItem.fileCacheUri)
        this.log(`[第${index}张图片]-0-第${index}/${this.imgUriPool.size}张Latex-svg图片转换完毕`)
      }
    }
    this.log(`所有Latex图片转换完毕`)
    this.log(`图片下载流程执行完毕`)
  }

  private async asyncDownloadImg(index: number, src: string, cacheUri: string) {
    await CommonUtil.asyncSleep(1)
    // 确保下载日志可以和下载成功的日志一起输出, 保证日志完整性, 方便debug
    this.log(`[第${index}张图片]-1-准备下载第${index}/${this.imgUriPool.size}张图片, src => ${src}`)
    let imgContent = await http.downloadImg(src).catch(e => {
      this.log(`[第${index}张图片]-1-2-第${index}/${this.imgUriPool.size}张图片下载失败, 自动跳过`)
      this.log(`[第${index}张图片]-1-3-错误原因 =>`, e.message)
      return ''
    })
    if (imgContent === '') {
      this.log(`[第${index}张图片]-1-4-下载失败, 图片内容为空`)
      return
    }
    this.log(`[第${index}张图片]-2-第${index}/${this.imgUriPool.size}张图片下载完成, src => ${src}`)
    // 调用writeFileSync时间长了之后可能会卡在这上边, 导致程序无响应, 因此改用promise试一下
    this.log(`[第${index}张图片]-3-准备写入文件:${cacheUri}`)
    await CommonUtil.asyncSleep(10)
    fs.writeFileSync(cacheUri, imgContent)
    this.log(`[第${index}张图片]-4-第${index}/${this.imgUriPool.size}张图片储存完毕`)
  }

  copyImgToCache(imgBookCachePath: string) {
    let index = 0
    for (let imgItem of this.imgUriPool.values()) {
      index++
      // 避免文件名不存在的情况
      if (imgItem.realFilename === '') {
        continue
      }
      let imgToUri = path.resolve(imgBookCachePath, imgItem.realFilename)
      if (fs.existsSync(imgItem.fileCacheUri)) {
        fs.copyFileSync(imgItem.fileCacheUri, imgToUri)
        this.log(`第${index}/${this.imgUriPool.size}张图片复制完毕`)
      } else {
        this.log(`第${index}/${this.imgUriPool.size}张图片不存在, 自动跳过`)
        this.log(`src => ${imgItem.fileCacheUri}`)
      }
      this.epub.addImage(imgToUri)
    }
    this.log(`全部图片复制完毕`)
  }

  copyStaticResource() {
    // css
    for (let filename of ['bootstrap.css', 'customer.css', 'markdown.css', 'normalize.css']) {
      let copyFromUri = path.resolve(PathConfig.resourcePath, 'css', filename)
      let copyToUri = path.resolve(this.htmlCacheCssPath, filename)
      fs.copyFileSync(copyFromUri, copyToUri)
      this.epub.addCss(copyToUri)
    }
    // 图片资源
    for (let filename of ['cover.jpg', 'kanshan.png']) {
      let copyFromUri = path.resolve(PathConfig.resourcePath, 'image', filename)
      let copyToUri = path.resolve(this.htmlCacheImgPath, filename)
      fs.copyFileSync(copyFromUri, copyToUri)
      this.epub.addImage(copyToUri)
    }

    // 设置封面
    let coverCopyFromUri = path.resolve(PathConfig.resourcePath, 'image', 'cover.jpg')
    let coverCopyToUri = path.resolve(this.htmlCacheImgPath, 'cover.jpg')
    fs.copyFileSync(coverCopyFromUri, coverCopyToUri)
    this.epub.addCoverImage(coverCopyToUri)
  }

  async asyncProcessStaticResource() {
    this.log(`内容列表预处理完毕, 准备下载图片`)
    // 下载图片
    this.log(`开始下载图片, 共${this.imgUriPool.size}张待下载`)
    await this.downloadImg()
    this.log(`图片下载完毕`)
    this.log(`将图片从图片池复制到电子书文件夹中`)
    this.copyImgToCache(this.htmlCacheImgPath)
    this.log(`图片复制完毕`)

    this.log(`复制静态资源`)
    this.copyStaticResource()
    this.log(`静态资源完毕`)

    this.log(`生成电子书`)
    await this.epub.asyncGenerate()
    this.log(`电子书生成完毕`)

    this.log(`将生成文件复制到目标文件夹`)
    this.log(`复制epub电子书`)
    fs.copyFileSync(
      path.resolve(this.epubCachePath, this.bookname + '.epub'),
      path.resolve(this.epubOutputPath, this.bookname + '.epub'),
    )
    this.log(`epub电子书复制完毕`)
    this.log(`复制网页`)
    shelljs.cp('-r', path.resolve(this.htmlCachePath), path.resolve(this.htmlOutputPath))
    this.log(`网页复制完毕`)
  }

  /**
   * 根据图片地址生成图片名
   * @param src
   */
  getImgName(src: string) {
    // 直接将路径信息md5
    let filename = ''
    try {
      let srcMd5 = md5(src)
      let urlObj = new url.URL(src)
      let pathname = urlObj.pathname
      if (path.extname(pathname) === '') {
        // 避免没有后缀名
        pathname = `${pathname}.svg`
      }
      if (pathname.length > 50) {
        // 文件名不能过长, 否则用户无法直接删除该文件
        pathname = pathname.substr(pathname.length - 50, 50)
      }
      filename = StringUtil.encodeFilename(`${srcMd5}_${pathname}`)
    } catch (e) {
      // 非url, 不需要进行处理, 返回空即可
      logger.warn(`[警告]传入值src:${src}不是合法url, 将返回空filename`)
    }
    return filename
  }
}

export default FetchBase
