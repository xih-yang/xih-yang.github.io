import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import DdkkScraperWorkbench from './components/DdkkScraperWorkbench.vue'
import DdkkMenuScraperWorkbench from './components/DdkkMenuScraperWorkbench.vue'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DdkkScraperWorkbench', DdkkScraperWorkbench)
    app.component('DdkkMenuScraperWorkbench', DdkkMenuScraperWorkbench)
  }
}

export default theme
