const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const repositoryRoot = path.resolve(__dirname, '../..')
const temporaryRoot = path.resolve(repositoryRoot, '.docs-screenshot-tmp')
const relativeTemporaryRoot = path.relative(repositoryRoot, temporaryRoot)

if (relativeTemporaryRoot === '' || relativeTemporaryRoot.startsWith('..') || path.isAbsolute(relativeTemporaryRoot)) {
  throw new Error('截图临时目录必须位于仓库根目录内')
}

const cachePath = path.resolve(temporaryRoot, 'cache')
const outputPath = path.resolve(temporaryRoot, 'output')
const logPath = path.resolve(temporaryRoot, 'log')

function importDistModule(...relativePathSegments) {
  const moduleUrl = pathToFileURL(path.join(repositoryRoot, 'dist', ...relativePathSegments)).href
  return import(moduleUrl)
}

const title = '知乎助手公开示例电子书'
const questionTitle = '如何高效整理公开资料？'
const answerRecord = {
  id: 'docs-preview-answer',
  type: 'answer',
  content: [
    '<h2>从公开内容到离线电子书</h2>',
    '<p>选择需要保存的公开内容，知乎助手会依次完成抓取、入库、排版与输出。</p>',
    '<blockquote>同一次任务可以同时生成 HTML 与 EPUB，方便浏览器阅读和电子书设备使用。</blockquote>',
    '<h3>可复现的文档示例</h3>',
    '<p>本页面由真实输出生成器在隔离目录中创建，不读取 Cookie、配置文件或业务数据库。</p>',
  ].join(''),
  voteup_count: 128,
  comment_count: 8,
  created_time: 1786118400,
  updated_time: 1786204800,
  author: {
    id: 'docs-preview-author',
    url_token: 'docs-preview-author',
    name: '公开示例用户',
    headline: '此资料仅用于产品文档演示',
    avatar_url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  },
  question: {
    id: '100000000',
    title: questionTitle,
    detail: '公开示例问题，不对应真实用户数据。',
    answer_count: 1,
    follower_count: 32,
    created: 1786032000,
    updated_time: 1786204800,
  },
}

async function main() {
  const PathConfig = (await importDistModule('config', 'path.js')).default
  const EpubGenerator = (
    await importDistModule('application', 'workflow', 'generate', 'library', 'epub_generator.js')
  ).default
  const HtmlRender = (
    await importDistModule('application', 'workflow', 'generate', 'library', 'html_render', 'index.js')
  ).default

  fs.rmSync(temporaryRoot, { recursive: true, force: true })
  PathConfig.setCachePath(cachePath)
  PathConfig.setOutputPath(outputPath)
  PathConfig.setLogPath(logPath)

  const generator = new EpubGenerator({ bookname: title, imageQuilty: 'none' })
  const infoPage = HtmlRender.renderInfoPage({
    title,
    desc: '由知乎助手生成的公开示例，包含 HTML 与 EPUB 两种输出格式。',
  })
  const questionPage = HtmlRender.renderQuestion({ title: questionTitle, recordList: [answerRecord] })

  generator.addIndexHtml({
    filename: 'index',
    title,
    html: HtmlRender.renderToString(infoPage.htmlEle),
  })
  generator.addHtml({
    filename: '公开示例回答',
    title: questionTitle,
    html: HtmlRender.renderToString(questionPage.htmlEle),
  })
  generator.generateSinglePageHtml({
    html: HtmlRender.generateSinglePageHtml({
      title,
      eleList: [infoPage.singleEle, questionPage.singleEle],
    }),
  })
  await generator.asyncGenerateEpub(['html', 'epub'])

  const htmlPath = path.resolve(generator.htmlOutputPathUri, '单文件版', `${generator.outputBasename}.html`)
  const epubPath = generator.epubOutputPathUri
  if (!fs.existsSync(htmlPath) || !fs.existsSync(epubPath)) {
    throw new Error('隔离输出未同时生成 HTML 与 EPUB')
  }
  process.stdout.write(
    `${JSON.stringify({
      htmlPath: path.relative(repositoryRoot, htmlPath).replaceAll('\\', '/'),
      epubPath: path.relative(repositoryRoot, epubPath).replaceAll('\\', '/'),
    })}\n`,
  )
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exitCode = 1
})
