---
title: 2635. 数组元素转换
category: 刷题
tags:
  - LeetCode
  - JavaScript
  - 数组
  - map
  - 简单
---

# 2635. 数组元素转换

- 难度：简单
- 类型：数组 / map / 遍历

## 题目

给定一个整数数组 `arr` 和一个映射函数 `fn`，返回一个新数组 `returnedArray`，其中 `returnedArray[i] = fn(arr[i], i)`。

## 示例

```text
输入：arr = [1,2,3], fn = function plusone(n) { return n + 1; }
输出：[2,3,4]
```

## 思路

这道题对应的是手写 `map`。

做法很直接：

1. 创建结果数组
2. 依次遍历原数组
3. 将 `fn(arr[i], i)` 的结果放入新数组

## 代码

```javascript
var map = function(arr, fn) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    result.push(fn(arr[i], i));
  }

  return result;
};
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 易错点

- 不要在原数组上直接改值。
- 需要把下标 `i` 一并传给 `fn`。
