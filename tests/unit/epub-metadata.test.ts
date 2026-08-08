import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import OPF from '../../src/library/epub/opf'
import TOC from '../../src/library/epub/toc'

describe('EPUB XML metadata', () => {
  it('escapes titles and file attributes into valid OPF/TOC XML', () => {
    const opf = new OPF()
    opf.title = 'A & B <测试>'
    opf.addHtml('chapter&1.xhtml')
    const toc = new TOC()
    toc.title = 'A & B <测试>'
    toc.addHtml('章节 & <一>', 'chapter&1.xhtml')

    expect(() => new JSDOM(opf.content, { contentType: 'application/xml' })).not.toThrow()
    expect(() => new JSDOM(toc.content, { contentType: 'application/xml' })).not.toThrow()
    expect(opf.content).toContain('A &amp; B &lt;测试&gt;')
    expect(toc.content).toContain('章节 &amp; &lt;一&gt;')
    expect(toc.content).toContain('chapter&amp;1.xhtml')
  })

  it('writes the actual media type for each image extension', () => {
    const opf = new OPF()
    opf.addImage('a.jpg')
    opf.addImage('b.png')
    opf.addImage('c.gif')
    opf.addImage('d.webp')
    opf.addImage('e.svg')

    expect(opf.content).toContain('a.jpg" id="index_1" media-type="image/jpeg"')
    expect(opf.content).toContain('b.png" id="index_2" media-type="image/png"')
    expect(opf.content).toContain('c.gif" id="index_3" media-type="image/gif"')
    expect(opf.content).toContain('d.webp" id="index_4" media-type="image/webp"')
    expect(opf.content).toContain('e.svg" id="index_5" media-type="image/svg+xml"')
  })

  it('registers the cover href only once', () => {
    const opf = new OPF()
    opf.addImage('kanshan.png')
    opf.addCoverImage('cover.jpg')
    expect(opf.manifestItemList.filter((item) => item.includes('image/cover.jpg'))).toHaveLength(1)
  })
})
