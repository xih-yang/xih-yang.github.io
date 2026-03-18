# Markdown 扩展示例

本页面展示了 VitePress 提供的一些内置 Markdown 扩展功能。

## 语法高亮

VitePress 提供由 [Shiki](https://github.com/shikijs/shiki) 提供的语法高亮功能，支持行高亮等额外特性：

**输入**

````md
```js{4}
export default {
  data () {
    return {
      msg: '高亮显示!'
    }
  }
}
```
````

**输出**

```js{4}
export default {
  data () {
    return {
      msg: '高亮显示!'
    }
  }
}
```

## 自定义容器

**输入**

```md
::: info
这是一个信息框。
:::

::: tip
这是一个提示。
:::

::: warning
这是一个警告。
:::

::: danger
这是一个危险警告。
:::

::: details
这是一个详情块。
:::
```

**输出**

::: info
这是一个信息框。
:::

::: tip
这是一个提示。
:::

::: warning
这是一个警告。
:::

::: danger
这是一个危险警告。
:::

::: details
这是一个详情块。
:::

## 更多

查看 [Markdown 扩展完整列表](https://vitepress.dev/guide/markdown) 的文档。
