import { h, onBeforeUnmount, onMounted } from 'vue'
import { onContentUpdated, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { scheduleMermaidRender } from './mermaid'
import DownloadRelease from './DownloadRelease.vue'
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

    return () => h(DefaultTheme.Layout, null, {
      'home-hero-info-after': () => h(DownloadRelease),
    })
  },
}

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme
