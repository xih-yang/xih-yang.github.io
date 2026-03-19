---
title: 2626. 数组归约运算
category: 刷题
tags:
  - LeetCode
  - JavaScript
  - 数组
  - reduce
  - 简单
---

# 2626. 数组归约运算

- 难度：简单
- 类型：数组 / reduce / 遍历

## 题目

请实现一个 `reduce` 方法。它接收三个参数：

- `nums`：一个整数数组
- `fn`：归约函数
- `init`：初始值

函数需要按照从左到右的顺序遍历数组，并不断把累计值与当前元素交给 `fn` 处理，最后返回累计结果。

## 示例

```text
输入：nums = [1,2,3,4], fn = function sum(accum, curr) { return accum + curr; }, init = 0
输出：10
```

## 思路

这题就是手写 `reduce` 的核心行为。

我们需要维护一个累计值 `result`：

1. 初始时令 `result = init`
2. 遍历数组中的每个元素
3. 每次都执行 `result = fn(result, nums[i])`
4. 遍历结束后返回 `result`

## 代码

```javascript
var reduce = function(nums, fn, init) {
  let result = init;

  for (let i = 0; i < nums.length; i++) {
    result = fn(result, nums[i]);
  }

  return result;
};
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(1)`

## 易错点

- 不要忘记从 `init` 开始累计。
- 空数组时应该直接返回 `init`。
- 顺序必须是从左到右。
