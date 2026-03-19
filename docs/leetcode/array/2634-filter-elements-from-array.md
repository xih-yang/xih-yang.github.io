---
title: 2634. 过滤数组中的元素
category: 刷题
tags:
  - LeetCode
  - JavaScript
  - 数组
  - filter
  - 简单
---

# 2634. 过滤数组中的元素

- 难度：简单
- 类型：数组 / filter / 模拟

## 题目

给定一个数组 `arr` 和一个过滤函数 `fn`，请返回一个新数组，包含 `arr` 中所有让 `fn(arr[i], i)` 返回真值的元素。

## 示例

```text
输入：arr = [0,10,20,30], fn = function greaterThan10(n) { return n > 10; }
输出：[20,30]
```

## 思路

逐个检查数组元素即可：

1. 遍历每一个元素
2. 调用 `fn(arr[i], i)`
3. 如果结果为真，就把当前元素放进结果数组

这和原生 `filter` 的行为是一致的。

## 代码

```javascript
var filter = function(arr, fn) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    if (fn(arr[i], i)) {
      result.push(arr[i]);
    }
  }

  return result;
};
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 易错点

- `fn` 的第二个参数是下标，不要漏传。
- 返回的是新数组，不要直接修改原数组。
