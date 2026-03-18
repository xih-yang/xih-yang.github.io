import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/essays/',
  title: "随笔",
  description: "逻辑之外，随笔之内",
  themeConfig: {
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
          { text: '前端技术', link: '/frontend/tech' }
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
    ]
  }
})
