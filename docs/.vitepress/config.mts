import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitepress'

type SidebarItem = {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

const docsRoot = path.resolve(__dirname, '..')
const sectionOrder = ['daily', 'knowledge', 'leetcode', 'interview', 'frontend', 'java', 'tags']
const sectionLabelMap: Record<string, string> = {
  daily: '每日技巧',
  knowledge: '知识点',
  leetcode: '刷题',
  interview: '面试',
  frontend: '前端',
  java: 'JAVA',
  tags: '标签'
}

const nav = buildNav()
const sidebar = buildSidebar()

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: '随笔',
  description: '逻辑之外，随笔之内',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/icons/studio-logo.svg' }]
  ],
  themeConfig: {
    logo: '/icons/studio-logo.svg',
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '深色模式',
    outline: {
      label: '目录',
      level: 'deep'
    },
    nav,
    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xih-yang/xih-yang.github.io' }
    ],
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        forceLocale: true
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

function buildNav() {
  const items = [{ text: '首页', link: '/' }]

  for (const section of getTopLevelSectionDirs()) {
    items.push({
      text: sectionLabelMap[section] ?? formatSegment(section),
      link: `/${section}/`
    })
  }

  return items
}

function buildSidebar() {
  const sidebarConfig: Record<string, SidebarItem[]> = {}

  for (const section of getTopLevelSectionDirs()) {
    const sectionDir = path.join(docsRoot, section)
    const items = buildItemsForDirectory(sectionDir)
    if (items.length > 0) {
      sidebarConfig[`/${section}/`] = [
        {
          text: sectionLabelMap[section] ?? formatSegment(section),
          items
        }
      ]
    }
  }

  sidebarConfig['/'] = [
    {
      text: '示例',
      items: [
        { text: extractTitle(path.join(docsRoot, 'markdown-examples.md'), 'Markdown 示例'), link: '/markdown-examples' },
        { text: extractTitle(path.join(docsRoot, 'api-examples.md'), '运行时 API 示例'), link: '/api-examples' }
      ]
    }
  ]

  return sidebarConfig
}

function getTopLevelSectionDirs() {
  const entries = fs.readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)

  return entries.sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a)
    const bIndex = sectionOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, 'zh-CN')
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

function buildItemsForDirectory(dir: string): SidebarItem[] {
  return buildItemsForDirectoryInternal(dir, true)
}

function buildItemsForDirectoryInternal(dir: string, includeIndexLink: boolean): SidebarItem[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .sort((a, b) => sortEntries(a, b))

  const items: SidebarItem[] = []
  const indexPath = path.join(dir, 'index.md')

  if (includeIndexLink && fs.existsSync(indexPath)) {
    items.push({
      text: extractTitle(indexPath, formatSegment(path.basename(dir))),
      link: toLink(path.relative(docsRoot, indexPath))
    })
  }

  for (const entry of entries) {
    if (entry.name === 'index.md') continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nestedItems = buildItemsForDirectoryInternal(fullPath, false)
      if (nestedItems.length > 0) {
        const directoryIndexPath = path.join(fullPath, 'index.md')
        items.push({
          text: extractDirectoryTitle(fullPath, entry.name),
          link: fs.existsSync(directoryIndexPath)
            ? toLink(path.relative(docsRoot, directoryIndexPath))
            : undefined,
          collapsed: false,
          items: nestedItems
        })
      }
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      items.push({
        text: extractTitle(fullPath, formatSegment(path.basename(entry.name, '.md'))),
        link: toLink(path.relative(docsRoot, fullPath))
      })
    }
  }

  return items
}

function extractDirectoryTitle(dir: string, fallbackSegment: string) {
  const indexPath = path.join(dir, 'index.md')
  if (fs.existsSync(indexPath)) {
    return extractTitle(indexPath, formatSegment(fallbackSegment))
  }
  return formatSegment(fallbackSegment)
}

function extractTitle(filePath: string, fallback: string) {
  if (!fs.existsSync(filePath)) return fallback

  const source = fs.readFileSync(filePath, 'utf8')
  const frontmatterTitle = source.match(/^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/m)?.[1]
  if (frontmatterTitle) return frontmatterTitle.trim()

  const heading = source.match(/^#\s+(.+)$/m)?.[1]
  if (heading) return heading.trim()

  return fallback
}

function toLink(relativePath: string) {
  const normalized = `/${relativePath.replace(/\\/g, '/')}`
  if (normalized.endsWith('/index.md')) {
    return normalized.slice(0, -'index.md'.length)
  }
  return normalized.replace(/\.md$/, '')
}

function formatSegment(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function sortEntries(a: fs.Dirent, b: fs.Dirent) {
  if (a.name === 'index.md') return -1
  if (b.name === 'index.md') return 1

  if (a.isDirectory() !== b.isDirectory()) {
    return a.isDirectory() ? -1 : 1
  }

  return a.name.localeCompare(b.name, 'zh-CN')
}
