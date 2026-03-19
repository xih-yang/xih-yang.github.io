---
title: JavaScript 可选链与空值合并
category: 每日技巧
tags:
  - JavaScript
  - 前端
  - 技巧
---

# JavaScript 可选链与空值合并

## 适用场景

接口返回层级较深，或者某些字段可能不存在时，传统写法容易堆很多判空逻辑。

## 推荐写法

```js
const name = user?.profile?.name ?? '匿名用户'
const city = order?.address?.city ?? '未知城市'
```

## 为什么更好

- 可读性更高
- 判空路径更短
- 给默认值时可以直接接 `??`

## 注意点

- `?.` 遇到 `null` 或 `undefined` 才会短路
- `??` 只在左侧是 `null` 或 `undefined` 时才使用默认值
- 如果你想把空字符串也当成“无值”，那要用别的判断方式

## 延伸

- 深层对象读取时，推荐和数据建模一起考虑
- 如果某个字段理论上必有值，更适合从源头修正类型或接口约束
