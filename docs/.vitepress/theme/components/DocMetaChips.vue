<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { slugifyTag } from '../../shared/tag-slugs.mjs'

const { frontmatter, page } = useData()

const category = computed(() => {
  const value = frontmatter.value?.category
  return typeof value === 'string' ? value : ''
})

const tags = computed(() => {
  const value = frontmatter.value?.tags
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
})

const showMeta = computed(() => {
  return page.value.relativePath !== 'index.md' && (Boolean(category.value) || tags.value.length > 0)
})
</script>

<template>
  <div v-if="showMeta" class="doc-meta-chips">
    <div v-if="category" class="doc-meta-row">
      <span class="doc-meta-label">分类</span>
      <span class="doc-chip doc-chip-category">{{ category }}</span>
    </div>
    <div v-if="tags.length" class="doc-meta-row">
      <span class="doc-meta-label">标签</span>
      <div class="doc-chip-list">
        <a
          v-for="tag in tags"
          :key="tag"
          class="doc-chip"
          :href="`/tags/topics/${slugifyTag(tag)}`"
        >
          {{ tag }}
        </a>
      </div>
    </div>
  </div>
</template>
