---
title: 代码规范与提交流程
category: 知识点
tags:
  - 前端
  - ESLint
  - Prettier
  - Git
---

# 代码规范与提交流程

规范体系的目标不是“管人”，而是把低价值争论和低级错误尽量前置。

## 核心范围

- ESLint：语法规则、最佳实践、团队规则集
- Prettier：统一格式化边界
- Stylelint：样式代码规范
- Git 提交规范：Conventional Commits、分支策略、代码评审流程
- 常见配套：lint-staged、Husky、commitlint

## 实战关注点

- 规范要服务协作效率，而不是制造额外负担
- 自动化检查尽量前置到提交前和 CI 中
- 评审关注点要从“格式”转向“设计和风险”

## 常见问题

- ESLint 和 Prettier 职责重叠，规则互相打架
- 规范很多，但没有落进提交流程和 CI
- 代码评审只看风格，不看行为变化和风险
