<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DocMetaChips from './components/DocMetaChips.vue'

const { page } = useData()

const sectionClass = computed(() => {
  const relativePath = page.value.relativePath || ''
  const topLevel = relativePath.split('/')[0]
  if (!topLevel || topLevel === 'index.md') return 'section-home'
  return `section-${topLevel.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`
})
</script>

<template>
  <div class="app-shell" :class="sectionClass">
    <DefaultTheme.Layout>
      <template #doc-before>
        <DocMetaChips />
      </template>
    </DefaultTheme.Layout>
  </div>
</template>
