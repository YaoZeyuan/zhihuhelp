import { h, onBeforeUnmount, onMounted } from 'vue'
import { onContentUpdated, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { scheduleMermaidRender } from './mermaid'
import './style.css'

const Layout = {
  setup() {
    let observer: MutationObserver | undefined

    onContentUpdated(scheduleMermaidRender)

    onMounted(() => {
      scheduleMermaidRender()
      observer = new MutationObserver(scheduleMermaidRender)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    })

    onBeforeUnmount(() => observer?.disconnect())

    return () => h(DefaultTheme.Layout)
  },
}

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme
