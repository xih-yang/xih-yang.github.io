import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "随笔",
  description: "逻辑之外，随笔之内",
  themeConfig: {
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '深色模式',
    outline: {
      label: '目录',
      /**
       * outline 中要显示的标题级别。
       * 单个数字表示只显示该级别的标题。
       * 如果传递的是一个元组，第一个数字是最小级别，第二个数字是最大级别。
       * `'deep'` 与 `[2, 6]` 相同，将显示从 `<h2>` 到 `<h6>` 的所有标题。
       *
       * @default 2
       */
      level: 'deep'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '前端', link: '/frontend/' },
      { text: 'JAVA', link: '/java/' },
      { text: '示例', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: '前端',
        items: [
          { text: '前端首页', link: '/frontend/' },
          { text: '前端技术', link: '/frontend/tech' },
          {
            text: 'Vue',
            collapsed: false,
            items: [
              { text: 'Vue 介绍', link: '/frontend/vue/' },
              { text: 'Vue 基础', link: '/frontend/vue/basics' },
              { text: 'Vue 组件', link: '/frontend/vue/components' },
              { text: 'Vue 路由', link: '/frontend/vue/router' },
              { text: 'Vue 状态管理', link: '/frontend/vue/pinia' }
            ]
          },
          {
            text: 'React',
            collapsed: false,
            items: [
              { text: 'React 介绍', link: '/frontend/react/' },
              { text: 'React 基础', link: '/frontend/react/basics' },
              { text: 'React Hooks', link: '/frontend/react/hooks' },
              { text: 'React 路由', link: '/frontend/react/router' },
              { text: 'React 状态管理', link: '/frontend/react/redux' }
            ]
          }
        ]
      },
      {
        text: 'JAVA',
        items: [
          { text: 'JAVA首页', link: '/java/' },
          { text: 'JAVA技术', link: '/java/tech' }
        ]
      },
      {
        text: '示例',
        items: [
          { text: 'Markdown 示例', link: '/markdown-examples' },
          { text: '运行时 API 示例', link: '/api-examples' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    search: {
      provider: 'local'
    }
  }
})