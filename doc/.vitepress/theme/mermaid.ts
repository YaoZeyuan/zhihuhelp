let renderSequence = 0
let renderQueue = Promise.resolve()

function showError(element: HTMLElement, source: string): void {
  element.dataset.mermaidState = 'error'
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
      element.innerHTML = svg
      element.dataset.mermaidState = 'rendered'
      element.dataset.mermaidTheme = theme
      element.setAttribute('role', 'img')
      element.setAttribute('aria-label', '流程图')
      bindFunctions?.(element)
    } catch (error) {
      console.error('[docs] Mermaid render failed', error)
      showError(element, source)
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
