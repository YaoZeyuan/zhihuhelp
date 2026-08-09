import { defineConfig } from 'vitepress'

const siteUrl = 'https://zhihuhelp.yaozeyuan.online'
const githubUrl = 'https://github.com/YaoZeyuan/zhihuhelp'

function canonicalPath(page: string): string {
  const withoutExtension = page.replace(/\.(?:html|md)$/, '')
  const normalized = withoutExtension.replace(/(^|\/)index$/, '$1')
  return normalized ? `/${normalized}` : '/'
}

export default defineConfig({
  lang: 'zh-CN',
  title: '知乎助手',
  titleTemplate: ':title | 知乎助手',
  description: '将知乎回答、文章、想法、收藏夹等内容保存到本地，并生成 HTML / EPUB 电子书。',
  base: '/',
  cleanUrls: true,
  appearance: true,
  lastUpdated: true,
  srcExclude: ['README.md', 'task/**', '项目文档/**'],
  sitemap: {
    hostname: siteUrl,
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/brand/icon.png' }],
    ['meta', { name: 'theme-color', content: '#1677ff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: '知乎助手' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og.png` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og.png` }],
  ],
  transformHead({ page, title, description }) {
    const url = `${siteUrl}${canonicalPath(page)}`
    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
    ]
  },
  markdown: {
    config(markdown) {
      const defaultFence = markdown.renderer.rules.fence

      markdown.renderer.rules.fence = (tokens, index, options, env, self) => {
        const token = tokens[index]
        if (token.info.trim().split(/\s+/, 1)[0] === 'mermaid') {
          const source = encodeURIComponent(token.content)
          const fallback = markdown.utils.escapeHtml(token.content)
          return `<div class="mermaid-diagram" data-mermaid-source="${source}" data-mermaid-state="source"><pre class="mermaid-fallback"><code>${fallback}</code></pre></div>`
        }

        return defaultFence?.(tokens, index, options, env, self) ?? self.renderToken(tokens, index, options)
      }
    },
  },
  themeConfig: {
    logo: { src: '/brand/icon.png', alt: '知乎助手' },
    siteTitle: '知乎助手',
    nav: [
      { text: '首页', link: '/' },
      { text: '用户指南', link: '/guide/' },
      { text: '开发文档', link: '/dev/' },
      { text: 'GitHub', link: githubUrl },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '用户指南',
          items: [
            { text: '指南首页', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '功能说明', link: '/guide/features' },
            { text: '数据浏览与输出结果', link: '/guide/data-and-output' },
            { text: '常见问题', link: '/guide/faq' },
          ],
        },
      ],
      '/dev/': [
        {
          text: '开发文档',
          items: [
            { text: '文档首页', link: '/dev/' },
            { text: '开发环境与命令', link: '/dev/environment' },
            { text: '架构总览', link: '/dev/architecture' },
            { text: '业务流程', link: '/dev/workflows' },
            { text: '前端 / Electron / 后端分工', link: '/dev/frontend-electron-backend' },
            { text: '数据与日志', link: '/dev/data-and-logging' },
            { text: '测试与 Fixture', link: '/dev/testing-and-fixtures' },
            { text: '维护注意事项', link: '/dev/maintenance' },
          ],
        },
      ],
      '/about/': [
        {
          text: '关于项目',
          items: [
            { text: '项目信息', link: '/about/' },
            { text: '更新日志', link: '/about/changelog' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到相关结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '向上',
              navigateDownKeyAriaLabel: '向下',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc',
            },
          },
        },
      },
    },
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
    editLink: {
      pattern: `${githubUrl}/edit/master/doc/:path`,
      text: '在 GitHub 上编辑此页',
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
        forceLocale: true,
      },
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    socialLinks: [{ icon: 'github', link: githubUrl }],
    externalLinkIcon: true,
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    skipToContentLabel: '跳到正文',
    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © Yao Zeyuan 与知乎助手贡献者',
    },
    notFound: {
      title: '页面不存在',
      quote: '这个页面可能已经移动，或从未存在。',
      linkLabel: '返回首页',
      linkText: '返回首页',
    },
  },
})
