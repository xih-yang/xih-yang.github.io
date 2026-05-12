<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

type ScrapeResponse = {
  ok: boolean
  exitCode?: number
  stdout?: string
  stderr?: string
  outDir?: string
  files?: string[]
  message?: string
}

type QuickTask = {
  index: number
  title: string
  url: string
  outDir: string
  ok: boolean
  exitCode: number
  files?: string[]
  stdout?: string
  stderr?: string
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

const form = reactive({
  apiBase: 'http://127.0.0.1:3456',
  url: 'https://ddkk.com/springboot/4-action/index.html',
  outDir: 'tmp/ddkk-springboot-ui',
  limit: 200,
  single: false,
  includeIndex: true,
  overwrite: true
})

const healthText = ref('未检测')
const isChecking = ref(false)
const isRunning = ref(false)
const isQuickRunning = ref(false)
const result = ref<ScrapeResponse | null>(null)
const quickResult = ref<QuickScrapeResponse | null>(null)
const requestError = ref('')

const prettyFiles = computed(() => result.value?.files ?? [])

async function checkHealth() {
  isChecking.value = true
  requestError.value = ''

  try {
    const response = await fetch(`${normalizeBase(form.apiBase)}/api/ddkk/health`)
    const data = await response.json()
    healthText.value = data.ok ? `在线 · ${data.host}:${data.port}` : '离线'
  } catch (error) {
    healthText.value = '无法连接'
    requestError.value = error instanceof Error ? error.message : '健康检查失败'
  } finally {
    isChecking.value = false
  }
}

async function submitScrape() {
  isRunning.value = true
  requestError.value = ''
  result.value = null

  try {
    const response = await fetch(`${normalizeBase(form.apiBase)}/api/ddkk/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: form.url,
        outDir: form.outDir,
        limit: Number(form.limit),
        single: form.single,
        includeIndex: form.includeIndex,
        overwrite: form.overwrite
      })
    })

    const data = (await response.json()) as ScrapeResponse
    result.value = data

    if (!response.ok) {
      requestError.value = data.message || data.stderr || '执行失败'
    }
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : '请求失败'
  } finally {
    isRunning.value = false
  }
}

async function submitQuickMqScrape() {
  isQuickRunning.value = true
  requestError.value = ''
  quickResult.value = null

  try {
    const response = await fetch(`${normalizeBase(form.apiBase)}/api/ddkk/quick-scrape-mq`, {
      method: 'POST'
    })

    const data = (await response.json()) as QuickScrapeResponse
    quickResult.value = data

    if (!response.ok) {
      requestError.value = data.message || '执行失败'
    }
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : '请求失败'
  } finally {
    isQuickRunning.value = false
  }
}

function normalizeBase(value: string) {
  return value.replace(/\/+$/, '')
}
</script>

<template>
  <section class="ddkk-workbench">
    <div class="ddkk-workbench-shell">
      <div class="ddkk-workbench-panel">
        <div class="ddkk-panel-header">
          <div>
            <span class="ddkk-panel-eyebrow">DDKK Scraper</span>
            <h2>抓取工作台</h2>
          </div>
          <button class="ddkk-ghost-button" type="button" :disabled="isChecking" @click="checkHealth">
            {{ isChecking ? '检测中...' : '检测本地服务' }}
          </button>
        </div>

        <div class="ddkk-inline-meta">
          <span class="ddkk-inline-chip">服务：{{ healthText }}</span>
          <span class="ddkk-inline-chip">快捷预设：12、消息队列合集</span>
        </div>

        <div class="ddkk-quick-strip">
          <div class="ddkk-quick-copy">
            <strong>一键扒消息队列合集</strong>
            <span>自动发现 24 个子项，默认 `limit=200`、勾选包含阅读指南和覆盖已有文件。</span>
          </div>
          <button class="ddkk-primary-button" type="button" :disabled="isQuickRunning" @click="submitQuickMqScrape">
            {{ isQuickRunning ? '一键扒执行中...' : '一键扒' }}
          </button>
        </div>

        <form class="ddkk-form" @submit.prevent="submitScrape">
          <label class="ddkk-field">
            <span>服务地址</span>
            <input v-model="form.apiBase" type="text" placeholder="http://127.0.0.1:3456" />
          </label>

          <label class="ddkk-field">
            <span>目标 URL</span>
            <input v-model="form.url" type="url" placeholder="https://ddkk.com/springboot/4-action/index.html" />
          </label>

          <div class="ddkk-grid">
            <label class="ddkk-field">
              <span>输出目录</span>
              <input v-model="form.outDir" type="text" placeholder="tmp/ddkk-springboot-ui" />
            </label>

            <label class="ddkk-field">
              <span>抓取上限</span>
              <input v-model="form.limit" type="number" min="1" step="1" />
            </label>
          </div>

          <div class="ddkk-toggle-row">
            <label class="ddkk-toggle">
              <input v-model="form.single" type="checkbox" />
              <span>单篇模式</span>
            </label>
            <label class="ddkk-toggle">
              <input v-model="form.includeIndex" type="checkbox" />
              <span>包含阅读指南</span>
            </label>
            <label class="ddkk-toggle">
              <input v-model="form.overwrite" type="checkbox" />
              <span>覆盖已有文件</span>
            </label>
          </div>

          <div class="ddkk-action-row">
            <button class="ddkk-primary-button" type="submit" :disabled="isRunning">
              {{ isRunning ? '抓取执行中...' : '开始抓取' }}
            </button>
            <span class="ddkk-run-note">手动模式：可覆盖 URL 和输出目录</span>
          </div>
        </form>
      </div>

      <div class="ddkk-results-panel">
        <div class="ddkk-results-header">
          <div>
            <span class="ddkk-panel-eyebrow">Result</span>
            <h2>执行结果</h2>
          </div>
          <span class="ddkk-badge" :class="{ 'is-ok': result?.ok, 'is-error': requestError || (result && !result.ok) }">
            {{ requestError ? '失败' : result?.ok ? '成功' : '等待执行' }}
          </span>
        </div>

        <p v-if="requestError" class="ddkk-error">{{ requestError }}</p>

        <div class="ddkk-log-card">
          <h3>标准输出</h3>
          <pre>{{ result?.stdout || '执行后这里会显示抓取日志。' }}</pre>
        </div>

        <div class="ddkk-meta-stack">
          <div class="ddkk-meta-item">
            <span>输出目录</span>
            <strong>{{ result?.outDir || form.outDir }}</strong>
          </div>
          <div class="ddkk-meta-item">
            <span>退出码</span>
            <strong>{{ result?.exitCode ?? '-' }}</strong>
          </div>
        </div>

        <div class="ddkk-log-card" v-if="result?.stderr || requestError">
          <h3>错误输出</h3>
          <pre>{{ result?.stderr || requestError }}</pre>
        </div>

        <h3 class="ddkk-file-title">生成文件</h3>
        <ul class="ddkk-file-list">
          <li v-for="file in prettyFiles" :key="file">{{ file }}</li>
          <li v-if="!prettyFiles.length" class="is-placeholder">执行完成后这里会列出 Markdown 文件。</li>
        </ul>

        <template v-if="quickResult">
          <h3 class="ddkk-file-title">一键扒结果</h3>
          <div class="ddkk-meta-stack">
            <div class="ddkk-meta-item">
              <span>合集</span>
              <strong>{{ quickResult.collectionName || '-' }}</strong>
            </div>
            <div class="ddkk-meta-item">
              <span>任务数 / 失败数</span>
              <strong>{{ quickResult.total ?? '-' }} / {{ quickResult.failed ?? '-' }}</strong>
            </div>
          </div>

          <div class="ddkk-log-card" v-if="quickResult.logs?.length">
            <h3>批量日志</h3>
            <pre>{{ quickResult.logs.join('\n') }}</pre>
          </div>

          <ul class="ddkk-file-list">
            <li v-for="task in quickResult.tasks || []" :key="`${task.index}-${task.title}`">
              {{ task.index }}. {{ task.title }} · {{ task.ok ? '成功' : '失败' }}
            </li>
          </ul>
        </template>
      </div>
    </div>
  </section>
</template>
