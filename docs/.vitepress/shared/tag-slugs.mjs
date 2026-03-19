export const tagSlugMap = {
  前端: 'frontend',
  后端: 'backend',
  刷题: 'leetcode-practice',
  面试: 'interview',
  知识点: 'knowledge',
  工具: 'tools',
  导航: 'navigation',
  简单: 'easy',
  中等: 'medium',
  困难: 'hard',
  数组: 'array',
  链表: 'linked-list',
  字符串: 'string',
  哈希表: 'hash-table',
  动态规划: 'dynamic-programming',
  树: 'tree',
  图: 'graph',
  双指针: 'two-pointers',
  滑动窗口: 'sliding-window',
  回溯: 'backtracking',
  二分: 'binary-search',
  贪心: 'greedy',
  原型: 'prototype',
  模拟: 'simulation',
  分组: 'grouping',
  教程: 'tutorial',
  题解: 'problem-solution',
  复盘: 'review',
  实战: 'practice',
  笔记: 'notes',
  题单: 'problem-list',
  分类: 'category',
  标签: 'tag',
  工程化: 'engineering',
  基础: 'basics',
  框架: 'framework',
  算法: 'algorithm'
}

export function slugifyTag(value) {
  if (tagSlugMap[value]) return tagSlugMap[value]

  const ascii = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (ascii) return ascii

  return `tag-${Array.from(new TextEncoder().encode(value)).map((item) => item.toString(16).padStart(2, '0')).join('')}`
}
