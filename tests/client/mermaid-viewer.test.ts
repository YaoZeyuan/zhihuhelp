import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enhanceMermaidDiagram } from '../../doc/.vitepress/theme/mermaid'

const originalFullscreenElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement')
const originalFullscreenEnabled = Object.getOwnPropertyDescriptor(document, 'fullscreenEnabled')
const originalExitFullscreen = Object.getOwnPropertyDescriptor(document, 'exitFullscreen')
const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')

function createDiagram(): HTMLElement {
  const element = document.createElement('div')
  element.className = 'mermaid-diagram'
  element.innerHTML = '<svg viewBox="0 0 100 50"><text>示例流程图</text></svg>'
  document.body.append(element)
  return element
}

function restoreDocumentProperty(name: string, descriptor?: PropertyDescriptor): void {
  if (descriptor) {
    Object.defineProperty(document, name, descriptor)
  } else {
    Reflect.deleteProperty(document, name)
  }
}

describe('Mermaid 图表查看器', () => {
  beforeEach(() => {
    document.body.replaceChildren()
    let objectUrlSequence = 0
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:mermaid-test-${objectUrlSequence++}`),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  })

  afterEach(() => {
    restoreDocumentProperty('fullscreenElement', originalFullscreenElement)
    restoreDocumentProperty('fullscreenEnabled', originalFullscreenEnabled)
    restoreDocumentProperty('exitFullscreen', originalExitFullscreen)
    if (originalCreateObjectUrl) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl)
    else Reflect.deleteProperty(URL, 'createObjectURL')
    if (originalRevokeObjectUrl) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl)
    else Reflect.deleteProperty(URL, 'revokeObjectURL')
    vi.restoreAllMocks()
  })

  it('无 Fullscreen API 时提供明确的新标签页 SVG 后备操作', () => {
    const element = createDiagram()
    enhanceMermaidDiagram(element)

    const fullscreenButton = element.querySelector<HTMLButtonElement>('.mermaid-viewer-primary')
    const newTabLink = element.querySelector<HTMLAnchorElement>('.mermaid-viewer-link')
    expect(fullscreenButton).not.toBeVisible()
    expect(newTabLink).toHaveAccessibleName('在新标签页打开此流程图 SVG')
    expect(newTabLink?.target).toBe('_blank')
    expect(newTabLink?.rel).toBe('noopener noreferrer')
    expect(newTabLink?.href).toBe('blob:mermaid-test-0')
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type: 'image/svg+xml;charset=utf-8' }))
  })

  it('进入全屏、显示关闭按钮并在关闭后恢复焦点', async () => {
    let fullscreenElement: Element | null = null
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    })

    const exitFullscreen = vi.fn(async () => {
      fullscreenElement = null
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })

    const element = createDiagram()
    const requestFullscreen = vi.fn(async () => {
      fullscreenElement = element
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    Object.defineProperty(element, 'requestFullscreen', { configurable: true, value: requestFullscreen })
    enhanceMermaidDiagram(element)

    const primaryButton = element.querySelector<HTMLButtonElement>('.mermaid-viewer-primary')
    const closeButton = element.querySelector<HTMLButtonElement>('.mermaid-viewer-close')
    primaryButton?.click()
    await Promise.resolve()

    expect(requestFullscreen).toHaveBeenCalledOnce()
    expect(primaryButton).not.toBeVisible()
    expect(closeButton).toBeVisible()
    expect(closeButton).toHaveFocus()
    expect(closeButton).toHaveAttribute('title', '关闭全屏（Esc）')

    closeButton?.click()
    await Promise.resolve()

    expect(exitFullscreen).toHaveBeenCalledOnce()
    expect(primaryButton).toBeVisible()
    expect(closeButton).not.toBeVisible()
    expect(primaryButton).toHaveFocus()
  })

  it('全屏被拒绝时切换为新标签页 SVG 操作', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })

    const element = createDiagram()
    Object.defineProperty(element, 'requestFullscreen', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error('Fullscreen denied')),
    })
    enhanceMermaidDiagram(element)

    const button = element.querySelector<HTMLButtonElement>('.mermaid-viewer-primary')
    const newTabLink = element.querySelector<HTMLAnchorElement>('.mermaid-viewer-link')
    const status = element.querySelector<HTMLElement>('.mermaid-viewer-status')
    button?.click()
    await Promise.resolve()
    await Promise.resolve()

    expect(button).not.toBeVisible()
    expect(status).toHaveTextContent('浏览器未允许全屏')
    expect(status).toBeVisible()
    expect(newTabLink).toHaveFocus()
    expect(element.dataset.mermaidViewerMode).toBe('new-tab')
  })

  it('图表重绘时撤销之前的 SVG 对象 URL', () => {
    const element = createDiagram()
    enhanceMermaidDiagram(element)
    element.innerHTML = '<svg viewBox="0 0 100 50"><text>重绘后的流程图</text></svg>'

    enhanceMermaidDiagram(element)

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mermaid-test-0')
    expect(element.querySelector<HTMLAnchorElement>('.mermaid-viewer-link')?.href).toBe('blob:mermaid-test-1')
  })
})
