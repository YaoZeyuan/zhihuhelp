import http from '~/src/library/http'
import md5 from 'md5'
import url from 'url'
import lodash from 'lodash'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import CommonUtil from '~/src/library/util/common'
import logger from '~/src/library/logger'
import Epub from '~/src/library/epub'
import * as Type_TaskConfig from '~/src/type/task_config'
import sharp from 'sharp'

const Const_Zhihu_Img_Prefix_Reg = /https:\/\/pic\w.zhimg.com/
const Const_Zhihu_Img_CDN_List = [
  'https://pic1.zhimg.com',
  'https://pic2.zhimg.com',
  'https://pic3.zhimg.com',
  'https://pic4.zhimg.com',
  'https://picx.zhimg.com',
]

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
        pathname = pathname.slice(pathname.length - 50)
      }
      filename = CommonUtil.encodeFilename(`${srcMd5}_${pathname}`)
    } catch (e) {
      // 非url, 不需要进行处理, 返回空即可
      logger.warn(`[警告]传入值src:${src}不是合法url, 将返回空filename`)
    }
    return filename
  }
}

class EpubGenerator {
  bookname = ''
  epub: Epub
  imageQuilty: Type_TaskConfig.Type_Image_Quilty = 'hd'

  imgUriPool: Map<TypeSrc2Download, ImgItem> = new Map()

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

  /**
   * 简易logger
   * @returns  null
   */
  async log(...argumentList: string[] | any): Promise<any> {
    let message = ''
    for (const rawMessage of argumentList) {
      if (lodash.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    logger.log(`[${this.constructor.name}] ` + message)
  }

  constructor({ bookname, imageQuilty }: { bookname: string; imageQuilty: Type_TaskConfig.Type_Image_Quilty }) {
    this.bookname = bookname
    this.imageQuilty = imageQuilty
    // 必须要先处理静态资源, 否则创建出的Epub缓存目录会被删除
    this.initStaticRecource()

    // 然后创建epub目录
    this.epub = new Epub(bookname, this.epubCachePath)
  }

  // 初始化静态资源(电子书 & html目录)
  private initStaticRecource() {
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
  }

  // 删除noscript标签内的元素
  private utilRemoveNoScript(rawHtml: string) {
    rawHtml = lodash.replace(rawHtml, /<\/br>/g, '')
    rawHtml = lodash.replace(rawHtml, /<br +?>/g, '<br />')
    rawHtml = lodash.replace(rawHtml, /<br>/g, '<br />')
    rawHtml = lodash.replace(rawHtml, /href="\/\/link.zhihu.com'/g, 'href="https://link.zhihu.com') // 修复跳转链接
    rawHtml = lodash.replace(rawHtml, /<noscript>.*?<\/noscript>/g, '')
    return rawHtml
  }

  // 替换图片地址(假定所有图片都在img文件夹下)
  private utilReplaceImgSrc(rawHtml: string, isRaw = false) {
    rawHtml = lodash.replace(rawHtml, / src="data:image.+?"/g, '  ')
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
      // imgContent 可能值 =>
      // <img   data-caption="" data-size="normal" data-rawwidth="794" data-rawheight="588" data-default-watermark-src="https://pic4.zhimg.com/50/v2-df6f9458bad1873bc717ddf92a58f802_720w.jpg?source=c8b7c179" class="origin_image zh-lightbox-thumb lazy" width="794" data-original="https://pic1.zhimg.com/v2-6abb2bbfdb4ccbf7e8481b313591dc99_720w.jpg?source=c8b7c179" data-actualsrc="https://pica.zhimg.com/50/v2-6abb2bbfdb4ccbf7e8481b313591dc99_720w.jpg?source=c8b7c179">

      // this.log(`处理第${index}/${imgContentList.length}个img标签`)
      let processedImgContent = imgContent
      let matchImgRawHeight = imgContent.match(/(?<=data-rawheight=")\d+/)
      let imgRawHeight = parseInt(matchImgRawHeight?.[0] || '0')
      let matchImgRawWidth = imgContent.match(/(?<=data-rawwidth=")\d+/)
      let imgRawWidth = parseInt(matchImgRawWidth?.[0] || '0')
      // 有可能只有data-actualsrc属性, 没有data-original属性

      let hasRawImg = imgContent.indexOf(`data-original="`) !== -1
      let hasHdImg = imgContent.indexOf(`data-actualsrc="`) !== -1
      let isLatexImg = imgContent.indexOf(`eeimg`) !== -1
      let imgSrc = ''
      if (hasHdImg) {
        let matchImgSrc = imgContent.match(/(?<=data-actualsrc=")[^"]+/)
        imgSrc = matchImgSrc?.[0] || ''
      }
      if (imgSrc === '' && hasRawImg) {
        let matchImgSrc = imgContent.match(/(?<=data-original=")[^"]+/)
        imgSrc = matchImgSrc?.[0] || ''
      }
      if (hasRawImg === false && hasHdImg === false) {
        // 只有src属性
        let matchImgSrc = imgContent.match(/(?<=src=")[^"]+/)
        imgSrc = matchImgSrc?.[0] || ''
      }
      let backupImgSrc = imgSrc
      // 去掉最后的_r/_b后缀
      let imgSrc_raw = lodash.replace(imgSrc, /(?=\w+)_\w+(?!=\.)/g, '_r')
      let imgSrc_hd = lodash.replace(imgSrc, /(?=\w+)_\w+(?!=\.)/g, '_b')
      // 彻底去除imgContent中的src属性
      imgContent = lodash.replace(imgContent, / src=".+?"/g, '  ')
      if (isLatexImg) {
        // 如果是LatexImg, 不需要被处理
        imgSrc = backupImgSrc
      }

      if (this.imageQuilty === 'raw') {
        // 原始图片
        processedImgContent = lodash.replace(imgContent, /<img /g, `<img src="${imgSrc_raw}"`)
      } else if (this.imageQuilty === 'none') {
        // 无图
        processedImgContent = ''
      } else {
        // if (that.imageQuilty === 'hd' || that.imageQuilty === 'default') {
        // 高度大于宽度4倍的图, 一般属于条图, 默认作为原图进行展示
        let needDisplayRawImg = imgRawWidth !== 0 && imgRawHeight > imgRawWidth * 4
        // 是否需要展示为原图(判断逻辑: 有原图属性 && (需要展示为原图 或 通过配置强制指定为原图)
        let isDisplayAsRawImg = hasRawImg && (needDisplayRawImg || isRaw)
        if (isDisplayAsRawImg) {
          processedImgContent = lodash.replace(imgContent, /<img /g, `<img src="${imgSrc_raw}"`)
        } else {
          // 高清图
          processedImgContent = lodash.replace(imgContent, /<img /g, `<img src="${imgSrc_hd}"`)
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

      if (this.imageQuilty === 'none' && isLatexImg === false) {
        // 没有图片, 也就不需要处理了, 直接跳过即可
        processedImgContentList.push(processedImgContent)
        continue
      }

      // 将图片地址提取到图片池中
      // 将html内图片地址替换为html内的地址
      let matchImgSrc = processedImgContent.match(/(?<= src=")[^"]+/)
      let rawImgSrc = matchImgSrc?.[0] || ''
      let imgItem = new ImgItem(rawImgSrc, isLatexImg)
      if (rawImgSrc.length > 0) {
        this.imgUriPool.set(rawImgSrc, imgItem)
      }
      processedImgContent = lodash.replace(processedImgContent, imgItem.rawImgSrc, imgItem.htmlImguri)

      processedImgContentList.push(processedImgContent)
    }
    // 拼接 rawHtmlWithoutImgContentList 和 processImgContentList 成 rawHtml
    let strMergeList = []
    for (let index = 0; index < rawHtmlWithoutImgContentList.length; index++) {
      strMergeList.push(rawHtmlWithoutImgContentList[index])
      strMergeList.push(processedImgContentList?.[index] || '')
    }
    let processedHtml = strMergeList.join('')
    return processedHtml
  }

  addHtml({ filename, title, html }: { filename: string, title: string; html: string }) {
    let htmlUri = path.resolve(this.htmlCacheHtmlPath, `${filename}.html`)
    // 对html进行处理, 替换掉图片地址
    let processContent = this.processContent(html)
    fs.writeFileSync(htmlUri, processContent)
    this.epub.addHtml(title, htmlUri)

    // 返回的html地址必须是相对地址, 以便在epub中进行定位
    const returnHtmlUri = `./${filename}.html`
    return returnHtmlUri
  }

  /**
   * 针对单页html专门提供的方法, 用于添加单页html
   * 该方法只在知乎助手中进行使用, 不能作为公共方法
   * @param param0
   * @returns
   */
  generateSinglePageHtml({ html }: { html: string }) {
    // 对html进行处理, 替换掉图片地址
    let processContent = this.processContent(html)
    fs.writeFileSync(path.resolve(this.htmlCacheSingleHtmlPath, `${this.bookname}.html`), processContent)
    return processContent
  }

  addIndexHtml({ filename, title, html }: { filename: string, title: string; html: string }) {
    let htmlUri = path.resolve(this.htmlCacheHtmlPath, `${filename}.html`)
    // 对html进行处理, 替换掉图片地址
    let processContent = this.processContent(html)
    fs.writeFileSync(htmlUri, processContent)
    this.epub.addIndexHtml(title, htmlUri)

    // 返回的html地址必须是相对地址, 以便在epub中进行定位
    const returnHtmlUri = `./${filename}.html`
    return returnHtmlUri
  }

  processContent(content: string) {
    content = this.utilRemoveNoScript(content)
    let tinyContentList = content.split(`<div data-key='single-page'`).map((value) => {
      return this.utilReplaceImgSrc(value)
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
        this.log(`[第${index}张图片]-0-第${index}/${this.imgUriPool.size}张图片已存在,自动跳过`)
        continue
      }

      if (fs.existsSync(imgItem.downloadCacheUri) === false) {
        // 分批下载
        this.log(`[第${index}张图片]-0-将第${index}/${this.imgUriPool.size}张图片添加到任务队列中`)
        let currentIndex = index
        CommonUtil.addAsyncTaskFunc({
          "asyncTaskFunc": async () => {
            await this.asyncDownloadImg(currentIndex, imgItem.rawImgSrc, imgItem.downloadCacheUri)
            return
          },
          needProtect: false,
        })
      }
    }
    this.log(`开始下载图片`)
    await CommonUtil.asyncWaitAllTaskComplete({
      needTTL: true
    })
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
        await sharp(imgItem.downloadCacheUri).png().toFile(imgItem.fileCacheUri)
        this.log(`[第${index}张图片]-0-第${index}/${this.imgUriPool.size}张Latex-svg图片转换完毕`)
      }
    }
    this.log(`所有Latex图片转换完毕`)
    this.log(`图片下载流程执行完毕`)
  }

  private async asyncDownloadImg(index: number, src: string, cacheUri: string) {
    // 确保下载日志可以和下载成功的日志一起输出, 保证日志完整性, 方便debug
    this.log(`[第${index}张图片]-1-准备下载第${index}/${this.imgUriPool.size}张图片, src => ${src}`)

    let imgContent: Buffer = Buffer.from("")
    // 知乎图片cdn不稳定, 需要把几个服务器都试下, 直到成功下载到图片为止
    if (src.match(Const_Zhihu_Img_Prefix_Reg) !== null) {
      // 匹配到说明是知乎的服务器
      let rawSrc = src
      let tryImgSrc = ''
      for (let prefix of Const_Zhihu_Img_CDN_List) {
        if (imgContent.length === 0) {
          tryImgSrc = rawSrc.replace(Const_Zhihu_Img_Prefix_Reg, prefix)
          imgContent = await http.downloadImg(tryImgSrc).catch((e) => {
            return Buffer.from("")
          })
        }
      }
    } else {
      // 非zhimg文件直接下载
      imgContent = await http.downloadImg(src).catch((e) => {
        return new Buffer('')
      })
    }

    if (imgContent.length === 0) {
      this.log(`[第${index}张图片]-1-4-下载失败, 图片内容为空, 原url=>${src}`)
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

  async asyncGenerateEpub() {
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
        pathname = pathname.slice(pathname.length - 50)
      }
      filename = CommonUtil.encodeFilename(`${srcMd5}_${pathname}`)
    } catch (e) {
      // 非url, 不需要进行处理, 返回空即可
      logger.warn(`[警告]传入值src:${src}不是合法url, 将返回空filename`)
    }
    return filename
  }
}

export default EpubGenerator
