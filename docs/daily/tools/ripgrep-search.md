---
title: 用 Ripgrep 快速搜代码
category: 每日技巧
tags:
  - rg
  - 工具
  - 效率
---

# 用 Ripgrep 快速搜代码

## 常用命令

```bash
rg "useEffect"
rg --files | rg "vite"
rg -n "TODO|FIXME" src
```

## 为什么好用

- 速度快
- 适合大仓库
- 支持正则和行号输出

## 使用建议

- 搜函数名时优先配合路径范围一起用
- 查配置和脚本时，`rg --files` 往往比手动翻目录更快
