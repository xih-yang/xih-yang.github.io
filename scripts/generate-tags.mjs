import fs from 'node:fs'
import path from 'node:path'
import { slugifyTag } from '../docs/.vitepress/shared/tag-slugs.mjs'

const root = process.cwd()
const docsRoot = path.join(root, 'docs')
const tagsRoot = path.join(docsRoot, 'tags')
const generatedRoot = path.join(tagsRoot, 'topics')

const tagGroups = [
  {
    title: '技术方向',
    tags: ['前端', '后端', '刷题', '面试', '知识点', '工具', '导航']
  },
  {
    title: '前端技术栈',
    tags: ['Vue3', 'React', 'Vite', 'TypeScript', 'JavaScript', 'Pinia', 'Vue Router', 'Redux']
  },
  {
    title: '后端技术栈',
    tags: ['Java', 'SpringBoot3', 'MySQL', 'Redis', 'JVM', '并发']
  },
  {
    title: '刷题难度',
    tags: ['简单', '中等', '困难']
  },
  {
    title: '刷题题型',
    tags: ['数组', '链表', '字符串', '哈希表', '动态规划', '树', '图', '双指针', '滑动窗口', '回溯', '二分', '贪心', '原型', '模拟', 'reduce', 'filter', 'map', '分组']
  },
  {
    title: '文章类型',
    tags: ['教程', '题解', '复盘', '实战', '笔记', '题单', '分类']
  }
]

const markdownFiles = listMarkdownFiles(docsRoot)
  .filter((file) => !file.startsWith('tags/topics/'))

const docs = markdownFiles
  .map((relativePath) => parseDoc(relativePath))
  .filter((doc) => doc.tags.length > 0 || doc.category)

const tagMap = buildTagMap(docs)

resetGeneratedDir()
writeTagPages(tagMap)
writeTagsIndex(tagMap)

function listMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.relative(docsRoot, fullPath).replace(/\\/g, '/'))
    }
  }

  return files.sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function parseDoc(relativePath) {
  const fullPath = path.join(docsRoot, relativePath)
  const source = fs.readFileSync(fullPath, 'utf8')
  const stats = fs.statSync(fullPath)
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/)
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : ''

  const title = matchField(frontmatter, 'title') ?? firstHeading(source) ?? prettifyPath(relativePath)
  const category = matchField(frontmatter, 'category') ?? ''
  const tags = matchListField(frontmatter, 'tags')
  const link = toLink(relativePath)
  const updatedAt = formatDateTime(stats.mtime)

  return { title, category, tags, link, relativePath, updatedAt, updatedAtValue: stats.mtimeMs }
}

function buildTagMap(docsList) {
  const map = new Map()

  for (const doc of docsList) {
    const allTags = [...doc.tags]
    if (doc.category) {
      allTags.push(doc.category)
    }

    for (const tag of allTags) {
      if (!map.has(tag)) {
        map.set(tag, [])
      }

      map.get(tag).push({
        title: doc.title,
        link: doc.link,
        relativePath: doc.relativePath,
        category: doc.category,
        tags: doc.tags,
        updatedAt: doc.updatedAt,
        updatedAtValue: doc.updatedAtValue
      })
    }
  }

  for (const docsForTag of map.values()) {
    docsForTag.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  }

  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN')))
}

function resetGeneratedDir() {
  fs.rmSync(generatedRoot, { recursive: true, force: true })
  fs.mkdirSync(generatedRoot, { recursive: true })
}

function writeTagPages(tagMapInstance) {
  for (const [tag, docsForTag] of tagMapInstance) {
    const slug = slugifyTag(tag)
    const filePath = path.join(generatedRoot, `${slug}.md`)
    const categories = [...new Set(docsForTag.map((doc) => doc.category).filter(Boolean))]
    const latest = docsForTag.reduce((current, doc) => {
      return !current || doc.updatedAtValue > current.updatedAtValue ? doc : current
    }, null)
    const lines = [
      '---',
      `title: 标签：${tag}`,
      'category: 标签',
      'tags:',
      '  - 标签',
      `  - ${tag}`,
      '---',
      '',
      `# 标签：${tag}`,
      '',
      `当前共有 **${docsForTag.length}** 篇内容使用了这个标签。`,
      '',
      '<div class="tag-summary-grid">',
      `<div class="tag-summary-card"><strong>内容数量</strong><span>${docsForTag.length} 篇</span></div>`,
      `<div class="tag-summary-card"><strong>涉及分类</strong><span>${categories.length > 0 ? categories.join(' / ') : '暂未归类'}</span></div>`,
      `<div class="tag-summary-card"><strong>最近更新</strong><span>${latest ? latest.updatedAt : '暂无时间记录'}</span></div>`,
      '</div>',
      '',
      '## 相关文章',
      '',
      '<div class="related-card-grid">'
    ]

    for (const doc of docsForTag) {
      const extras = [doc.category, ...doc.tags.filter((item) => item !== tag)].filter(Boolean)
      const meta = extras.length > 0 ? extras.join(' / ') : '查看这篇内容的详情与标签'
      lines.push(`<a class="related-card" href="${doc.link}"><strong>${doc.title}</strong><span>${meta}</span><em>更新于 ${doc.updatedAt}</em></a>`)
    }

    lines.push('</div>', '', '## 原始路径', '')
    for (const doc of docsForTag) {
      lines.push(`- \`${doc.relativePath}\``)
    }
    lines.push('')

    fs.writeFileSync(filePath, lines.join('\n'))
  }
}

function writeTagsIndex(tagMapInstance) {
  const latestDoc = [...tagMapInstance.values()]
    .flat()
    .reduce((current, doc) => {
      return !current || doc.updatedAtValue > current.updatedAtValue ? doc : current
    }, null)

  const lines = [
    '---',
    'title: 标签分类',
    'category: 导航',
    'tags:',
    '  - 标签',
    '  - 分类',
    '  - 导航',
    '---',
    '',
    '# 标签分类',
    '',
    '这里不只是标签说明，而是全站内容的标签导航页。后面新增文章或题解后，重新构建就会自动刷新这里的聚合结果。',
    '',
    '## 使用方式',
    '',
    '推荐在文章 frontmatter 里统一写：',
    '',
    '```yaml',
    '---',
    'title: 文章标题',
    'category: 刷题',
    'tags:',
    '  - LeetCode',
    '  - JavaScript',
    '  - 数组',
    '  - 简单',
    '---',
    '```',
    '',
    '## 标签总览',
    '',
    `当前共收录 **${tagMapInstance.size}** 个标签。`,
    '',
    '<div class="tag-summary-grid">',
    `<div class="tag-summary-card"><strong>标签总数</strong><span>${tagMapInstance.size} 个</span></div>`,
    `<div class="tag-summary-card"><strong>聚合页</strong><span>${[...tagMapInstance.keys()].length} 个主题页已生成</span></div>`,
    `<div class="tag-summary-card"><strong>最近内容更新</strong><span>${latestDoc ? latestDoc.updatedAt : '暂无时间记录'}</span></div>`,
    '</div>',
    ''
  ]

  const groupedTags = new Set()
  for (const group of tagGroups) {
    const available = group.tags.filter((tag) => tagMapInstance.has(tag))
    if (available.length === 0) continue

    lines.push(`### ${group.title}`, '')
    lines.push('<div class="tag-card-grid">')
    for (const tag of available) {
      groupedTags.add(tag)
      const slug = slugifyTag(tag)
      const docsForTag = tagMapInstance.get(tag)
      const count = docsForTag.length
      const categoryCount = new Set(docsForTag.map((doc) => doc.category).filter(Boolean)).size
      const latest = docsForTag.reduce((current, doc) => {
        return !current || doc.updatedAtValue > current.updatedAtValue ? doc : current
      }, null)
      lines.push(`<a class="tag-card" href="./topics/${slug}.md"><strong>${tag}</strong><span>当前收录 ${count} 篇相关内容</span><em>${categoryCount} 个分类 · 最近更新 ${latest ? latest.updatedAt : '暂无记录'}</em></a>`)
    }
    lines.push('</div>', '')
  }

  const remaining = [...tagMapInstance.keys()].filter((tag) => !groupedTags.has(tag))
  if (remaining.length > 0) {
    lines.push('### 其他标签', '')
    lines.push('<div class="tag-card-grid">')
    for (const tag of remaining) {
      const slug = slugifyTag(tag)
      const docsForTag = tagMapInstance.get(tag)
      const count = docsForTag.length
      const categoryCount = new Set(docsForTag.map((doc) => doc.category).filter(Boolean)).size
      const latest = docsForTag.reduce((current, doc) => {
        return !current || doc.updatedAtValue > current.updatedAtValue ? doc : current
      }, null)
      lines.push(`<a class="tag-card" href="./topics/${slug}.md"><strong>${tag}</strong><span>当前收录 ${count} 篇相关内容</span><em>${categoryCount} 个分类 · 最近更新 ${latest ? latest.updatedAt : '暂无记录'}</em></a>`)
    }
    lines.push('</div>', '')
  }

  lines.push('## 命名建议', '')
  lines.push('- 技术名词尽量固定，例如统一使用 `Vue3`、`SpringBoot3`。')
  lines.push('- 难度标签统一使用 `简单 / 中等 / 困难`。')
  lines.push('- 刷题内容优先补“题型 + 方法 + 难度”。')
  lines.push('- 一篇文章建议保留 3 到 6 个核心标签。')
  lines.push('')

  fs.writeFileSync(path.join(tagsRoot, 'index.md'), lines.join('\n'))
}

function matchField(frontmatter, key) {
  return frontmatter.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?$`, 'm'))?.[1]?.trim() ?? null
}

function matchListField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\n((?:\\s+-\\s+.+\\n?)*)`, 'm'))
  if (!match) return []

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-\s+/, '').trim())
}

function firstHeading(source) {
  return source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null
}

function toLink(relativePath) {
  const normalized = `/${relativePath.replace(/\\/g, '/')}`
  if (normalized.endsWith('/index.md')) {
    return normalized.slice(0, -'index.md'.length)
  }
  return normalized.replace(/\.md$/, '')
}

function prettifyPath(relativePath) {
  return relativePath
    .replace(/\.md$/, '')
    .split('/')
    .pop()
    .replace(/[-_]/g, ' ')
}

function formatDateTime(value) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
