---
title: 2631. 数组分组
category: 刷题
tags:
  - LeetCode
  - JavaScript
  - 数组
  - 原型
  - 分组
  - 中等
---

# 2631. 数组分组

- 难度：中等
- 类型：数组 / 原型 / 分组 / 哈希表

## 题目

请增强数组功能，使其支持 `groupBy(fn)`。该方法接收一个函数 `fn`，并根据 `fn` 的返回值对数组元素进行分组。

返回结果是一个对象：

- 键：`fn(item)` 的返回值
- 值：拥有相同键的元素数组

## 示例

```text
输入：[{"id":"1"},{"id":"1"},{"id":"2"}], fn = function (item) { return item.id; }
输出：{"1":[{"id":"1"},{"id":"1"}],"2":[{"id":"2"}]}
```

## 思路

这题的核心是“遍历 + 按键归类”。

我们可以准备一个结果对象 `result`：

1. 遍历数组中的每个元素
2. 计算当前元素的分组键 `key = fn(item)`
3. 如果 `result[key]` 不存在，就先初始化为空数组
4. 把当前元素推进对应数组

这其实就是一个很典型的哈希分组过程。

## 代码

```javascript
Array.prototype.groupBy = function(fn) {
  const result = {};

  for (const item of this) {
    const key = fn(item);

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(item);
  }

  return result;
};
```

## 复杂度

- 时间复杂度：`O(n)`
- 空间复杂度：`O(n)`

## 易错点

- 这是挂在 `Array.prototype` 上的方法，所以遍历对象应当是 `this`。
- 结果值必须是数组，因为一个键可能对应多个元素。
- 分组键会作为对象键使用，通常会被转成字符串。
