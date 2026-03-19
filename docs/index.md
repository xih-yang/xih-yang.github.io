---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "随笔"
  text: "逻辑之外，随笔之内"
  tagline: 用更有设计感的方式整理知识体系、题库、技巧沉淀与开发灵感
  image:
    src: /icons/hero-scene.svg
    alt: 作品集风格主视觉插画
  actions:
    - theme: brand
      text: 每日技巧
      link: /daily
    - theme: alt
      text: 知识点
      link: /knowledge
    - theme: alt
      text: 刷题
      link: /leetcode
    - theme: alt
      text: 面试
      link: /interview

features:
  - title: 每日技巧
    details: 适合快速回查的短知识卡片，覆盖前端、工具、工作流和后端小技巧。
  - title: 知识点
    details: 从前端基础到架构与 AI 的系统化知识地图，适合按模块深入学习。
  - title: 面试与刷题
    details: 面试题库、回答框架和按题型整理的刷题记录，适合集中复习。
---

<div class="home-portfolio-panel">
  <div class="home-portfolio-copy">
    <span class="home-portfolio-kicker">Curated Knowledge Workspace</span>
    <h2>不是简单的文档首页，而是一个带作品感的知识入口。</h2>
    <p>把知识体系、刷题记录、面试表达和日常技巧整理成统一的视觉与结构语言，既方便回看，也更适合长期迭代。</p>
    <div class="home-portfolio-metrics">
      <div class="home-portfolio-metric">
        <strong>4</strong>
        <span>主内容分区</span>
      </div>
      <div class="home-portfolio-metric">
        <strong>9+</strong>
        <span>前端知识模块</span>
      </div>
      <div class="home-portfolio-metric">
        <strong>持续</strong>
        <span>更新中的题库与技巧</span>
      </div>
    </div>
  </div>
  <div class="home-portfolio-stage">
    <div class="home-stage-card home-stage-card-primary">
      <img src="/icons/studio-logo.svg" alt="站点 Logo" />
      <strong>Notebook Studio</strong>
      <span>知识整理、答题训练、表达沉淀</span>
    </div>
    <div class="home-stage-card home-stage-card-floating">
      <img src="/icons/knowledge-3d.svg" alt="知识点图标" />
      <div>
        <strong>Knowledge Map</strong>
        <span>系统结构优先</span>
      </div>
    </div>
    <div class="home-stage-card home-stage-card-floating home-stage-card-secondary">
      <img src="/icons/interview-3d.svg" alt="面试图标" />
      <div>
        <strong>Interview Notes</strong>
        <span>回答框架与项目表达</span>
      </div>
    </div>
    <div class="home-stage-orb home-stage-orb-primary"></div>
    <div class="home-stage-orb home-stage-orb-secondary"></div>
  </div>
</div>

<div class="section-banner">
  <span class="section-banner-kicker">Notebook Hub</span>
  <strong>把零散经验整理成可回看的知识入口</strong>
  <p>首页现在聚合了每日技巧、知识点、面试和刷题四条主线，适合按目标快速进入。</p>
  <img class="section-banner-logo" src="/icons/studio-logo.svg" alt="站点 Logo" />
  <div class="section-banner-icon-cluster">
    <img class="section-banner-icon" src="/icons/daily-3d.svg" alt="每日技巧图标" />
    <img class="section-banner-icon" src="/icons/knowledge-3d.svg" alt="知识点图标" />
    <img class="section-banner-icon" src="/icons/interview-3d.svg" alt="面试图标" />
    <img class="section-banner-icon" src="/icons/leetcode-3d.svg" alt="刷题图标" />
  </div>
</div>

## 快速导航

<div class="home-tag-grid">
  <a class="home-tag-card" href="/daily/">
    <img class="home-card-icon" src="/icons/daily-3d.svg" alt="每日技巧图标" />
    <span class="home-card-badge">Daily</span>
    <strong>每日技巧</strong>
    <span>短平快的开发经验卡片，适合碎片化积累和回查。</span>
  </a>
  <a class="home-tag-card" href="/knowledge/">
    <img class="home-card-icon" src="/icons/knowledge-3d.svg" alt="知识点图标" />
    <span class="home-card-badge">Knowledge</span>
    <strong>知识点</strong>
    <span>系统化知识地图，目前以前端体系为主，持续补充中。</span>
  </a>
  <a class="home-tag-card" href="/interview/">
    <img class="home-card-icon" src="/icons/interview-3d.svg" alt="面试图标" />
    <span class="home-card-badge">Interview</span>
    <strong>面试</strong>
    <span>按专题整理题库、回答要点、追问点和项目表达模板。</span>
  </a>
  <a class="home-tag-card" href="/leetcode/">
    <img class="home-card-icon" src="/icons/leetcode-3d.svg" alt="刷题图标" />
    <span class="home-card-badge">Problems</span>
    <strong>刷题</strong>
    <span>按题型沉淀题解和解题思路，方便横向复习。</span>
  </a>
</div>

## 最近更新

<div class="home-tag-grid">
  <a class="home-tag-card" href="/daily/archive/2026-03">
    <strong>每日技巧归档</strong>
    <span>已经有按月份回看的入口，适合做阶段性复盘和知识沉淀。</span>
  </a>
  <a class="home-tag-card" href="/interview/frontend/javascript">
    <strong>JavaScript 面试题库</strong>
    <span>包含问题、回答要点和追问点，适合做口头复述练习。</span>
  </a>
  <a class="home-tag-card" href="/knowledge/frontend/08-deployment-architecture-ai/ai-frontend">
    <strong>AI 前端专题</strong>
    <span>从流式输出到 RAG 应用，已经形成专题化知识页面。</span>
  </a>
</div>

## 热门入口

<div class="home-tag-row">
  <a class="home-tag-pill" href="/knowledge/frontend/">前端知识体系 <em>总览</em></a>
  <a class="home-tag-pill" href="/interview/behavioral/project-storytelling">项目介绍模板 <em>面试</em></a>
  <a class="home-tag-pill" href="/daily/tools/">工具技巧 <em>效率</em></a>
  <a class="home-tag-pill" href="/leetcode/array/">数组题型 <em>刷题</em></a>
  <a class="home-tag-pill" href="/daily/archive/">月份归档 <em>沉淀</em></a>
</div>

## 按标签浏览

<div class="home-tag-grid">
  <a class="home-tag-card" href="/tags/topics/vue3">
    <strong>Vue3</strong>
    <span>组合式 API、组件设计、状态管理和 Vue 生态相关内容。</span>
  </a>
  <a class="home-tag-card" href="/tags/topics/react">
    <strong>React</strong>
    <span>从基础概念到 Hooks、路由和状态管理，逐步补齐 React 笔记。</span>
  </a>
  <a class="home-tag-card" href="/tags/topics/vite">
    <strong>Vite</strong>
    <span>围绕工程化、构建速度和现代前端开发体验整理实践记录。</span>
  </a>
  <a class="home-tag-card" href="/tags/topics/java">
    <strong>Java</strong>
    <span>Java 基础、后端实践和服务端工程经验的持续积累。</span>
  </a>
  <a class="home-tag-card" href="/tags/topics/springboot3">
    <strong>SpringBoot3</strong>
    <span>面向现代 Java 服务开发的配置、规范与项目经验。</span>
  </a>
  <a class="home-tag-card" href="/tags/topics/leetcode">
    <strong>LeetCode</strong>
    <span>题解、题单和按题型整理的刷题路线。</span>
  </a>
</div>

## 常用筛选

<div class="home-tag-row">
  <a class="home-tag-pill" href="/tags/topics/array">数组 <em>题型</em></a>
  <a class="home-tag-pill" href="/tags/topics/prototype">原型 <em>题型</em></a>
  <a class="home-tag-pill" href="/tags/topics/easy">简单 <em>难度</em></a>
  <a class="home-tag-pill" href="/tags/topics/medium">中等 <em>难度</em></a>
  <a class="home-tag-pill" href="/tags/topics/javascript">JavaScript <em>语言</em></a>
  <a class="home-tag-pill" href="/tags/">查看全部标签 <em>总览</em></a>
</div>
