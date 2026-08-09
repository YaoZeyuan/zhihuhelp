let renderSequence = 0
let viewerSequence = 0
let renderQueue = Promise.resolve()
let fullscreenListenersInstalled = false
let lastFullscreenDiagram: HTMLElement | undefined
const viewerObjectUrls = new Map<HTMLElement, string>()

type FullscreenCapableElement = HTMLElement & {
  requestFullscreen: () => Promise<void>
}

function getDiagramSvg(element: HTMLElement): SVGSVGElement | null {
  return element.querySelector<SVGSVGElement>(':scope > svg')
}

function serializeStandaloneSvg(element: HTMLElement, svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('role', 'img')

  let title = clone.querySelector<SVGTitleElement>(':scope > title')
  if (!title) {
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
    title.textContent = '知乎助手文档流程图'
    clone.prepend(title)
  }

  title = clone.querySelector<SVGTitleElement>(':scope > title')
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  background.setAttribute('width', '100%')
  background.setAttribute('height', '100%')
  background.setAttribute('fill', getComputedStyle(element).backgroundColor)
  background.setAttribute('aria-hidden', 'true')
  if (title) title.after(background)
  else clone.prepend(background)

  const serialized = new XMLSerializer().serializeToString(clone)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`
}

function revokeViewerObjectUrl(element: HTMLElement): void {
  const objectUrl = viewerObjectUrls.get(element)
  if (!objectUrl) return

  URL.revokeObjectURL(objectUrl)
  viewerObjectUrls.delete(element)
}

function createStandaloneSvgUrl(element: HTMLElement, svg: SVGSVGElement): string {
  revokeViewerObjectUrl(element)

  const objectUrl = URL.createObjectURL(
    new Blob([serializeStandaloneSvg(element, svg)], { type: 'image/svg+xml;charset=utf-8' }),
  )
  viewerObjectUrls.set(element, objectUrl)
  return objectUrl
}

function cleanupDetachedViewerObjectUrls(): void {
  viewerObjectUrls.forEach((_objectUrl, element) => {
    if (!element.isConnected) revokeViewerObjectUrl(element)
  })
}

function canRequestFullscreen(element: HTMLElement): element is FullscreenCapableElement {
  return typeof element.requestFullscreen === 'function' && document.fullscreenEnabled !== false
}

function exitDiagramFullscreen(): void {
  if (!document.fullscreenElement || typeof document.exitFullscreen !== 'function') return

  try {
    void document.exitFullscreen().catch(() => undefined)
  } catch {
    // The browser still provides its native Esc escape hatch if an exit request fails.
  }
}

function syncFullscreenControls(): void {
  const fullscreenElement = document.fullscreenElement

  document.querySelectorAll<HTMLElement>('[data-mermaid-viewer="ready"]').forEach((element) => {
    const isFullscreen = fullscreenElement === element
    const primaryButton = element.querySelector<HTMLButtonElement>('.mermaid-viewer-primary')
    const closeButton = element.querySelector<HTMLButtonElement>('.mermaid-viewer-close')

    if (primaryButton) primaryButton.hidden = isFullscreen || element.dataset.mermaidViewerMode !== 'fullscreen'
    if (closeButton) closeButton.hidden = !isFullscreen

    if (isFullscreen && closeButton && document.activeElement !== closeButton) closeButton.focus()
  })

  if (!fullscreenElement && lastFullscreenDiagram) {
    const diagram = lastFullscreenDiagram
    lastFullscreenDiagram = undefined
    if (diagram.isConnected) diagram.querySelector<HTMLButtonElement>('.mermaid-viewer-primary')?.focus()
  }
}

function ensureFullscreenListeners(): void {
  if (fullscreenListenersInstalled) return
  fullscreenListenersInstalled = true

  document.addEventListener('fullscreenchange', syncFullscreenControls)
  window.addEventListener('pagehide', () => {
    viewerObjectUrls.forEach((_objectUrl, element) => revokeViewerObjectUrl(element))
  })
}

function useNewTabFallback(
  element: HTMLElement,
  primaryButton: HTMLButtonElement,
  status: HTMLElement,
  newTabLink: HTMLAnchorElement,
): void {
  element.dataset.mermaidViewerMode = 'new-tab'
  primaryButton.hidden = true
  status.hidden = false
  status.textContent = '浏览器未允许全屏，请使用“新标签打开 SVG”。'
  newTabLink.classList.add('is-fallback')
  newTabLink.focus()
}

/** Add accessible viewing controls to one rendered Mermaid diagram. */
export function enhanceMermaidDiagram(element: HTMLElement): void {
  const svg = getDiagramSvg(element)
  if (!svg) return

  const existingToolbar = element.querySelector<HTMLElement>(':scope > .mermaid-viewer-toolbar')
  if (existingToolbar) {
    syncFullscreenControls()
    return
  }

  ensureFullscreenListeners()
  revokeViewerObjectUrl(element)

  const statusId = `mermaid-viewer-status-${viewerSequence++}`
  const toolbar = document.createElement('div')
  toolbar.className = 'mermaid-viewer-toolbar'
  toolbar.setAttribute('role', 'group')
  toolbar.setAttribute('aria-label', '流程图查看操作')

  const primaryButton = document.createElement('button')
  primaryButton.type = 'button'
  primaryButton.className = 'mermaid-viewer-button mermaid-viewer-primary'
  primaryButton.setAttribute('aria-describedby', statusId)

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'mermaid-viewer-button mermaid-viewer-close'
  closeButton.textContent = '关闭全屏'
  closeButton.setAttribute('aria-label', '关闭流程图全屏视图')
  closeButton.title = '关闭全屏（Esc）'
  closeButton.hidden = true
  closeButton.addEventListener('click', exitDiagramFullscreen)

  const status = document.createElement('span')
  status.id = statusId
  status.className = 'mermaid-viewer-status'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.hidden = true

  const newTabLink = document.createElement('a')
  newTabLink.className = 'mermaid-viewer-button mermaid-viewer-link'
  newTabLink.textContent = '新标签打开 SVG'
  newTabLink.setAttribute('aria-label', '在新标签页打开此流程图 SVG')
  newTabLink.title = '在新标签页打开独立 SVG'
  newTabLink.href = createStandaloneSvgUrl(element, svg)
  newTabLink.target = '_blank'
  newTabLink.rel = 'noopener noreferrer'

  if (canRequestFullscreen(element)) {
    element.dataset.mermaidViewerMode = 'fullscreen'
    primaryButton.textContent = '全屏查看'
    primaryButton.setAttribute('aria-label', '全屏查看此流程图')
    primaryButton.title = '全屏查看流程图'
  } else {
    element.dataset.mermaidViewerMode = 'new-tab'
    primaryButton.hidden = true
  }

  primaryButton.addEventListener('click', () => {
    if (!canRequestFullscreen(element) || element.dataset.mermaidViewerMode !== 'fullscreen') return

    lastFullscreenDiagram = element
    void element.requestFullscreen().catch(() => {
      if (lastFullscreenDiagram === element) lastFullscreenDiagram = undefined
      if (!element.isConnected) {
        revokeViewerObjectUrl(element)
        return
      }
      useNewTabFallback(element, primaryButton, status, newTabLink)
    })
  })

  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', '流程图')
  element.dataset.mermaidViewer = 'ready'
  element.setAttribute('role', 'group')
  element.setAttribute('aria-label', '流程图及查看操作')
  toolbar.append(status, primaryButton, closeButton, newTabLink)
  element.prepend(toolbar)
  syncFullscreenControls()
}

function showError(element: HTMLElement, source: string): void {
  if (document.fullscreenElement === element) exitDiagramFullscreen()
  revokeViewerObjectUrl(element)
  element.dataset.mermaidState = 'error'
  delete element.dataset.mermaidViewer
  delete element.dataset.mermaidViewerMode
  element.removeAttribute('role')
  element.removeAttribute('aria-label')
  element.replaceChildren()

  const message = document.createElement('p')
  message.className = 'mermaid-error'
  message.textContent = '流程图暂时无法渲染，下面保留原始定义：'

  const pre = document.createElement('pre')
  pre.className = 'mermaid-fallback'
  const code = document.createElement('code')
  code.textContent = source
  pre.append(code)
  element.append(message, pre)
}

async function renderMermaidDiagrams(): Promise<void> {
  cleanupDetachedViewerObjectUrls()
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-mermaid-source]'))
  if (elements.length === 0) return

  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'default'
  const { default: mermaid } = await import('mermaid')

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    flowchart: { htmlLabels: false },
  })

  for (const element of elements) {
    if (!element.isConnected) {
      revokeViewerObjectUrl(element)
      continue
    }
    if (element.dataset.mermaidState === 'rendered' && element.dataset.mermaidTheme === theme) continue

    const encodedSource = element.dataset.mermaidSource
    if (!encodedSource) continue

    let source: string
    try {
      source = decodeURIComponent(encodedSource)
    } catch {
      showError(element, '无法读取流程图定义。')
      continue
    }

    try {
      const id = `zhihuhelp-mermaid-${Date.now()}-${renderSequence++}`
      const { svg, bindFunctions } = await mermaid.render(id, source)
      if (!element.isConnected) {
        revokeViewerObjectUrl(element)
        continue
      }
      revokeViewerObjectUrl(element)
      element.innerHTML = svg
      element.dataset.mermaidState = 'rendered'
      element.dataset.mermaidTheme = theme
      bindFunctions?.(element)
      enhanceMermaidDiagram(element)
    } catch (error) {
      console.error('[docs] Mermaid render failed', error)
      if (element.isConnected) showError(element, source)
      else revokeViewerObjectUrl(element)
    }
  }
}

export function scheduleMermaidRender(): void {
  if (typeof document === 'undefined') return

  renderQueue = renderQueue
    .catch(() => undefined)
    .then(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
    .then(renderMermaidDiagrams)
}
