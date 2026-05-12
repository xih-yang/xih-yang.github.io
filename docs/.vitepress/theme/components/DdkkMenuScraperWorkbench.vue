<script setup lang="ts">
import { ref } from 'vue'

type QuickTask = {
  index: number
  title: string
  url: string
  outDir: string
  ok: boolean
  exitCode: number
  files?: string[]
}

type QuickScrapeResponse = {
  ok: boolean
  collectionName?: string
  total?: number
  failed?: number
  logs?: string[]
  tasks?: QuickTask[]
  message?: string
}

const apiBase = 'http://127.0.0.1:3456'
const menuName = ref('消息队列合集')
const isRunning = ref(false)
const requestError = ref('')
const result = ref<QuickScrapeResponse | null>(null)

async function submit() {
  isRunning.value = true
  requestError.value = ''
  result.value = null

  try {
    const response = await fetch(`${apiBase}/api/ddkk/quick-scrape-menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        menuName: menuName.value
      })
    })

    const data = (await response.json()) as QuickScrapeResponse
    result.value = data

    if (!response.ok) {
      requestError.value = data.message || '执行失败'
    }
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : '请求失败'
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <section class="ddkk-workbench">
    <div class="ddkk-workbench-shell">
      <div class="ddkk-workbench-panel">
        <div class="ddkk-panel-header">
          <div>
            <span class="ddkk-panel-eyebrow">Menu Scraper</span>
            <h2>菜单栏批量抓取</h2>
          </div>
        </div>

        <div class="ddkk-inline-meta">
          <span class="ddkk-inline-chip">服务地址固定：{{ apiBase }}</span>
          <span class="ddkk-inline-chip">默认参数：limit=200 / 包含阅读指南 / 覆盖已有文件</span>
        </div>

        <form class="ddkk-form" @submit.prevent="submit">
          <label class="ddkk-field">
            <span>菜单栏名称</span>
            <input v-model="menuName" type="text" placeholder="例如：消息队列合集" />
          </label>

          <div class="ddkk-action-row">
            <button class="ddkk-primary-button" type="submit" :disabled="isRunning">
              {{ isRunning ? '批量抓取中...' : '开始批量抓取' }}
            </button>
            <span class="ddkk-run-note">自动搜索首页对应栏目，自动推导目标 URL 与输出目录</span>
          </div>
        </form>
      </div>

      <div class="ddkk-results-panel">
        <div class="ddkk-results-header">
          <div>
            <span class="ddkk-panel-eyebrow">Batch Result</span>
            <h2>执行结果</h2>
          </div>
          <span class="ddkk-badge" :class="{ 'is-ok': result?.ok, 'is-error': requestError || (result && !result.ok) }">
            {{ requestError ? '失败' : result?.ok ? '成功' : '等待执行' }}
          </span>
        </div>

        <p v-if="requestError" class="ddkk-error">{{ requestError }}</p>

        <div class="ddkk-meta-stack" v-if="result">
          <div class="ddkk-meta-item">
            <span>菜单栏</span>
            <strong>{{ result.collectionName || menuName }}</strong>
          </div>
          <div class="ddkk-meta-item">
            <span>任务数 / 失败数</span>
            <strong>{{ result.total ?? '-' }} / {{ result.failed ?? '-' }}</strong>
          </div>
        </div>

        <div class="ddkk-log-card">
          <h3>批量日志</h3>
          <pre>{{ result?.logs?.join('\n') || '执行后这里会显示批量抓取日志。' }}</pre>
        </div>

        <h3 class="ddkk-file-title">任务列表</h3>
        <ul class="ddkk-file-list">
          <li v-for="task in result?.tasks || []" :key="`${task.index}-${task.title}`">
            {{ task.index }}. {{ task.title }} · {{ task.ok ? '成功' : '失败' }}
            <br />
            <span class="ddkk-task-path">{{ task.outDir }}</span>
          </li>
          <li v-if="!(result?.tasks?.length)" class="is-placeholder">执行完成后这里会列出各子项任务与输出目录。</li>
        </ul>
      </div>
    </div>
  </section>
</template>
