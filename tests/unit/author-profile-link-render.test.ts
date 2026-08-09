import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AnswerTemplate from '../../src/application/workflow/generate/library/html_render/template/answer'
import ArticleTemplate from '../../src/application/workflow/generate/library/html_render/template/article'
import PinTemplate from '../../src/application/workflow/generate/library/html_render/template/pin'
import GenerateWorkflow from '../../src/application/workflow/generate/customer'
import * as Package from '../../src/application/workflow/generate/resource/library/package'
import * as ConstTaskConfig from '../../src/constant/task_config'
import type * as TypeAnswer from '../../src/type/zhihu/answer'
import type * as TypeArticle from '../../src/type/zhihu/article'
import type * as TypeAuthor from '../../src/type/zhihu/author'
import type * as TypePin from '../../src/type/zhihu/pin'

const stableAuthorId = '7eb8dd6d1e665c9b53832a0d8ab3a4c2'

function createAuthor(urlToken: string) {
  return {
    id: stableAuthorId,
    url_token: urlToken,
    name: '测试作者',
    avatar_url: 'https://example.test/avatar.png',
    headline: '',
  }
}

const renderCases = [
  {
    label: '回答',
    render: (urlToken: string) =>
      renderToStaticMarkup(
        React.createElement(AnswerTemplate, {
          answerRecord: {
            author: createAuthor(urlToken),
            content: '<p>回答正文</p>',
            voteup_count: 1,
            comment_count: 2,
            created_time: 1,
            updated_time: 2,
          } as TypeAnswer.Record,
        }),
      ),
  },
  {
    label: '文章',
    render: (urlToken: string) =>
      renderToStaticMarkup(
        React.createElement(ArticleTemplate, {
          articleRecord: {
            author: createAuthor(urlToken),
            title: '文章标题',
            content: '<p>文章正文</p>',
            voteup_count: 1,
            comment_count: 2,
            created: 1,
            updated: 2,
          } as TypeArticle.Record,
        }),
      ),
  },
  {
    label: '想法',
    render: (urlToken: string) =>
      renderToStaticMarkup(
        React.createElement(PinTemplate, {
          rawPinRecord: {
            author: createAuthor(urlToken),
            excerpt_title: '想法标题',
            content_html: '<p>想法正文</p>',
            like_count: 1,
            comment_count: 2,
            created: 1,
            updated: 2,
          } as TypePin.Record,
        }),
      ),
  },
] as const

describe.each(renderCases)('$label作者主页链接', ({ render }) => {
  it('优先使用规范 url_token 并输出 HTTPS 链接', () => {
    const html = render('Hentioe')

    expect(html).toContain('href="https://www.zhihu.com/people/Hentioe"')
    expect(html).not.toContain(`href="https://www.zhihu.com/people/${stableAuthorId}"`)
    expect(html).not.toContain('href="http://www.zhihu.com/people/')
  })

  it('url_token 缺失时回退稳定 id', () => {
    const html = render('')

    expect(html).toContain(`href="https://www.zhihu.com/people/${stableAuthorId}"`)
  })

  it('对主页标识进行 URL 编码', () => {
    const html = render('Hentioe/中文')

    expect(html).toContain('href="https://www.zhihu.com/people/Hentioe%2F%E4%B8%AD%E6%96%87"')
  })
})

describe('用户电子书标题', () => {
  const createUnit = (urlToken: string) =>
    new Package.Unit_用户({
      type: ConstTaskConfig.Const_Task_Type_用户的所有回答,
      info: createAuthor(urlToken) as TypeAuthor.Record,
      pageList: [],
    })

  it('展示规范 url_token 而不是稳定 id', () => {
    const title = new GenerateWorkflow().generateColumnTitle(createUnit('Hentioe'))

    expect(title).toContain('用户_测试作者(Hentioe)')
    expect(title).not.toContain(stableAuthorId)
  })

  it('url_token 缺失时在标题中回退稳定 id', () => {
    const title = new GenerateWorkflow().generateColumnTitle(createUnit(''))

    expect(title).toContain(`用户_测试作者(${stableAuthorId})`)
  })
})
